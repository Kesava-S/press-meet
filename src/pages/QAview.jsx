import { useState, useEffect, useRef } from "react";
import './globals.css'

const TOPIC_ICONS = {
  Economy: "📈", Healthcare: "🏥", Education: "🎓", Infrastructure: "🏗️",
  Technology: "💡", Environment: "🌿", Politics: "🏛️", Science: "🔬",
  Culture: "🎨", Sports: "⚽", Default: "📌"
};

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Preloader ──────────────────────────────────────────────────────────────────
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

// ── Chevron icon ───────────────────────────────────────────────────────────────
function ChevronIcon({ open }) {
  return (
    <svg
      className={`qav-chevron ${open ? "open" : ""}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Text answers block ─────────────────────────────────────────────────────────
function TextAnswers({ answers }) {
  return (
    <div className="qav-answers-inner">
      {answers.map((val, i) => (
        <div key={i} className="qav-text-answer">
          <div className="qav-text-answer-meta">
            <span className="qav-answer-type text">✏️ Text Input</span>
            <span className="qav-answer-index">#{i + 1}</span>
          </div>
          <p>{val}</p>
        </div>
      ))}
    </div>
  );
}

// ── Document answer block ──────────────────────────────────────────────────────
function DocumentAnswer({ url }) {
  let displayName = "View Document";
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length > 0) displayName = decodeURIComponent(parts[parts.length - 1]);
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

// ── Single accordion Q&A item ──────────────────────────────────────────────────
function QAAccordionItem({ qa, index, isOpen, onToggle }) {
  const bodyRef = useRef(null);

  return (
    <div className={`qav-accordion-item ${isOpen ? "open" : ""}`}>

      {/* Question trigger */}
      <button className="qav-accordion-trigger" onClick={onToggle}>
        <div className="qav-accordion-left">
          <span className="qav-accordion-num">Q{index + 1}</span>
          <span className="qav-accordion-question">{qa.question}</span>
        </div>
        <div className="qav-accordion-right">
          {qa.summaryAns && !isOpen && (
            <span className="qav-accordion-preview">{qa.summaryAns}</span>
          )}
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* Slide-down body */}
      <div
        ref={bodyRef}
        className="qav-accordion-body"
        style={{
          maxHeight: isOpen
            ? (bodyRef.current?.scrollHeight ?? 2000) + "px"
            : "0px",
        }}
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

          {/* Answers label */}
          <div className="qav-section-label" style={{ marginTop: qa.summaryAns ? 18 : 0 }}>
            <span className="qav-dot qav-dot--amber" />
            {qa.inputType === "document" ? "DOCUMENT ANSWER" : "ANSWERS"}
            {qa.inputType === "text" && qa.textAnswers.length > 0 && (
              <span className="field-optional">
                &nbsp;· {qa.textAnswers.length}{" "}
                {qa.textAnswers.length === 1 ? "answer" : "answers"}
              </span>
            )}
          </div>

          {/* Text answers */}
          {qa.inputType === "text" && qa.textAnswers.length > 0 && (
            <TextAnswers answers={qa.textAnswers} />
          )}

          {/* Document answer */}
          {qa.inputType === "document" && qa.documentUrl && (
            <DocumentAnswer url={qa.documentUrl} />
          )}

          {/* No answer fallback */}
          {((qa.inputType === "text" && qa.textAnswers.length === 0) ||
            (qa.inputType === "document" && !qa.documentUrl)) && (
            <p className="qav-no-answer">No answer provided for this question.</p>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeTopics — deduplicate topic column from datatable rows
// ─────────────────────────────────────────────────────────────────────────────
function normalizeTopics(raw) {
  if (raw && !Array.isArray(raw)) {
    raw = raw.topics ?? raw.data ?? raw.items ?? raw.rows ?? [];
  }
  if (!Array.isArray(raw)) return [];

  const seen = new Set();
  const out  = [];
  for (const item of raw) {
    const name =
      (typeof item === "string" ? item : null) ??
      item.topic ?? item.name ?? item.label ?? item.title ?? null;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, tag: item.tag ?? item.badge ?? undefined });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeQAList — parse ALL Q&A rows for a topic into an array
// Each row: topic | question | summary_ans | inputType | answers
// ─────────────────────────────────────────────────────────────────────────────
function normalizeQAList(raw, topicName) {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];

  return rows.map((item, idx) => {
    if (!item) return null;

    const inputType = (
      item.inputType ?? item.input_type ?? item.answerMode ?? "text"
    ).toString().toLowerCase();

    const isDocument = inputType === "document";

    // Parse text answers
    let textAnswers = [];
    if (!isDocument) {
      const ra = item.answers ?? item.answer ?? [];
      if (Array.isArray(ra)) {
        textAnswers = ra
          .map(a => (typeof a === "string" ? a : a.value ?? a.text ?? ""))
          .filter(Boolean);
      } else if (typeof ra === "string") {
        try {
          const parsed = JSON.parse(ra);
          textAnswers = Array.isArray(parsed)
            ? parsed.map(a => (typeof a === "string" ? a : a.value ?? a.text ?? "")).filter(Boolean)
            : [ra];
        } catch {
          textAnswers = ra.split(/\n|\|/).map(s => s.trim()).filter(Boolean);
        }
      }
    }

    // Parse document URL
    let documentUrl = "";
    if (isDocument) {
      const ra = item.answers ?? item.answer ?? item.document_url ?? item.fileUrl ?? "";
      documentUrl = typeof ra === "string"
        ? ra.trim()
        : (ra?.url ?? ra?.fileUrl ?? "");
    }

    const question = item.question ?? item.q ?? "";
    if (!question) return null;

    return {
      id:         item.id ?? item._id ?? `qa-${idx}`,
      question,
      summaryAns: item.summary_ans ?? item.shortAnswer ?? item.short_answer ?? item.summary ?? "",
      inputType,
      textAnswers,
      documentUrl,
    };
  }).filter(Boolean);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QaView() {
  const [appReady, setAppReady]           = useState(false);
  const [topics, setTopics]               = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [qaList, setQaList]               = useState([]);
  const [loadingQA, setLoadingQA]         = useState(false);
  const [fetchError, setFetchError]       = useState(false);
  const [qaError, setQaError]             = useState(false);
  const [search, setSearch]               = useState("");
  const [openIndex, setOpenIndex]         = useState(null);

  // ── Fetch topics on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/meet-fetch-topics`, {
          headers: { Accept: "application/json" },
        });
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

  // ── Fetch all Q&As for selected topic ─────────────────────────────────────
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
      const normalized = normalizeQAList(await res.json(), topic.name);
      setQaList(normalized); // empty array = no Q&A yet, that's fine
    } catch (err) {
      console.warn("[QAView] QA:", err.message);
      setQaError(true);
      // Demo fallback with 2 questions
      setQaList([
        {
          id: "demo-1",
          question: `What are the key factors affecting ${topic.name} today?`,
          summaryAns: `Several structural and cyclical factors drive ${topic.name} outcomes.`,
          inputType: "text",
          textAnswers: [
            "Global supply chains have been disrupted significantly, affecting pricing and availability.",
            "Policy decisions and regulatory frameworks continue to shape investment patterns.",
          ],
          documentUrl: "",
        },
        {
          id: "demo-2",
          question: `What is the long-term outlook for ${topic.name}?`,
          summaryAns: "The outlook remains cautiously optimistic given recent trends.",
          inputType: "text",
          textAnswers: [
            "Analysts project moderate growth over the next decade contingent on stable global conditions.",
          ],
          documentUrl: "",
        },
      ]);
    } finally {
      setLoadingQA(false);
    }
  };

  const toggleAccordion = (i) => setOpenIndex(p => (p === i ? null : i));
  const getIcon         = (n) => TOPIC_ICONS[n] || TOPIC_ICONS.Default;
  const filteredTopics  = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* Header */}
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
              {filteredTopics.length === 0 && (
                <p className="qav-empty">No topics match.</p>
              )}
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

          {/* ── Main Panel ── */}
          <main className="qav-main">

            {/* No topic selected */}
            {!selectedTopic && (
              <div className="qav-placeholder">
                <div className="qav-placeholder-icon">💬</div>
                <h3>Select a topic</h3>
                <p>Choose a topic from the left panel to view its Q&amp;A.</p>
              </div>
            )}

            {/* Loading */}
            {selectedTopic && loadingQA && (
              <div className="state-box">
                <div className="loading-dots"><span /><span /><span /></div>
                <p>Loading Q&amp;A…</p>
              </div>
            )}

            {/* Content */}
            {selectedTopic && !loadingQA && (
              <div className="qav-content">

                {/* Header row */}
                <div className="qav-content-header">
                  <span className="topic-badge">
                    {getIcon(selectedTopic.name)} {selectedTopic.name}
                  </span>
                  {!qaError && qaList.length > 0 && (
                    <span className="qa-count">
                      {qaList.length} {qaList.length === 1 ? "question" : "questions"}
                    </span>
                  )}
                  {qaError && (
                    <span className="qav-warn">⚠️ Demo data — webhook unreachable</span>
                  )}
                </div>

                {/* ── No Q&A for this topic ── */}
                {qaList.length === 0 && (
                  <div className="qav-no-data">
                    <div className="qav-no-data-icon">🗂️</div>
                    <h4>No Q&amp;A yet</h4>
                    <p>
                      There are no questions added for{" "}
                      <strong>{selectedTopic.name}</strong> yet.
                    </p>
                  </div>
                )}

                {/* ── Accordion Q&A list ── */}
                {qaList.length > 0 && (
                  <div className="qav-accordion-list">
                    {qaList.map((qa, i) => (
                      <QAAccordionItem
                        key={qa.id}
                        qa={qa}
                        index={i}
                        isOpen={openIndex === i}
                        onToggle={() => toggleAccordion(i)}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </main>
        </div>

        <div className="status-bar" />
      </div>
    </>
  );
}