import sqlite3
import os

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(_REPO_ROOT, "pheatures.db")

def _connect():
    return sqlite3.connect(DB_PATH)

"""
01. GET PHONEME FEATURES
    PURPOSE:
    - given a phoneme id, return its full feature bundle as a dict

    PARAMS:
    - phoneme_id: the id of a phoneme

    RETURNS:
    - a dict: {"voice": "+", "nasal": "-", ...}, or {} if not found
"""
def get_phoneme_features(phoneme_id):
    con = _connect()
    rows = con.execute("""
        SELECT features.feature_name, phoneme_features.feature_value
        FROM phoneme_features
        JOIN features ON phoneme_features.feature_id = features.id
        WHERE phoneme_features.phoneme_id = ?
    """, (phoneme_id,)).fetchall()
    con.close()
    return {row[0]: row[1] for row in rows}


"""
02. GET ALL PHONEMES
    PURPOSE:
    - returns every phoneme in the database as a list of {id, symbol} dicts

    RETURNS:
    - a list of dicts: [{"id": 1, "symbol": "p"}, ...]
"""
def get_all_phonemes():
    con = _connect()
    rows = con.execute("SELECT id, phoneme_symbol FROM phonemes ORDER BY id").fetchall()
    con.close()
    return [{"id": row[0], "symbol": row[1]} for row in rows]


"""
03. FIND PHONEME BY FEATURES
    PURPOSE:
    - given a full feature bundle, find a phoneme in the DB whose features exactly match

    PARAMS:
    - bundle: a dict of feature/value pairs {"voice": "+", "nasal": "-", ...}

    RETURNS:
    - the phoneme symbol string if an exact match is found, or None
"""
def find_phoneme_by_features(bundle):
    con = _connect()
    rows = con.execute("SELECT id, phoneme_symbol FROM phonemes").fetchall()
    con.close()
    for phoneme_id, symbol in rows:
        if get_phoneme_features(phoneme_id) == bundle:
            return symbol
    return None


"""
04. GET ALL PHONEME BUNDLES
    PURPOSE:
    - returns every phoneme in the database with its symbol and full feature bundle, in one query

    RETURNS:
    - a dict: {phoneme_id: {"symbol": str, "bundle": {feature: value, ...}}, ...}
"""
def get_all_phoneme_bundles():
    con = _connect()
    phoneme_rows = con.execute("SELECT id, phoneme_symbol FROM phonemes ORDER BY id").fetchall()
    feature_rows = con.execute("""
        SELECT phoneme_features.phoneme_id, features.feature_name, phoneme_features.feature_value
        FROM phoneme_features
        JOIN features ON phoneme_features.feature_id = features.id
    """).fetchall()
    con.close()

    result = {pid: {"symbol": sym, "bundle": {}} for pid, sym in phoneme_rows}
    for phoneme_id, feature_name, feature_value in feature_rows:
        if phoneme_id in result:
            result[phoneme_id]["bundle"][feature_name] = feature_value
    return result
