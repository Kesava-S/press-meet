import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Sentiment config ──────────────────────────────────────────────────────────
const SENTIMENT_MAP = {
  hostile:  { label: "Hostile",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: "🔴" },
  negative: { label: "Negative", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "🟡" },
  neutral:  { label: "Neutral",  color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: "🔵" },
  positive: { label: "Positive", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "🟢" },
};

const TAG_MAP = {
  criticism:  { color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  question:   { color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  accusation: { color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
  answer:     { color: "#10b981", bg: "rgba(16,185,129,0.09)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function isGDrive(url = "") {
  return url.includes("docs.google.com") || url.includes("drive.google.com");
}
function gDriveLabel(url = "") {
  if (url.includes("/document/"))     return "Google Doc";
  if (url.includes("/spreadsheets/")) return "Google Sheet";
  if (url.includes("/presentation/")) return "Google Slides";
  return "Google Drive File";
}
function gDriveEmoji(url = "") {
  if (url.includes("/document/"))     return "📝";
  if (url.includes("/spreadsheets/")) return "📊";
  if (url.includes("/presentation/")) return "📑";
  return "📁";
}
function fileEmoji(url = "") {
  if (isGDrive(url)) return gDriveEmoji(url);
  const ext = url.split(".").pop().split("?")[0].toLowerCase();
  if (ext === "pdf") return "📄";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  return "📎";
}
function fileLabel(url = "") {
  if (isGDrive(url)) return gDriveLabel(url);
  try {
    const decoded = decodeURIComponent(url.split("/").pop().split("?")[0]);
    return decoded.length > 32 ? decoded.slice(0, 30) + "…" : decoded;
  } catch { return "Document"; }
}

// parse tags — stored as JSON string in DB
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// parse proofDocs — stored as comma-separated string in DB
function parseProofs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// group history by sessionId
function groupBySessions(items) {
  const map = new Map();
  items.forEach(item => {
    const sid = item.sessionId || "unknown";
    if (!map.has(sid)) map.set(sid, []);
    map.get(sid).push(item);
  });
  return Array.from(map.entries()).map(([sessionId, entries]) => ({
    sessionId,
    entries,
    startTime: entries[entries.length - 1]?.createdAt || "",
    topic:     entries[0]?.topic || "",
    count:     entries.length,
  }));
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SentimentBadge({ sentiment }) {
  const s = SENTIMENT_MAP[sentiment?.toLowerCase()] || SENTIMENT_MAP.neutral;
  return (
    <span className="pm2-sentiment" style={{ color: s.color, background: s.bg }}>
      {s.icon} {s.label}
    </span>
  );
}

function TagPill({ tag }) {
  const t = TAG_MAP[tag?.toLowerCase()] || TAG_MAP.question;
  return (
    <span className="pm2-tag" style={{ color: t.color, background: t.bg }}>{tag}</span>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pm2-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── History Entry Card ────────────────────────────────────────────────────────
function HistoryEntry({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const tags   = parseTags(item.tags);
  const proofs = parseProofs(item.proofDocs);

  return (
    <div className="ph-entry-card" style={{ animationDelay: `${index * 0.05}s` }}>
      {/* Header row */}
      <div className="ph-entry-header" onClick={() => setExpanded(p => !p)}>
        <div className="ph-entry-left">
          <span className="ph-entry-index">#{index + 1}</span>
          {item.topic && (
            <span className="pm2-topic-badge pm2-topic-badge--sm">📌 {item.topic}</span>
          )}
          <SentimentBadge sentiment={item.sentiment} />
          {tags.map(t => <TagPill key={t} tag={t} />)}
        </div>
        <div className="ph-entry-right">
          <span className="ph-entry-time">{formatDate(item.createdAt)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, opacity: 0.5 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Question — always visible */}
      <div className="ph-entry-question">
        <span className="ph-entry-q-icon">❓</span>
        <span className="ph-entry-q-text">{item.question}</span>
      </div>

      {/* Answer — expandable */}
      {expanded && (
        <div className="ph-entry-body">
          <div className="ph-entry-answer-label">
            <span className="pm2-answer-icon">🤖</span> AI Response
          </div>
          <div className="ph-entry-answer-text">{item.answer}</div>

          {proofs.length > 0 && (
            <div className="ph-entry-proofs">
              <span className="ph-entry-proof-label">📎 Proof Documents</span>
              <div className="ph-entry-proof-list">
                {proofs.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="pm2-proof-chip">
                    <span className="pm2-proof-emoji">{fileEmoji(url)}</span>
                    <span className="pm2-proof-name">{fileLabel(url)}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink: 0, opacity: 0.5 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Session Group ─────────────────────────────────────────────────────────────
function SessionGroup({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="ph-session-group">
      <div className="ph-session-header" onClick={() => setOpen(p => !p)}>
        <div className="ph-session-left">
          <span className="ph-session-icon">🎙️</span>
          <div className="ph-session-info">
            <span className="ph-session-title">
              Press Meet Session
            </span>
            <span className="ph-session-meta">
              {formatDate(session.startTime)} · {session.count} question{session.count !== 1 ? "s" : ""}
              {session.topic && ` · ${session.topic}`}
            </span>
          </div>
        </div>
        <div className="ph-session-right">
          <span className="ph-session-count">{session.count}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="ph-session-entries">
          {session.entries.map((item, i) => (
            <HistoryEntry key={item.id || i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ search, onSearch, sentiment, onSentiment, topic, onTopic, topics }) {
  return (
    <div className="ph-filter-bar">
      <div className="ph-search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="ph-search-input"
          placeholder="Search questions or answers…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <select className="ph-filter-select" value={sentiment} onChange={e => onSentiment(e.target.value)}>
        <option value="">All Sentiments</option>
        <option value="hostile">🔴 Hostile</option>
        <option value="negative">🟡 Negative</option>
        <option value="neutral">🔵 Neutral</option>
        <option value="positive">🟢 Positive</option>
      </select>

      <select className="ph-filter-select" value={topic} onChange={e => onTopic(e.target.value)}>
        <option value="">All Topics</option>
        {topics.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ items }) {
  const sentiments = items.reduce((acc, i) => {
    const s = i.sentiment || "neutral";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const sessions = new Set(items.map(i => i.sessionId)).size;

  return (
    <div className="ph-stats-bar">
      <div className="ph-stat">
        <span className="ph-stat-num">{items.length}</span>
        <span className="ph-stat-label">Questions</span>
      </div>
      <div className="ph-stat-div" />
      <div className="ph-stat">
        <span className="ph-stat-num">{sessions}</span>
        <span className="ph-stat-label">Sessions</span>
      </div>
      <div className="ph-stat-div" />
      {Object.entries(sentiments).map(([s, n]) => {
        const cfg = SENTIMENT_MAP[s] || SENTIMENT_MAP.neutral;
        return (
          <div key={s} className="ph-stat">
            <span className="ph-stat-num" style={{ color: cfg.color }}>{n}</span>
            <span className="ph-stat-label">{cfg.icon} {cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PressMeetHistory() {
  const { user } = useAuth();
  const userId   = user?.id || user?.userId || user?.email || "anonymous";
  const userName = user?.name || user?.email || "User";

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [sentiment, setSentiment] = useState("");
  const [topic,     setTopic]     = useState("");
  const [view,      setView]      = useState("sessions"); // "sessions" | "flat"

  // ── Fetch history ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || userId === "anonymous") {
      setLoading(false);
      setError("Please log in to view your history.");
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BASE}/meet-fetch-history`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userId }),
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();

        // Handle array or wrapped { data: [...] }
        const rows = Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.rows) ? data.rows
          : [];

        // Sort newest first
        rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItems(rows);
      } catch (err) {
        console.error(err);
        setError("Failed to load history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const topics = [...new Set(items.map(i => i.topic).filter(Boolean))];

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    if (q && !item.question?.toLowerCase().includes(q) && !item.answer?.toLowerCase().includes(q)) return false;
    if (sentiment && item.sentiment?.toLowerCase() !== sentiment) return false;
    if (topic && item.topic !== topic) return false;
    return true;
  });

  const sessions = groupBySessions(filtered);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="qa-root qa-root--ready">

      {/* ── Header ── */}
      <div className="qa-top">
        <div className="qa-logo">📋</div>
        <span className="qa-title">Session History</span>
        <span className="qa-subtitle">Past press meet questions by {userName}</span>
      </div>

      <div className="qa-body">

        {loading && (
          <div className="ph-loading">
            <SpinnerIcon />
            <span>Loading your history…</span>
          </div>
        )}

        {error && !loading && (
          <div className="ph-error-card">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="ph-empty-card">
            <span className="ph-empty-icon">🎙️</span>
            <p className="ph-empty-title">No history yet</p>
            <p className="ph-empty-sub">Questions you ask in PressMeet Now will appear here.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            {/* Stats */}
            <StatsBar items={items} />

            <div className="divider" />

            {/* Filters */}
            <FilterBar
              search={search}    onSearch={setSearch}
              sentiment={sentiment} onSentiment={setSentiment}
              topic={topic}      onTopic={setTopic}
              topics={topics}
            />

            {/* View toggle */}
            <div className="ph-view-toggle">
              <button
                className={`ph-view-btn ${view === "sessions" ? "active" : ""}`}
                onClick={() => setView("sessions")}
              >
                🗂️ By Session
              </button>
              <button
                className={`ph-view-btn ${view === "flat" ? "active" : ""}`}
                onClick={() => setView("flat")}
              >
                📋 All Questions
              </button>
            </div>

            {/* No results after filter */}
            {filtered.length === 0 && (
              <div className="ph-empty-card" style={{ marginTop: 12 }}>
                <span className="ph-empty-icon">🔍</span>
                <p className="ph-empty-title">No matches</p>
                <p className="ph-empty-sub">Try adjusting your filters or search term.</p>
              </div>
            )}

            {/* Sessions view */}
            {view === "sessions" && filtered.length > 0 && (
              <div className="ph-sessions-list">
                {sessions.map((s, i) => (
                  <SessionGroup key={s.sessionId} session={s} defaultOpen={i === 0} />
                ))}
              </div>
            )}

            {/* Flat view */}
            {view === "flat" && filtered.length > 0 && (
              <div className="ph-flat-list">
                {filtered.map((item, i) => (
                  <HistoryEntry key={item.id || i} item={item} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CSS ── */}
      <style>{`
        /* Loading / Error / Empty */
        .ph-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 48px; justify-content: center;
          color: var(--text-muted, #9ca3af); font-size: 14px;
        }
        .ph-error-card {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px; padding: 16px 20px; color: #ef4444;
          font-size: 14px; margin-bottom: 12px;
        }
        .ph-empty-card {
          text-align: center; padding: 56px 24px;
          background: var(--card-bg, #fff); border: 1px dashed var(--border, #e5e7eb);
          border-radius: 14px;
        }
        .ph-empty-icon { font-size: 40px; display: block; margin-bottom: 12px; }
        .ph-empty-title { font-size: 16px; font-weight: 600; color: var(--text, #111); margin: 0 0 6px; }
        .ph-empty-sub   { font-size: 13px; color: var(--text-muted, #9ca3af); margin: 0; }

        /* Stats bar */
        .ph-stats-bar {
          display: flex; align-items: center;
          background: var(--card-bg, #fff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px; padding: 12px 20px;
          flex-wrap: wrap; gap: 0;
        }
        .ph-stat { display: flex; flex-direction: column; align-items: center; padding: 0 18px; }
        .ph-stat-num   { font-size: 20px; font-weight: 700; color: var(--text, #111); line-height: 1; }
        .ph-stat-label { font-size: 11px; color: var(--text-muted, #9ca3af); margin-top: 3px; white-space: nowrap; }
        .ph-stat-div   { width: 1px; height: 28px; background: var(--border, #e5e7eb); }

        /* Filter bar */
        .ph-filter-bar {
          display: flex; gap: 8px; align-items: center;
          flex-wrap: nowrap; margin-bottom: 4px;
        }
        .ph-search-wrap {
          position: relative; flex: 1; min-width: 0;
        }
        .ph-search-input {
          width: 100%; padding: 8px 12px 8px 32px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px; font-size: 13px;
          background: var(--card-bg, #fff); color: var(--text, #111);
          outline: none; box-sizing: border-box;
        }
        .ph-search-input:focus { border-color: #6366f1; }
        .ph-filter-select {
          padding: 8px 10px; flex-shrink: 0;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px; font-size: 13px;
          background: var(--card-bg, #fff); color: var(--text, #111);
          outline: none; cursor: pointer; max-width: 140px;
        }
        .ph-filter-select:focus { border-color: #6366f1; }
        @media (max-width: 580px) {
          .ph-filter-bar { flex-wrap: wrap; }
          .ph-filter-select { max-width: 100%; flex: 1; }
        }

        /* View toggle */
        .ph-view-toggle {
          display: flex; gap: 6px; margin-bottom: 4px;
        }
        .ph-view-btn {
          padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
          border: 1px solid var(--border, #e5e7eb);
          background: var(--card-bg, #fff); color: var(--text-muted, #6b7280);
          cursor: pointer; transition: all 0.15s;
        }
        .ph-view-btn.active {
          background: #6366f1; color: #fff; border-color: #6366f1;
        }
        .ph-view-btn:not(.active):hover { border-color: #6366f1; color: #6366f1; }

        /* Session group */
        .ph-sessions-list, .ph-flat-list { display: flex; flex-direction: column; gap: 12px; }
        .ph-session-group {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px; overflow: hidden;
          background: var(--card-bg, #fff);
        }
        .ph-session-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; cursor: pointer;
          background: var(--bg-subtle, #f9fafb);
          border-bottom: 1px solid var(--border, #e5e7eb);
          transition: background 0.15s;
        }
        .ph-session-header:hover { background: var(--bg-hover, #f3f4f6); }
        .ph-session-left  { display: flex; align-items: center; gap: 10px; }
        .ph-session-right { display: flex; align-items: center; gap: 10px; }
        .ph-session-icon  { font-size: 18px; }
        .ph-session-info  { display: flex; flex-direction: column; }
        .ph-session-title { font-size: 14px; font-weight: 600; color: var(--text, #111); }
        .ph-session-meta  { font-size: 12px; color: var(--text-muted, #9ca3af); margin-top: 2px; }
        .ph-session-count {
          background: #6366f1; color: #fff;
          border-radius: 20px; padding: 2px 9px;
          font-size: 12px; font-weight: 600;
        }
        .ph-session-entries { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

        /* Entry card */
        .ph-entry-card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 10px; overflow: hidden;
          background: var(--card-bg, #fff);
          animation: phFadeIn 0.25s ease both;
        }
        @keyframes phFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ph-entry-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; cursor: pointer;
          gap: 8px; flex-wrap: wrap;
          background: var(--bg-subtle, #fafafa);
        }
        .ph-entry-header:hover { background: var(--bg-hover, #f3f4f6); }
        .ph-entry-left  { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .ph-entry-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ph-entry-index {
          font-size: 11px; font-weight: 700; color: var(--text-muted, #9ca3af);
          background: var(--bg-hover, #f3f4f6);
          border-radius: 6px; padding: 2px 7px; min-width: 28px; text-align: center;
        }
        .ph-entry-time  { font-size: 11px; color: var(--text-muted, #9ca3af); white-space: nowrap; }
        .ph-entry-question {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 14px; border-top: 1px solid var(--border, #f0f0f0);
        }
        .ph-entry-q-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .ph-entry-q-text { font-size: 13px; color: var(--text, #111); line-height: 1.55; font-weight: 500; }

        /* Expanded body */
        .ph-entry-body { padding: 12px 14px; border-top: 1px solid var(--border, #f0f0f0); }
        .ph-entry-answer-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: var(--text-muted, #6b7280);
          margin-bottom: 8px;
        }
        .ph-entry-answer-text {
          font-size: 13px; color: var(--text, #333);
          line-height: 1.7; white-space: pre-wrap;
        }
        .ph-entry-proofs { margin-top: 12px; }
        .ph-entry-proof-label {
          font-size: 12px; font-weight: 600; color: var(--text-muted, #6b7280);
          display: block; margin-bottom: 6px;
        }
        .ph-entry-proof-list { display: flex; flex-wrap: wrap; gap: 6px; }
      `}</style>
    </div>
  );
}