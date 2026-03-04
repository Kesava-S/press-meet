// ── pages/data/CriticismPage.jsx ─────────────────────────────────────────────
// Unified: Criticism + Q&A in one page
// - Card grid topic selector (Criticism UI style)
// - After topic select → choose mode: Criticism or Q&A
// - Criticism: Title, Summary, Source, Severity/Type/Status, Text Notes + Proof Docs
// - Q&A: Question, Short Answer, Text answers OR single Document

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
const SEV_OPTIONS = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#10b981" },
];
const TAG_OPTIONS = [
  { value: "criticism", label: "Criticism", color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  { value: "question", label: "Question", color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  { value: "accusation", label: "Accusation", color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
];
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
  { value: "in-progress", label: "In Progress", color: "#6366f1", bg: "rgba(99,102,241,0.10)" },
  { value: "addressed", label: "Addressed", color: "#10b981", bg: "rgba(16,185,129,0.10)" },
];

const getIcon = n => TOPIC_ICONS[n] || TOPIC_ICONS.Default;
const newAnswer = () => ({ value: "" });
const newNote = () => ({ value: "" });
const newDocFile = () => ({ file: null, fileName: "", fileSize: 0, fileError: "" });

function formatSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}
function fileEmoji(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📄";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["mp4", "mov", "avi"].includes(ext)) return "🎬";
  if (["mp3", "wav"].includes(ext)) return "🎵";
  return "📎";
}

// ── Icons ──────────────────────────────────────────────────────────────────────
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
function PaperclipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
    </svg>
  );
}

function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring"><span /><span /><span /></div>
        <p className="preloader-text">Loading…</p>
      </div>
    </div>
  );
}

// ── Text Answer (Q&A) ──────────────────────────────────────────────────────────
function TextAnswerItem({ index, answer, onChange, onRemove, canRemove }) {
  return (
    <div className="answer-item">
      <div className="answer-item-header">
        <span className="answer-variant-label">ANSWER {String(index + 1).padStart(2, "0")}</span>
        {canRemove && <button className="answer-remove-btn" onClick={onRemove}><TrashIcon /></button>}
      </div>
      <textarea className="variant-input"
        placeholder={`Type answer ${index + 1}…`}
        value={answer.value}
        onChange={e => onChange({ ...answer, value: e.target.value })} />
    </div>
  );
}

// ── Text Note (Criticism) ──────────────────────────────────────────────────────
function TextNoteItem({ index, note, onChange, onRemove, canRemove }) {
  return (
    <div className="answer-item">
      <div className="answer-item-header">
        <span className="answer-variant-label">NOTE {String(index + 1).padStart(2, "0")}</span>
        {canRemove && <button className="answer-remove-btn" onClick={onRemove}><TrashIcon /></button>}
      </div>
      <textarea className="variant-input"
        placeholder={`Add supporting note or evidence ${index + 1}…`}
        value={note.value}
        onChange={e => onChange({ ...note, value: e.target.value })} />
    </div>
  );
}

