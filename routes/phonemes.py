# routes/phonemes.py
# GET /api/phonemes — returns every phoneme in the database as [{id, symbol}, ...]

from flask import Blueprint, jsonify
from backend.logic.phoneme_funcs import get_all_phonemes

phonemes_bp = Blueprint("phonemes", __name__)

@phonemes_bp.route("/phonemes")
def get_phonemes():
    return jsonify(get_all_phonemes())
