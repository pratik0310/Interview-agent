from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import random
import threading
import asyncio
import edge_tts
import pygame
import uuid
import os
import json

app = Flask(__name__)
CORS(app)

print("Loading Whisper...")
model = WhisperModel("small", device="cpu", compute_type="int8")
print("Whisper loaded!")

questions = [
    "Tell me about yourself",
    "What are your strengths",
    "What are your weaknesses",
    "Why should we hire you",
    "Why do you want to work here",
    "Where do you see yourself in 5 years",
    "Explain your latest project",
    "Tell me about a challenge you faced",
    "Describe yourself in one word",
    "What motivates you",
    "What are your career goals",
    "Why did you choose this field",
    "Tell me about your leadership experience",
    "How do you handle pressure",
    "What is your biggest achievement",
    "What makes you unique",
    "Describe a difficult situation at work",
    "How do you manage time",
    "What are your hobbies",
    "Tell me about your teamwork skills",
    "How do you handle criticism",
    "What is success for you",
    "What is failure for you",
    "How do you prioritize tasks",
    "What do you know about our company",
    "Why did you leave your previous role",
    "Describe your communication skills",
    "Tell me about a conflict you resolved",
    "How quickly do you learn new technology",
    "What is your dream job",
    "How do you stay updated with technology",
    "Tell me about your internship",
    "Describe your work ethic",
    "What are your salary expectations",
    "Are you willing to relocate",
    "How do you handle deadlines",
    "Tell me about a time you failed",
    "What did you learn from mistakes",
    "Describe your ideal work environment",
    "What are your technical skills",
    "How do you solve problems",
    "Tell me about your college project",
    "Describe a time you showed leadership",
    "How do you work in a team",
    "What is your biggest strength",
    "What is your biggest weakness",
    "How do you handle stress",
    "Why are you interested in this role",
    "Tell me something not on your resume",
    "How do you define hard work",
    "What are your short term goals",
    "What are your long term goals",
    "What do you do in your free time",
    "How do you manage multiple tasks",
    "Tell me about a proud moment",
    "Describe your decision making process",
    "What kind of manager do you prefer",
    "How do you deal with disagreements",
    "What inspires you",
    "How do you adapt to change",
    "Describe your learning process",
    "What programming languages do you know",
    "Tell me about your favorite project",
    "How do you handle failure",
    "What is your leadership style",
    "What are your expectations from this company",
    "How do you improve your skills",
    "Tell me about your responsibilities",
    "How do you approach new challenges",
    "Describe your creativity",
    "How do you maintain work life balance",
    "What are your future plans",
    "What does teamwork mean to you",
    "How do you stay motivated",
    "Tell me about your achievements",
    "Describe a stressful situation",
    "How do you deal with difficult people",
    "What do you value most in a workplace",
    "What is your management style",
    "Tell me about a successful project",
    "How do you communicate with teammates",
    "Describe your personality",
    "How do you handle rejection",
    "What are your strengths as a leader",
    "What is your greatest accomplishment",
    "Describe a risk you took",
    "How do you react to feedback",
    "Tell me about a time you helped someone",
    "What is your favorite technology",
    "How do you organize your work",
    "Tell me about your education",
    "What skills would you like to improve",
    "Describe your adaptability",
    "How do you ensure quality work",
    "Tell me about a difficult decision",
    "What do you expect from a manager",
    "How do you build relationships at work",
    "What is your proudest achievement",
    "Tell me about a time you worked under pressure",
    "How do you contribute to a team",
    "Describe your problem solving skills",
    "Why are you the best candidate"
]

random.shuffle(questions)
selected_questions = questions[:10]

current_question = 0
question_served = False
stored_answers = []

pygame.mixer.init()
tts_lock = threading.Lock()

def speak_text(text):
    def _speak():
        with tts_lock:
            filename = f"speech_{uuid.uuid4().hex}.mp3"
            async def _run():
                communicate = edge_tts.Communicate(text, voice="en-US-JennyNeural")
                await communicate.save(filename)
            asyncio.run(_run())
            pygame.mixer.music.load(filename)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)
            pygame.mixer.music.unload()
            os.remove(filename)
    threading.Thread(target=_speak, daemon=True).start()


@app.route("/question", methods=["GET"])
def get_question():
    global current_question, question_served

    if current_question >= len(selected_questions):
        speak_text("Interview Finished. Check your results.")
        return jsonify({"question": "Interview Finished", "finished": True})

    question = selected_questions[current_question]
    if not question_served:
        speak_text(question)
        question_served = True

    return jsonify({
        "question_number": current_question + 1,
        "total_questions": 10,
        "question": question,
        "finished": False
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    global current_question, question_served

    audio = request.files["audio"]
    file_path = "temp.wav"
    audio.save(file_path)

    segments, _ = model.transcribe(
        file_path, beam_size=5, language="en",
        vad_filter=True,
        initial_prompt="This is a professional HR interview."
    )
    text = " ".join(s.text for s in segments).strip()

    stored_answers.append({
        "question": selected_questions[current_question],
        "answer": text
    })

    # ✅ save to json for grammar server
    with open("answers.json", "w") as f:
        json.dump(stored_answers, f)

    current_question += 1
    question_served = False

    return jsonify({"transcript": text})


@app.route("/restart", methods=["GET"])
def restart_interview():
    global current_question, question_served, selected_questions, stored_answers

    current_question = 0
    question_served = False
    stored_answers = []
    random.shuffle(questions)
    selected_questions = questions[:10]

    if os.path.exists("answers.json"):
        os.remove("answers.json")

    return jsonify({"message": "Interview restarted"})


if __name__ == "__main__":
    app.run(port=5000, debug=True, use_reloader=False, threaded=True)