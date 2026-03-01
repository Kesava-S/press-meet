// ── pages/data/CriticismPage.jsx ─────────────────────────────────────────────
// Mirrors QAPage exactly:
//   • Same topic grid + add/delete topics
//   • Same qa-card structure inside
//   • "Answer" area = criticism fields (title, source, severity, tag, status)
//     + text notes (like TextAnswerItem) OR document upload
//   • View toggle: Add New ↔ View List (split panel, same cs-split CSS)

import { useState, useEffect, useRef } from "react";
import "../globals.css";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Topic icons (shared with QAPage) ─────────────────────────────────────────
const TOPIC_ICONS = {
  Economy: "📈", Healthcare: "🏥", Education: "🎓", Infrastructure: "🏗️",
  Technology: "💡", Environment: "🌿", Politics: "🏛️", Science: "🔬",
  Culture: "🎨", Sports: "⚽", Default: "📌",
};

// ── Config maps ───────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { value: "in-progress", label: "In Progress", color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  { value: "addressed", label: "Addressed", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
];

const TAG_OPTIONS = [
  { value: "criticism", label: "Criticism", color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  { value: "question", label: "Question", color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  { value: "accusation", label: "Accusation", color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
];

const SEV_OPTIONS = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#10b981" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStatusCfg = (v) => STATUS_OPTIONS.find(s => s.value === v) || STATUS_OPTIONS[0];
const getTagCfg = (v) => TAG_OPTIONS.find(t => t.value === v) || TAG_OPTIONS[0];
const getSevColor = (v) => SEV_OPTIONS.find(s => s.value === v)?.color || "#f59e0b";
const getTopicIcon = (n) => TOPIC_ICONS[n] || TOPIC_ICONS.Default;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const newNote = () => ({ value: "" });
const newDocFile = () => ({ file: null, fileName: "", fileSize: 0, fileError: "" });

// ── Shared tiny components ────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring"><span /><span /><span /></div>
        <p className="preloader-text">Loading Criticism Manager…</p>
      </div>
    </div>
  );
}

// ── StatusBadge / TagPill / SeverityDot ───────────────────────────────────────
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

// ── TextNoteItem — mirrors TextAnswerItem exactly ─────────────────────────────
function TextNoteItem({ index, note, onChange, onRemove, canRemove }) {
  return (
    <div className="answer-item">
      <div className="answer-item-header">
        <span className="answer-variant-label">NOTE {String(index + 1).padStart(2, "0")}</span>
        {canRemove && (
          <button className="answer-remove-btn" onClick={onRemove} title="Remove note">
            <TrashIcon />
          </button>
        )}
      </div>
      <textarea
        className="variant-input"
        placeholder={`Add supporting note or evidence ${index + 1}…`}
        value={note.value}
        onChange={e => onChange({ ...note, value: e.target.value })}
      />
    </div>
  );
}

// ── DocumentUpload — identical copy from QAPage ───────────────────────────────
function DocumentUpload({ file, fileName, fileSize, fileError, onChange }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      onChange({ file: null, fileName: "", fileSize: 0, fileError: `File too large — max 10 MB (your file: ${formatSize(f.size)})` });
      return;
    }
    onChange({ file: f, fileName: f.name, fileSize: f.size, fileError: "" });
  };

  return (
    <div className="document-upload-wrapper">
      <div
        className={`doc-drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""} ${fileError ? "has-error" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <input ref={fileRef} type="file" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])} />

        {file ? (
          <div className="doc-attached">
            <div className="doc-attached-icon"><FileIcon /></div>
            <div className="doc-attached-info">
              <span className="doc-attached-name">{fileName}</span>
              <span className="doc-attached-size">{formatSize(fileSize)}</span>
            </div>
            <button className="doc-clear-btn" title="Remove file"
              onClick={e => { e.stopPropagation(); onChange(newDocFile()); }}>
              <TrashIcon />
            </button>
          </div>
        ) : (
          <div className="doc-empty">
            <div className={`doc-upload-icon ${dragging ? "bounce" : ""}`}><UploadIcon /></div>
            <p className="doc-upload-label">{dragging ? "Drop it here!" : "Click or drag a file to upload"}</p>
            <p className="doc-upload-hint">Any format · Max 10 MB</p>
          </div>
        )}
      </div>

      {file && (
        <div className="doc-size-bar">
          <div className="doc-size-fill" style={{ width: `${Math.min((fileSize / MAX_FILE_SIZE) * 100, 100)}%` }} />
        </div>
      )}
      {fileError && <div className="doc-error"><span>⚠ {fileError}</span></div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
export default function CriticismPage() {

  // ── Topics state (identical to QAPage) ──────────────────────────────────────
  const [appReady, setAppReady] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  // ── Criticism form ───────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [detail, setDetail] = useState("");     // short summary (= shortAnswer)
  const [severity, setSeverity] = useState("medium");
  const [tag, setTag] = useState("criticism");
  const [itemStatus, setItemStatus] = useState("pending");
  const [entryMode, setEntryMode] = useState("text"); // "text" | "document"
  const [notes, setNotes] = useState([newNote(), newNote()]);
  const [docFile, setDocFile] = useState(newDocFile());

  // ── List view ────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selected, setSelected] = useState(null);
  const [panelView, setPanelView] = useState("add"); // "add" | "list"

  // ── Saving / toast ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  // ── Fetch topics ─────────────────────────────────────────────────────────────
  const fetchTopics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`${BASE}/meet-fetch-topics`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const norm = Array.isArray(data) ? data.map(d => typeof d === "string" ? { name: d } : d) : [];
      setTopics(norm);
    } catch {
      setFetchError(true);
      setTopics([
        { name: "Economy" }, { name: "Healthcare" }, { name: "Education" },
        { name: "Infrastructure", tag: "NEW" }, { name: "Technology" }, { name: "Politics" },
      ]);
    } finally {
      setLoading(false); setRefreshing(false); setAppReady(true);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  // ── Fetch criticisms for a topic ─────────────────────────────────────────────
  const fetchItems = async (topicName) => {
    setLoadingItems(true); setItems([]); setSelected(null);
    try {
      const res = await fetch(`${BASE}/meet-fetch-criticisms?topic=${encodeURIComponent(topicName)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      setItems(Array.isArray(data) ? data : (data.items ?? []));
    } catch {
      setItems([]); // starts empty — user adds via form
    } finally {
      setLoadingItems(false);
    }
  };

  // ── Add / delete topic ───────────────────────────────────────────────────────
  const addTopic = async () => {
    if (!newTopic.trim()) return;
    setAddingTopic(true);
    try {
      const res = await fetch(`${BASE}/meet-add-topics`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_topic", name: newTopic.trim() }),
      });
      if (!res.ok) throw new Error();
      setTopics(p => [...p, { name: newTopic.trim() }]);
      setNewTopic("");
      showToast("Topic added");
    } catch { showToast("Failed to add topic — webhook unreachable"); }
    finally { setAddingTopic(false); }
  };

  const deleteTopic = async (e, topicName) => {
    e.stopPropagation();
    setDeletingTopic(topicName);
    try {
      const res = await fetch(`${BASE}/meet-delete-topic`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_topic", name: topicName }),
      });
      if (!res.ok) throw new Error();
      setTopics(p => p.filter(t => t.name !== topicName));
      if (selectedTopic?.name === topicName) { setSelectedTopic(null); resetForm(); }
      showToast(`"${topicName}" deleted`);
    } catch { showToast(`Failed to delete "${topicName}"`); }
    finally { setDeletingTopic(null); }
  };

  // ── Select topic ─────────────────────────────────────────────────────────────
  const selectTopic = (t) => {
    setSelectedTopic(t);
    resetForm();
    fetchItems(t.name);
    setPanelView("add");
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setTitle(""); setSource(""); setDetail("");
    setSeverity("medium"); setTag("criticism"); setItemStatus("pending");
    setEntryMode("text");
    setNotes([newNote(), newNote()]);
    setDocFile(newDocFile());
  };

  const switchMode = (mode) => {
    setEntryMode(mode);
    setNotes([newNote(), newNote()]);
    setDocFile(newDocFile());
  };

  const updateNote = (i, val) => setNotes(p => p.map((n, idx) => idx === i ? val : n));
  const addNote = () => setNotes(p => [...p, newNote()]);
  const removeNote = (i) => setNotes(p => p.filter((_, idx) => idx !== i));

  // ── Save criticism ────────────────────────────────────────────────────────────
  const saveCriticism = async () => {
    if (!selectedTopic) return showToast("Select a topic first");
    if (!title.trim()) return showToast("Please enter a title");
    if (!source.trim()) return showToast("Please enter a source");
    if (entryMode === "document" && !docFile.file) return showToast("Please upload a document");

    setSaving(true);
    try {
      let res;

      if (entryMode === "document") {
        const fd = new FormData();
        fd.append("topic", selectedTopic.name);
        fd.append("title", title.trim());
        fd.append("detail", detail.trim());
        fd.append("source", source.trim());
        fd.append("severity", severity);
        fd.append("tag", tag);
        fd.append("status", itemStatus);
        fd.append("entryMode", "document");
        fd.append("document", docFile.file, docFile.fileName);
        fd.append("documentName", docFile.fileName);
        res = await fetch(`${BASE}/meet-save-criticism`, { method: "POST", body: fd });
      } else {
        res = await fetch(`${BASE}/meet-save-criticism`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: selectedTopic.name, title: title.trim(),
            detail: detail.trim(), source: source.trim(),
            severity, tag, status: itemStatus, entryMode: "text",
            notes: notes.filter(n => n.value.trim()).map(n => ({ value: n.value.trim() })),
          }),
        });
      }

      if (!res.ok) throw new Error();

      // Optimistic update
      // const fresh = {
      //   id: `c-${Date.now()}`, topic: selectedTopic.name,
      //   title: title.trim(), detail: detail.trim(), source: source.trim(),
      //   date: new Date().toISOString().split("T")[0],
      //   severity, tag, status: itemStatus,
      //   notes: entryMode === "text" ? notes.filter(n => n.value.trim()) : [],
      //   hasDoc: entryMode === "document",
      // };
      // setItems(p => [fresh, ...p]);
      // setSelected(fresh);
      setPanelView("list");
      showToast("Criticism saved ✓");

      // Fire-and-forget: trigger embedding generation after save
      fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-embed-qa`, {
        method: "GET",
        headers: { Accept: "application/json" },
      }).catch(err => console.warn("[QAPage] Embed trigger failed:", err.message));

      resetForm();

    } catch { showToast("Failed to save — webhook unreachable"); }
    finally { setSaving(false); }
  };

  // ── Update status from detail view ───────────────────────────────────────────
  const updateStatus = (id, newStatus) => {
    setItems(p => p.map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }));
    fetch(`${BASE}/meet-update-criticism-status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    }).catch(() => { });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* ── Header (same as QAPage) ── */}
        <div className="qa-top">
          <div className="qa-logo">📊</div>
          <span className="qa-title">Criticism Manager</span>
          <span className="qa-subtitle">
            {selectedTopic ? `→ ${selectedTopic.name}` : "Select a topic to begin"}
          </span>
        </div>

        <div className="qa-body">

          {/* ══════════════════════════════════
              TOPICS — identical to QAPage
          ══════════════════════════════════ */}
          <div className="section-label">Topics</div>

          <div className="topic-header">
            <div className="topic-header-left">
              <h2>Choose a Topic</h2>
              <p>
                {fetchError
                  ? "⚠️ Using fallback topics (webhook unreachable)"
                  : "Topics loaded from n8n webhook"}
              </p>
            </div>
            <button
              className={`btn-refresh ${refreshing ? "spinning" : ""}`}
              onClick={() => fetchTopics(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading && appReady ? (
            <div className="state-box">
              <div className="loading-dots"><span /><span /><span /></div>
              <p>Fetching topics from webhook…</p>
            </div>
          ) : (
            <div className="topic-grid">
              {topics.map(t => {
                const isDeleting = deletingTopic === t.name;
                return (
                  <button
                    key={t.name}
                    className={`topic-btn ${selectedTopic?.name === t.name ? "active" : ""} ${isDeleting ? "topic-btn--deleting" : ""}`}
                    onClick={() => !isDeleting && selectTopic(t)}
                  >
                    {t.tag && <span className="topic-tag">{t.tag}</span>}
                    <span className="topic-icon">{getTopicIcon(t.name)}</span>
                    <span className="topic-name">{t.name}</span>
                    <span className="topic-delete-btn" title={`Delete "${t.name}"`}
                      onClick={e => !isDeleting && deleteTopic(e, t.name)}>
                      {isDeleting ? <span className="topic-delete-spinner" /> : <TrashIcon />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Add topic row */}
          <div className="add-topic-row">
            <input
              className="input-field"
              placeholder="Add a custom topic..."
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !addingTopic && addTopic()}
            />
            <button className="btn-primary" onClick={addTopic} disabled={addingTopic}
              style={{ opacity: addingTopic ? 0.7 : 1, cursor: addingTopic ? "not-allowed" : "pointer" }}>
              {addingTopic ? "Adding…" : "+ Add Topic"}
            </button>
          </div>

          {/* ══════════════════════════════════
              CRITICISM EDITOR — shown after topic selected
          ══════════════════════════════════ */}
          {selectedTopic && (
            <>
              <div className="divider" />
              <div className="section-label">Criticism Entry</div>

              {/* Section header: topic badge + view toggle + save button */}
              <div className="qa-section-header">
                <div className="qa-section-title">
                  <span className="topic-badge">
                    {getTopicIcon(selectedTopic.name)} {selectedTopic.name}
                  </span>
                  {items.length > 0 && (
                    <span className="field-optional" style={{ marginLeft: 8 }}>
                      · {items.length} {items.length === 1 ? "entry" : "entries"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* Add ↔ List toggle */}
                  <div className="answer-mode-toggle">
                    <button
                      className={`mode-toggle-btn ${panelView === "add" ? "active" : ""}`}
                      onClick={() => setPanelView("add")}
                    >
                      ➕ Add New
                    </button>
                    <button
                      className={`mode-toggle-btn ${panelView === "list" ? "active" : ""}`}
                      onClick={() => setPanelView("list")}
                    >
                      📋 View List
                    </button>
                  </div>
                  {panelView === "add" && (
                    <button className="btn-primary" onClick={saveCriticism} disabled={saving}
                      style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? "Saving…" : "💾 Save Criticism"}
                    </button>
                  )}
                </div>
              </div>

              {/* ───────────────────────────────
                  ADD VIEW
              ─────────────────────────────── */}
              {panelView === "add" && (
                <div className="qa-card">

                  {/* ── Title (= Question in QAPage) ── */}
                  <div className="qa-card-header">
                    <span className="qa-num">CRITICISM DETAILS</span>
                  </div>

                  <div className="qa-field qa-field--full">
                    <div className="field-label"><span />Title / Headline</div>
                    <textarea
                      className="input-field"
                      placeholder="Brief title of this criticism, question, or accusation…"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  </div>

                  {/* ── Summary detail (= Short Answer in QAPage) ── */}
                  <div className="qa-field-divider" />
                  <div className="qa-field qa-field--full">
                    <div className="field-label">
                      <span style={{ background: "#10b981" }} />
                      Summary
                      <span className="field-optional">(brief description)</span>
                    </div>
                    <textarea
                      className="input-field"
                      placeholder="One or two sentences describing what the criticism is about…"
                      value={detail}
                      onChange={e => setDetail(e.target.value)}
                      style={{ minHeight: 60 }}
                    />
                  </div>

                  {/* ── Source row ── */}
                  <div className="qa-field-divider" />
                  <div className="qa-field qa-field--full">
                    <div className="field-label">
                      <span style={{ background: "#6366f1" }} />
                      Source
                    </div>
                    <input
                      className="input-field"
                      placeholder="Opposition Party, Media outlet, NGO, Civil Society…"
                      value={source}
                      onChange={e => setSource(e.target.value)}
                    />
                  </div>

                  {/* ── Severity · Tag · Status pills row ── */}
                  <div className="qa-field-divider" />
                  <div className="crm-pills-row">

                    {/* Severity */}
                    <div className="crm-pill-group">
                      <div className="field-label" style={{ marginBottom: 8 }}>
                        <span style={{ background: "#ef4444" }} />Severity
                      </div>
                      <div className="crm-pills">
                        {SEV_OPTIONS.map(s => (
                          <button
                            key={s.value}
                            className={`type-pill ${severity === s.value ? "active" : ""}`}
                            style={severity === s.value
                              ? { borderColor: s.color, color: s.color, background: `${s.color}18` }
                              : {}}
                            onClick={() => setSeverity(s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="crm-pill-divider" />

                    {/* Tag / Type */}
                    <div className="crm-pill-group">
                      <div className="field-label" style={{ marginBottom: 8 }}>
                        <span style={{ background: "#3b82f6" }} />Type
                      </div>
                      <div className="crm-pills">
                        {TAG_OPTIONS.map(t => (
                          <button
                            key={t.value}
                            className={`type-pill ${tag === t.value ? "active" : ""}`}
                            style={tag === t.value
                              ? { borderColor: t.color, color: t.color, background: t.bg }
                              : {}}
                            onClick={() => setTag(t.value)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="crm-pill-divider" />

                    {/* Status */}
                    <div className="crm-pill-group">
                      <div className="field-label" style={{ marginBottom: 8 }}>
                        <span style={{ background: "#f59e0b" }} />Status
                      </div>
                      <div className="crm-pills">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s.value}
                            className={`type-pill ${itemStatus === s.value ? "active" : ""}`}
                            style={itemStatus === s.value
                              ? { borderColor: s.color, color: s.color, background: s.bg }
                              : {}}
                            onClick={() => setItemStatus(s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Notes / Document (= Answers section in QAPage) ── */}
                  <div className="qa-field-divider" />
                  <div className="answers-section">

                    <div className="answers-section-header">
                      <div className="field-label" style={{ margin: 0 }}>
                        <span style={{ background: "#f59e0b" }} />
                        Evidence &amp; Notes
                        <span className="field-optional">
                          {entryMode === "text" ? `(${notes.length} notes)` : "(document)"}
                        </span>
                      </div>

                      {/* Text ↔ Document toggle */}
                      <div className="answer-mode-toggle">
                        <button
                          className={`mode-toggle-btn ${entryMode === "text" ? "active" : ""}`}
                          onClick={() => switchMode("text")}
                        >
                          ✏️ Text Notes
                        </button>
                        <button
                          className={`mode-toggle-btn ${entryMode === "document" ? "active" : ""}`}
                          onClick={() => switchMode("document")}
                        >
                          📄 Document
                        </button>
                      </div>
                    </div>

                    {/* Text notes — mirrors QAPage TextAnswerItem list */}
                    {entryMode === "text" && (
                      <>
                        <div className="answers-list">
                          {notes.map((n, i) => (
                            <TextNoteItem
                              key={i} index={i} note={n}
                              onChange={val => updateNote(i, val)}
                              onRemove={() => removeNote(i)}
                              canRemove={notes.length > 1}
                            />
                          ))}
                        </div>
                        <button className="btn-add-answer" onClick={addNote}>
                          <PlusIcon /> Add Another Note
                        </button>
                      </>
                    )}

                    {/* Document upload — identical to QAPage */}
                    {entryMode === "document" && (
                      <DocumentUpload
                        file={docFile.file} fileName={docFile.fileName}
                        fileSize={docFile.fileSize} fileError={docFile.fileError}
                        onChange={setDocFile}
                      />
                    )}

                  </div>
                </div>
              )}

              {/* ───────────────────────────────
                  LIST VIEW
              ─────────────────────────────── */}
              {panelView === "list" && (
                <div className="cs-split">

                  {/* Left list */}
                  <div className="cs-list">
                    {loadingItems && (
                      <div className="state-box">
                        <div className="loading-dots"><span /><span /><span /></div>
                        <p>Loading entries…</p>
                      </div>
                    )}
                    {!loadingItems && items.length === 0 && (
                      <div className="cs-empty">
                        No criticisms yet for <strong>{selectedTopic.name}</strong>.<br />
                        Switch to "Add New" to create one.
                      </div>
                    )}
                    {items.map(item => (
                      <button
                        key={item.id}
                        className={`cs-list-item ${selected?.id === item.id ? "active" : ""}`}
                        onClick={() => setSelected(item)}
                      >
                        <div className="cs-list-item-top">
                          <SeverityDot severity={item.severity} />
                          <TagPill tag={item.tag} />
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="cs-list-item-title">{item.title}</p>
                        <div className="cs-list-item-meta">
                          <span>📰 {item.source}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        {item.hasDoc && (
                          <span style={{ fontSize: 11, color: "#6366f1", fontFamily: "Space Mono,monospace" }}>
                            📄 Document attached
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Right detail */}
                  {selected ? (
                    <div className="cs-detail">
                      <div className="cs-detail-header">
                        <div className="cs-detail-header-left">
                          <SeverityDot severity={selected.severity} />
                          <span className="cs-detail-topic">{selected.topic}</span>
                          <TagPill tag={selected.tag} />
                        </div>
                        <StatusBadge status={selected.status} />
                      </div>

                      <h3 className="cs-detail-title">{selected.title}</h3>

                      <div className="cs-detail-meta-row">
                        <span>📰 {selected.source}</span>
                        <span>📅 {new Date(selected.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>

                      {selected.detail && (
                        <p className="cs-detail-body">{selected.detail}</p>
                      )}

                      {/* Notes preview */}
                      {selected.inputType === 'text' && selected.answers?.length > 0 && (
                        <>
                          <div className="cs-detail-section-label">NOTES</div>
                          {JSON.parse(selected.answers).map((n, i) => (
                            <div key={i} className="answer-item" style={{ marginTop: 6 }}>
                              <div className="answer-item-header">
                                <span className="answer-variant-label">NOTE {String(i + 1).padStart(2, "0")}</span>
                              </div>
                              <p style={{ fontSize: 13, color: "var(--text-secondary)", padding: "8px 14px 10px", lineHeight: 1.65 }}>
                                {n.value}
                              </p>
                            </div>
                          ))}
                        </>
                      )}

                      {selected.inputType === 'document' && selected.answers && (
                        <>
                          <div className="cs-detail-section-label">DOCUMENT</div>
                          <div className="doc-attached" style={{ margin: "8px 0" }}>
                            <div className="doc-attached-icon"><FileIcon /></div>
                            <div className="doc-attached-info">
                              <span className="doc-attached-name"> <a href={selected.answers} target="_blank">{selected.title}</a> </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Status update buttons */}
                      <div className="cs-detail-section-label" style={{ marginTop: 18 }}>UPDATE STATUS</div>
                      <div className="cs-status-actions">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s.value}
                            className={`cs-status-btn ${selected.status === s.value ? "active" : ""}`}
                            style={selected.status === s.value
                              ? { borderColor: s.color, color: s.color, background: s.bg }
                              : {}}
                            onClick={() => updateStatus(selected.id, s.value)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Internal notes textarea */}
                      <div className="cs-detail-section-label" style={{ marginTop: 18 }}>INTERNAL NOTES</div>
                      <textarea
                        className="input-field"
                        style={{ minHeight: 90, marginTop: 8 }}
                        placeholder="Add internal notes visible only to your team…"
                      />
                    </div>
                  ) : (
                    <div className="cs-detail cs-detail--empty">
                      <p>Select an entry to view details</p>
                    </div>
                  )}

                </div>
              )}

            </>
          )}

        </div>

        {/* ── Toast (identical to QAPage) ── */}
        <div
          className={`status-bar ${toast ? "show" : ""}`}
          style={toast?.startsWith("Failed")
            ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
            : {}}
        >
          {toast?.startsWith("Failed") ? "✕" : "✓"} {toast}
        </div>

      </div>
    </>
  );
}