import { useState, useEffect } from "react";
import "./globals.css";

function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring">
          <span />
          <span />
          <span />
        </div>
        <p className="preloader-text">Loading Documents…</p>
      </div>
    </div>
  );
}

export default function DocumentsPage() {

  const [appReady, setAppReady] = useState(false);

  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState("");

  const [pendingDocs, setPendingDocs] = useState([]);
  const [docs, setDocs] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const showStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  };

  // ─────────────────────────────────────────────
  // LOAD TOPICS FROM N8N
  // ─────────────────────────────────────────────
  const fetchTopics = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-fetch-topics`
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      // ensure it's always array of objects
      const normalized = Array.isArray(data) ? data : [];

      setTopics(normalized);

      if (normalized.length > 0) {
        setTopic(normalized[0].name);
      }

    } catch {
      showStatus("Failed to load topics");
    }
  };

  // ─────────────────────────────────────────────
  // LOAD DOCUMENTS FROM N8N
  // ─────────────────────────────────────────────
  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-fetch-documents`
      );

      if (!res.ok) {
        setDocs([]);
        return;
      }

      const data = await res.json();

      // If backend returns null or not array → treat as empty
      if (!Array.isArray(data)) {
        setDocs([]);
        return;
      }

      setDocs(data);

    } catch (error) {
      console.error("Fetch documents error:", error);
      setDocs([]); // important: don't show error if empty
    }
  };

  useEffect(() => {

    const init = async () => {
      await Promise.all([
        fetchTopics(),
        fetchDocuments()
      ]);

      setAppReady(true);
    };

    init();

  }, []);

  // ─────────────────────────────────────────────
  // HANDLE FILE SELECT
  // ─────────────────────────────────────────────
  const handleUpload = (e) => {

    if (!topic) {
      showStatus("Please select a topic");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const files = Array.from(e.target.files || []);

    const validFiles = [];

    for (const f of files) {

      if (f.size > MAX_SIZE) {
        showStatus(`${f.name} exceeds 10MB limit`);
        continue;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        name: f.name,
        size: (f.size / 1024).toFixed(1) + " KB",
        topic,
        file: f,
      });
    }

    if (validFiles.length > 0) {
      setPendingDocs((prev) => [...prev, ...validFiles]);
    }
  };

  // ─────────────────────────────────────────────
  // UPLOAD TO N8N → DRIVE
  // ─────────────────────────────────────────────
  const uploadToN8N = async (doc) => {

    if (uploading) return;
    console.log("Document...", doc);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", doc.file);
      formData.append("topic", doc.topic);
      formData.append("name", doc.name);

      const res = await fetch(
        `${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-upload-document`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      // expect response:
      // { topic, fileName, fileUrl }

      showStatus("Document uploaded successfully");

      setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));

      fetchDocuments(); // reload from backend

    } catch {
      showStatus("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const deleteSavedDoc = async (doc) => {
    try {
      await fetch(
        `${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-delete-document`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: doc.topic,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl
          }),
        }
      );

      showStatus("Document removed");

      fetchDocuments();

    } catch {
      showStatus("Failed to delete document");
    }
  };

  const removePendingDoc = (id) => {
    setPendingDocs((prev) => prev.filter((d) => d.id !== id));
    showStatus("Removed from pending list");
  };

  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* Header */}
        <div className="qa-top">
          <div className="qa-logo">📁</div>
          <span className="qa-title">Document Manager</span>
          <span className="qa-subtitle">
            Upload and manage knowledge files
          </span>
        </div>

        <div className="qa-body">

          {/* Section Label */}
          <div className="section-label">Upload Documents</div>

          {/* Upload Card */}
          <div className="qa-card">
            <div className="qa-card-header">
              <span className="qa-num">FILE UPLOAD</span>
            </div>

            <div style={{ padding: "24px" }}>
              <label
                className="input-field"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px",
                  cursor: "pointer",
                  textAlign: "center",
                  borderStyle: "dashed"
                }}
              >
                <strong style={{ marginBottom: 8 }}>Click to upload</strong>
                <span style={{ fontSize: 12, color: "#8b8fa8" }}>
                  PDF, DOCX, TXT (max 10MB)
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  hidden
                  onChange={handleUpload}
                />
              </label>

              {/* Topic Selector */}
              <div style={{ marginTop: 20 }}>
                <div className="field-label">
                  <span /> Topic
                </div>

                <select
                  className="input-field"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>
          </div>

          {/* Pending Docs */}
          {pendingDocs.length > 0 && (
            <>
              <div className="divider" />
              <div className="section-label">Pending Files</div>

              <div className="topic-grid">
                {pendingDocs.map((d) => (
                  <div key={d.id} className="doc-card">
                    <span className="topic-icon">📄</span>
                    <span className="topic-name">{d.name}</span>

                    {/* Show Topic */}
                    <span className="topic-badge" style={{ marginTop: 6 }}>
                      📁 {d.topic}
                    </span>
                    <br></br>
                    <small style={{ color: "#8b8fa8" }}>
                      {d.size}
                    </small>

                    {/* Buttons Row */}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>

                      <button
                        className="btn-primary"
                        disabled={uploading}
                        onClick={() => {
                          console.log("clicked!!!");
                          uploadToN8N(d)
                        }}
                      >
                        {uploading ? "Uploading..." : "Save to Drive"}
                      </button>

                      {/* Remove Pending Button */}
                      <button
                        className="btn-delete"
                        onClick={() => removePendingDoc(d.id)}
                      >
                        ✕
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Saved Docs */}
          <div className="divider" />
          <div className="section-label">My Documents</div>

          {docs.length === 0 ? (
            <div className="state-box">
              <div className="state-icon">📂</div>
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="doc-grid">
              {docs.map((d, index) => (
                <div key={index} className="doc-card">

                  <div className="doc-header">
                    <div className="doc-icon">📄</div>
                    <div className="doc-info">
                      <div className="doc-title">{d.fileName}</div>
                      <div className="doc-topic">📁 {d.topic}</div>
                    </div>
                  </div>

                  <div className="doc-actions">
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                    >
                      Open
                    </a>

                    <button
                      className="btn-delete"
                      onClick={() => deleteSavedDoc(d)}
                    >
                      Delete
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Status Toast */}
        <div
          className={`status-bar ${status ? "show" : ""}`}
          style={
            status?.includes("Failed")
              ? {
                borderColor: "rgba(239,68,68,0.35)",
                color: "#ef4444",
              }
              : {}
          }
        >
          {status}
        </div>

      </div>
    </>
  );
}