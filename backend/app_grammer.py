from flask import Flask, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import difflib
import json
import os

app = Flask(__name__)
CORS(app)

print("Loading grammar model...")
try:
    tokenizer = AutoTokenizer.from_pretrained("deep-learning-analytics/GrammarCorrector")
    grammar_model = AutoModelForSeq2SeqLM.from_pretrained("deep-learning-analytics/GrammarCorrector")
    print("Grammar model loaded!")
except Exception as e:
    print(f"Grammar model FAILED: {e}")
    raise


def correct_grammar(text):
    if not text or not text.strip():
        return text
    input_text = f"Fix grammatical errors in this sentence: {text}"
    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        truncation=True,
        max_length=256
    )
    outputs = grammar_model.generate(
        **inputs,
        max_length=256,
        num_beams=5,
        early_stopping=True
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def find_mistakes(original, corrected):
    diff = difflib.ndiff(original.split(), corrected.split())
    mistakes = []
    wrong_buf = []
    correct_buf = []
    for token in diff:
        if token.startswith("- "):
            wrong_buf.append(token[2:])
        elif token.startswith("+ "):
            correct_buf.append(token[2:])
        else:
            # flush buffers as pairs
            for w, c in zip(wrong_buf, correct_buf):
                mistakes.append({"wrong": w, "correct": c})
            # leftovers — deletions with no replacement
            for w in wrong_buf[len(correct_buf):]:
                mistakes.append({"wrong": w, "correct": ""})
            # additions with no original
            for c in correct_buf[len(wrong_buf):]:
                mistakes.append({"wrong": "", "correct": c})
            wrong_buf, correct_buf = [], []
    # flush remaining
    for w, c in zip(wrong_buf, correct_buf):
        mistakes.append({"wrong": w, "correct": c})
    for w in wrong_buf[len(correct_buf):]:
        mistakes.append({"wrong": w, "correct": ""})
    for c in correct_buf[len(wrong_buf):]:
        mistakes.append({"wrong": "", "correct": c})
    return mistakes


@app.route("/results", methods=["GET"])
def get_results():

    if not os.path.exists("answers.json"):
        return jsonify({"error": "No answers found. Complete interview first."}), 400

    with open("answers.json", "r") as f:
        stored_answers = json.load(f)

    if not stored_answers:
        return jsonify({"error": "Answers file empty"}), 400

    results = []

    for i, item in enumerate(stored_answers):
        original = item["answer"].strip()
        corrected = correct_grammar(original)
        is_correct = original.lower() == corrected.lower()
        mistakes = [] if is_correct else find_mistakes(original, corrected)

        results.append({
            "question_number": i + 1,
            "question": item["question"],
            "original_answer": original,
            "corrected_answer": corrected,
            "status": "CORRECT" if is_correct else "WRONG",
            "mistakes": mistakes          # ✅ now list of {wrong, correct} dicts
        })

    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(port=5001, debug=True, use_reloader=False, threaded=True)