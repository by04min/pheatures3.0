import sqlite3
import csv
import json
import os

# paths are built from this file's location, so they work from any folder
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT   = os.path.dirname(_BACKEND_DIR)
_DATA_DIR    = os.path.join(_REPO_ROOT, "data")
_SCHEMA_PATH = os.path.join(_BACKEND_DIR, "schema.sql")

from backend.logic.phoneme_funcs import DB_PATH

# the order matters: phoneme_features points at phonemes and features, so it is cleared first
_TABLES_TO_CLEAR = [
    "phoneme_features", "features", "phonemes",
    "contradictions", "dependencies", "diacritics",
]

def _create_schema(con):
    # creates any missing tables. safe to run repeatedly
    with open(_SCHEMA_PATH, "r") as f:
        con.executescript(f.read())
    con.commit()


def _is_seeded(con):
    # "already loaded" means the phonemes table has rows
    row = con.execute("SELECT COUNT(*) FROM phonemes").fetchone()
    return row[0] > 0


def _clear(con):
    # empties every table and restarts the id numbering, so ids come out the same every time
    for table in _TABLES_TO_CLEAR:
        con.execute(f"DELETE FROM {table}")
    con.execute("DELETE FROM sqlite_sequence")


def _create_bundle(text, delimiter=None):
    # "+consonantal; -tense"  ->  '{"consonantal": "+", "tense": "-"}'
    # pass delimiter=";" when one cell holds several features
    bundle = {}
    if delimiter:
        text = text.split(delimiter)
    for item in text:
        item = item.strip()
        if not item:
            continue
        bundle[item[1:].strip().lower()] = item[0]  # first character is the value (+, -, 0)
    return json.dumps(bundle)


def _parse_symbol(text):
    # some diacritics are written as unicode numbers (e.g. "810"); turn those into the real character
    try:
        return chr(int(text))
    except Exception:
        return text


def _seed(con):
    # loads every CSV into its table. the caller commits, so a failure leaves nothing half-loaded
    db = con.cursor()

    # sounds, features, and the answer for each pair (feature_table.csv)
    with open(os.path.join(_DATA_DIR, "feature_table.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    feature_names = [n.lower() for n in rows[0][1:]]  # first header cell is empty
    feature_ids = {}
    for name in feature_names:
        db.execute("INSERT OR IGNORE INTO features (feature_name) VALUES (?)", (name,))
        feature_ids[name] = db.execute("SELECT id FROM features WHERE feature_name = ?", (name,)).fetchone()[0]
    for row in rows[1:]:
        symbol = row[0]
        db.execute("INSERT OR IGNORE INTO phonemes (phoneme_symbol) VALUES (?)", (symbol,))
        phoneme_id = db.execute("SELECT id FROM phonemes WHERE phoneme_symbol = ?", (symbol,)).fetchone()[0]
        for idx, value in enumerate(row[1:]):
            db.execute(
                "INSERT OR IGNORE INTO phoneme_features (phoneme_id, feature_id, feature_value) VALUES (?, ?, ?)",
                (phoneme_id, feature_ids[feature_names[idx]], value),
            )

    # impossible feature combinations (contradictions.csv)
    with open(os.path.join(_DATA_DIR, "contradictions.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]  # skip the title row
    for row in rows:
        if row:
            db.execute("INSERT INTO contradictions (bundle) VALUES (?)", (_create_bundle(row),))

    # "if this, then that" rules (dependencies.csv)
    with open(os.path.join(_DATA_DIR, "dependencies.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]  # skip the header row
    for row in rows:
        if row:
            db.execute(
                "INSERT INTO dependencies (condition, consequence) VALUES (?, ?)",
                (_create_bundle(row[0], ";"), _create_bundle(row[1], ";")),
            )

    # diacritics: name, symbol, condition, consequence (diacritics.csv)
    with open(os.path.join(_DATA_DIR, "diacritics.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]  # skip the header row
    for row in rows:
        if row:
            db.execute(
                "INSERT INTO diacritics (diacritic_name, diacritic_symbol, condition, consequence) VALUES (?, ?, ?, ?)",
                (row[0].strip(), _parse_symbol(row[1].strip()),
                 _create_bundle(row[2].strip(), ";"), _create_bundle(row[3].strip(), ";")),
            )


def init_db():
    # runs at app startup. loads the CSVs only if the database is empty
    # (to pick up CSV edits later, use rebuild_db instead)
    con = sqlite3.connect(DB_PATH)
    try:
        _create_schema(con)
        if _is_seeded(con):
            print("init_db: database already seeded, skipping")
        else:
            _seed(con)
            con.commit()
            print("init_db: database seeded successfully")
    except Exception:
        con.rollback()  # undo a half-finished load, so the next startup starts clean
        raise
    finally:
        con.close()


def rebuild_db():
    # wipes the database and reloads it from the CSVs. run this after editing anything in data/
    # if a CSV is broken, the error is raised and the existing data is left untouched
    con = sqlite3.connect(DB_PATH)
    try:
        _create_schema(con)
        _clear(con)
        _seed(con)
        con.commit()
        print(f"rebuild_db: reloaded {DB_PATH}")
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


if __name__ == "__main__":
    # from the repo root:  python -m backend.init_db
    rebuild_db()
