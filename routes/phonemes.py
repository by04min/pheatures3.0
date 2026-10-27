from flask import Blueprint, jsonify, request
from backend.logic.phoneme_funcs import get_all_phonemes, get_phoneme_features, find_phoneme_by_features, get_all_phoneme_bundles
from backend.logic.dependency_funcs import apply_dependencies
from backend.logic.contradiction_funcs import no_contradictions
from backend.logic.diacritic_funcs import apply_diacritic_to_bundle, get_all_diacritic_rules

"""
01. PHONEMES BLUEPRINT
    The server routes for sounds and rules, all under /api:
    - GET  /phonemes            all sounds
    - POST /phonemes/features   the features of the sounds asked for
    - POST /phonemes/transform  applies a rule to the inventory
    - POST /rules/check         checks a rule for contradictions
"""
phonemes_bp = Blueprint("phonemes", __name__)

"""
02. GET PHONEMES
    Returns every sound in the database as [{id, symbol}, ...]
"""
@phonemes_bp.route("/phonemes")
def get_phonemes():
    return jsonify(get_all_phonemes())

"""
03. GET FEATURES BATCH
    Given a list of phoneme_ids, returns each sound's features, keyed by id
"""
@phonemes_bp.route("/phonemes/features", methods=["POST"])
def get_features_batch():
    body = request.get_json(silent=True) or {}
    phoneme_ids = body.get("phoneme_ids", [])
    return jsonify({pid: get_phoneme_features(pid) for pid in phoneme_ids})

"""
04. TRANSFORM PHONEMES
    Applies a rule (target features -> feature changes) to the sounds in the inventory

    RECEIVES:
    - phoneme_ids: the base sounds in the inventory
    - diacritic_items: sounds with diacritics, as [{key, phoneme_id, diacritic_id, symbol, bundle}]
      (the frontend may already have worked out the bundle)
    - target_features: which sounds the rule applies to, as {feature: value}
    - feature_changes: what the rule changes, as {feature: value}

    RETURNS:
    - for each sound, whether it matched, what it turned into, and whether the result is valid
"""
@phonemes_bp.route("/phonemes/transform", methods=["POST"])
def transform_phonemes():
    body = request.get_json(silent=True) or {}
    phoneme_ids = body.get("phoneme_ids", [])
    diacritic_items = body.get("diacritic_items", [])
    target_features = body.get("target_features", {})
    feature_changes = body.get("feature_changes", {})

    # Features of every inventory sound, looked up once so matching is fast
    inventory_bundles = {pid: get_phoneme_features(pid) for pid in phoneme_ids}
    # Every diacritic rule, loaded once for matching in memory
    diacritic_rules = get_all_diacritic_rules()
    # Every sound in the database, used as a backup when the result isn't in the user's inventory
    all_db_bundles = get_all_phoneme_bundles()

    # Adds a diacritic to a sound's features, or gives back None if the sound doesn't meet its conditions
    def _apply_rule(bundle, rule):
        for feature, value in rule["condition"].items():
            if bundle.get(feature) != value:
                return None
        updated = dict(bundle)
        for feature, value in rule["consequence"].items():
            updated[feature] = value
        return updated

    def find_in_inventory(bundle):
        # Finds the IPA symbol for a set of features, or None if no symbol fits (the page then shows ?).
        # Looks in the user's inventory first, then in the whole IPA database.
        # Exact match among the user's base sounds
        for inv_pid, inv_bundle in inventory_bundles.items():
            if inv_bundle == bundle:
                return find_phoneme_by_features(inv_bundle)
        # Sounds with diacritics that the frontend already worked out
        for item in diacritic_items:
            if item.get("bundle") == bundle:
                return item["symbol"]
        # Every diacritic added to every inventory sound
        for rule in diacritic_rules:
            for inv_pid, inv_bundle in inventory_bundles.items():
                applied = _apply_rule(inv_bundle, rule)
                if applied == bundle:
                    base_symbol = find_phoneme_by_features(inv_bundle)
                    if base_symbol:
                        return f"{base_symbol}{rule['symbol']}"
        # Backup: any IPA sound (not in the inventory, but still a real sound)
        base_match = find_phoneme_by_features(bundle)
        if base_match:
            return base_match
        # Backup: every diacritic added to every IPA sound
        for rule in diacritic_rules:
            for pid, entry in all_db_bundles.items():
                applied = _apply_rule(entry["bundle"], rule)
                if applied == bundle:
                    return f"{entry['symbol']}{rule['symbol']}"
        # No symbol fits these features
        return None

    # Builds the answer for one sound: what it turned into, and whether that result is valid
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

    # Sounds with diacritics: change the base sound, then add the diacritic back if it still fits
    for item in diacritic_items:
        bundle = item.get("bundle")
        key = item["key"]
        phoneme_id = item["phoneme_id"]
        diacritic_id = item["diacritic_id"]
        original_symbol = item["symbol"]
        if not bundle:
            # The frontend didn't send the features, so work them out from the base sound + diacritic
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

        # Step 1: apply the changes to the base sound (not the one with the diacritic)
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

        # Step 2: try adding the diacritic back to the changed sound
        diacritic_result = apply_diacritic_to_bundle(updated_base, diacritic_id)
        # Keep the diacritic only if it doesn't undo the rule's changes; otherwise the rule wins and the diacritic is dropped
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

"""
05. CHECK RULE
    Checks a rule's target features and feature changes for contradictions (no inventory needed)
"""
@phonemes_bp.route("/rules/check", methods=["POST"])
def check_rule():
    body = request.get_json(silent=True) or {}
    target_features = body.get("target_features", {})
    feature_changes = body.get("feature_changes", {})

    _, target_violations  = no_contradictions(target_features)  if target_features  else (True, [])
    _, change_violations  = no_contradictions(feature_changes)  if feature_changes  else (True, [])

    return jsonify({
        "target_contradictions": target_violations,
        "change_contradictions": change_violations,
    })
