import { useState, useEffect, useRef } from "react";
import './globals.css'

const TOPIC_ICONS = {
  Economy: "📈", Healthcare: "🏥", Education: "🎓", Infrastructure: "🏗️",
  Technology: "💡", Environment: "🌿", Politics: "🏛️", Science: "🔬",
  Culture: "🎨", Sports: "⚽", Default: "📌"
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Preloader ──────────────────────────────────────────────────────────────────
function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring">
          <span /><span /><span />
        </div>
        <p className="preloader-text">Loading Q&amp;A Builder…</p>
      </div>
    </div>
  );
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

// ── Format file size ───────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Text Answer Item ───────────────────────────────────────────────────────────
function TextAnswerItem({ index, answer, onChange, onRemove, canRemove }) {
  return (
    <div className="answer-item">
      <div className="answer-item-header">
        <span className="answer-variant-label">ANSWER {String(index + 1).padStart(2, "0")}</span>
        {canRemove && (
          <button className="answer-remove-btn" onClick={onRemove} title="Remove answer">
            <TrashIcon />
          </button>
        )}
      </div>
      <textarea
        className="variant-input"
        placeholder={`Type answer ${index + 1}…`}
        value={answer.value}
        onChange={e => onChange({ ...answer, value: e.target.value })}
      />
    </div>
  );
}

