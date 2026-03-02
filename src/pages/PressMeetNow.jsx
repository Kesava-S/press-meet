import { useEffect, useRef, useState } from "react";
import "./globals.css";

const BASE = import.meta.env.VITE_N8N_WEBHOOK_URL;

// ── Sentiment config ───────────────────────────────────────────────────────────
const SENTIMENT_MAP = {
  hostile: { label: "Hostile", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "🔴" },
  negative: { label: "Negative", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "🟡" },
  neutral: { label: "Neutral", color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: "🔵" },
  positive: { label: "Positive", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: "🟢" },
};

const TAG_MAP = {
  criticism: { color: "#ef4444", bg: "rgba(239,68,68,0.09)" },
  question: { color: "#3b82f6", bg: "rgba(59,130,246,0.09)" },
  accusation: { color: "#f59e0b", bg: "rgba(245,158,11,0.09)" },
  answer: { color: "#10b981", bg: "rgba(16,185,129,0.09)" },
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
    </button>
  );
}

// ── Answer card — chat bubble style with expand ────────────────────────────────
function AnswerCard({ answer, question, onTranslate, translating, translated, showTamil, onToggleLang, translateErr }) {
  const [expanded, setExpanded] = useState(true);
  const displayText = showTamil && translated ? translated : answer;

  return (
    <div className="pm2-answer-card">

      {/* Card header */}
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
          <button
            className="pm-translate-btn"
            onClick={onTranslate}
            disabled={translating}
            title="Translate to Tamil"
          >
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
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tamil badge */}
      {showTamil && translated && (
        <div className="pm-lang-badge" style={{ margin: "0 18px" }}>🇮🇳 தமிழ் மொழிபெயர்ப்பு</div>
      )}

      {/* Error */}
      {translateErr && (
        <div className="pm-translate-error" style={{ margin: "0 18px 8px" }}>{translateErr}</div>
      )}

      {/* Answer body */}
      <div className={`pm2-answer-body ${expanded ? "open" : ""}`}>
        <div className="pm2-answer-text" style={{
          fontFamily: showTamil ? "'Noto Sans Tamil','Latha',sans-serif" : "inherit",
          fontSize: showTamil ? "15px" : "14px",
          lineHeight: showTamil ? "1.9" : "1.75",
        }}>
          {displayText}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PressMeetNow() {

  const [appReady, setAppReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState("en-US");

  // Question
  const [question, setQuestion] = useState("");

  // Answer + loading
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // Translation
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState("");
  const [showTamil, setShowTamil] = useState(false);
  const [translateErr, setTranslateErr] = useState("");

  // AI-parsed metadata from response
  const [sentiment, setSentiment] = useState("neutral");
  const [tags, setTags] = useState([]);
  const [topic, setTopic] = useState("");

  // Session history (for chat-like feel)
  const [history, setHistory] = useState([]);

  // Sentiment analysis loading
  const [analyzing, setAnalyzing] = useState(false);

  const recognitionRef = useRef(null);
  const answerRef = useRef(null);

  // ── Init speech recognition ────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setAppReady(true); return; }

    const rec = new SR();
    rec.lang = language;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setQuestion(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    setTimeout(() => setAppReady(true), 600);
  }, [language]);

  // ── Toggle listen / stop ───────────────────────────────────────────────────
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();          // onend fires → setListening(false)
    } else {
      setAnswer(""); setTranslated(""); setShowTamil(false);
      setTags([]); setSentiment("neutral"); setTopic("");
      setListening(true);
      recognitionRef.current.start();
    }
  };

  // ── Get answer ─────────────────────────────────────────────────────────────
  const getAnswer = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(""); setTranslated(""); setShowTamil(false); setTranslateErr("");
    setTags([]); setSentiment("neutral");
    setAnalyzing(true);

    try {
      const res = await fetch(`${BASE}/meet-ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language }),
      });
      if (!res.ok) throw new Error("Webhook failed");

      const raw = await res.text();
      let answerText = raw;
      let meta = {};

      // Try parsing JSON response with metadata
      // Expected: { answer: "...", sentiment: "negative", tags: ["criticism"], topic: "Economy" }
      // Falls back to plain text if not JSON
      try {
        const json = JSON.parse(raw);
        answerText = json.answer ?? json.text ?? json.output ?? raw;
        meta.sentiment = json.sentiment ?? "neutral";
        meta.tags = Array.isArray(json.tags) ? json.tags : [];
        meta.topic = json.topic ?? "";
      } catch { /* plain text */ }

      setAnswer(answerText || "No answer received.");
      setSentiment(meta.sentiment || "neutral");
      setTags(meta.tags || []);
      setTopic(meta.topic || "");

      // Add to session history
      setHistory(prev => [{
        id: Date.now(),
        question,
        answer: answerText,
        sentiment: meta.sentiment || "neutral",
        tags: meta.tags || [],
        topic: meta.topic || "",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }, ...prev]);

      // Scroll to answer
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: answer.trim(), targetLanguage: "ta", sourceLanguage: "en" }),
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

            {/* Top row: label + language selector */}
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

            {/* Mic center */}
            <div className="pm2-mic-center">
              {/* Waveform — visible when listening */}
              <div className={`pm2-waveform-wrap ${listening ? "visible" : ""}`}>
                <WaveformBars />
              </div>

              {/* Big mic button */}
              <button
                className={`pm2-mic-btn ${listening ? "listening" : ""}`}
                onClick={toggleListening}
                aria-label={listening ? "Tap to stop" : "Tap to listen"}
              >
                <span className="pm2-mic-ring pm2-mic-ring--1" />
                <span className="pm2-mic-ring pm2-mic-ring--2" />
                {listening ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
                <span className="pm2-mic-label">
                  {listening ? "Tap to Stop" : "Tap to Listen"}
                </span>
              </button>

              {listening && (
                <p className="pm2-mic-hint">Speak clearly — tap again to stop</p>
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

              {/* Bottom action row */}
              <div className="pm2-question-footer">
                {/* Character count */}
                <span className="pm2-char-count">{question.length} chars</span>

                <div className="pm2-question-actions">
                  {question && (
                    <button className="pm2-clear-btn" onClick={() => {
                      setQuestion(""); setAnswer(""); setTranslated(""); setShowTamil(false);
                      setTags([]); setSentiment("neutral");
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

              {/* Metadata row — topic + sentiment + tags */}
              <div className="pm2-meta-row" ref={answerRef}>
                {topic && <span className="pm2-topic-badge">📌 {topic}</span>}
                <SentimentBadge sentiment={sentiment} />
                {tags.map(tag => <TagPill key={tag} tag={tag} />)}
                {analyzing && <span className="pm2-analyzing">🔍 Analyzing…</span>}
              </div>

              {/* Loading skeleton */}
              {loading ? (
                <div className="pm2-skeleton-card">
                  <div className="pm2-skeleton-line pm2-skeleton-line--80" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--60" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--90" />
                  <div className="pm2-skeleton-line pm2-skeleton-line--50" />
                </div>
              ) : (
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