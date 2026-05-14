# routes/diacritics.py
# GET  /api/diacritics                    — returns all diacritics as [{id, name, symbol}, ...]
# POST /api/diacritics/applicable-phonemes — given a diacritic_id, returns phoneme ids it can apply to

from flask import Blueprint, jsonify, request
from backend.logic.diacritic_funcs import get_all_diacritics, apply_diacritic
from backend.logic.phoneme_funcs import get_all_phonemes

diacritics_bp = Blueprint("diacritics", __name__)

@diacritics_bp.route("/diacritics")
def get_diacritics():
    return jsonify(get_all_diacritics())

@diacritics_bp.route("/diacritics/applicable-phonemes", methods=["POST"])
def applicable_phonemes():
    body = request.get_json(silent=True) or {}
    diacritic_id = body.get("diacritic_id")
    if not diacritic_id:
        return jsonify({"error": "diacritic_id required"}), 400

    # apply_diacritic returns None if the diacritic's conditions aren't met by that phoneme
    phonemes = get_all_phonemes()
    applicable_ids = [
        p["id"] for p in phonemes
        if apply_diacritic(p["id"], diacritic_id) is not None
    ]
    return jsonify({"phoneme_ids": applicable_ids})
