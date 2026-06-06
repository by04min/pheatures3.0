# routes/phonemes.py
# GET  /api/phonemes           — returns every phoneme in the database as [{id, symbol}, ...]
# POST /api/phonemes/features  — given a list of phoneme_ids, returns their feature bundles keyed by id
# POST /api/phonemes/transform — applies a phonological rule to matching inventory phonemes

from flask import Blueprint, jsonify, request
from backend.logic.phoneme_funcs import get_all_phonemes, get_phoneme_features, find_phoneme_by_features, get_all_phoneme_bundles
from backend.logic.dependency_funcs import apply_dependencies
from backend.logic.contradiction_funcs import no_contradictions
from backend.logic.diacritic_funcs import apply_diacritic_to_bundle, get_all_diacritic_rules

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
    # [{key, phoneme_id, diacritic_id, symbol, bundle}] — pre-computed diacritic bundles from frontend
    diacritic_items = body.get("diacritic_items", [])
    target_features = body.get("target_features", {})   # {feature: value}
    feature_changes = body.get("feature_changes", {})   # {feature: value}

    # pre-fetch all inventory bundles for fast in-inventory matching
    inventory_bundles = {pid: get_phoneme_features(pid) for pid in phoneme_ids}
    # all diacritic rules loaded once for in-memory matching
    diacritic_rules = get_all_diacritic_rules()
    # full DB phoneme bundles — used as fallback when the result isn't in the user's inventory
    all_db_bundles = get_all_phoneme_bundles()

    def _apply_rule(bundle, rule):
        for feature, value in rule["condition"].items():
            if bundle.get(feature) != value:
                return None
        updated = dict(bundle)
        for feature, value in rule["consequence"].items():
            updated[feature] = value
        return updated

    def find_in_inventory(bundle):
        """Return the IPA symbol for a result bundle, or None if it has no IPA spelling.
        Searches the user's inventory first (fast path), then falls back to the full IPA
        database. None is only returned when no base symbol or base+diacritic combination
        anywhere in the IPA corresponds to this feature matrix — that is when ? is shown."""
        # fast path: exact match in the user's selected base phonemes
        for inv_pid, inv_bundle in inventory_bundles.items():
            if inv_bundle == bundle:
                return find_phoneme_by_features(inv_bundle)
        # fast path: pre-computed diacritic combinations the frontend sent
        for item in diacritic_items:
            if item.get("bundle") == bundle:
                return item["symbol"]
        # fast path: every diacritic applied to every inventory base phoneme
        for rule in diacritic_rules:
            for inv_pid, inv_bundle in inventory_bundles.items():
                applied = _apply_rule(inv_bundle, rule)
                if applied == bundle:
                    base_symbol = find_phoneme_by_features(inv_bundle)
                    if base_symbol:
                        return f"{base_symbol}{rule['symbol']}"
        # fallback: search all IPA base phonemes (result not in inventory but still a real sound)
        base_match = find_phoneme_by_features(bundle)
        if base_match:
            return base_match
        # fallback: every diacritic applied to every IPA base phoneme
        for rule in diacritic_rules:
            for pid, entry in all_db_bundles.items():
                applied = _apply_rule(entry["bundle"], rule)
                if applied == bundle:
                    return f"{entry['symbol']}{rule['symbol']}"
        # genuinely unspellable feature matrix — caller will show ?
        return None

    def _make_result(key, bundle, original_symbol):
        if not feature_changes:
            return {
                "matched": True,
                "transformed": False,
                "original_symbol": original_symbol,
                "result_bundle": bundle,
                "result_symbol": original_symbol,
                "valid": True,
            }
        updated = dict(bundle)
        for feature, value in feature_changes.items():
            updated[feature] = value
            updated = apply_dependencies(updated, {feature: value})
        valid, _ = no_contradictions(updated)
        result_symbol = find_in_inventory(updated) if valid else None
        return {
            "matched": True,
            "transformed": True,
            "original_symbol": original_symbol,
            "result_bundle": updated,
            "result_symbol": result_symbol,
            "valid": valid,
        }

    results = {}

    for pid in phoneme_ids:
        bundle = inventory_bundles.get(pid)
        if not bundle:
            continue
        if not all(bundle.get(f) == v for f, v in target_features.items()):
            results[str(pid)] = {"matched": False}
            continue
        results[str(pid)] = _make_result(str(pid), bundle, find_phoneme_by_features(bundle))

    # process diacritic items: apply change to base, then re-apply the diacritic if it still fits
    for item in diacritic_items:
        bundle = item.get("bundle")
        key = item["key"]
        phoneme_id = item["phoneme_id"]
        diacritic_id = item["diacritic_id"]
        original_symbol = item["symbol"]
        if not bundle:
            # bundle not pre-loaded by frontend — compute it now from base + diacritic
            base = inventory_bundles.get(phoneme_id)
            if not base:
                continue
            bundle = apply_diacritic_to_bundle(base, diacritic_id)
            if bundle is None:
                continue
        if not all(bundle.get(f) == v for f, v in target_features.items()):
            results[key] = {"matched": False}
            continue
        if not feature_changes:
            results[key] = {
                "matched": True, "transformed": False,
                "original_symbol": original_symbol, "result_bundle": bundle,
                "result_symbol": original_symbol, "valid": True,
            }
            continue

        # step 1: apply feature change to the base phoneme (not the diacritic bundle)
        base_bundle = inventory_bundles.get(phoneme_id)
        if not base_bundle:
            continue
        updated_base = dict(base_bundle)
        for feature, value in feature_changes.items():
            updated_base[feature] = value
            updated_base = apply_dependencies(updated_base, {feature: value})
        valid, _ = no_contradictions(updated_base)
        if not valid:
            results[key] = {
                "matched": True, "transformed": True,
                "original_symbol": original_symbol, "result_bundle": updated_base,
                "result_symbol": None, "valid": False,
            }
            continue

        # step 2: try to re-apply the diacritic to the transformed base
        diacritic_result = apply_diacritic_to_bundle(updated_base, diacritic_id)
        # only use the diacritic result if it doesn't conflict with the requested feature changes
        # (e.g. if +long was the change and the diacritic sets long=+, the change wins → drop it)
        if diacritic_result is not None and all(
            diacritic_result.get(f) == v for f, v in feature_changes.items()
        ):
            result_bundle = diacritic_result
        else:
            result_bundle = updated_base

        results[key] = {
            "matched": True, "transformed": True,
            "original_symbol": original_symbol,
            "result_bundle": result_bundle,
            "result_symbol": find_in_inventory(result_bundle),
            "valid": True,
        }

    return jsonify(results)

@phonemes_bp.route("/rules/check", methods=["POST"])
def check_rule():
    """Check a rule spec for contradictions without needing an inventory."""
    body = request.get_json(silent=True) or {}
    target_features = body.get("target_features", {})
    feature_changes = body.get("feature_changes", {})

    _, target_violations  = no_contradictions(target_features)  if target_features  else (True, [])
    _, change_violations  = no_contradictions(feature_changes)  if feature_changes  else (True, [])

    return jsonify({
        "target_contradictions": target_violations,
        "change_contradictions": change_violations,
    })
