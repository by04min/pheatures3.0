from flask import Blueprint, jsonify, request
from backend.logic.diacritic_funcs import get_all_diacritics, apply_diacritic
from backend.logic.phoneme_funcs import get_all_phonemes

"""
01. DIACRITICS BLUEPRINT
    The server routes for diacritics, all under /api:
    - GET  /diacritics                     all diacritics
    - POST /diacritics/applicable-phonemes which sounds a diacritic can go on
    - POST /diacritics/apply               a sound's features once a diacritic is added
"""
diacritics_bp = Blueprint("diacritics", __name__)

"""
02. GET DIACRITICS
    Returns every diacritic as [{id, name, symbol}, ...]
"""
@diacritics_bp.route("/diacritics")
def get_diacritics():
    return jsonify(get_all_diacritics())

"""
03. APPLICABLE PHONEMES
    Given a diacritic_id, returns the ids of every sound it can be added to
"""
@diacritics_bp.route("/diacritics/applicable-phonemes", methods=["POST"])
def applicable_phonemes():
    body = request.get_json(silent=True) or {}
    diacritic_id = body.get("diacritic_id")
    if not diacritic_id:
        return jsonify({"error": "diacritic_id required"}), 400

    # A sound is left out if it doesn't meet the diacritic's conditions (apply_diacritic gives back None)
    phonemes = get_all_phonemes()
    applicable_ids = [
        p["id"] for p in phonemes
        if apply_diacritic(p["id"], diacritic_id) is not None
    ]
    return jsonify({"phoneme_ids": applicable_ids})

"""
04. APPLY DIACRITIC
    Given a phoneme_id and a diacritic_id, returns the sound's new feature bundle.
    Fails with 422 if the diacritic can't go on that sound.
"""
@diacritics_bp.route("/diacritics/apply", methods=["POST"])
def apply_diacritic_route():
    body = request.get_json(silent=True) or {}
    phoneme_id = body.get("phoneme_id")
    diacritic_id = body.get("diacritic_id")
    if not phoneme_id or not diacritic_id:
        return jsonify({"error": "phoneme_id and diacritic_id required"}), 400
    result = apply_diacritic(phoneme_id, diacritic_id)
    if result is None:
        return jsonify({"error": "cannot apply diacritic to this phoneme"}), 422
    return jsonify(result)
