import { useEffect, useRef, useState } from "react";
import "./globals.css";

export default function PressMeetNow() {

  const [appReady, setAppReady] = useState(false);

  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en-US");

  const recognitionRef = useRef(null);

  // ─────────────────────────────────────────────
  // Preloader Init
  // ─────────────────────────────────────────────
  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported.");
      setAppReady(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setQuestion(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;

    // Simulate small load delay for smooth transition
    setTimeout(() => {
      setAppReady(true);
    }, 600);

  }, [language]);

  // ─────────────────────────────────────────────
  // Start Listening
  // ─────────────────────────────────────────────
  const startListening = () => {
    if (!recognitionRef.current) return;
    setAnswer("");
    setListening(true);
    recognitionRef.current.start();
  };

  // ─────────────────────────────────────────────
  // Get Answer (Replace with n8n API)
  // ─────────────────────────────────────────────
  const getAnswer = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_N8N_WEBHOOK_URL}/meet-ask-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question,
            language: language
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Webhook failed");
      }

      // const data = await res.json();
      const text = await res.text();
      
      // Expecting: { answer: "..." }
      setAnswer(text || "No answer received.");

    } catch (error) {
      console.error("Error:", error);
      setAnswer("Failed to generate answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Preloader Component
  // ─────────────────────────────────────────────
  const Preloader = () => (
    <div className="preloader-overlay">
      <div className="preloader-box">
        <div className="preloader-ring">
          <span />
          <span />
          <span />
        </div>
        <p className="preloader-text">Initializing PressMeet AI…</p>
      </div>
    </div>
  );

  return (
    <>
      {!appReady && <Preloader />}

      <div className={`qa-root ${appReady ? "qa-root--ready" : ""}`}>

        {/* Header */}
        <div className="qa-top">
          <div className="qa-logo">🎙️</div>
          <span className="qa-title">PressMeet AI</span>
          <span className="qa-subtitle">
            Live Voice Assisted Answering
          </span>
        </div>

        <div className="qa-body">

          {/* Section Label */}
          <div className="section-label">Voice Input</div>

          {/* Mic Card */}
          <div className="qa-card">
            <div className="qa-card-header">
              <span className="qa-num">VOICE CAPTURE</span>

              <select
                className="input-field"
                style={{ maxWidth: 150 }}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en-US">English</option>
                <option value="ta-IN">Tamil</option>
              </select>
            </div>

            <div style={{ padding: 30, textAlign: "center" }}>
              <button
                className={`mic-button ${listening ? "active" : ""}`}
                onClick={startListening}
              >
                {listening ? "Listening..." : "Tap to Listen"}
              </button>
            </div>
          </div>

          {/* Recognized Question */}
          <div className="divider" />
          <div className="section-label">Recognized Question</div>

          <div className="qa-card">
            <div style={{ padding: 24 }}>
              <textarea
                className="input-field"
                style={{ minHeight: 100 }}
                placeholder="Live voice transcription will appear here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  className="btn-primary"
                  onClick={getAnswer}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Answer"}
                </button>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          {answer && (
            <>
              <div className="divider" />
              <div className="section-label">AI Response</div>

              <div className="qa-card">
                <div style={{ padding: 24 }}>
                  <textarea
                    className="input-field"
                    style={{ minHeight: 300 }}
                    value={answer}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}