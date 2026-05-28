# routes/phonemes.py
# GET  /api/phonemes           — returns every phoneme in the database as [{id, symbol}, ...]
# POST /api/phonemes/features  — given a list of phoneme_ids, returns their feature bundles keyed by id
# POST /api/phonemes/transform — applies a phonological rule to matching inventory phonemes

from flask import Blueprint, jsonify, request
from backend.logic.phoneme_funcs import get_all_phonemes, get_phoneme_features, find_phoneme_by_features
from backend.logic.dependency_funcs import apply_dependencies
from backend.logic.contradiction_funcs import no_contradictions

phonemes_bp = Blueprint("phonemes", __name__)

@phonemes_bp.route("/phonemes")
def get_phonemes():
    return jsonify(get_all_phonemes())

@phonemes_bp.route("/phonemes/features", methods=["POST"])
def get_features_batch():
    body = request.get_json(silent=True) or {}
    phoneme_ids = body.get("phoneme_ids", [])
    return jsonify({pid: get_phoneme_features(pid) for pid in phoneme_ids})

@phonemes_bp.route("/phonemes/transform", methods=["POST"])
def transform_phonemes():
    body = request.get_json(silent=True) or {}
    phoneme_ids = body.get("phoneme_ids", [])
    target_features = body.get("target_features", {})   # {feature: value}
    feature_changes = body.get("feature_changes", {})   # {feature: value}

    # pre-fetch all inventory bundles so result lookup is scoped to the inventory, not the full DB
    inventory_bundles = {pid: get_phoneme_features(pid) for pid in phoneme_ids}

    def find_in_inventory(bundle):
        """Return the symbol of the inventory phoneme whose bundle exactly matches, or None."""
        for inv_pid, inv_bundle in inventory_bundles.items():
            if inv_bundle == bundle:
                return find_phoneme_by_features(inv_bundle)
        return None

    results = {}
    for pid in phoneme_ids:
        bundle = inventory_bundles.get(pid)
        if not bundle:
            continue

        # check if this phoneme matches all target features
        if not all(bundle.get(f) == v for f, v in target_features.items()):
            results[str(pid)] = {"matched": False}
            continue

        original_symbol = find_phoneme_by_features(bundle)

        # if no feature changes, just report the match with no transformation
        if not feature_changes:
            results[str(pid)] = {
                "matched": True,
                "transformed": False,
                "original_symbol": original_symbol,
                "result_bundle": bundle,
                "result_symbol": original_symbol,
                "valid": True,
            }
            continue

        # apply feature changes and propagate dependencies
        updated = dict(bundle)
        for feature, value in feature_changes.items():
            updated[feature] = value
            updated = apply_dependencies(updated, {feature: value})

        # check for contradictions
        valid, _ = no_contradictions(updated)

        # result must exist within the current inventory, not just anywhere in the DB
        result_symbol = find_in_inventory(updated) if valid else None

        results[str(pid)] = {
            "matched": True,
            "transformed": True,
            "original_symbol": original_symbol,
            "result_bundle": updated,
            "result_symbol": result_symbol,
            "valid": valid,
        }

    return jsonify(results)
