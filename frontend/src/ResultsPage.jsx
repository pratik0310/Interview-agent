import { useEffect, useState } from "react";
import axios from "axios";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #0a0a0a;
    color: #f0ede6;
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
  }

  .results-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 60px 24px;
  }

  .header {
    margin-bottom: 56px;
  }

  .header-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .header h1 {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 800;
    line-height: 1.05;
    color: #f0ede6;
  }

  .header h1 span {
    color: #c8f560;
  }

  .summary-bar {
    display: flex;
    gap: 24px;
    margin-top: 32px;
    padding: 20px 24px;
    background: #141414;
    border: 1px solid #222;
    border-radius: 4px;
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .summary-stat .val {
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1;
  }

  .summary-stat .lbl {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    color: #555;
    text-transform: uppercase;
  }

  .val.correct { color: #c8f560; }
  .val.wrong   { color: #ff5f5f; }
  .val.total   { color: #f0ede6; }

  .divider {
    width: 1px;
    background: #222;
    align-self: stretch;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 6px;
    overflow: hidden;
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #1a1a1a;
  }

  .q-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.15em;
    color: #444;
    text-transform: uppercase;
  }

  .badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 2px;
  }

  .badge.correct { background: #1a2e00; color: #c8f560; }
  .badge.wrong   { background: #2e0000; color: #ff5f5f; }

  .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .question-text {
    font-size: 1rem;
    font-weight: 700;
    color: #f0ede6;
  }

  .answer-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .answer-block {
    padding: 14px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .answer-block.original  { background: #161616; border: 1px solid #222; }
  .answer-block.corrected { background: #111d00; border: 1px solid #2a3a00; }

  .answer-block .alabel {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #555;
  }

  .answer-block.corrected .alabel { color: #7aaa20; }

  .answer-block p {
    font-size: 0.88rem;
    line-height: 1.6;
    color: #ccc;
  }

  .answer-block.corrected p { color: #d4ee90; }

  .mistakes-section { display: flex; flex-direction: column; gap: 8px; }

  .mistakes-title {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
  }

  .mistakes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mistake-pair {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #1a1010;
    border: 1px solid #2e1a1a;
    border-radius: 3px;
    padding: 5px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
  }

  .mistake-pair .wrong-word  { color: #ff5f5f; text-decoration: line-through; }
  .mistake-pair .arrow       { color: #444; }
  .mistake-pair .correct-word{ color: #c8f560; }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
  }

  .spinner {
    width: 36px; height: 36px;
    border: 2px solid #222;
    border-top-color: #c8f560;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading p {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.15em;
    color: #444;
    text-transform: uppercase;
  }

  .retry-btn {
    margin-top: 40px;
    padding: 14px 32px;
    background: #c8f560;
    color: #0a0a0a;
    border: none;
    border-radius: 3px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: opacity 0.2s;
  }

  .retry-btn:hover { opacity: 0.85; }
`;

function parseMistakes(mistakes) {
//   const pairs = [];
//   for (let i = 0; i < mistakes.length; i++) {
//     if (mistakes[i].startsWith("Wrong: ") && mistakes[i + 1]?.startsWith("Correct: ")) {
//       pairs.push({
//         wrong: mistakes[i].replace("Wrong: ", ""),
//         correct: mistakes[i + 1].replace("Correct: ", ""),
//       });
//       i++;
//     }
//   }
//   return pairs;
  return mistakes.filter(m => m.wrong || m.correct);

}

export default function ResultsPage({ onRestart }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:5001/results")
      .then(res => {
        setResults(res.data.results);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load results.");
        setLoading(false);
      });
  }, []);

  const totalCorrect = results.filter(r => r.status === "CORRECT").length;
  const totalWrong   = results.filter(r => r.status === "WRONG").length;

  const handleRestart = async () => {
    await axios.get("http://127.0.0.1:5000/restart");
    onRestart();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="results-page">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Analysing answers...</p>
          </div>
        ) : error ? (
          <div className="loading"><p>{error}</p></div>
        ) : (
          <>
            <div className="header">
              <div className="header-label">Interview Complete</div>
              <h1>Your <span>Results</span></h1>
              <div className="summary-bar">
                <div className="summary-stat">
                  <span className="val total">{results.length}</span>
                  <span className="lbl">Total</span>
                </div>
                <div className="divider" />
                <div className="summary-stat">
                  <span className="val correct">{totalCorrect}</span>
                  <span className="lbl">Correct</span>
                </div>
                <div className="divider" />
                <div className="summary-stat">
                  <span className="val wrong">{totalWrong}</span>
                  <span className="lbl">Errors</span>
                </div>
              </div>
            </div>

            <div className="cards">
              {results.map((r, i) => {
                const pairs = parseMistakes(r.mistakes || []);
                return (
                  <div
                    className="card"
                    key={i}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="card-header">
                      <span className="q-label">Q{r.question_number}</span>
                      <span className={`badge ${r.status === "CORRECT" ? "correct" : "wrong"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="question-text">{r.question}</div>
                      <div className="answer-row">
                        <div className="answer-block original">
                          <span className="alabel">Your Answer</span>
                          <p>{r.original_answer || "—"}</p>
                        </div>
                        <div className="answer-block corrected">
                          <span className="alabel">Corrected</span>
                          <p>{r.corrected_answer || "—"}</p>
                        </div>
                      </div>
                      {pairs.length > 0 && (
                        <div className="mistakes-section">
                          <span className="mistakes-title">Mistakes</span>
                          <div className="mistakes-list">
                            {pairs.map((p, j) => (
                              <div className="mistake-pair" key={j}>
                                <span className="wrong-word">{p.wrong}</span>
                                <span className="arrow">→</span>
                                <span className="correct-word">{p.correct}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="retry-btn" onClick={handleRestart}>
              Restart Interview
            </button>
          </>
        )}
      </div>
    </>
  );
}