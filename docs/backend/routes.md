# API Routes

All routes are registered under the `/api` prefix. The Flask app (`backend/app.py`) uses two blueprints: `phonemes_bp` (`routes/phonemes.py`) and `diacritics_bp` (`routes/diacritics.py`).

---

## Phoneme Routes (`routes/phonemes.py`)

### `GET /api/phonemes`
Returns every phoneme in the database.

**Response:**
```json
[
  { "id": 1, "symbol": "p" },
  { "id": 2, "symbol": "b" },
  ...
]
```

---

### `POST /api/phonemes/features`
Returns the full feature bundle for each requested phoneme id, keyed by id.

**Request body:**
```json
{ "phoneme_ids": [1, 5, 12] }
```

**Response:**
```json
{
  "1": { "voice": "-", "nasal": "-", ... },
  "5": { "voice": "+", "nasal": "+", ... }
}
```

---

### `POST /api/phonemes/transform`
Applies a phonological rule to a set of inventory phonemes. Phonemes that match the target features are transformed by the feature changes; the result is looked up within the inventory (not the full database) to find a valid resulting symbol.

**Request body:**
```json
{
  "phoneme_ids": [1, 5, 12],
  "target_features": { "voice": "+" },
  "feature_changes": { "voice": "-" }
}
```

- `target_features` — which phonemes to apply the rule to. An empty object matches all phonemes.
- `feature_changes` — what to change on matching phonemes. An empty object returns matches with no transformation.

**Response:**
```json
{
  "1": { "matched": false },
  "5": {
    "matched": true,
    "transformed": true,
    "original_symbol": "b",
    "result_bundle": { "voice": "-", ... },
    "result_symbol": "p",
    "valid": true
  }
}
```

- `result_symbol` is `null` if the resulting bundle doesn't match any phoneme in the inventory, or if the bundle contains a contradiction.
- `transformed: false` means the phoneme matched the target but no feature changes were applied.

---

## Diacritic Routes (`routes/diacritics.py`)

### `GET /api/diacritics`
Returns every diacritic in the database.

**Response:**
```json
[
  { "id": 1, "name": "syllabic", "symbol": "...", "condition": { "consonantal": "-" } },
  ...
]
```

---

### `POST /api/diacritics/applicable-phonemes`
Given a diacritic id, returns the ids of all phonemes it can legally apply to. Used to highlight valid drop targets when dragging a diacritic in the inventory UI.

**Request body:**
```json
{ "diacritic_id": 3 }
```

**Response:**
```json
{ "phoneme_ids": [2, 7, 14, ...] }
```

---

### `POST /api/diacritics/apply`
Applies a diacritic to a base phoneme and returns the resulting feature bundle. Returns a `422` if the diacritic's conditions are not met by the phoneme.

**Request body:**
```json
{ "phoneme_id": 5, "diacritic_id": 3 }
```

**Response (success):**
```json
{ "voice": "+", "nasal": "-", "syllabic": "+", ... }
```

**Response (failure):**
```json
{ "error": "cannot apply diacritic to this phoneme" }
```

---

## Test Endpoint

### `GET /test`
Returns a simple confirmation that Flask is running.

```json
{ "message": "Flask is working!" }
```
