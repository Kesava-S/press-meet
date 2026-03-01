// ── pages/QAView.jsx ──────────────────────────────────────────────────────────
// Q&A Viewer — read, edit (text only), delete (text answers + whole Q&A)
// Webhooks:
//   GET  /meet-fetch-topics
//   GET  /meet-fetch-qa?topic=Economy
//   POST /meet-update-qa-answer   { id, answerIndex, newValue, topic }
//   POST /meet-delete-qa-answer   { id, answerIndex, topic }
//   POST /meet-delete-qa          { id, topic }

import { useState, useEffect, useRef } from "react";
import './globals.css';

const TOPIC_ICONS = {
  Economy: "📈", Healthcare: "🏥", Education: "🎓", Infrastructure: "🏗️",
  Technology: "💡", Environment: "🌿", Politics: "🏛️", Science: "🔬",
  Culture: "🎨", Sports: "⚽", Default: "📌",
};
const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Preloader ─────────────────────────────────────────────────────────────────
function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring"><span /><span /><span /></div>
        <p className="preloader-text">Loading Q&amp;A Viewer…</p>
      </div>
    </div>
  );
}

// ── Chevron icon ──────────────────────────────────────────────────────────────
function ChevronIcon({ open }) {
  return (
    <svg className={`qav-chevron ${open ? "open" : ""}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Tiny spinner ──────────────────────────────────────────────────────────────
function Spinner() { return <span className="qav-action-spinner" />; }

// ─────────────────────────────────────────────────────────────────────────────
// TextAnswerItem — single editable/deletable text answer
// ─────────────────────────────────────────────────────────────────────────────
function TextAnswerItem({ value, index, qaId, topic, onUpdate, onDelete }) {
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState(value);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const textareaRef = useRef(null);

  // Sync draft when parent value changes (e.g. another item deleted shifts indices)
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  // Auto-resize + focus textarea when editing opens
  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
      el.focus();
      el.selectionStart = el.selectionEnd = el.value.length;
    }
  }, [editing]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`${BASE}/meet-update-qa-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: qaId, answerIndex: index, newValue: trimmed, topic }),
      });
    } catch { /* optimistic — local state handles it */ }
    onUpdate(index, trimmed);
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setConfirmDel(false);
    try {
      await fetch(`${BASE}/meet-delete-qa-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: qaId, answerIndex: index, topic }),
      });
    } catch { /* optimistic */ }
    onDelete(index);
  };

  return (
    <div className={`qav-text-answer ${editing ? "editing" : ""} ${deleting ? "deleting" : ""}`}>

      {/* ── Meta row ── */}
      <div className="qav-text-answer-meta">
        <span className="qav-answer-type text">✏️ Text Input</span>
        <span className="qav-answer-index">#{index + 1}</span>

        {/* Action buttons — hidden by default, shown on hover via CSS */}
        {!editing && !deleting && !saving && (
          <div className="qav-answer-actions">
            <button
              className="qav-action-btn qav-edit-btn"
              title="Edit this answer"
              onClick={() => { setDraft(value); setEditing(true); setConfirmDel(false); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button
              className="qav-action-btn qav-delete-btn"
              title="Delete this answer"
              onClick={() => { setConfirmDel(true); setEditing(false); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Delete
            </button>
          </div>
        )}

        {saving && (
          <div className="qav-answer-actions" style={{ opacity: 1 }}><Spinner /></div>
        )}
      </div>

      {/* ── Delete confirm ── */}
      {confirmDel && (
        <div className="qav-confirm-box" style={{ marginTop: 8 }}>
          <p>Delete answer <strong>#{index + 1}</strong>? This cannot be undone.</p>
          <div className="qav-confirm-actions">
            <button className="qav-action-btn qav-delete-btn" onClick={handleDelete}>
              Yes, delete
            </button>
            <button className="qav-action-btn qav-cancel-btn" onClick={() => setConfirmDel(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Display or edit ── */}
      {!editing && !confirmDel && <p>{value}</p>}

      {editing && (
        <>
          <textarea
            ref={textareaRef}
            className="qav-edit-textarea"
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              // auto-resize
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
              if (e.key === "Escape") { setEditing(false); setDraft(value); }
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button className="qav-action-btn qav-save-btn" disabled={saving} onClick={handleSave}>
              {saving ? <Spinner /> : "💾 Save"}
            </button>
            <button className="qav-action-btn qav-cancel-btn"
              onClick={() => { setEditing(false); setDraft(value); }}>
              Cancel
            </button>
            <span className="qav-edit-hint">⌘ Enter to save · Esc to cancel</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TextAnswers — wraps all text answers for a Q&A item
// ─────────────────────────────────────────────────────────────────────────────
function TextAnswers({ answers, qaId, topic, onAnswersChange }) {
  const handleUpdate = (index, newVal) => {
    const updated = [...answers];
    updated[index] = newVal;
    onAnswersChange(updated);
  };
  const handleDelete = (index) => {
    onAnswersChange(answers.filter((_, i) => i !== index));
  };

  return (
    <div className="qav-answers-inner">
      {answers.map((val, i) => (
        <TextAnswerItem
          key={`${qaId}-a${i}-${val.slice(0, 10)}`}
          value={val}
          index={i}
          qaId={qaId}
          topic={topic}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
      {answers.length === 0 && (
        <p className="qav-no-answer">All answers removed. Delete the Q&amp;A if no longer needed.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentAnswer — view only, no edit/delete
// ─────────────────────────────────────────────────────────────────────────────
function DocumentAnswer({ url }) {
  let displayName = "View Document";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length) displayName = decodeURIComponent(parts[parts.length - 1]);
  } catch { /* keep default */ }

  const ext     = displayName.split(".").pop()?.toLowerCase();
  const isImage = ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
  const isPdf   = ext === "pdf";
  const icon    = isImage ? "🖼️" : isPdf ? "📑" : "📄";
  const action  = isImage ? "View Image" : isPdf ? "Open PDF" : "Open Document";

  return (
    <div className="qav-answers-inner">
      <div className="qav-text-answer-meta" style={{ marginBottom: 12 }}>
        <span className="qav-answer-type file">📄 Document Input</span>
        <span className="qav-view-only-badge">View only</span>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="qav-doc-link">
        <div className="qav-doc-link-icon">{icon}</div>
        <div className="qav-doc-link-info">
          <span className="qav-doc-link-name">{displayName}</span>
          <span className="qav-doc-link-url">{url}</span>
        </div>
        <div className="qav-doc-link-action">
          <span>{action}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </div>
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QAAccordionItem — one collapsible Q&A row with delete Q&A button
// ─────────────────────────────────────────────────────────────────────────────
function QAAccordionItem({ qa, index, isOpen, onToggle, topic, onQAUpdate, onQADelete }) {
  const bodyRef      = useRef(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const handleAnswersChange = (newAnswers) => {
    onQAUpdate(qa.id, { ...qa, textAnswers: newAnswers });
  };

  const handleDeleteQA = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    setConfirmDel(false);
    try {
      await fetch(`${BASE}/meet-delete-qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: qa.id, topic }),
      });
    } catch { /* optimistic */ }
    onQADelete(qa.id);
  };

  return (
    <div className={`qav-accordion-item ${isOpen ? "open" : ""} ${deleting ? "qav-item-deleting" : ""}`}>

      {/* ── Trigger row ── */}
      <button className="qav-accordion-trigger" onClick={onToggle}>
        <div className="qav-accordion-left">
          <span className="qav-accordion-num">Q{index + 1}</span>
          <span className="qav-accordion-question">{qa.question}</span>
        </div>
        <div className="qav-accordion-right">
          {qa.summaryAns && !isOpen && (
            <span className="qav-accordion-preview">{qa.summaryAns}</span>
          )}

          {/* Delete Q&A — hidden until hover/open via CSS */}
          <button
            className="qav-qa-delete-btn"
            title="Delete this entire Q&A"
            onClick={(e) => { e.stopPropagation(); setConfirmDel(p => !p); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>

          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* ── Delete Q&A confirm bar ── */}
      {confirmDel && (
        <div className="qav-confirm-overlay">
          <div className="qav-confirm-box">
            <p>
              Permanently delete <strong>Q{index + 1}</strong>:{" "}
              <strong>"{qa.question.slice(0, 55)}{qa.question.length > 55 ? "…" : ""}"</strong> and all its answers?
            </p>
            <div className="qav-confirm-actions">
              <button className="qav-action-btn qav-delete-btn" onClick={handleDeleteQA}>
                {deleting ? <Spinner /> : "Yes, delete"}
              </button>
              <button className="qav-action-btn qav-cancel-btn" onClick={() => setConfirmDel(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-down body ── */}
      <div
        ref={bodyRef}
        className="qav-accordion-body"
        style={{ maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 2000) + "px" : "0px" }}
      >
        <div className="qav-accordion-body-inner">

          {/* Summary */}
          {qa.summaryAns && (
            <div className="qav-summary-block">
              <div className="qav-section-label">
                <span className="qav-dot qav-dot--green" />SUMMARY ANSWER
              </div>
              <p className="qav-short-text">{qa.summaryAns}</p>
            </div>
          )}

          {/* Answers header */}
          <div className="qav-section-label" style={{ marginTop: qa.summaryAns ? 18 : 0 }}>
            <span className="qav-dot qav-dot--amber" />
            {qa.inputType === "document" ? "DOCUMENT ANSWER" : "ANSWERS"}
            {qa.inputType === "text" && qa.textAnswers.length > 0 && (
              <span className="field-optional">
                &nbsp;· {qa.textAnswers.length} {qa.textAnswers.length === 1 ? "answer" : "answers"}
              </span>
            )}
            {qa.inputType === "document" && (
              <span className="field-optional">&nbsp;· document editing not available</span>
            )}
          </div>

          {/* Text answers with edit/delete */}
          {qa.inputType === "text" && qa.textAnswers.length > 0 && (
            <TextAnswers
              answers={qa.textAnswers}
              qaId={qa.id}
              topic={topic}
              onAnswersChange={handleAnswersChange}
            />
          )}

          {/* Document — view only */}
          {qa.inputType === "document" && qa.documentUrl && (
            <DocumentAnswer url={qa.documentUrl} />
          )}

          {/* Empty */}
          {((qa.inputType === "text" && qa.textAnswers.length === 0) ||
            (qa.inputType === "document" && !qa.documentUrl)) && (
            <p className="qav-no-answer">No answer provided for this question.</p>
          )}

        </div>
      </div>
    </div>
  );
}

// ── normalizeTopics ───────────────────────────────────────────────────────────
function normalizeTopics(raw) {
  if (raw && !Array.isArray(raw))
    raw = raw.topics ?? raw.data ?? raw.items ?? raw.rows ?? [];
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.reduce((out, item) => {
    const name = (typeof item === "string" ? item : null) ??
      item.topic ?? item.name ?? item.label ?? item.title ?? null;
    if (!name || seen.has(name)) return out;
    seen.add(name);
    out.push({ name, tag: item.tag ?? item.badge ?? undefined });
    return out;
  }, []);
}

// ── normalizeQAList ───────────────────────────────────────────────────────────
function normalizeQAList(raw) {
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).map((item, idx) => {
    if (!item) return null;
    const inputType = (item.inputType ?? item.input_type ?? item.answerMode ?? "text")
      .toString().toLowerCase();
    const isDoc = inputType === "document";

    let textAnswers = [];
    if (!isDoc) {
      const ra = item.answers ?? item.answer ?? [];
      if (Array.isArray(ra)) {
        textAnswers = ra.map(a => typeof a === "string" ? a : (a.value ?? a.text ?? "")).filter(Boolean);
      } else if (typeof ra === "string") {
        try {
          const p = JSON.parse(ra);
          textAnswers = Array.isArray(p)
            ? p.map(a => typeof a === "string" ? a : (a.value ?? a.text ?? "")).filter(Boolean)
            : [ra];
        } catch {
          textAnswers = ra.split(/\n|\|/).map(s => s.trim()).filter(Boolean);
        }
      }
    }

    let documentUrl = "";
    if (isDoc) {
      const ra = item.answers ?? item.answer ?? item.document_url ?? item.fileUrl ?? "";
      documentUrl = typeof ra === "string" ? ra.trim() : (ra?.url ?? ra?.fileUrl ?? "");
    }

    const question = item.question ?? item.q ?? "";
    if (!question) return null;
    return {
      id: item.id ?? item._id ?? `qa-${idx}`,
      question,
      summaryAns: item.summary_ans ?? item.shortAnswer ?? item.short_answer ?? item.summary ?? "",
      inputType,
      textAnswers,
      documentUrl,
    };
  }).filter(Boolean);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QAndAView() {
  const [appReady,      setAppReady]      = useState(false);
  const [topics,        setTopics]        = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [qaList,        setQaList]        = useState([]);
  const [loadingQA,     setLoadingQA]     = useState(false);
  const [fetchError,    setFetchError]    = useState(false);
  const [qaError,       setQaError]       = useState(false);
  const [search,        setSearch]        = useState("");
  const [openIndex,     setOpenIndex]     = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── Fetch topics on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/meet-fetch-topics`, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const normalized = normalizeTopics(await res.json());
        if (!normalized.length) throw new Error("Empty");
        setTopics(normalized);
      } catch (err) {
        console.warn("[QAView] Topics:", err.message);
        setFetchError(true);
        setTopics([
          { name: "Economy" }, { name: "Healthcare" },
          { name: "Education" }, { name: "Technology" },
        ]);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  // ── Load Q&A for a topic ───────────────────────────────────────────────────
  const loadQA = async (topic) => {
    setSelectedTopic(topic);
    setQaList([]);
    setQaError(false);
    setOpenIndex(null);
    setLoadingQA(true);
    try {
      const res = await fetch(
        `${BASE}/meet-fetch-qa?topic=${encodeURIComponent(topic.name)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setQaList(normalizeQAList(await res.json()));
    } catch (err) {
      console.warn("[QAView] QA:", err.message);
      setQaError(true);
      setQaList([]);
    } finally {
      setLoadingQA(false);
    }
  };

  // ── Handlers passed down ───────────────────────────────────────────────────
  const handleQAUpdate = (id, updatedQA) => {
    setQaList(p => p.map(q => q.id === id ? updatedQA : q));
    showToast("Answer updated ✓");
  };

  const handleQADelete = (id) => {
    setQaList(p => p.filter(q => q.id !== id));
    setOpenIndex(null);
    showToast("Q&A deleted");
  };

  const toggleAccordion = (i) => setOpenIndex(p => p === i ? null : i);
  const getIcon         = (n) => TOPIC_ICONS[n] || TOPIC_ICONS.Default;
  const filteredTopics  = topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* ── Header ── */}
        <div className="qa-top">
          <div className="qa-logo">📖</div>
          <span className="qa-title">Q&amp;A Viewer</span>
          <span className="qa-subtitle">
            {selectedTopic ? `→ ${selectedTopic.name}` : "Select a topic to view"}
          </span>
        </div>

        <div className="qa-body qav-layout">

          {/* ── Sidebar ── */}
          <aside className="qav-sidebar">
            <div className="section-label" style={{ marginBottom: 14 }}>Topics</div>
            <input
              className="input-field qav-search"
              placeholder="Search topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {fetchError && <p className="qav-warn">⚠️ Using fallback topics</p>}
            <div className="qav-topic-list">
              {filteredTopics.length === 0 && <p className="qav-empty">No topics match.</p>}
              {filteredTopics.map(t => (
                <button
                  key={t.name}
                  className={`qav-topic-item ${selectedTopic?.name === t.name ? "active" : ""}`}
                  onClick={() => loadQA(t)}
                >
                  <span className="qav-topic-icon">{getIcon(t.name)}</span>
                  <span>{t.name}</span>
                  {t.tag && (
                    <span className="topic-tag" style={{ marginLeft: "auto", position: "static" }}>
                      {t.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* ── Main panel ── */}
          <main className="qav-main">

            {!selectedTopic && (
              <div className="qav-placeholder">
                <div className="qav-placeholder-icon">💬</div>
                <h3>Select a topic</h3>
                <p>Choose a topic from the left panel to view its Q&amp;A.</p>
              </div>
            )}

            {selectedTopic && loadingQA && (
              <div className="state-box">
                <div className="loading-dots"><span /><span /><span /></div>
                <p>Loading Q&amp;A…</p>
              </div>
            )}

            {selectedTopic && !loadingQA && (
              <div className="qav-content">
                <div className="qav-content-header">
                  <span className="topic-badge">
                    {getIcon(selectedTopic.name)} {selectedTopic.name}
                  </span>
                  {!qaError && qaList.length > 0 && (
                    <span className="qa-count">
                      {qaList.length} {qaList.length === 1 ? "question" : "questions"}
                    </span>
                  )}
                  {qaError && <span className="qav-warn">⚠️ Demo data — webhook unreachable</span>}
                </div>

                {qaList.length === 0 && (
                  <div className="qav-no-data">
                    <div className="qav-no-data-icon">🗂️</div>
                    <h4>No Q&amp;A yet</h4>
                    <p>There are no questions added for <strong>{selectedTopic.name}</strong> yet.</p>
                  </div>
                )}

                {qaList.length > 0 && (
                  <div className="qav-accordion-list">
                    {qaList.map((qa, i) => (
                      <QAAccordionItem
                        key={qa.id}
                        qa={qa}
                        index={i}
                        isOpen={openIndex === i}
                        onToggle={() => toggleAccordion(i)}
                        topic={selectedTopic.name}
                        onQAUpdate={handleQAUpdate}
                        onQADelete={handleQADelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* ── Toast ── */}
        <div
          className={`status-bar ${toast ? "show" : ""}`}
          style={toast?.toLowerCase().includes("delet")
            ? { borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
            : {}}
        >
          {toast}
        </div>

      </div>
    </>
  );
}