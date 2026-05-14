import sys, os

# routes/ lives at the repo root, one level above backend/
# adding the repo root to sys.path lets Python find it as a package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from routes.phonemes import phonemes_bp
from routes.diacritics import diacritics_bp

app = Flask(__name__)

# all API endpoints are grouped under /api
app.register_blueprint(phonemes_bp, url_prefix="/api")
app.register_blueprint(diacritics_bp, url_prefix="/api")

@app.route("/test")
def test():
    return {"message": "Flask is working!"}

if __name__ == "__main__":
    app.run(debug=True)