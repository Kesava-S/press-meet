import { useState } from "react";

export default function QAPage() {
  const [topics, setTopics] = useState([
    "Economy",
    "Healthcare",
    "Education",
    "Infrastructure",
  ]);

  const [newTopic, setNewTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [qaSets, setQaSets] = useState([
    { question: "", shortAnswer: "", multiAnswers: ["", "", ""] },
  ]);

  const [showMultiAnswerFor, setShowMultiAnswerFor] = useState(null); // index

  const addTopic = () => {
    if (!newTopic.trim()) return;
    setTopics((prev) => [...prev, newTopic.trim()]);
    setNewTopic("");
  };

  const addQASet = () => {
    setQaSets((prev) => [
      ...prev,
      { question: "", shortAnswer: "", multiAnswers: ["", "", ""] },
    ]);
  };

  const updateQA = (i, field, val) => {
    setQaSets((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  };

  const updateMultiAnswer = (setIndex, ansIndex, val) => {
    setQaSets((prev) => {
      const next = [...prev];
      const answers = [...next[setIndex].multiAnswers];
      answers[ansIndex] = val;
      next[setIndex].multiAnswers = answers;
      return next;
    });
  };

  const addMultiAnswer = (setIndex) => {
    setQaSets((prev) => {
      const next = [...prev];
      next[setIndex].multiAnswers.push("");
      return next;
    });
  };

  return (
    <div className="qa-page">
      <h2>Define Your Own Question & Answer</h2>

      {/* Step 1: Topic Page */}
      {!selectedTopic && (
        <div className="card">
          <h3>Select a Topic</h3>

          <div className="topic-input-row">
            <input
              className="input"
              placeholder="Add new topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
            />
            <button className="primary" onClick={addTopic}>
              Add
            </button>
          </div>

          <div className="topic-grid">
            {topics.map((t) => (
              <div
                key={t}
                className="topic-card"
                onClick={() => {
                  setSelectedTopic(t);
                  setQaSets([
                    {
                      question: "",
                      shortAnswer: "",
                      multiAnswers: ["", "", ""],
                    },
                  ]);
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Q&A Sets Stacked */}
      {selectedTopic && (
        <>
          <div className="qa-header">
            <button className="back-btn" onClick={() => setSelectedTopic(null)}>
              ← Topics
            </button>
            <h3>{selectedTopic}</h3>
            <button className="add-q-btn" onClick={addQASet}>
              + Add Q&A Set
            </button>
          </div>

          {qaSets.map((set, i) => (
            <div key={i} className="qa-set">
              <div className="qa-editor">
                <div className="card qa-left">
                  <h3>Question {i + 1}</h3>
                  <textarea
                    className="input"
                    placeholder="Type the question..."
                    value={set.question}
                    onChange={(e) => updateQA(i, "question", e.target.value)}
                  />
                </div>

                <div className="card qa-right">
                  <h3>Answer (Short)</h3>
                  <textarea
                    className="input"
                    placeholder="Type short answer..."
                    value={set.shortAnswer}
                    onFocus={() => setShowMultiAnswerFor(i)}
                    onChange={(e) =>
                      updateQA(i, "shortAnswer", e.target.value)
                    }
                  />
                  <p className="hint">
                    Click to add multiple answer variations
                  </p>
                </div>
              </div>

              {/* Step 3: Multi Answer Editor (inline per Q&A set) */}
              {showMultiAnswerFor === i && (
                <div className="card multi-answer-card">
                  <div className="qa-header">
                    <h4>Multiple Answers</h4>
                    <button
                      className="back-btn"
                      onClick={() => setShowMultiAnswerFor(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="multi-answer-grid">
                    {set.multiAnswers.map((ans, idx) => (
                      <textarea
                        key={idx}
                        className="input"
                        placeholder={`Answer variant ${idx + 1}`}
                        value={ans}
                        onChange={(e) =>
                          updateMultiAnswer(i, idx, e.target.value)
                        }
                      />
                    ))}
                  </div>

                  <button
                    className="primary"
                    onClick={() => addMultiAnswer(i)}
                  >
                    + Add another answer
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
