# routes/phonemes.py
# GET  /api/phonemes          — returns every phoneme in the database as [{id, symbol}, ...]
# POST /api/phonemes/features — given a list of phoneme_ids, returns their feature bundles keyed by id

from flask import Blueprint, jsonify, request
from backend.logic.phoneme_funcs import get_all_phonemes, get_phoneme_features

phonemes_bp = Blueprint("phonemes", __name__)

@phonemes_bp.route("/phonemes")
def get_phonemes():
    return jsonify(get_all_phonemes())

@phonemes_bp.route("/phonemes/features", methods=["POST"])
def get_features_batch():
    body = request.get_json(silent=True) or {}
    phoneme_ids = body.get("phoneme_ids", [])
    return jsonify({pid: get_phoneme_features(pid) for pid in phoneme_ids})
