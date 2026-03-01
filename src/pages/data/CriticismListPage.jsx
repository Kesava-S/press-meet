// ── pages/data/CriticismListPage.jsx ─────────────────────────────────────────
// Separate page: /app/data/criticism/list/:topic
// Shows all criticisms for a topic with full edit + delete

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../globals.css";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

const TOPIC_ICONS = {
  Economy: "📈", Healthcare: "🏥", Education: "🎓", Infrastructure: "🏗️",
  Technology: "💡", Environment: "🌿", Politics: "🏛️", Science: "🔬",
  Culture: "🎨", Sports: "⚽", Default: "📌",
};

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending",     color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { value: "in-progress", label: "In Progress", color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  { value: "addressed",   label: "Addressed",   color: "#10b981", bg: "rgba(16,185,129,0.10)" },
];
const TAG_OPTIONS = [
  { value: "criticism",  label: "Criticism",  color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  { value: "question",   label: "Question",   color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  { value: "accusation", label: "Accusation", color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
];
const SEV_OPTIONS = [
  { value: "high",   label: "High",   color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low",    label: "Low",    color: "#10b981" },
];

const getTopicIcon = (n) => TOPIC_ICONS[n] || TOPIC_ICONS.Default;
const getStatusCfg = (v) => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];
const getTagCfg    = (v) => TAG_OPTIONS.find(t => t.value === v) || TAG_OPTIONS[0];
const getSevColor  = (v) => SEV_OPTIONS.find(s => s.value === v)?.color || "#f59e0b";

// ── Icons ─────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

// ── Badge components ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = getStatusCfg(status);
  return <span className="cs-status-badge" style={{ color: c.color, background: c.bg }}>{c.label}</span>;
}
function TagPill({ tag }) {
  const c = getTagCfg(tag);
  return <span className="cs-tag-pill" style={{ color: c.color, background: c.bg }}>{c.label}</span>;
}
function SeverityDot({ severity }) {
  return <span className="cs-severity-dot" style={{ background: getSevColor(severity) }} title={severity} />;
}

// ── Inline edit field ─────────────────────────────────────────────────────────
function EditField({ label, value, multiline, onChange, placeholder }) {
  return (
    <div className="csl-edit-field">
      <div className="csl-edit-label">{label}</div>
      {multiline ? (
        <textarea className="input-field csl-edit-input"
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ minHeight: 72, resize: "vertical" }} />
      ) : (
        <input className="input-field csl-edit-input"
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ item, onUpdate, onDelete, showToast }) {
  const [editing,       setEditing]       = useState(false);
  const [draft,         setDraft]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset when item changes
  useEffect(() => {
    setEditing(false);
    setDraft(null);
    setConfirmDelete(false);
  }, [item?.id]);

  if (!item) {
    return (
      <div className="csl-detail csl-detail--empty">
        <div className="csl-empty-icon">👈</div>
        <p>Select an entry to view details</p>
      </div>
    );
  }

  const d = editing ? draft : item;

  // Parse notes safely
  const parseNotes = (answers) => {
    if (!answers) return [];
    if (Array.isArray(answers)) return answers;
    try { return JSON.parse(answers); } catch { return []; }
  };

  const notes = parseNotes(item.answers ?? item.notes);

  // ── Start editing ──────────────────────────────────────────────────────────
  const startEdit = () => {
    setDraft({
      title:      item.title      || "",
      detail:     item.detail     || "",
      source:     item.source     || "",
      severity:   item.severity   || "medium",
      tag:        item.tag        || "criticism",
      status:     item.status     || "pending",
    });
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); };

  // ── Save edits ─────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/meet-update-criticism`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, topic: item.topic, ...draft }),
      });
      if (!res.ok) throw new Error();
      onUpdate(item.id, draft);
      setEditing(false);
      setDraft(null);
      showToast("Entry updated ✓");
    } catch {
      showToast("Failed to save — webhook unreachable");
    } finally {
      setSaving(false);
    }
  };

  // ── Update status only ─────────────────────────────────────────────────────
  const updateStatus = async (newStatus) => {
    try {
      await fetch(`${BASE}/meet-update-criticism-status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      onUpdate(item.id, { status: newStatus });
      showToast("Status updated ✓");
    } catch {
      showToast("Failed to update status");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteItem = async () => {
    setDeleting(true);
    setConfirmDelete(false);
    try {
      const res = await fetch(`${BASE}/meet-delete-criticism`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, topic: item.topic }),
      });
      if (!res.ok) throw new Error();
      onDelete(item.id);
      showToast("Entry deleted");
    } catch {
      showToast("Failed to delete — webhook unreachable");
      setDeleting(false);
    }
  };

  return (
    <div className={`csl-detail${deleting ? " csl-detail--deleting" : ""}`}>

      {/* ── Detail header ── */}
      <div className="csl-detail-top">
        <div className="csl-detail-badges">
          <SeverityDot severity={d.severity} />
          <TagPill tag={d.tag} />
          <StatusBadge status={d.status} />
        </div>

        <div className="csl-detail-actions">
          {!editing ? (
            <>
              <button className="csl-act-btn csl-act-edit" onClick={startEdit} disabled={deleting}>
                <EditIcon /> Edit
              </button>
              <button className="csl-act-btn csl-act-delete"
                onClick={() => setConfirmDelete(true)} disabled={deleting}>
                {deleting ? <span className="qav-spinner" style={{ borderTopColor: "#ef4444" }} /> : <TrashIcon />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button className="csl-act-btn csl-act-save" onClick={saveEdit} disabled={saving}>
                {saving ? <span className="qav-spinner" /> : <CheckIcon />}
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="csl-act-btn csl-act-cancel" onClick={cancelEdit} disabled={saving}>
                <XIcon /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="csl-confirm-strip">
          <span className="csl-confirm-msg">
            Delete <strong>"{item.title?.slice(0, 50)}{item.title?.length > 50 ? "…" : ""}"</strong>?
          </span>
          <div className="csl-confirm-btns">
            <button className="csl-act-btn csl-act-delete" onClick={deleteItem}>
              <TrashIcon /> Yes, delete
            </button>
            <button className="csl-act-btn csl-act-cancel" onClick={() => setConfirmDelete(false)}>
              <XIcon /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Fields ── */}
      {!editing ? (
        <>
          <h3 className="csl-detail-title">{item.title}</h3>
          <div className="csl-detail-meta">
            <span>📰 {item.source}</span>
            <span>📅 {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
              : "—"}</span>
          </div>
          {item.detail && <p className="csl-detail-body">{item.detail}</p>}
        </>
      ) : (
        <div className="csl-edit-form">
          <EditField label="Title" value={draft.title} multiline
            placeholder="Title of this criticism…" onChange={v => setDraft(p => ({ ...p, title: v }))} />
          <EditField label="Summary" value={draft.detail} multiline
            placeholder="Brief description…" onChange={v => setDraft(p => ({ ...p, detail: v }))} />
          <EditField label="Source" value={draft.source}
            placeholder="Source name…" onChange={v => setDraft(p => ({ ...p, source: v }))} />

          {/* Severity pills */}
          <div className="csl-edit-field">
            <div className="csl-edit-label">Severity</div>
            <div className="crm-pills">
              {SEV_OPTIONS.map(s => (
                <button key={s.value} className={`type-pill${draft.severity===s.value?" active":""}`}
                  style={draft.severity===s.value?{borderColor:s.color,color:s.color,background:`${s.color}18`}:{}}
                  onClick={() => setDraft(p => ({ ...p, severity: s.value }))}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Tag pills */}
          <div className="csl-edit-field">
            <div className="csl-edit-label">Type</div>
            <div className="crm-pills">
              {TAG_OPTIONS.map(t => (
                <button key={t.value} className={`type-pill${draft.tag===t.value?" active":""}`}
                  style={draft.tag===t.value?{borderColor:t.color,color:t.color,background:t.bg}:{}}
                  onClick={() => setDraft(p => ({ ...p, tag: t.value }))}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Status pills */}
          <div className="csl-edit-field">
            <div className="csl-edit-label">Status</div>
            <div className="crm-pills">
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} className={`type-pill${draft.status===s.value?" active":""}`}
                  style={draft.status===s.value?{borderColor:s.color,color:s.color,background:s.bg}:{}}
                  onClick={() => setDraft(p => ({ ...p, status: s.value }))}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Notes (always visible in view mode) ── */}
      {!editing && notes.length > 0 && (
        <>
          <div className="cs-detail-section-label" style={{ marginTop: 20 }}>NOTES</div>
          {notes.map((n, i) => (
            <div key={i} className="csl-note-card">
              <span className="answer-variant-label">NOTE {String(i + 1).padStart(2, "0")}</span>
              <p className="csl-note-text">{typeof n === "string" ? n : n.value}</p>
            </div>
          ))}
        </>
      )}

      {/* ── Document attachment ── */}
      {!editing && item.inputType === "document" && item.answers && (
        <>
          <div className="cs-detail-section-label" style={{ marginTop: 20 }}>DOCUMENT</div>
          <a href={item.answers} target="_blank" rel="noreferrer" className="csl-doc-link">
            <FileIcon />
            <span>{item.title}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </>
      )}

      {/* ── Quick status change (view mode only) ── */}
      {!editing && (
        <>
          <div className="cs-detail-section-label" style={{ marginTop: 20 }}>UPDATE STATUS</div>
          <div className="cs-status-actions">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value}
                className={`cs-status-btn${item.status===s.value?" active":""}`}
                style={item.status===s.value?{borderColor:s.color,color:s.color,background:s.bg}:{}}
                onClick={() => updateStatus(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CriticismListPage() {
  const { topic }  = useParams();
  const navigate   = useNavigate();
  const topicName  = decodeURIComponent(topic || "");

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterSev,   setFilterSev]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast,       setToast]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  // ── Fetch items ────────────────────────────────────────────────────────────
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/meet-fetch-criticisms?topic=${encodeURIComponent(topicName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      // Demo fallback
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [topicName]);

  // ── Mutators ───────────────────────────────────────────────────────────────
  const handleUpdate = (id, patch) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.source?.toLowerCase().includes(search.toLowerCase()) ||
      item.detail?.toLowerCase().includes(search.toLowerCase());
    const matchSev    = filterSev === "all"    || item.severity === filterSev;
    const matchStatus = filterStatus === "all" || item.status === filterStatus;
    return matchSearch && matchSev && matchStatus;
  });

  // severity dot label for filter buttons
  const sevLabel = (v) => ({ high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" }[v] || v);

  return (
    <div className="csl-root">

      {/* ── Page header ── */}
      <div className="csl-header">
        <button className="csl-back-btn" onClick={() => navigate("/app/data/criticism")}>
          <BackIcon />
          Back
        </button>

        <div className="csl-header-center">
          <span className="csl-header-icon">{getTopicIcon(topicName)}</span>
          <div>
            <h1 className="csl-header-title">{topicName}</h1>
            <p className="csl-header-sub">
              {loading ? "Loading…" : `${items.length} ${items.length === 1 ? "entry" : "entries"}`}
            </p>
          </div>
        </div>

        <button className="btn-refresh" onClick={fetchItems}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Filters bar ── */}
      <div className="csl-filters">
        <input
          className="input-field csl-search"
          placeholder="Search entries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="csl-filter-pills">
          {/* Severity filter */}
          <button className={`csl-filter-pill${filterSev==="all"?" active":""}`} onClick={() => setFilterSev("all")}>All Severity</button>
          {["high","medium","low"].map(v => (
            <button key={v} className={`csl-filter-pill${filterSev===v?" active":""}`}
              style={filterSev===v?{borderColor:getSevColor(v),color:getSevColor(v),background:`${getSevColor(v)}15`}:{}}
              onClick={() => setFilterSev(v)}>{sevLabel(v)}</button>
          ))}
        </div>

        <div className="csl-filter-pills">
          {/* Status filter */}
          <button className={`csl-filter-pill${filterStatus==="all"?" active":""}`} onClick={() => setFilterStatus("all")}>All Status</button>
          {STATUS_OPTIONS.map(s => (
            <button key={s.value} className={`csl-filter-pill${filterStatus===s.value?" active":""}`}
              style={filterStatus===s.value?{borderColor:s.color,color:s.color,background:s.bg}:{}}
              onClick={() => setFilterStatus(s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* ── Main split layout ── */}
      <div className="csl-body">

        {/* Left — list */}
        <div className="csl-list-panel">
          {loading && (
            <div className="state-box">
              <div className="loading-dots"><span /><span /><span /></div>
              <p>Loading entries…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="csl-empty-state">
              <div style={{ fontSize: 40, opacity: 0.35 }}>📭</div>
              <p>{items.length === 0
                ? `No entries yet for ${topicName}.`
                : "No entries match your filters."}</p>
            </div>
          )}

          {!loading && filtered.map(item => {
            const sc = getStatusCfg(item.status);
            const tc = getTagCfg(item.tag);
            return (
              <button
                key={item.id}
                className={`csl-list-card${selected?.id === item.id ? " active" : ""}`}
                onClick={() => setSelected(item)}
              >
                {/* Severity stripe */}
                <div className="csl-card-stripe" style={{ background: getSevColor(item.severity) }} />

                <div className="csl-card-body">
                  <div className="csl-card-top">
                    <span className="cs-tag-pill" style={{ color: tc.color, background: tc.bg }}>{tc.label}</span>
                    <span className="cs-status-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
                    <span className="csl-card-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : ""}
                    </span>
                  </div>

                  <p className="csl-card-title">{item.title}</p>

                  {item.detail && (
                    <p className="csl-card-detail">{item.detail}</p>
                  )}

                  <div className="csl-card-meta">
                    <span>📰 {item.source}</span>
                    {item.inputType === "document" && (
                      <span style={{ color: "#6366f1", fontFamily: "Space Mono, monospace", fontSize: 10 }}>📄 Doc</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right — detail */}
        <div className="csl-detail-panel">
          <DetailPanel
            item={selected}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Toast */}
      <div className={`status-bar ${toast ? "show" : ""}`}
        style={toast?.startsWith("Failed")
          ? { background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
          : {}}>
        {toast?.startsWith("Failed") ? "✕" : "✓"} {toast}
      </div>
    </div>
  );
}