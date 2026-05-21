import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ResultsPage from "./ResultsPage";

function App() {
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showResults, setShowResults] = useState(false);  // ✅
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/question");
      if (response.data.finished) {
        setShowResults(true);                              // ✅ switch to results
        return;
      }
      setQuestion(response.data.question);
    } catch (err) {
      console.error("Failed to fetch question", err);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          const response = await axios.post("http://127.0.0.1:5000/transcribe", formData);
          setTranscript(response.data.transcript);
          fetchQuestion();
        } catch (err) {
          console.error("Transcribe failed", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRestart = () => {
    setShowResults(false);                                 // ✅ back to interview
    setQuestion("");
    setTranscript("");
    hasFetched.current = false;
    fetchQuestion();
  };

  // ✅ show results page after 10 questions
  if (showResults) {
    return <ResultsPage onRestart={handleRestart} />;
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AI Interview Agent</h1>
      <h2>Question</h2>
      <p>{question}</p>
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? "Recording..." : "Start Answer"}
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Answer
      </button>
      <h2>Transcript</h2>
      <p>{transcript}</p>
    </div>
  );
}

export default App;