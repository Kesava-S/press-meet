// ── pages/data/DocumentsPage.jsx ─────────────────────────────────────────────
// Documents Manager — upload + view separated by topics (accordion groups)
// Preserves all original webhook logic exactly.

import { useState, useEffect } from "react";
import "../globals.css";

const FILE_TYPE_ICON = {
  pdf:  "📑",
  doc:  "📝",
  docx: "📝",
  txt:  "📃",
  xlsx: "📊",
  xls:  "📊",
  ppt:  "📊",
  pptx: "📊",
  default: "📄",
};

const getFileIcon = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return FILE_TYPE_ICON[ext] || FILE_TYPE_ICON.default;
};

const formatSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ── Preloader ─────────────────────────────────────────────────────────────────
function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring"><span /><span /><span /></div>
        <p className="preloader-text">Loading Documents…</p>
      </div>
    </div>
  );
}

// ── Topic accordion group — shows docs grouped under a collapsible header ─────
function TopicGroup({ topicName, docs, onOpen, onDelete }) {
  const [open, setOpen] = useState(true); // starts open

  return (
    <div className="dtg-group">

      {/* Group header (clickable) */}
      <button className="dtg-header" onClick={() => setOpen(p => !p)}>
        <div className="dtg-header-left">
          <span className="dtg-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
          <span className="dtg-topic-icon">📁</span>
          <span className="dtg-topic-name">{topicName}</span>
          <span className="dtg-count">{docs.length} {docs.length === 1 ? "file" : "files"}</span>
        </div>
        <div className="dtg-header-right">
          {/* Quick-add indicator */}
          <span className="dtg-topic-badge">{topicName}</span>
        </div>
      </button>

      {/* Collapsible doc grid */}
      <div className={`dtg-body ${open ? "open" : ""}`}>
        <div className="dtg-doc-grid">
          {docs.map((d, i) => (
            <div key={d.fileUrl || d.id || i} className="doc-card dtg-doc-card">

              {/* Card header */}
              <div className="doc-header">
                <div className="doc-icon">{getFileIcon(d.fileName)}</div>
                <div className="doc-info">
                  <div className="doc-title">{d.fileName}</div>
                  <div className="doc-topic">📁 {d.topic}</div>
                  {d.uploadedAt && (
                    <div className="dtg-doc-date">
                      {new Date(d.uploadedAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="doc-actions">
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  Open
                </a>
                <button className="btn-delete" onClick={() => onDelete(d)}>
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════
export default function DocumentsPage() {

  const [appReady,     setAppReady]     = useState(false);
  const [topics,       setTopics]       = useState([]);
  const [topic,        setTopic]        = useState("");
  const [pendingDocs,  setPendingDocs]  = useState([]);
  const [docs,         setDocs]         = useState([]);
  const [uploading,    setUploading]    = useState(false);
  const [status,       setStatus]       = useState(null);

  // Search / filter for the saved docs section
  const [search,        setSearch]        = useState("");
  const [filterTopic,   setFilterTopic]   = useState("All");

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  };

  // ── Fetch topics ─────────────────────────────────────────────────────────────
  const fetchTopics = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-fetch-topics`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const norm = Array.isArray(data) ? data : [];
      setTopics(norm);
      if (norm.length > 0) setTopic(norm[0].name);
    } catch {
      showStatus("Failed to load topics");
    }
  };

  // ── Fetch documents ───────────────────────────────────────────────────────────
  const fetchDocuments = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-fetch-documents`);
      if (!res.ok) { setDocs([]); return; }
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      setDocs([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTopics(), fetchDocuments()]);
      setAppReady(true);
    };
    init();
  }, []);

  // ── Handle file select ────────────────────────────────────────────────────────
  const handleUpload = (e) => {
    if (!topic) { showStatus("Please select a topic"); return; }
    const MAX_SIZE = 10 * 1024 * 1024;
    const files    = Array.from(e.target.files || []);
    const valid    = [];

    for (const f of files) {
      if (f.size > MAX_SIZE) { showStatus(`${f.name} exceeds 10MB limit`); continue; }
      valid.push({ id: crypto.randomUUID(), name: f.name, size: f.size, topic, file: f });
    }

    if (valid.length > 0) setPendingDocs(p => [...p, ...valid]);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  // ── Upload to n8n → Drive ─────────────────────────────────────────────────────
  const uploadToN8N = async (doc) => {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",  doc.file);
      fd.append("topic", doc.topic);
      fd.append("name",  doc.name);

      const res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-upload-document`, {
        method: "POST", body: fd,
      });

      if (!res.ok) throw new Error("Upload failed");
      showStatus("Document uploaded successfully ✓");
      setPendingDocs(p => p.filter(d => d.id !== doc.id));
      fetchDocuments();
    } catch {
      showStatus("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  // ── Delete saved doc ──────────────────────────────────────────────────────────
  const deleteSavedDoc = async (doc) => {
    try {
      await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-delete-document`, {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic: doc.topic, fileName: doc.fileName, fileUrl: doc.fileUrl }),
      });
      showStatus("Document removed");
      fetchDocuments();
    } catch {
      showStatus("Failed to delete document");
    }
  };

  const removePending = (id) => {
    setPendingDocs(p => p.filter(d => d.id !== id));
    showStatus("Removed from pending list");
  };

  // ── Build topic groups from docs (filtered) ───────────────────────────────────
  const filteredDocs = docs.filter(d => {
    const matchTopic  = filterTopic === "All" || d.topic === filterTopic;
    const matchSearch = !search ||
      d.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      d.topic?.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  // Group filtered docs by topic, preserving topic order from server
  const topicOrder  = topics.map(t => t.name);
  const groupedDocs = filteredDocs.reduce((acc, d) => {
    const key = d.topic || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  // Sort group keys by the topics order, then alphabetically for unknown ones
  const groupKeys = [
    ...topicOrder.filter(t => groupedDocs[t]),
    ...Object.keys(groupedDocs).filter(k => !topicOrder.includes(k)).sort(),
  ];

  const docTopics = ["All", ...new Set(docs.map(d => d.topic).filter(Boolean))];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* ── Header ── */}
        <div className="qa-top">
          <div className="qa-logo">📁</div>
          <span className="qa-title">Document Manager</span>
          <span className="qa-subtitle">Upload and manage knowledge files</span>
        </div>

        <div className="qa-body">

          {/* ══════════════════════════════════
              UPLOAD SECTION
          ══════════════════════════════════ */}
          <div className="section-label">Upload Documents</div>

          <div className="qa-card">
            <div className="qa-card-header">
              <span className="qa-num">FILE UPLOAD</span>
            </div>

            <div style={{ padding: 24 }}>

              {/* Drop zone label */}
              <label className="dtg-upload-zone">
                <div className="dtg-upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <strong className="dtg-upload-label">Click to upload files</strong>
                <span className="dtg-upload-hint">PDF, DOCX, TXT, XLSX · Max 10 MB each</span>
                <input
                  type="file" multiple accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                  hidden onChange={handleUpload}
                />
              </label>

              {/* Topic selector */}
              <div style={{ marginTop: 18 }}>
                <div className="field-label"><span />Assign to Topic</div>
                <select className="input-field" value={topic} onChange={e => setTopic(e.target.value)}>
                  {topics.map(t => (
                    <option key={t.id ?? t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* ══════════════════════════════════
              PENDING FILES
          ══════════════════════════════════ */}
          {pendingDocs.length > 0 && (
            <>
              <div className="divider" />
              <div className="section-label">
                Pending Files
                <span className="field-optional"> · {pendingDocs.length} ready to upload</span>
              </div>

              <div className="doc-grid">
                {pendingDocs.map(d => (
                  <div key={d.id} className="doc-card dtg-pending-card">
                    <div className="doc-header">
                      <div className="doc-icon">{getFileIcon(d.name)}</div>
                      <div className="doc-info">
                        <div className="doc-title">{d.name}</div>
                        <div className="doc-topic">📁 {d.topic}</div>
                        <div className="dtg-doc-date">{formatSize(d.size)}</div>
                      </div>
                    </div>

                    {/* Progress bar placeholder */}
                    <div className="dtg-pending-bar">
                      <div className="dtg-pending-fill" style={{ width: uploading ? "60%" : "0%" }} />
                    </div>

                    <div className="doc-actions">
                      <button
                        className="btn-primary"
                        disabled={uploading}
                        style={{ opacity: uploading ? 0.7 : 1 }}
                        onClick={() => uploadToN8N(d)}
                      >
                        {uploading ? "Uploading…" : "💾 Save to Drive"}
                      </button>
                      <button className="btn-delete" onClick={() => removePending(d.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══════════════════════════════════
              SAVED DOCS — grouped by topic
          ══════════════════════════════════ */}
          <div className="divider" />

          {/* Header row: label + search + filter */}
          <div className="dtg-saved-header">
            <div className="section-label" style={{ margin: 0 }}>
              My Documents
              {docs.length > 0 && (
                <span className="field-optional"> · {docs.length} total</span>
              )}
            </div>
            <div className="dtg-saved-controls">
              <input
                className="input-field dtg-search"
                placeholder="🔍  Search documents…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className="input-field dtg-filter"
                value={filterTopic}
                onChange={e => setFilterTopic(e.target.value)}
              >
                {docTopics.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Empty state */}
          {docs.length === 0 ? (
            <div className="state-box">
              <div className="state-icon">📂</div>
              <p>No documents uploaded yet.</p>
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="state-box">
              <div className="state-icon">🔍</div>
              <p>No documents match your search.</p>
            </div>
          ) : (
            /* Topic accordion groups */
            <div className="dtg-groups">
              {groupKeys.map(topicName => (
                <TopicGroup
                  key={topicName}
                  topicName={topicName}
                  docs={groupedDocs[topicName]}
                  onDelete={deleteSavedDoc}
                />
              ))}
            </div>
          )}

        </div>

        {/* ── Toast ── */}
        <div
          className={`status-bar ${status ? "show" : ""}`}
          style={status?.includes("Failed")
            ? { background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.35)", color: "#ef4444" }
            : {}}
        >
          {status}
        </div>

      </div>
    </>
  );
}