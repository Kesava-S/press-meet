import { useEffect, useRef, useState } from "react";

export default function PressMeetNow() {
  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuestion(text);
      setAnswer(""); // reset old answer
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    setListening(true);
    recognitionRef.current?.start();
  };

  const getAnswer = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    // 🔁 Replace with real API call (n8n → OpenAI → RAG)
    setTimeout(() => {
      setAnswer(
        "This is a concise AI-generated summary based on the prepared documents. This response is read-only for official reference during the press meet."
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="pressmeet-page">
      <h2>PressMeet Now</h2>

      {/* Mic Button */}
      <button
        className={`mic-btn ${listening ? "active" : ""}`}
        onClick={startListening}
      >
        🎙️ {listening ? "Listening..." : "Tap to Listen"}
      </button>

      {/* Recognized Question */}
      <div className="card">
        <h3>Recognized Question</h3>
        <textarea
          className="input"
          style={{ minHeight: 80 }}
          placeholder="Recognized question will appear here..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="primary" onClick={getAnswer} disabled={loading}>
            {loading ? "Getting Answer..." : "Get Answer"}
          </button>
        </div>
      </div>

      {/* Summarized Answer */}
      {answer && (
        <div className="card">
          <h3>Summarized Answer</h3>
          <textarea
            className="input"
            style={{ minHeight: 120 }}
            value={answer}
            readOnly   // 🔒 not editable
          />
        </div>
      )}
    </div>
  );
}
