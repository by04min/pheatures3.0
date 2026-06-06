# Logic Functions

The `backend/logic/` folder contains four modules, each responsible for one area of phonological computation. These functions are called by the route handlers — they don't know anything about HTTP, they just take Python dicts in and return Python dicts (or lists) out.

---

## `phoneme_funcs.py`

Core lookups for phonemes and their feature bundles.

| Function | Purpose |
|---|---|
| `get_all_phonemes()` | Returns every phoneme as a list of `{"id", "symbol"}` dicts |
| `get_phoneme(phoneme_id)` | Returns the symbol string for a given id, or `None` |
| `get_phoneme_features(phoneme_id)` | Returns the full feature bundle for a phoneme as `{"voice": "+", "nasal": "-", ...}` |
| `find_phoneme_by_features(bundle)` | Searches all phonemes and returns the symbol whose feature bundle exactly matches `bundle`, or `None` |
| `get_all_phoneme_bundles()` | Returns every phoneme in the DB as `{phoneme_id: {"symbol": str, "bundle": dict}}` in a single query — used during rule application to check if a result maps to any IPA symbol |
| `query_segments(feature_list)` | Given a list of `{"feature", "value"}` dicts, returns the ids of all phonemes that satisfy every condition |

Most other logic modules depend on `get_phoneme_features` from this file.

---

## `dependency_funcs.py`

Propagates cascading feature changes based on implicational rules stored in the `dependencies` table.

| Function | Purpose |
|---|---|
| `apply_dependencies(feature_bundle, changed_feature)` | Given a full feature bundle and the single feature that just changed, applies all matching dependency rules and returns the updated bundle |

**How it works:**
The function runs two passes over all dependency rules:
1. **Pass 1** — applies only rules whose condition includes the changed feature, and where all conditions match the current bundle. This handles the direct consequence of the change.
2. **Pass 2** — re-runs all rules on the updated bundle to catch anything that cascaded from pass 1.

**Example:**
```python
bundle = {"high": "+", "low": "-", "voice": "+"}
changed = {"low": "+"}
result = apply_dependencies(bundle, changed)
# if the DB has a rule: low:+ → high:-, then result["high"] == "-"
```

---

## `contradiction_funcs.py`

Validates that a feature bundle doesn't contain any impossible feature combinations.

| Function | Purpose |
|---|---|
| `no_contradictions(feature_bundle)` | Checks the bundle against all contradiction rules in the DB |

**Returns:** a tuple `(bool, list)`
- `(True, [])` — no contradictions found, the bundle is valid
- `(False, [rule1, rule2, ...])` — one or more contradiction rules were violated

**Example:**
```python
valid, violations = no_contradictions({"syllabic": "+", "consonantal": "+"})
# if that combination is a stored contradiction: valid == False
```

---

## `diacritic_funcs.py`

Handles applying diacritics to base phonemes.

| Function | Purpose |
|---|---|
| `apply_diacritic(base_sound, diacritic)` | Checks if a diacritic can be applied to a phoneme (by ID) and returns the modified feature bundle, or `None` if incompatible |
| `apply_diacritic_to_bundle(bundle, diacritic)` | Same as `apply_diacritic`, but takes a pre-computed feature bundle instead of a phoneme ID |
| `get_all_diacritic_rules()` | Returns all diacritics with their `condition` and `consequence` — used for in-memory matching during rule application |
| `get_all_diacritics()` | Returns every diacritic as a list of `{"id", "name", "symbol", "condition"}` dicts — used to populate the UI |

**How `apply_diacritic` works:**
1. Fetches the diacritic's `condition` and `consequence` from the DB
2. Gets the base phoneme's feature bundle via `get_phoneme_features`
3. Checks that every feature in `condition` matches the bundle — if not, returns `None`
4. Applies every feature in `consequence` to a copy of the bundle and returns the result

**Example:**
```python
result = apply_diacritic(phoneme_id=5, diacritic=3)
# None  → diacritic conditions not met by this phoneme
# {...} → new feature bundle with diacritic applied
```

**`apply_diacritic_to_bundle`** is used during rule application (`POST /phonemes/transform`). After a phonological rule mutates a base phoneme's features, there's no DB entry to look up anymore — only the modified in-memory bundle. This function lets the route re-apply the original diacritic to that bundle to check whether the diacritized form still holds (e.g. if /p/ → /b/ under a rule, does /pː/ → /bː/?).

**`get_all_diacritic_rules`** is fetched once per transform request and held in memory. The route uses it to reverse-look up result symbols: for each inventory phoneme, it tries applying every diacritic to see if the result matches the transformation output. This is how the route can return a symbol like /bː/ even if only /b/ and /pː/ are in the user's inventory.

---

## Testing Scripts (`backend/testing/`)

Each logic module has a corresponding test file. These are plain Python scripts using `assert` statements — no test framework required.

| File | Tests |
|---|---|
| `phoneme_tests.py` | `query_segments`, `get_phoneme` |
| `dependency_tests.py` | `apply_dependencies` |
| `contradiction_tests.py` | `no_contradictions` |
| `diacritic_tests.py` | `apply_diacritic` |

### Running the tests

Make sure the virtual environment is active and you are in the `backend/` folder.

```bash
cd backend
source venv/bin/activate
```

Run an individual test file with pytest:

```bash
pytest testing/phoneme_tests.py
pytest testing/dependency_tests.py
pytest testing/contradiction_tests.py
pytest testing/diacritic_tests.py
```

Or run all tests at once:

```bash
pytest testing/
```

### Writing a new test

Each test is a function named `test_*`. Add assertions for the expected output:

```python
from logic.phoneme_funcs import get_phoneme

def test_get_phoneme():
    assert get_phoneme(1) == "p"
    assert get_phoneme(99999) is None  # invalid id returns None
```

pytest picks up any function whose name starts with `test_` automatically.