// ── Single Document Upload (Q&A doc mode) ─────────────────────────────────────
function DocumentUpload({ file, fileName, fileSize, fileError, onChange }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const handleFile = f => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      onChange({ file: null, fileName: "", fileSize: 0, fileError: `File too large — max 10 MB (${formatSize(f.size)})` });
      return;
    }
    onChange({ file: f, fileName: f.name, fileSize: f.size, fileError: "" });
  };
  return (
    <div className="document-upload-wrapper">
      <div className={`doc-drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""} ${fileError ? "has-error" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
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

// ── Multi-file Proof Attachments (Criticism) ───────────────────────────────────
function ProofAttachments({ files, onAdd, onRemove }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = incoming => {
    setError("");
    const arr = Array.from(incoming);
    const tooBig = arr.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) { setError(`"${tooBig.name}" is too large — max 10 MB`); return; }
    arr.forEach(f => onAdd({ file: f, fileName: f.name, fileSize: f.size }));
  };

  return (
    <div className="proof-attachments">
      <div className={`proof-drop-zone ${dragging ? "dragging" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)} />
        <span className="proof-drop-icon"><PaperclipIcon /></span>
        <span className="proof-drop-label">{dragging ? "Drop files here" : "Attach proof documents"}</span>
        <span className="proof-drop-hint">PDF, images, videos, docs · Max 10 MB each · Multiple allowed</span>
      </div>
      {error && <div className="doc-error" style={{ marginTop: 6 }}><span>⚠ {error}</span></div>}
      {files.length > 0 && (
        <div className="proof-files-list">
          {files.map((f, i) => (
            <div key={i} className="proof-file-chip">
              <span className="proof-file-emoji">{fileEmoji(f.fileName)}</span>
              <div className="proof-file-meta">
                <span className="proof-file-name" title={f.fileName}>
                  {f.fileName.length > 26 ? f.fileName.slice(0, 24) + "…" : f.fileName}
                </span>
                <span className="proof-file-size">{formatSize(f.fileSize)}</span>
              </div>
              <button className="proof-file-remove" onClick={() => onRemove(i)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function CriticismPage() {
  const navigate = useNavigate();

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [appReady, setAppReady] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicCounts, setTopicCounts] = useState({});
  const [toast, setToast] = useState(null);

  // "criticism" | "qa" — chosen AFTER topic selected
  const [formMode, setFormMode] = useState(null);

  // ── Criticism form ─────────────────────────────────────────────────────────
  const [cTitle, setCTitle] = useState("");
  const [cSource, setCSource] = useState("");
  const [cDetail, setCDetail] = useState("");
  const [cSeverity, setCSeverity] = useState("medium");
  const [cTag, setCTag] = useState("criticism");
  const [cStatus, setCStatus] = useState("pending");
  const [cNotes, setCNotes] = useState([newNote(), newNote()]);
  const [cNoteMode, setCNoteMode] = useState("text");
  const [cDocFile, setCDocFile] = useState(newDocFile());
  const [proofFiles, setProofFiles] = useState([]);
  const [savingCrit, setSavingCrit] = useState(false);

  // ── Q&A form ───────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [answerMode, setAnswerMode] = useState("text"); // "text" | "document"
  const [answers, setAnswers] = useState([newAnswer(), newAnswer()]);
  const [qaDocFile, setQaDocFile] = useState(newDocFile());
  const [savingQA, setSavingQA] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  // ── Topics ─────────────────────────────────────────────────────────────────
  const fetchTopics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`${BASE}/meet-fetch-topics`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTopics(Array.isArray(data) ? data.map(d => typeof d === "string" ? { name: d } : d) : []);
    } catch {
      setFetchError(true);
      setTopics([
        { name: "Economy" }, { name: "Healthcare" }, { name: "Education" },
        { name: "Infrastructure" }, { name: "Technology" }, { name: "Politics" },
      ]);
    } finally { setLoading(false); setRefreshing(false); setAppReady(true); }
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
      if (selectedTopic?.name === topicName) { setSelectedTopic(null); setFormMode(null); resetAll(); }
      showToast(`"${topicName}" deleted`);
    } catch { showToast(`Failed to delete "${topicName}"`); }
    finally { setDeletingTopic(null); }
  };

  const selectTopic = t => {
    setSelectedTopic(t);
    setFormMode(null); // always reset to mode picker when topic changes
    resetAll();
  };

  // ── Resets ─────────────────────────────────────────────────────────────────
  const resetCriticism = () => {
    setCTitle(""); setCSource(""); setCDetail("");
    setCSeverity("medium"); setCTag("criticism"); setCStatus("pending");
    setCNotes([newNote(), newNote()]); setCNoteMode("text"); setCDocFile(newDocFile()); setProofFiles([]);
  };
  const resetQA = () => {
    setQuestion(""); setShortAnswer(""); setAnswerMode("text");
    setAnswers([newAnswer(), newAnswer()]); setQaDocFile(newDocFile());
  };
  const resetAll = () => { resetCriticism(); resetQA(); };

  const switchNoteMode = mode => {
    setCNoteMode(mode);
    setCNotes([newNote(), newNote()]);
    setCDocFile(newDocFile());
  };

  const switchAnswerMode = mode => {
    setAnswerMode(mode);
    setAnswers([newAnswer(), newAnswer()]);
    setQaDocFile(newDocFile());
  };

  // ── Criticism note helpers ─────────────────────────────────────────────────
  const updateNote = (i, v) => setCNotes(p => p.map((n, idx) => idx === i ? v : n));
  const addNote = () => setCNotes(p => [...p, newNote()]);
  const removeNote = i => setCNotes(p => p.filter((_, idx) => idx !== i));

  // ── Q&A answer helpers ─────────────────────────────────────────────────────
  const updateAnswer = (i, v) => setAnswers(p => p.map((a, idx) => idx === i ? v : a));
  const addAnswer = () => setAnswers(p => [...p, newAnswer()]);
  const removeAnswer = i => setAnswers(p => p.filter((_, idx) => idx !== i));

  // ── Proof files ────────────────────────────────────────────────────────────
  const addProofFile = f => setProofFiles(p => [...p, f]);
  const removeProofFile = i => setProofFiles(p => p.filter((_, idx) => idx !== i));

  // ── Save Criticism ─────────────────────────────────────────────────────────
  const saveCriticism = async () => {
    if (!selectedTopic) return showToast("Select a topic first");
    if (!cTitle.trim()) return showToast("Please enter a title");
    if (!cSource.trim()) return showToast("Please enter a source");
    if (cNoteMode === "document" && !cDocFile.file) return showToast("Please attach a document for notes");
    setSavingCrit(true);
    try {
      const fd = new FormData();
      fd.append("topic", selectedTopic.name);
      fd.append("title", cTitle.trim());
      fd.append("detail", cDetail.trim());
      fd.append("source", cSource.trim());
      fd.append("severity", cSeverity);
      fd.append("tag", cTag);
      fd.append("status", cStatus);
      fd.append("entryMode", cNoteMode);
      if (cNoteMode === "document") {
        fd.append("document", cDocFile.file, cDocFile.fileName);
        fd.append("documentName", cDocFile.fileName);
      } else {
        fd.append("notes", JSON.stringify(
          cNotes.filter(n => n.value.trim()).map(n => ({ value: n.value.trim() }))
        ));
      }
      proofFiles.forEach((pf, i) => fd.append(`proof_${i}`, pf.file, pf.fileName));
      fd.append("proofCount", proofFiles.length);
      const res = await fetch(`${BASE}/meet-save-criticism`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      fetch(`${BASE}/meet-embed-qa`, { method: "GET" }).catch(() => { });
      setTopicCounts(p => ({ ...p, [selectedTopic.name]: (p[selectedTopic.name] || 0) + 1 }));
      showToast("Criticism saved ✓");
      resetCriticism();
    } catch { showToast("Failed to save — webhook unreachable"); }
    finally { setSavingCrit(false); }
  };

  // ── Save Q&A ───────────────────────────────────────────────────────────────
  const saveQA = async () => {
    if (!selectedTopic) return showToast("Select a topic first");
    if (!question.trim()) return showToast("Please enter a question");
    if (answerMode === "document" && !qaDocFile.file) return showToast("Please attach a document");
    setSavingQA(true);
    try {
      let res;
      if (answerMode === "document") {
        const fd = new FormData();
        fd.append("topic", selectedTopic.name);
        fd.append("question", question.trim());
        fd.append("shortAnswer", shortAnswer.trim());
        fd.append("inputType", "document");
        fd.append("document", qaDocFile.file, qaDocFile.fileName);
        res = await fetch(`${BASE}/meet-save-qa`, { method: "POST", body: fd });
      } else {
        res = await fetch(`${BASE}/meet-save-qa`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: selectedTopic.name,
            question: question.trim(),
            shortAnswer: shortAnswer.trim(),
            inputType: "text",
            answers: answers.filter(a => a.value.trim()).map(a => ({ value: a.value.trim() })),
          }),
        });
      }
      if (!res.ok) throw new Error();
      fetch(`${BASE}/meet-embed-qa`, { method: "GET" }).catch(() => { });
      setTopicCounts(p => ({ ...p, [selectedTopic.name]: (p[selectedTopic.name] || 0) + 1 }));
      showToast("Q&A saved ✓");
      resetQA();
    } catch { showToast("Failed to save — webhook unreachable"); }
    finally { setSavingQA(false); }
  };

  const viewEntries = topicName =>
    navigate(`/app/data/criticism/list/${encodeURIComponent(topicName)}`);


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}
      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* Header */}
        <div className="qa-top">
          <div className="qa-logo">
            {formMode === "qa" ? "💬" : "📊"}
          </div>
          <span className="qa-title">
            {formMode === "qa" ? "Q&A Manager" : "Criticism Manager"}
          </span>
          <span className="qa-subtitle">
            {selectedTopic
              ? formMode
                ? `→ ${selectedTopic.name}`
                : `→ ${selectedTopic.name} — choose type below`
              : "Select a topic to begin"}
          </span>
        </div>

        <div className="qa-body">

          {/* ── TOPICS GRID ── */}
          <div className="section-label">Topics</div>
          <div className="topic-header">
            <div className="topic-header-left">
              <h2>Choose a Topic</h2>
              <p>{fetchError ? "⚠️ Using fallback topics" : "Topics loaded from n8n"}</p>
            </div>
            <button className={`btn-refresh ${refreshing ? "spinning" : ""}`} onClick={() => fetchTopics(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
                      <span className="csp-card-icon">{getIcon(t.name)}</span>
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
                      <button className={`csp-btn-add${isActive ? " active" : ""}`}
                        onClick={() => selectTopic(t)}>
                        <PlusIcon />
                        {isActive ? "Selected" : "Add Entry"}
                      </button>
                      <button className="csp-btn-view" onClick={() => viewEntries(t.name)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
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

          {/* ── MODE PICKER — shown after topic selected ── */}
          {selectedTopic && (
            <>
              <div className="divider" />
              <div className="section-label">Entry Type</div>
              <div className="ucp-mode-picker">
                <button
                  className={`ucp-mode-card ${formMode === "criticism" ? "active" : ""}`}
                  onClick={() => { setFormMode("criticism"); resetCriticism(); }}>
                  <span className="ucp-mode-icon">📊</span>
                  <span className="ucp-mode-label">Criticism</span>
                  <span className="ucp-mode-desc">Log a criticism, accusation, or challenge with proof docs</span>
                  {formMode === "criticism" && <span className="ucp-mode-check">✓</span>}
                </button>
                <button
                  className={`ucp-mode-card ${formMode === "qa" ? "active" : ""}`}
                  onClick={() => { setFormMode("qa"); resetQA(); }}>
                  <span className="ucp-mode-icon">💬</span>
                  <span className="ucp-mode-label">Q&amp;A</span>
                  <span className="ucp-mode-desc">Add a question with text answers or a reference document</span>
                  {formMode === "qa" && <span className="ucp-mode-check">✓</span>}
                </button>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              CRITICISM FORM
          ══════════════════════════════════════════════ */}
          {selectedTopic && formMode === "criticism" && (
            <>
              <div className="divider" />
              <div className="section-label">New Criticism — {selectedTopic.name}</div>
              <div className="qa-section-header">
                <span className="topic-badge">{getIcon(selectedTopic.name)} {selectedTopic.name}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="csp-view-link" onClick={() => viewEntries(selectedTopic.name)}>
                    <ListIcon /> View all entries
                  </button>
                  <button className="btn-primary" onClick={saveCriticism} disabled={savingCrit}
                    style={{ opacity: savingCrit ? 0.7 : 1, cursor: savingCrit ? "not-allowed" : "pointer" }}>
                    {savingCrit ? "Saving…" : "💾 Save Criticism"}
                  </button>
                </div>
              </div>

              <div className="qa-card">
                <div className="qa-card-header"><span className="qa-num">CRITICISM DETAILS</span></div>

                <div className="qa-field qa-field--full">
                  <div className="field-label"><span />Title / Headline</div>
                  <textarea className="input-field"
                    placeholder="Brief title of this criticism, question, or accusation…"
                    value={cTitle} onChange={e => setCTitle(e.target.value)} />
                </div>

                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label">
                    <span style={{ background: "#10b981" }} />Summary
                    <span className="field-optional">(brief description)</span>
                  </div>
                  <textarea className="input-field"
                    placeholder="One or two sentences describing the criticism…"
                    value={cDetail} onChange={e => setCDetail(e.target.value)} style={{ minHeight: 60 }} />
                </div>

                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label"><span style={{ background: "#6366f1" }} />Source</div>
                  <input className="input-field"
                    placeholder="Opposition Party, Media outlet, NGO, Civil Society…"
                    value={cSource} onChange={e => setCSource(e.target.value)} />
                </div>

                {/* Severity / Type / Status */}
                <div className="qa-field-divider" />
                <div className="crm-pills-row">
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#ef4444" }} />Severity</div>
                    <div className="crm-pills">
                      {SEV_OPTIONS.map(s => (
                        <button key={s.value} className={`type-pill ${cSeverity === s.value ? "active" : ""}`}
                          style={cSeverity === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}
                          onClick={() => setCSeverity(s.value)}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="crm-pill-divider" />
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#3b82f6" }} />Type</div>
                    <div className="crm-pills">
                      {TAG_OPTIONS.map(t => (
                        <button key={t.value} className={`type-pill ${cTag === t.value ? "active" : ""}`}
                          style={cTag === t.value ? { borderColor: t.color, color: t.color, background: t.bg } : {}}
                          onClick={() => setCTag(t.value)}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="crm-pill-divider" />
                  <div className="crm-pill-group">
                    <div className="field-label" style={{ marginBottom: 8 }}><span style={{ background: "#f59e0b" }} />Status</div>
                    <div className="crm-pills">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.value} className={`type-pill ${cStatus === s.value ? "active" : ""}`}
                          style={cStatus === s.value ? { borderColor: s.color, color: s.color, background: s.bg } : {}}
                          onClick={() => setCStatus(s.value)}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes — text OR document toggle */}
                <div className="qa-field-divider" />
                <div className="answers-section">
                  <div className="answers-section-header">
                    <div className="field-label" style={{ margin: 0 }}>
                      <span style={{ background: "#f59e0b" }} />
                      Evidence &amp; Notes
                      <span className="field-optional">
                        {cNoteMode === "text" ? `(${cNotes.length} notes)` : "(document)"}
                      </span>
                    </div>
                    <div className="answer-mode-toggle">
                      <button className={`mode-toggle-btn ${cNoteMode === "text" ? "active" : ""}`}
                        onClick={() => switchNoteMode("text")}>✏️ Text Notes</button>
                      <button className={`mode-toggle-btn ${cNoteMode === "document" ? "active" : ""}`}
                        onClick={() => switchNoteMode("document")}>📄 Document</button>
                    </div>
                  </div>
                  {cNoteMode === "text" && (
                    <>
                      <div className="answers-list">
                        {cNotes.map((n, i) => (
                          <TextNoteItem key={i} index={i} note={n}
                            onChange={v => updateNote(i, v)}
                            onRemove={() => removeNote(i)}
                            canRemove={cNotes.length > 1} />
                        ))}
                      </div>
                      <button className="btn-add-answer" onClick={addNote}>
                        <PlusIcon /> Add Another Note
                      </button>
                    </>
                  )}
                  {cNoteMode === "document" && (
                    <DocumentUpload file={cDocFile.file} fileName={cDocFile.fileName}
                      fileSize={cDocFile.fileSize} fileError={cDocFile.fileError}
                      onChange={setCDocFile} />
                  )}
                </div>

                {/* Proof Documents — multi-file, always alongside notes */}
                <div className="qa-field-divider" />
                <div className="answers-section">
                  <div className="answers-section-header">
                    <div className="field-label" style={{ margin: 0 }}>
                      <span style={{ background: "#6366f1" }} />
                      Proof Documents
                      <span className="field-optional">
                        {proofFiles.length === 0
                          ? "(optional — attach supporting files)"
                          : `(${proofFiles.length} file${proofFiles.length > 1 ? "s" : ""} attached)`}
                      </span>
                    </div>
                  </div>
                  <ProofAttachments files={proofFiles} onAdd={addProofFile} onRemove={removeProofFile} />
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════
              Q&A FORM
          ══════════════════════════════════════════════ */}
          {selectedTopic && formMode === "qa" && (
            <>
              <div className="divider" />
              <div className="section-label">New Q&amp;A — {selectedTopic.name}</div>
              <div className="qa-section-header">
                <span className="topic-badge">{getIcon(selectedTopic.name)} {selectedTopic.name}</span>
                <button className="btn-primary" onClick={saveQA} disabled={savingQA}
                  style={{ opacity: savingQA ? 0.7 : 1, cursor: savingQA ? "not-allowed" : "pointer" }}>
                  {savingQA ? "Saving…" : "💾 Save Q&A"}
                </button>
              </div>

              <div className="qa-card">
                <div className="qa-card-header"><span className="qa-num">QUESTION</span></div>

                <div className="qa-field qa-field--full">
                  <div className="field-label"><span />Question</div>
                  <textarea className="input-field" placeholder="Type your question here..."
                    value={question} onChange={e => setQuestion(e.target.value)} />
                </div>

                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label">
                    <span style={{ background: "#10b981" }} />Short Answer
                    <span className="field-optional">(optional summary)</span>
                  </div>
                  <textarea className="input-field" placeholder="A brief one-line answer..."
                    value={shortAnswer} onChange={e => setShortAnswer(e.target.value)} style={{ minHeight: 60 }} />
                </div>

                <div className="qa-field-divider" />
                <div className="answers-section">
                  <div className="answers-section-header">
                    <div className="field-label" style={{ margin: 0 }}>
                      <span style={{ background: "#f59e0b" }} />Answers
                      <span className="field-optional">
                        {answerMode === "text" ? `(${answers.length} total)` : "(document)"}
                      </span>
                    </div>
                    <div className="answer-mode-toggle">
                      <button className={`mode-toggle-btn ${answerMode === "text" ? "active" : ""}`}
                        onClick={() => switchAnswerMode("text")}>✏️ Text</button>
                      <button className={`mode-toggle-btn ${answerMode === "document" ? "active" : ""}`}
                        onClick={() => switchAnswerMode("document")}>📄 Document</button>
                    </div>
                  </div>
                  {answerMode === "text" && (
                    <>
                      <div className="answers-list">
                        {answers.map((ans, i) => (
                          <TextAnswerItem key={i} index={i} answer={ans}
                            onChange={v => updateAnswer(i, v)}
                            onRemove={() => removeAnswer(i)}
                            canRemove={answers.length > 1} />
                        ))}
                      </div>
                      <button className="btn-add-answer" onClick={addAnswer}>
                        <PlusIcon /> Add Another Answer
                      </button>
                    </>
                  )}
                  {answerMode === "document" && (
                    <DocumentUpload file={qaDocFile.file} fileName={qaDocFile.fileName}
                      fileSize={qaDocFile.fileSize} fileError={qaDocFile.fileError}
                      onChange={setQaDocFile} />
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Toast */}
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