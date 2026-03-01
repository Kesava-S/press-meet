// ── pages/data/CriticismPage.jsx ─────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../globals.css";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
function formatSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}
const newNote    = () => ({ value: "" });
const newDocFile = () => ({ file: null, fileName: "", fileSize: 0, fileError: "" });

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
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

function TextNoteItem({ index, note, onChange, onRemove, canRemove }) {
  return (
    <div className="answer-item">
      <div className="answer-item-header">
        <span className="answer-variant-label">NOTE {String(index + 1).padStart(2, "0")}</span>
        {canRemove && (
          <button className="answer-remove-btn" onClick={onRemove}><TrashIcon /></button>
        )}
      </div>
      <textarea className="variant-input"
        placeholder={`Add supporting note or evidence ${index + 1}…`}
        value={note.value}
        onChange={e => onChange({ ...note, value: e.target.value })} />
    </div>
  );
}

function DocumentUpload({ file, fileName, fileSize, fileError, onChange }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const handleFile = (f) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) { onChange({ file: null, fileName: "", fileSize: 0, fileError: "File too large — max 10 MB" }); return; }
    onChange({ file: f, fileName: f.name, fileSize: f.size, fileError: "" });
  };
  return (
    <div className="document-upload-wrapper">
      <div className={`doc-drop-zone ${dragging?"dragging":""} ${file?"has-file":""} ${fileError?"has-error":""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
        <input ref={fileRef} type="file" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <div className="doc-attached">
            <div className="doc-attached-icon"><FileIcon /></div>
            <div className="doc-attached-info">
              <span className="doc-attached-name">{fileName}</span>
              <span className="doc-attached-size">{formatSize(fileSize)}</span>
            </div>
            <button className="doc-clear-btn" onClick={e => { e.stopPropagation(); onChange(newDocFile()); }}><TrashIcon /></button>
          </div>
        ) : (
          <div className="doc-empty">
            <div className={`doc-upload-icon ${dragging?"bounce":""}`}><UploadIcon /></div>
            <p className="doc-upload-label">{dragging ? "Drop it here!" : "Click or drag a file to upload"}</p>
            <p className="doc-upload-hint">Any format · Max 10 MB</p>
          </div>
        )}
      </div>
      {file && <div className="doc-size-bar"><div className="doc-size-fill" style={{width:`${Math.min((fileSize/MAX_FILE_SIZE)*100,100)}%`}} /></div>}
      {fileError && <div className="doc-error"><span>⚠ {fileError}</span></div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CriticismPage() {
  const navigate = useNavigate();

  const [appReady,      setAppReady]      = useState(false);
  const [topics,        setTopics]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [addingTopic,   setAddingTopic]   = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [newTopic,      setNewTopic]      = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicCounts,   setTopicCounts]   = useState({});

  // Form
  const [title,      setTitle]      = useState("");
  const [source,     setSource]     = useState("");
  const [detail,     setDetail]     = useState("");
  const [severity,   setSeverity]   = useState("medium");
  const [tag,        setTag]        = useState("criticism");
  const [itemStatus, setItemStatus] = useState("pending");
  const [entryMode,  setEntryMode]  = useState("text");
  const [notes,      setNotes]      = useState([newNote(), newNote()]);
  const [docFile,    setDocFile]    = useState(newDocFile());
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

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
        { name: "Infrastructure" }, { name: "Technology" }, { name: "Politics" },
      ]);
    } finally {
      setLoading(false); setRefreshing(false); setAppReady(true);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  const addTopic = async () => {
    if (!newTopic.trim()) return;
    setAddingTopic(true);
    try {
      await fetch(`${BASE}/meet-add-topics`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_topic", name: newTopic.trim() }),
      });
      setTopics(p => [...p, { name: newTopic.trim() }]);
      setNewTopic(""); showToast("Topic added");
    } catch { showToast("Failed to add topic"); }
    finally { setAddingTopic(false); }
  };

  const deleteTopic = async (e, topicName) => {
    e.stopPropagation();
    setDeletingTopic(topicName);
    try {
      await fetch(`${BASE}/meet-delete-topic`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_topic", name: topicName }),
      });
      setTopics(p => p.filter(t => t.name !== topicName));
      if (selectedTopic?.name === topicName) { setSelectedTopic(null); resetForm(); }
      showToast(`"${topicName}" deleted`);
    } catch { showToast(`Failed to delete "${topicName}"`); }
    finally { setDeletingTopic(null); }
  };

  const selectTopic = (t) => { setSelectedTopic(t); resetForm(); };
  const resetForm = () => {
    setTitle(""); setSource(""); setDetail(""); setSeverity("medium");
    setTag("criticism"); setItemStatus("pending"); setEntryMode("text");
    setNotes([newNote(), newNote()]); setDocFile(newDocFile());
  };
  const switchMode = (m) => { setEntryMode(m); setNotes([newNote(), newNote()]); setDocFile(newDocFile()); };
  const updateNote = (i, val) => setNotes(p => p.map((n, idx) => idx === i ? val : n));
  const addNote    = () => setNotes(p => [...p, newNote()]);
  const removeNote = (i) => setNotes(p => p.filter((_, idx) => idx !== i));

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
        fd.append("topic", selectedTopic.name); fd.append("title", title.trim());
        fd.append("detail", detail.trim()); fd.append("source", source.trim());
        fd.append("severity", severity); fd.append("tag", tag); fd.append("status", itemStatus);
        fd.append("entryMode", "document"); fd.append("document", docFile.file, docFile.fileName);
        fd.append("documentName", docFile.fileName);
        res = await fetch(`${BASE}/meet-save-criticism`, { method: "POST", body: fd });
      } else {
        res = await fetch(`${BASE}/meet-save-criticism`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: selectedTopic.name, title: title.trim(), detail: detail.trim(),
            source: source.trim(), severity, tag, status: itemStatus, entryMode: "text",
            notes: notes.filter(n => n.value.trim()).map(n => ({ value: n.value.trim() })),
          }),
        });
      }
      if (!res.ok) throw new Error();
      setTopicCounts(prev => ({ ...prev, [selectedTopic.name]: (prev[selectedTopic.name] || 0) + 1 }));
      showToast("Criticism saved ✓");
      fetch(`${BASE}/meet-embed-qa`, { method: "GET", headers: { Accept: "application/json" } }).catch(() => {});
      resetForm();
    } catch { showToast("Failed to save — webhook unreachable"); }
    finally { setSaving(false); }
  };

  const viewEntries = (topicName) => {
    navigate(`/app/data/criticism/list/${encodeURIComponent(topicName)}`);
  };

  return (
    <>
      {!appReady && <Preloader />}
      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>
        <div className="qa-top">
          <div className="qa-logo">📊</div>
          <span className="qa-title">Criticism Manager</span>
          <span className="qa-subtitle">
            {selectedTopic ? `→ Adding to ${selectedTopic.name}` : "Select a topic to begin"}
          </span>
        </div>

        <div className="qa-body">
          <div className="section-label">Topics</div>
          <div className="topic-header">
            <div className="topic-header-left">
              <h2>Choose a Topic</h2>
              <p>{fetchError ? "⚠️ Using fallback topics" : "Topics loaded from n8n"}</p>
            </div>
            <button className={`btn-refresh ${refreshing ? "spinning" : ""}`} onClick={() => fetchTopics(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>

          {loading && appReady ? (
            <div className="state-box">
              <div className="loading-dots"><span /><span /><span /></div>
              <p>Fetching topics…</p>
            </div>
          ) : (
            <div className="csp-topic-grid">
              {topics.map(t => {
                const isDeleting = deletingTopic === t.name;
                const count = topicCounts[t.name];
                const isActive = selectedTopic?.name === t.name;
                return (
                  <div key={t.name}
                    className={`csp-topic-card${isActive ? " active" : ""}${isDeleting ? " deleting" : ""}`}>

                    <div className="csp-card-top">
                      <span className="csp-card-icon">{getTopicIcon(t.name)}</span>
                      <span className="csp-card-name">{t.name}</span>
                      {t.tag && <span className="topic-tag">{t.tag}</span>}
                      <button className="csp-card-del" disabled={isDeleting}
                        onClick={e => !isDeleting && deleteTopic(e, t.name)}>
                        {isDeleting ? <span className="topic-delete-spinner" /> : <TrashIcon />}
                      </button>
                    </div>

                    {count > 0 && (
                      <div className="csp-card-count">
                        <span className="csp-count-dot" />
                        {count} {count === 1 ? "entry" : "entries"}
                      </div>
                    )}

                    <div className="csp-card-actions">
                      <button
                        className={`csp-btn-add${isActive ? " active" : ""}`}
                        onClick={() => selectTopic(t)}>
                        <PlusIcon />
                        {isActive ? "Selected" : "Add Entry"}
                      </button>
                      <button className="csp-btn-view" onClick={() => viewEntries(t.name)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                          <line x1="8" y1="18" x2="21" y2="18"/>
                          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                          <line x1="3" y1="18" x2="3.01" y2="18"/>
                        </svg>
                        View Entries
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="add-topic-row">
            <input className="input-field" placeholder="Add a custom topic..."
              value={newTopic} onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !addingTopic && addTopic()} />
            <button className="btn-primary" onClick={addTopic} disabled={addingTopic}>
              {addingTopic ? "Adding…" : "+ Add Topic"}
            </button>
          </div>

          {/* ── Entry form ── */}
          {selectedTopic && (
            <>
              <div className="divider" />
              <div className="section-label">New Entry — {selectedTopic.name}</div>
              <div className="qa-section-header">
                <span className="topic-badge">{getTopicIcon(selectedTopic.name)} {selectedTopic.name}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="csp-view-link" onClick={() => viewEntries(selectedTopic.name)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                    </svg>
                    View all entries
                  </button>
                  <button className="btn-primary" onClick={saveCriticism} disabled={saving}>
                    {saving ? "Saving…" : "💾 Save Criticism"}
                  </button>
                </div>
              </div>

              <div className="qa-card">
                <div className="qa-card-header"><span className="qa-num">CRITICISM DETAILS</span></div>

                <div className="qa-field qa-field--full">
                  <div className="field-label"><span />Title / Headline</div>
                  <textarea className="input-field"
                    placeholder="Brief title of this criticism, question, or accusation…"
                    value={title} onChange={e => setTitle(e.target.value)} />
                </div>

                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label">
                    <span style={{ background: "#10b981" }} />Summary
                    <span className="field-optional">(brief description)</span>
                  </div>
                  <textarea className="input-field"
                    placeholder="One or two sentences describing the criticism…"
                    value={detail} onChange={e => setDetail(e.target.value)} style={{ minHeight: 60 }} />
                </div>

                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label"><span style={{ background: "#6366f1" }} />Source</div>
                  <input className="input-field"
                    placeholder="Opposition Party, Media outlet, NGO…"
                    value={source} onChange={e => setSource(e.target.value)} />
                </div>

                <div className="qa-field-divider" />
                <div className="crm-pills-row">
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#ef4444" }} />Severity</div>
                    <div className="crm-pills">
                      {SEV_OPTIONS.map(s => (
                        <button key={s.value} className={`type-pill ${severity===s.value?"active":""}`}
                          style={severity===s.value?{borderColor:s.color,color:s.color,background:`${s.color}18`}:{}}
                          onClick={() => setSeverity(s.value)}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="crm-pill-divider" />
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#3b82f6" }} />Type</div>
                    <div className="crm-pills">
                      {TAG_OPTIONS.map(t => (
                        <button key={t.value} className={`type-pill ${tag===t.value?"active":""}`}
                          style={tag===t.value?{borderColor:t.color,color:t.color,background:t.bg}:{}}
                          onClick={() => setTag(t.value)}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="crm-pill-divider" />
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#f59e0b" }} />Status</div>
                    <div className="crm-pills">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.value} className={`type-pill ${itemStatus===s.value?"active":""}`}
                          style={itemStatus===s.value?{borderColor:s.color,color:s.color,background:s.bg}:{}}
                          onClick={() => setItemStatus(s.value)}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="qa-field-divider" />
                <div className="answers-section">
                  <div className="answers-section-header">
                    <div className="field-label" style={{ margin: 0 }}>
                      <span style={{ background: "#f59e0b" }} />Evidence &amp; Notes
                      <span className="field-optional">{entryMode==="text"?`(${notes.length} notes)`:"(document)"}</span>
                    </div>
                    <div className="answer-mode-toggle">
                      <button className={`mode-toggle-btn ${entryMode==="text"?"active":""}`} onClick={() => switchMode("text")}>✏️ Text Notes</button>
                      <button className={`mode-toggle-btn ${entryMode==="document"?"active":""}`} onClick={() => switchMode("document")}>📄 Document</button>
                    </div>
                  </div>
                  {entryMode === "text" && (
                    <>
                      <div className="answers-list">
                        {notes.map((n, i) => (
                          <TextNoteItem key={i} index={i} note={n}
                            onChange={val => updateNote(i, val)}
                            onRemove={() => removeNote(i)} canRemove={notes.length > 1} />
                        ))}
                      </div>
                      <button className="btn-add-answer" onClick={addNote}><PlusIcon /> Add Another Note</button>
                    </>
                  )}
                  {entryMode === "document" && (
                    <DocumentUpload file={docFile.file} fileName={docFile.fileName}
                      fileSize={docFile.fileSize} fileError={docFile.fileError} onChange={setDocFile} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`status-bar ${toast ? "show" : ""}`}
          style={toast?.startsWith("Failed")
            ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
            : {}}>
          {toast?.startsWith("Failed") ? "✕" : "✓"} {toast}
        </div>
      </div>
    </>
  );
}