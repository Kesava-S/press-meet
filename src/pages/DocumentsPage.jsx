import { useState } from "react";

export default function DocumentsPage() {
  const [topics, setTopics] = useState([
    "Economy",
    "Healthcare",
    "Education",
    "Infrastructure",
  ]);
  const [topic, setTopic] = useState("Economy");
  const [newTopic, setNewTopic] = useState("");

  const [text, setText] = useState("");
  const [pendingDocs, setPendingDocs] = useState([]);
  const [docs, setDocs] = useState([]);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [summary, setSummary] = useState("");

  const handleUpload = (e) => {
    const finalTopic = topic === "__new__" || topic === "All" ? "General" : topic;

    const selected = Array.from(e.target.files || []).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + " KB",
      topic: finalTopic,
      file: f,
    }));

    setPendingDocs((prev) => [...prev, ...selected]);
  };

  const saveText = () => {
    if (!text.trim()) return;

    const finalTopic = topic === "__new__" || topic === "All" ? "General" : topic;

    setDocs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "Manual Text",
        size: `${text.length} chars`,
        topic: finalTopic,
        content: text,
        status: "Saved",
      },
    ]);
    setText("");
  };

  const getSummary = (doc) => {
    setSelectedDoc(doc);
    setSummary(`This is a generated summary preview for "${doc.name}".`);
  };

  const saveDocument = (doc) => {
    const finalTopic =
      doc.topic === "__new__" || doc.topic === "All" ? "General" : doc.topic;

    setDocs((prev) => [
      ...prev,
      { ...doc, topic: finalTopic, status: "Saved" },
    ]);
    setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setSelectedDoc(null);
    setSummary("");
  };

  const deleteSavedDoc = (id) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleTopicChange = (val) => {
    setTopic(val);
  };

  const addTopic = () => {
    if (!newTopic.trim()) return;

    const clean = newTopic.trim();
    setTopics((prev) => [...prev, clean]);
    setTopic(clean);
    setNewTopic("");
  };

  return (
    <div className="documents-page">
      <h2>Documents</h2>

      {/* Upload Documents */}
      <div className="card">
        <h3>Upload Documents</h3>

        <label className="upload-card">
          <div className="upload-icon">📄</div>
          <div className="upload-title">Click to upload or drag & drop</div>
          <div className="upload-hint">PDF, DOCX, TXT (max 10MB)</div>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            disabled={topic === "__new__"} // prevent upload until topic added
            onChange={handleUpload}
          />
        </label>

        <div className="category-row">
          <label>Topic:</label>
          <select value={topic} onChange={(e) => handleTopicChange(e.target.value)}>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="__new__">+ Create New Topic</option>
          </select>
        </div>

        {topic === "__new__" && (
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <input
              className="input"
              placeholder="Enter new topic name"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
            />
            <button className="primary" onClick={addTopic}>
              Add
            </button>
          </div>
        )}
      </div>

      {/* Pending Documents */}
      {pendingDocs.length > 0 && (
        <div className="card">
          <h3>Pending Documents</h3>
          <div className="kb-grid">
            {pendingDocs.map((d) => (
              <div
                key={d.id}
                className={`kb-card ${selectedDoc?.id === d.id ? "active" : ""}`}
              >
                <div className="title">{d.name}</div>
                <div className="meta">
                  {d.size} • {d.topic}
                </div>

                <div className="actions">
                  <button
                    className="summary-btn"
                    onClick={() => getSummary(d)}
                  >
                    Get Summary
                  </button>
                  <button className="save-btn" onClick={() => saveDocument(d)}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Preview */}
      {summary && selectedDoc && (
        <div className="card">
          <h3>Summary Preview – {selectedDoc.name}</h3>
          <p style={{ lineHeight: 1.7 }}>{summary}</p>
        </div>
      )}

      {/* Add Knowledge */}
      <div className="card">
        <h3>Add Your Personal Notes</h3>
        <textarea
          placeholder="Paste policies, FAQs, talking points here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="primary" style={{ marginTop: 10 }} onClick={saveText}>
          Save Text
        </button>
      </div>

      {/* Saved Documents */}
      <div className="card">
        <h3>My Documents</h3>

        {docs.length === 0 ? (
          <div className="empty-state">
            No saved documents yet. Save documents after reviewing summary.
          </div>
        ) : (
          <div className="kb-grid">
            {docs.map((d) => (
              <div key={d.id} className="kb-card">
                <div className="title">{d.name}</div>
                <div className="meta">
                  {d.size} • {d.topic}
                </div>
                <div className="actions">
                  <button
                    className="danger-btn"
                    onClick={() => deleteSavedDoc(d.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
