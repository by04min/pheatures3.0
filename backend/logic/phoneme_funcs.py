import sqlite3
import os

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(_REPO_ROOT, "pheatures.db")

def _connect():
    return sqlite3.connect(DB_PATH)

"""
01. QUERY SEGMENTS
    PURPOSE:
    - given some features, get all sounds from the database that having matching values for those features!

    PARAMS:
    - feature_list: a list of feature/value pairs
    - ex. [{"feature": "high", "value": "+"}, {"feature": "consonantal", "value": "-"}]

    RETURNS:
    - valid_sounds: a list of the ids of sounds that satisfy all feature/values in feature_list
    - ids come from the sqlite database, pheatures.db
"""
def query_segments(feature_list):
    con = _connect()
    db = con.cursor()

    valid_sounds = None

    # unpack feature/value pairs in the dictionary feature_list into ft, val
    for ft, val in feature_list.items():

        # get the corresponding feature id from the 'features' table in the database
        # since we know every feature is unique, fetchone() is more just for semantics
        ft_id = db.execute(
            "SELECT id FROM features WHERE feature_name = ?", (ft["feature"],)
        ).fetchone()

        # catch any features in feature_list that are somehow non-existing in the db!
        if not ft_id:
            continue

         # fetchone returns ft_id as a tuple! unpack it
        ft_id = ft_id[0]

        # find all phoneme (ids) from the 'phoneme_features' table that matches the current ft and its value
        sound_ids = db.execute(
            "SELECT phoneme_id FROM phoneme_features WHERE feature_id = ? AND feature_value = ?", (ft_id, val)
        ).fetchall()

        # in the very first iteration when valid_sounds is uninitialized, keep all sound ids
        if valid_sounds is None:

            # fetchall returns a list of tuples; unpack it!
            # i.e. sound_ids might look like [(2,), (5,), (8,), (13,)]
            valid_sounds = set(id[0] for id in sound_ids)

        # otherwise, find intersection of curr valid_sounds and sound_ids
        else:
            valid_sounds = valid_sounds & set(id[0] for id in sound_ids)

    con.close()

    if not valid_sounds:
        return []

    return list(valid_sounds)


"""
02. GET PHONEME
    PURPOSE:
    - given a phoneme id, return the actual symbol
    - this is what's used in the frontend to display those sounds!

    PARAMS:
    - phoeneme_id: the id of a phoneme, as stored in the database

    RETURNS:
    - symbol: the corresponding symbol of the id, or None if no corresponding symbol was found
"""
def get_phoneme(phoneme_id):
    con = _connect()
    symbol = con.execute(
        "SELECT phoneme_symbol FROM phonemes WHERE id = ?", (phoneme_id,)
    ).fetchone()
    con.close()
    # since fetchone returns a tuple, unpack it!
    return symbol[0] if symbol else None


"""
03. GET PHONEME FEATURES
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
04. GET ALL PHONEMES
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
05. FIND PHONEME BY FEATURES
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
06. GET ALL PHONEME BUNDLES
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
