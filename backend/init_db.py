import sqlite3
import csv
import json
import os

# absolute paths derived from this file's location so they resolve correctly
# regardless of the working directory (important for Render/gunicorn deployments)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT   = os.path.dirname(_BACKEND_DIR)
_DATA_DIR    = os.path.join(_REPO_ROOT, "data")        # shared CSV data at repo root
_SCHEMA_PATH = os.path.join(_BACKEND_DIR, "schema.sql")

from backend.logic.phoneme_funcs import DB_PATH


def _create_schema(con):
    # runs schema.sql to create all tables (CREATE TABLE IF NOT EXISTS, so safe to re-run)
    with open(_SCHEMA_PATH, "r") as f:
        con.executescript(f.read())
    con.commit()


def _is_seeded(con):
    # if the phonemes table has any rows, assume the full seed already ran
    row = con.execute("SELECT COUNT(*) FROM phonemes").fetchone()
    return row[0] > 0


def _create_bundle(text, delimiter=None):
    # converts a feature string like "+consonantal; -tense" into a JSON dict {"consonantal": "+", "tense": "-"}
    # delimiter is passed when multiple features are packed into one cell separated by ";"
    bundle = {}
    if delimiter:
        text = text.split(delimiter)
    for item in text:
        item = item.strip()
        if not item:
            continue
        bundle[item[1:].strip().lower()] = item[0]  # item[0] is the value (+/-/0), rest is feature name
    return json.dumps(bundle)


def _seed(con):
    db = con.cursor()

    # --- phonemes + features ---
    # feature_table.csv: first row is feature names, remaining rows are phoneme symbols + their feature values
    with open(os.path.join(_DATA_DIR, "feature_table.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    feature_names = [n.lower() for n in rows[0][1:]]  # skip the first (empty) header cell
    feature_ids = {}
    for name in feature_names:
        db.execute("INSERT OR IGNORE INTO features (feature_name) VALUES (?)", (name,))
        row = db.execute("SELECT id FROM features WHERE feature_name = ?", (name,)).fetchone()
        feature_ids[name] = row[0]
    for row in rows[1:]:
        symbol = row[0]
        db.execute("INSERT OR IGNORE INTO phonemes (phoneme_symbol) VALUES (?)", (symbol,))
        phoneme_id = db.execute("SELECT id FROM phonemes WHERE phoneme_symbol = ?", (symbol,)).fetchone()[0]
        for idx, value in enumerate(row[1:]):
            db.execute(
                "INSERT OR IGNORE INTO phoneme_features (phoneme_id, feature_id, feature_value) VALUES (?, ?, ?)",
                (phoneme_id, feature_ids[feature_names[idx]], value),
            )
    con.commit()

    # --- contradictions ---
    # each row is a set of features that cannot all be true simultaneously, stored as a JSON bundle
    with open(os.path.join(_DATA_DIR, "contradictions.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]  # skip header row
    for row in rows:
        if row:
            db.execute("INSERT INTO contradictions (bundle) VALUES (?)", (_create_bundle(row),))
    con.commit()

    # --- dependencies ---
    # each row is a condition → consequence pair (e.g. if +low then -high)
    # both columns may contain multiple features separated by ";"
    with open(os.path.join(_DATA_DIR, "dependencies.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]
    for row in rows:
        if row:
            db.execute(
                "INSERT INTO dependencies (condition, consequence) VALUES (?, ?)",
                (_create_bundle(row[0], ";"), _create_bundle(row[1], ";")),
            )
    con.commit()

    # --- diacritics ---
    # format: [name, symbol/unicode, condition features, consequence features]
    # symbols may be stored as unicode code points (integers) and need to be converted to characters
    def _parse_symbol(text):
        try:
            return chr(int(text))  # e.g. "810" → "̪"
        except Exception:
            return text  # already a character, use as-is

    with open(os.path.join(_DATA_DIR, "diacritics.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))[1:]
    for row in rows:
        if row:
            db.execute(
                "INSERT INTO diacritics (diacritic_name, diacritic_symbol, condition, consequence) VALUES (?, ?, ?, ?)",
                (row[0].strip(), _parse_symbol(row[1].strip()),
                 _create_bundle(row[2].strip(), ";"), _create_bundle(row[3].strip(), ";")),
            )
    con.commit()


def init_db():
    # called at app startup — creates tables and seeds data from CSVs if the DB is empty.
    # safe to call on every startup; skips seeding if data is already present.
    con = sqlite3.connect(DB_PATH)
    _create_schema(con)
    if not _is_seeded(con):
        _seed(con)
        print("init_db: database seeded successfully")
    else:
        print("init_db: database already seeded, skipping")
    con.close()
