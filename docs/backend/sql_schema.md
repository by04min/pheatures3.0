# SQL Schema

The database is a SQLite file (`pheatures.db`) defined in `backend/schema.sql`. It has four tables organized around two concerns: phoneme feature data, and the rules that govern how features interact.

---

## Tables

### `phonemes`
Stores every phoneme symbol in the system.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Auto-incrementing primary key |
| `phoneme_symbol` | `TEXT` | The IPA symbol (e.g. `"p"`, `"ɑ"`) — must be unique |

---

### `features`
Stores every possible phonological feature name.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Auto-incrementing primary key |
| `feature_name` | `TEXT` | The feature name (e.g. `"voice"`, `"nasal"`) — must be unique |

---

### `phoneme_features`
The join table that assigns a value to each (phoneme, feature) pair. This is where the actual feature bundles live.

| Column | Type | Description |
|---|---|---|
| `phoneme_id` | `INTEGER` | Foreign key → `phonemes.id` |
| `feature_id` | `INTEGER` | Foreign key → `features.id` |
| `feature_value` | `TEXT` | The value: `"+"`, `"-"`, or `"0"` |

The primary key is `(phoneme_id, feature_id)`, enforcing that each phoneme has exactly one value per feature.

To get the full feature bundle for a phoneme, join this table with `features` on `feature_id` and filter by `phoneme_id`.

---

### `contradictions`
Stores feature combinations that are phonologically impossible. Each row is a bundle of features that cannot co-occur.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Auto-incrementing primary key |
| `bundle` | `TEXT` | A JSON object of feature/value pairs that form a contradiction, e.g. `{"syllabic": "+", "consonantal": "+"}` |

Used by `no_contradictions()` in `backend/logic/contradiction_funcs.py` to validate feature bundles.

---

### `dependencies`
Stores implicational rules between features — if a certain condition holds, certain consequences must follow.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Auto-incrementing primary key |
| `condition` | `TEXT` | JSON object of features that trigger the rule, e.g. `{"low": "+"}` |
| `consequence` | `TEXT` | JSON object of features that must be set as a result, e.g. `{"high": "-"}` |

Used by `apply_dependencies()` in `backend/logic/dependency_funcs.py` to propagate cascading feature changes.

---

### `diacritics`
Stores diacritics and the rules governing when and how they apply to base phonemes.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER` | Auto-incrementing primary key |
| `diacritic_name` | `TEXT` | Human-readable name (e.g. `"syllabic"`) |
| `diacritic_symbol` | `TEXT` | The diacritic symbol itself |
| `condition` | `TEXT` | JSON object of features the base phoneme must have for the diacritic to be applicable |
| `consequence` | `TEXT` | JSON object of features that get changed when the diacritic is applied |

Used by `apply_diacritic()` in `backend/logic/diacritic_funcs.py`.

---

## Relationships

```
phonemes ──┐
           ├── phoneme_features ── features
           │
           └── (referenced by diacritics via condition/consequence logic)

contradictions   (standalone — checked against any feature bundle)
dependencies     (standalone — applied to any feature bundle after a change)
```