// ── Document Upload Area ───────────────────────────────────────────────────────
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
      {/* Drop zone */}
      <div
        className={`doc-drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""} ${fileError ? "has-error" : ""}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {file ? (
          /* ── Attached state ── */
          <div className="doc-attached">
            <div className="doc-attached-icon">
              <FileIcon />
            </div>
            <div className="doc-attached-info">
              <span className="doc-attached-name">{fileName}</span>
              <span className="doc-attached-size">{formatSize(fileSize)}</span>
            </div>
            <button
              className="doc-clear-btn"
              title="Remove file"
              onClick={e => {
                e.stopPropagation();
                onChange({ file: null, fileName: "", fileSize: 0, fileError: "" });
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="doc-empty">
            <div className={`doc-upload-icon ${dragging ? "bounce" : ""}`}>
              <UploadIcon />
            </div>
            <p className="doc-upload-label">
              {dragging ? "Drop it here!" : "Click or drag a file to upload"}
            </p>
            <p className="doc-upload-hint">Any format · Max 10 MB</p>
          </div>
        )}
      </div>

      {/* Size bar (shows when file attached) */}
      {file && (
        <div className="doc-size-bar">
          <div
            className="doc-size-fill"
            style={{ width: `${Math.min((fileSize / MAX_FILE_SIZE) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {fileError && (
        <div className="doc-error">
          <span>⚠ {fileError}</span>
        </div>
      )}
    </div>
  );
}

// ── Default factories ──────────────────────────────────────────────────────────
const newAnswer  = () => ({ value: "" });
const newDocFile = () => ({ file: null, fileName: "", fileSize: 0, fileError: "" });

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QAPage() {
  const [appReady, setAppReady]           = useState(false);
  const [topics, setTopics]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [addingTopic, setAddingTopic]     = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [savingQA, setSavingQA]           = useState(false);

  const [newTopic, setNewTopic]           = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [question, setQuestion]       = useState("");
  const [shortAnswer, setShortAnswer] = useState("");

  // "text" | "document"
  const [answerMode, setAnswerMode]   = useState("text");
  const [answers, setAnswers]         = useState([newAnswer(), newAnswer()]);
  const [docFile, setDocFile]         = useState(newDocFile());

  const [status, setStatus] = useState(null);

  // ── Fetch Topics ───────────────────────────────────────────────────────────
  const fetchTopics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-fetch-topics`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map(d => typeof d === "string" ? { name: d } : d)
        : [];
      setTopics(normalized);
    } catch {
      setFetchError(true);
      setTopics([
        { name: "Economy", tag: "LIVE" }, { name: "Healthcare" },
        { name: "Education", tag: "NEW" }, { name: "Infrastructure" },
        { name: "Technology", tag: "TRENDING" }, { name: "Environment" },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setAppReady(true);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2800);
  };

  // ── Add Topic ──────────────────────────────────────────────────────────────
  const addTopic = async () => {
    if (!newTopic.trim()) return;
    setAddingTopic(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-add-topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_topic", name: newTopic.trim() }),
      });
      if (!res.ok) throw new Error();
      setTopics(p => [...p, { name: newTopic.trim() }]);
      setNewTopic("");
      showStatus("Topic added");
    } catch {
      showStatus("Failed to add topic — webhook unreachable");
    } finally {
      setAddingTopic(false);
    }
  };

  // ── Delete Topic ───────────────────────────────────────────────────────────
  const deleteTopic = async (e, topicName) => {
    e.stopPropagation();
    setDeletingTopic(topicName);
    try {
      const res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-delete-topic`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_topic", name: topicName }),
      });
      if (!res.ok) throw new Error();
      setTopics(p => p.filter(t => t.name !== topicName));
      if (selectedTopic?.name === topicName) resetQA();
      showStatus(`"${topicName}" deleted`);
    } catch {
      showStatus(`Failed to delete "${topicName}"`);
    } finally {
      setDeletingTopic(null);
    }
  };

  // ── Select / Reset ─────────────────────────────────────────────────────────
  const selectTopic = (t) => { setSelectedTopic(t); resetQA(); };

  const resetQA = () => {
    setQuestion("");
    setShortAnswer("");
    setAnswerMode("text");
    setAnswers([newAnswer(), newAnswer()]);
    setDocFile(newDocFile());
  };

  // ── Switch answer mode ─────────────────────────────────────────────────────
  const switchMode = (mode) => {
    setAnswerMode(mode);
    // reset both sides on switch
    setAnswers([newAnswer(), newAnswer()]);
    setDocFile(newDocFile());
  };

  // ── Text answer helpers ────────────────────────────────────────────────────
  const updateAnswer = (i, val) => setAnswers(p => p.map((a, idx) => idx === i ? val : a));
  const addAnswer    = ()       => setAnswers(p => [...p, newAnswer()]);
  const removeAnswer = (i)      => setAnswers(p => p.filter((_, idx) => idx !== i));

  // ── Save Q&A ───────────────────────────────────────────────────────────────
  const saveQA = async () => {
    if (!selectedTopic)    return showStatus("Select a topic first");
    if (!question.trim())  return showStatus("Please enter a question");

    if (answerMode === "document") {
      if (!docFile.file)   return showStatus("Please upload a document");
      if (docFile.fileError) return showStatus(docFile.fileError);
    }

    setSavingQA(true);
    try {
      let res;

      if (answerMode === "document") {
        // Send as multipart so the file is included
        const formData = new FormData();
        formData.append("topic",       selectedTopic.name);
        formData.append("question",    question.trim());
        formData.append("shortAnswer", shortAnswer.trim());
        formData.append("answerMode",  "document");
        formData.append("document",    docFile.file, docFile.fileName);

        res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-save-qa`, {
          method: "POST",
          body: formData,
        });
      } else {
        // Text mode — plain JSON
        const payload = {
          topic:       selectedTopic.name,
          question:    question.trim(),
          shortAnswer: shortAnswer.trim(),
          answerMode:  "text",
          answers:     answers.filter(a => a.value.trim()).map(a => ({ value: a.value.trim() })),
        };

        res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-save-qa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();
      showStatus("Q&A saved successfully ✓");

      // Fire-and-forget: trigger embedding generation after save
      fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-embed-qa`, {
        method: "GET",
        headers: { Accept: "application/json" },
      }).catch(err => console.warn("[QAPage] Embed trigger failed:", err.message));

      resetQA();
    } catch {
      showStatus("Failed to save Q&A");
    } finally {
      setSavingQA(false);
    }
  };

  const getIcon = (name) => TOPIC_ICONS[name] || TOPIC_ICONS.Default;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* Header */}
        <div className="qa-top">
          <div className="qa-logo">🧩</div>
          <span className="qa-title">Q&amp;A Builder</span>
          <span className="qa-subtitle">
            {selectedTopic ? `→ ${selectedTopic.name}` : "Select a topic to begin"}
          </span>
        </div>

        <div className="qa-body">

          {/* ── Topics ── */}
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
              {topics.map((t) => {
                const isDeleting = deletingTopic === t.name;
                return (
                  <button
                    key={t.name}
                    className={`topic-btn ${selectedTopic?.name === t.name ? "active" : ""} ${isDeleting ? "topic-btn--deleting" : ""}`}
                    onClick={() => !isDeleting && selectTopic(t)}
                  >
                    {t.tag && <span className="topic-tag">{t.tag}</span>}
                    <span className="topic-icon">{getIcon(t.name)}</span>
                    <span className="topic-name">{t.name}</span>
                    <span
                      className="topic-delete-btn"
                      title={`Delete "${t.name}"`}
                      onClick={(e) => !isDeleting && deleteTopic(e, t.name)}
                    >
                      {isDeleting ? <span className="topic-delete-spinner" /> : <TrashIcon />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Add Custom Topic */}
          <div className="add-topic-row">
            <input
              className="input-field"
              placeholder="Add a custom topic..."
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !addingTopic && addTopic()}
            />
            <button
              className="btn-primary"
              onClick={addTopic}
              disabled={addingTopic}
              style={{ opacity: addingTopic ? 0.7 : 1, cursor: addingTopic ? "not-allowed" : "pointer" }}
            >
              {addingTopic ? "Adding…" : "+ Add Topic"}
            </button>
          </div>

          {/* ── Q&A Editor ── */}
          {selectedTopic && (
            <>
              <div className="divider" />
              <div className="section-label">Question &amp; Answers</div>

              <div className="qa-section-header">
                <div className="qa-section-title">
                  <span className="topic-badge">
                    {getIcon(selectedTopic.name)} {selectedTopic.name}
                  </span>
                </div>
                <button
                  className="btn-primary"
                  onClick={saveQA}
                  disabled={savingQA}
                  style={{ opacity: savingQA ? 0.7 : 1, cursor: savingQA ? "not-allowed" : "pointer" }}
                >
                  {savingQA ? "Saving…" : "💾 Save Q&A"}
                </button>
              </div>

              <div className="qa-card">

                {/* Question */}
                <div className="qa-card-header">
                  <span className="qa-num">QUESTION</span>
                </div>
                <div className="qa-field qa-field--full">
                  <div className="field-label"><span />Question</div>
                  <textarea
                    className="input-field"
                    placeholder="Type your question here..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                  />
                </div>

                {/* Short Answer */}
                <div className="qa-field-divider" />
                <div className="qa-field qa-field--full">
                  <div className="field-label">
                    <span style={{ background: "#10b981" }} />
                    Short Answer
                    <span className="field-optional">(optional summary)</span>
                  </div>
                  <textarea
                    className="input-field"
                    placeholder="A brief one-line answer..."
                    value={shortAnswer}
                    onChange={e => setShortAnswer(e.target.value)}
                    style={{ minHeight: 60 }}
                  />
                </div>

                {/* ── Answer Mode Toggle + Content ── */}
                <div className="qa-field-divider" />
                <div className="answers-section">

                  {/* Header: label + toggle */}
                  <div className="answers-section-header">
                    <div className="field-label" style={{ margin: 0 }}>
                      <span style={{ background: "#f59e0b" }} />
                      Answers
                      <span className="field-optional">
                        {answerMode === "text"
                          ? `(${answers.length} total)`
                          : "(document)"}
                      </span>
                    </div>

                    {/* Toggle */}
                    <div className="answer-mode-toggle">
                      <button
                        className={`mode-toggle-btn ${answerMode === "text" ? "active" : ""}`}
                        onClick={() => switchMode("text")}
                      >
                        ✏️ Text
                      </button>
                      <button
                        className={`mode-toggle-btn ${answerMode === "document" ? "active" : ""}`}
                        onClick={() => switchMode("document")}
                      >
                        📄 Document
                      </button>
                    </div>
                  </div>

                  {/* ── Text mode ── */}
                  {answerMode === "text" && (
                    <>
                      <div className="answers-list">
                        {answers.map((ans, i) => (
                          <TextAnswerItem
                            key={i}
                            index={i}
                            answer={ans}
                            onChange={val => updateAnswer(i, val)}
                            onRemove={() => removeAnswer(i)}
                            canRemove={answers.length > 1}
                          />
                        ))}
                      </div>
                      <button className="btn-add-answer" onClick={addAnswer}>
                        <PlusIcon /> Add Another Answer
                      </button>
                    </>
                  )}

                  {/* ── Document mode ── */}
                  {answerMode === "document" && (
                    <DocumentUpload
                      file={docFile.file}
                      fileName={docFile.fileName}
                      fileSize={docFile.fileSize}
                      fileError={docFile.fileError}
                      onChange={setDocFile}
                    />
                  )}

                </div>
              </div>
            </>
          )}
        </div>

        {/* Status Toast */}
        <div
          className={`status-bar ${status ? "show" : ""}`}
          style={status?.startsWith("Failed")
            ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
            : {}}
        >
          {status?.startsWith("Failed") ? "✕" : "✓"} {status}
        </div>

      </div>
    </>
  );
}