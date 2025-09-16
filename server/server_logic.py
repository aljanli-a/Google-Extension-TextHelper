from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

new_server = Flask(__name__)
CORS(new_server)

# Configure API key from environment
api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
else:
    model = None

@new_server.route("/analyze", methods=["POST"])
def analyze():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        msg = (data.get("text") or "").strip()
        mode = (data.get("mod") or "normal").strip()

        if not msg:
            return jsonify({"error": "Please Highlight Text"}), 400

        if mode not in ("normal", "academic"):
            return jsonify({"error": "Invalid mode specified"}), 400

        if model is None:
            return jsonify({"error": "Server not configured. Missing API key."}), 500

        if mode == "normal":
            prompt = (
                f"Explain the following text clearly and factually in the style of Wikipedia. "
                f"Keep the explanation under 50 words. Do not ask questions or provide extra commentary. "
                f"Don't use text format (ex. *[text]*)."
                f"Just provide concise information.\n\nText: {msg}"
            )
        else:  # mode == "academic"
            prompt = (
                f"Explain the following text in detail using scholarly tone and references where appropriate."
                f"Provide historical or contextual background if relevant. "
                f"Don't use text format (ex. *[text]*). "
                f"Keep it under 150 words. Include more technical details and examples if applicable.\n\nText: {msg}"
            )

        try:
            response = model.generate_content(prompt)
            answer = getattr(response, "text", "")
            return jsonify({"answer": answer})
        except Exception as err:
            return jsonify({"error": str(err)}), 500



if __name__ == "__main__":
    new_server.run(host="127.0.0.1", port=5000, debug=True)
