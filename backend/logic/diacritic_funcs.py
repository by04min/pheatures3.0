import sqlite3
import json
from backend.logic.phoneme_funcs import get_phoneme_features, DB_PATH

def _connect():
    return sqlite3.connect(DB_PATH)

"""
01. APPLY DIACRITIC
    PURPOSE:
    - given a sound and a diacritic, checks if the diacritic can be applied to that sound, and returns the updated feature bundle

    PARAMS:
    - base_sound: the id of a selected phoneme
    - diacritic: the id of a selected diacritic

    RETURNS:
    - None: not a valid diacritic application
    - updated_features = the new features of the base sound as a result of applying the diacritic
"""
def apply_diacritic(base_sound, diacritic):
    con = _connect()
    result = con.execute(
        "SELECT condition, consequence FROM diacritics WHERE id = ?", (diacritic,)
    ).fetchone()
    con.close()

    if not result:
        return None

    # unpack tuples, convert from JSON to python dictionary
    condition = json.loads(result[0])
    consequence = json.loads(result[1])

    bs_dict = get_phoneme_features(base_sound)

    # check whether base sound meets all conditions
    for feature, value in condition.items():
        if bs_dict.get(feature) != value:
            return None

    # apply the consequence by updating the base sound's features
    updated_features = dict(bs_dict)
    # items() gives you key-value pairs in a dictionary as a list of tuples
    for feature, value in consequence.items():
        updated_features[feature] = value

    return updated_features

"""
01b. APPLY DIACRITIC TO BUNDLE
    Like apply_diacritic, but accepts a pre-computed feature bundle instead of a phoneme ID.
    Used during rule application to re-apply a diacritic after transforming the base phoneme.

    RETURNS:
    - None: diacritic conditions not met by the bundle
    - updated bundle with consequence applied
"""
def apply_diacritic_to_bundle(bundle, diacritic):
    con = _connect()
    result = con.execute(
        "SELECT condition, consequence FROM diacritics WHERE id = ?", (diacritic,)
    ).fetchone()
    con.close()

    if not result:
        return None

    condition = json.loads(result[0])
    consequence = json.loads(result[1])

    for feature, value in condition.items():
        if bundle.get(feature) != value:
            return None

    updated = dict(bundle)
    for feature, value in consequence.items():
        updated[feature] = value

    return updated

"""
02. GET ALL DIACRITIC RULES
    Returns every diacritic with id, symbol, condition, and consequence.
    Used for in-memory matching when searching for a result bundle.
"""
def get_all_diacritic_rules():
    con = _connect()
    rows = con.execute(
        "SELECT id, diacritic_symbol, condition, consequence FROM diacritics ORDER BY id"
    ).fetchall()
    con.close()
    return [
        {
            "id": row[0],
            "symbol": row[1],
            "condition": json.loads(row[2]),
            "consequence": json.loads(row[3]),
        }
        for row in rows
    ]

"""
03. GET ALL DIACRITICS
    PURPOSE:
    - returns every diacritic in the database as a list of {id, name, symbol} dicts

    RETURNS:
    - a list of dicts: [{"id": 1, "name": "syllabic", "symbol": "e̩"}, ...]
"""
def get_all_diacritics():
    con = _connect()
    rows = con.execute(
        "SELECT id, diacritic_name, diacritic_symbol, condition FROM diacritics ORDER BY id"
    ).fetchall()
    con.close()
    return [{"id": row[0], "name": row[1], "symbol": row[2], "condition": json.loads(row[3])} for row in rows]
