import { useEffect, useRef, useState } from "react";
import "./globals.css";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Sentiment config ───────────────────────────────────────────────────────────
const SENTIMENT_MAP = {
  hostile:  { label: "Hostile",  color: "#ef4444", bg: "rgba(239,68,68,0.08)",  icon: "🔴" },
  negative: { label: "Negative", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "🟡" },
  neutral:  { label: "Neutral",  color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: "🔵" },
  positive: { label: "Positive", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "🟢" },
};

const TAG_MAP = {
  criticism:  { color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  question:   { color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  accusation: { color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
  answer:     { color: "#10b981", bg: "rgba(16,185,129,0.09)" },
};

// ── Mini components ────────────────────────────────────────────────────────────
function Preloader() {
  return (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring"><span /><span /><span /></div>
        <p className="preloader-text">Initializing PressMeet AI…</p>
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  const s = SENTIMENT_MAP[sentiment] || SENTIMENT_MAP.neutral;
  return (
    <span className="pm2-sentiment" style={{ color: s.color, background: s.bg }}>
      {s.icon} {s.label}
    </span>
  );
}

function TagPill({ tag }) {
  const t = TAG_MAP[tag?.toLowerCase()] || TAG_MAP.question;
  return (
    <span className="pm2-tag" style={{ color: t.color, background: t.bg }}>
      {tag}
    </span>
  );
}

function WaveformBars() {
  return (
    <div className="pm2-waveform">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="pm2-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className="pm2-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="pm2-icon-btn" onClick={copy} title="Copy to clipboard">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
  );
}

// ── File helpers ──────────────────────────────────────────────────────────────
function isGDrive(url = "") {
  return url.includes("docs.google.com") || url.includes("drive.google.com");
}
function gDriveLabel(url = "") {
  if (url.includes("/document/")) return "Google Doc";
  if (url.includes("/spreadsheets/")) return "Google Sheet";
  if (url.includes("/presentation/")) return "Google Slides";
  if (url.includes("/file/")) return "Google Drive File";
  return "Google Drive";
}
function gDriveEmoji(url = "") {
  if (url.includes("/document/")) return "📝";
  if (url.includes("/spreadsheets/")) return "📊";
  if (url.includes("/presentation/")) return "📑";
  return "📁";
}
function fileEmoji(url = "") {
  if (isGDrive(url)) return gDriveEmoji(url);
  const ext = url.split(".").pop().split("?")[0].toLowerCase();
  if (ext === "pdf") return "📄";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  if (["mp4","mov","avi"].includes(ext)) return "🎬";
  if (["mp3","wav"].includes(ext)) return "🎵";
  return "📎";
}

function fileName(url = "") {
  if (isGDrive(url)) return gDriveLabel(url);
  try {
    const decoded = decodeURIComponent(url.split("/").pop().split("?")[0]);
    return decoded.length > 36 ? decoded.slice(0, 34) + "…" : decoded;
  } catch { return "Document"; }
}

// ── Proof Documents ────────────────────────────────────────────────────────────
function ProofDocuments({ proofs }) {
  if (!proofs || proofs.length === 0) return null;
  return (
    <div className="pm2-proof-section">
      <div className="pm2-proof-header">
        <span className="pm2-proof-title">📎 Proof Documents</span>
        <span className="pm2-proof-count">{proofs.length} file{proofs.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="pm2-proof-list">
        {proofs.map((item, i) => {
          const url  = typeof item === "string" ? item : (item.url || item.link || item.href || "");
          const name = typeof item === "object" && item.name ? item.name : fileName(url);
          if (!url) return null;
          return (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="pm2-proof-chip">
              <span className="pm2-proof-emoji">{fileEmoji(url)}</span>
              <span className="pm2-proof-name">{name}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink:0, opacity:0.5 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Answer card ────────────────────────────────────────────────────────────────
function AnswerCard({ answer, question, onTranslate, translating, translated, showTamil, onToggleLang, translateErr }) {
  const [expanded, setExpanded] = useState(true);
  const displayText = showTamil && translated ? translated : answer;

  return (
    <div className="pm2-answer-card">
      <div className="pm2-answer-card-header">
        <div className="pm2-answer-card-meta">
          <span className="pm2-answer-icon">🤖</span>
          <span className="pm2-answer-label">AI Response</span>
          {translated && (
            <div className="pm-lang-toggle" style={{ marginLeft: 8 }}>
              <button className={`pm-lang-btn ${!showTamil ? "active" : ""}`} onClick={() => onToggleLang(false)}>EN</button>
              <button className={`pm-lang-btn ${showTamil ? "active" : ""}`} onClick={() => onToggleLang(true)}>தமிழ்</button>
            </div>
          )}
        </div>
        <div className="pm2-answer-card-actions">
          <CopyButton text={displayText} />
          <button className="pm-translate-btn" onClick={onTranslate} disabled={translating} title="Translate to Tamil">
            {translating ? (
              <><SpinnerIcon /> Translating…</>
            ) : translated ? (
              <>🔄 {showTamil ? "Show EN" : "Show தமிழ்"}</>
            ) : (
              <>🌐 Tamil</>
            )}
          </button>
          <button className="pm2-icon-btn" onClick={() => setExpanded(p => !p)} title={expanded ? "Collapse" : "Expand"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {showTamil && translated && (
        <div className="pm-lang-badge" style={{ margin: "0 18px" }}>🇮🇳 தமிழ் மொழிபெயர்ப்பு</div>
      )}
      {translateErr && (
        <div className="pm-translate-error" style={{ margin: "0 18px 8px" }}>{translateErr}</div>
      )}

      <div className={`pm2-answer-body ${expanded ? "open" : ""}`}>
        <div className="pm2-answer-text" style={{
          fontFamily: showTamil ? "'Noto Sans Tamil','Latha',sans-serif" : "inherit",
          fontSize:   showTamil ? "15px" : "14px",
          lineHeight: showTamil ? "1.9"  : "1.75",
        }}>
          {displayText}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PressMeetNow() {

  const [appReady,  setAppReady]  = useState(false);
  const [listening, setListening] = useState(false);
  const [language,  setLanguage]  = useState("en-US");
  const [question,  setQuestion]  = useState("");
  const [answer,    setAnswer]    = useState("");
  const [loading,   setLoading]   = useState(false);

  const [translating,   setTranslating]   = useState(false);
  const [translated,    setTranslated]    = useState("");
  const [showTamil,     setShowTamil]     = useState(false);
  const [translateErr,  setTranslateErr]  = useState("");

  const [sentiment, setSentiment] = useState("neutral");
  const [tags,      setTags]      = useState([]);
  const [topic,     setTopic]     = useState("");
  const [proofs,    setProofs]    = useState([]);
  const [history,   setHistory]   = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const recognitionRef = useRef(null);
  const stoppingRef    = useRef(false);  // true when user intentionally stops
  const answerRef      = useRef(null);

  // ── Init speech recognition ────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setAppReady(true); return; }

    const rec = new SR();
    rec.lang           = language;
    rec.interimResults = true;
    rec.continuous     = true;

    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setQuestion(prev => {
        // For continuous mode, append interim results properly
        const finals = [];
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) finals.push(e.results[i][0].transcript);
        }
        if (finals.length > 0) return finals.join(" ");
        return t;
      });
    };

    // Auto-restart on natural end UNLESS user intentionally stopped
    rec.onend = () => {
      if (stoppingRef.current) {
        // User tapped Stop — truly stop
        stoppingRef.current = false;
        setListening(false);
      } else {
        // Natural end (browser timeout) — restart to keep listening
        setListening(curr => {
          if (curr && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {}
          }
          return curr;
        });
      }
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return; // fired alongside onend — handled there
      stoppingRef.current = false;
      setListening(false);
    };

    recognitionRef.current = rec;
    setTimeout(() => setAppReady(true), 600);
  }, [language]);

  // ── Toggle listen / stop ───────────────────────────────────────────────────
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      // ── STOP: mark intentional stop BEFORE calling .stop()
      stoppingRef.current = true;
      recognitionRef.current.stop();
      // setListening(false) will be called in rec.onend
    } else {
      // ── START: clear previous state and begin
      setAnswer(""); setTranslated(""); setShowTamil(false);
      setTags([]); setSentiment("neutral"); setTopic(""); setProofs([]);
      setListening(true);
      recognitionRef.current.start();
    }
  };

  // ── Get answer ─────────────────────────────────────────────────────────────
  const getAnswer = async () => {
    if (!question.trim()) return;

    // If still listening, stop first before generating
    if (listening && recognitionRef.current) {
      stoppingRef.current = true;
      recognitionRef.current.stop();
    }

    setLoading(true);
    setAnswer(""); setTranslated(""); setShowTamil(false); setTranslateErr("");
    setTags([]); setSentiment("neutral"); setProofs([]);
    setAnalyzing(true);

    try {
      const res = await fetch(`${BASE}/meet-ask-ai`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question, language }),
      });
      if (!res.ok) throw new Error("Webhook failed");

      const raw = await res.text();
      let answerText = raw;
      let meta = {};

      try {
        const json = JSON.parse(raw);
        answerText     = json.answer ?? json.text ?? json.output ?? raw;
        meta.sentiment = json.sentiment ?? "neutral";
        meta.tags      = Array.isArray(json.tags) ? json.tags : [];
        meta.topic     = json.topic ?? "";
        // proofs may be array, JSON array string, or comma-separated string
        const rawProofs = json.proofs;
        if (Array.isArray(rawProofs)) meta.proofs = rawProofs;
        else if (typeof rawProofs === "string") {
          try { meta.proofs = JSON.parse(rawProofs); } catch {
            meta.proofs = rawProofs.split(",").map(s => s.trim()).filter(Boolean);
          }
        } else { meta.proofs = []; }
      } catch { /* plain text */ }

      setAnswer(answerText || "No answer received.");
      setSentiment(meta.sentiment || "neutral");
      setTags(meta.tags || []);
      setTopic(meta.topic || "");
      setProofs(meta.proofs || []);

      setHistory(prev => [{
        id:        Date.now(),
        question,
        answer:    answerText,
        sentiment: meta.sentiment || "neutral",
        tags:      meta.tags || [],
        topic:     meta.topic || "",
        proofs:    meta.proofs || [],
        time:      new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev]);

      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    } catch (err) {
      console.error(err);
      setAnswer("Failed to generate answer. Please try again.");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  // ── Translate to Tamil ─────────────────────────────────────────────────────
  const translateToTamil = async () => {
    if (!answer.trim()) return;
    if (translated) { setShowTamil(p => !p); return; }

    setTranslating(true); setTranslateErr("");
    try {
      const res = await fetch(`${BASE}/meet-translate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: answer.trim(), targetLanguage: "ta", sourceLanguage: "en" }),
      });
      if (!res.ok) throw new Error("Translation failed");

      const raw = await res.text();
      let result = raw;
      try {
        const j = JSON.parse(raw);
        result = j.translation ?? j.text ?? j.output ?? raw;
      } catch { /* plain text */ }

      setTranslated(result || "மொழிபெயர்ப்பு கிடைக்கவில்லை.");
      setShowTamil(true);
    } catch (err) {
      console.error(err);
      setTranslateErr("Translation failed. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  // ── Mic button label & icon ────────────────────────────────────────────────
  const micLabel = listening ? "Tap to Stop" : "Tap to Listen";

  const StopIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3"/>
    </svg>
  );

  const MicIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* ── Header ── */}
        <div className="qa-top">
          <div className="qa-logo">🎙️</div>
          <span className="qa-title">PressMeet AI</span>
          <span className="qa-subtitle">Live Voice Assisted Answering</span>
        </div>

        <div className="qa-body">

          {/* ── VOICE CAPTURE CARD ── */}
          <div className="section-label">Voice Input</div>

          <div className="pm2-mic-card">

            <div className="pm2-mic-top">
              <div className="pm2-mic-top-left">
                <span className="qa-num">VOICE CAPTURE</span>
                {listening && <SentimentBadge sentiment="neutral" />}
              </div>
              <select
                className="input-field"
                style={{ maxWidth: 140 }}
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="en-US">🇺🇸 English</option>
                <option value="ta-IN">🇮🇳 Tamil</option>
              </select>
            </div>

            <div className="pm2-mic-center">
              {/* Waveform — visible when listening */}
              <div className={`pm2-waveform-wrap ${listening ? "visible" : ""}`}>
                <WaveformBars />
              </div>

              {/* ── Single toggle button: Listen ↔ Stop ── */}
              <button
                className={`pm2-mic-btn ${listening ? "listening" : ""}`}
                onClick={toggleListening}
                aria-label={micLabel}
              >
                {/* Animated rings only shown when listening */}
                <span className="pm2-mic-ring pm2-mic-ring--1" />
                <span className="pm2-mic-ring pm2-mic-ring--2" />

                {/* Icon swaps between mic and stop square */}
                <div className="pm2-mic-icon-wrap">
                  {listening ? <StopIcon /> : <MicIcon />}
                </div>

                <span className="pm2-mic-label">{micLabel}</span>
              </button>

              {listening && (
                <p className="pm2-mic-hint">Speaking… tap the button to stop</p>
              )}
            </div>
          </div>

          {/* ── QUESTION INPUT CARD ── */}
          <div className="divider" />
          <div className="section-label">Recognized Question</div>

          <div className="qa-card">
            <div style={{ padding: 24 }}>
              <textarea
                className="input-field"
                style={{ minHeight: 90 }}
                placeholder="Spoken question appears here — or type manually..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />

              <div className="pm2-question-footer">
                <span className="pm2-char-count">{question.length} chars</span>

                <div className="pm2-question-actions">
                  {question && (
                    <button className="pm2-clear-btn" onClick={() => {
                      setQuestion(""); setAnswer(""); setTranslated(""); setShowTamil(false);
                      setTags([]); setSentiment("neutral"); setProofs([]);
                    }}>
                      Clear
                    </button>
                  )}
                  <button
                    className="btn-primary"
                    onClick={getAnswer}
                    disabled={loading || !question.trim()}
                  >
                    {loading ? <><SpinnerIcon /> Generating…</> : "Generate Answer"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── ANSWER SECTION ── */}
          {(answer || loading) && (
            <>
              <div className="divider" />

              <div className="pm2-meta-row" ref={answerRef}>
                {topic && <span className="pm2-topic-badge">📌 {topic}</span>}
                <SentimentBadge sentiment={sentiment} />
                {tags.map(tag => <TagPill key={tag} tag={tag} />)}
                {analyzing && <span className="pm2-analyzing">🔍 Analyzing…</span>}
              </div>

              {loading ? (
                <div className="pm2-skeleton-card">
                  <div className="pm2-skeleton-line pm2-skeleton-line--80" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--60" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--90" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--50" />
                </div>
              ) : (
                <>
                  <AnswerCard
                    answer={answer}
                    question={question}
                    onTranslate={translateToTamil}
                    translating={translating}
                    translated={translated}
                    showTamil={showTamil}
                    onToggleLang={setShowTamil}
                    translateErr={translateErr}
                  />
                  <ProofDocuments proofs={proofs} />
                </>
              )}
            </>
          )}

          {/* ── SESSION HISTORY ── */}
          {history.length > 1 && (
            <>
              <div className="divider" />
              <div className="section-label">
                Session History
                <span className="field-optional">&nbsp;· {history.length} exchanges</span>
              </div>

              <div className="pm2-history-list">
                {history.slice(1).map(item => (
                  <div key={item.id} className="pm2-history-item">
                    <div className="pm2-history-header">
                      <div className="pm2-history-left">
                        {item.topic && <span className="pm2-topic-badge pm2-topic-badge--sm">📌 {item.topic}</span>}
                        <SentimentBadge sentiment={item.sentiment} />
                        {item.tags.map(t => <TagPill key={t} tag={t} />)}
                      </div>
                      <span className="pm2-history-time">{item.time}</span>
                    </div>
                    <p className="pm2-history-q">❓ {item.question}</p>
                    <p className="pm2-history-a">{item.answer.slice(0, 160)}{item.answer.length > 160 ? "…" : ""}</p>
                     {item.proofs?.length > 0 && (
                      <div className="pm2-history-proofs">
                        {item.proofs.map((p, i) => {
                          const url = typeof p === "string" ? p : (p.url || p.link || "");
                          const name = typeof p === "object" && p.name ? p.name : fileName(url);
                          if (!url) return null;
                          return (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="pm2-history-proof-link">
                              {fileEmoji(url)} {name}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}