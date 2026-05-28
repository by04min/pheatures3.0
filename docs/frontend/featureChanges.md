# Feature Changes

The Feature Changes system lets you define phonological rules that filter and transform phonemes in your inventory. It lives on the Pheatures page and is made up of three layers: the UI panel, the page-level state and fetch logic, and the backend endpoint.

---

## How It Works (Overview)

1. The user fills in **Target Features** (which phonemes to select) and/or **Feature Changes** (what to apply to them) in the Rule Panel.
2. The page sends those rules to the backend, which checks each inventory phoneme against the targets and applies the changes.
3. The Sheet and Table views update to show only the matched phonemes, with arrow labels (`b → p`, or `b → ?`) when a transformation is active.

---

## Frontend

### `src/pheatures/RulePanel.jsx`

The Rule Panel renders two columns side by side (stacks vertically on small screens).

Each column contains:
- A **label** and a **"clear" button** on the same line (`justify-between`)
- A list of **rows**, each with:
  - A small **value select** (`+`, `-`, `0`)
  - A wider **feature select** (populated from `FEATURE_NAMES`)
- A **"+" button** at the bottom to add another row

The parent (`pheatures.jsx`) owns all row state. `RulePanel` only fires `onTargetChange` and `onChangesChange` callbacks — it holds no state of its own.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `targetRows` | `{value, feature}[]` | Current rows for the Target Features column |
| `featureChangeRows` | `{value, feature}[]` | Current rows for the Feature Changes column |
| `onTargetChange` | `fn(rows)` | Called whenever Target Features rows change |
| `onChangesChange` | `fn(rows)` | Called whenever Feature Changes rows change |
| `validation` | `object` | Validation results from `pheatures.jsx` — see below |

**`validation` shape:**

| Key | Type | Description |
|---|---|---|
| `targetContradictions` | `{feature: value}[]` | Violated contradiction rules in the target spec |
| `changeContradictions` | `{feature: value}[]` | Violated contradiction rules in the change spec |
| `redundantTarget` | `boolean` | True when a target feature can be removed without changing the matched set |
| `redundantChanges` | `boolean` | True when a change feature is already satisfied by every matched phoneme |

Errors and warnings are shown in a two-column region above the input rows, each column aligned with its respective feature column. The region is only rendered when at least one issue is present.

Each row's feature dropdown excludes features already selected in sibling rows within the same column, preventing same-feature conflicts at the input level.

---

### `src/pheatures/pheatures.jsx`

The Pheatures page manages all state and coordinates between the Rule Panel and the Sheet/Table views.

**State:**

| State | Description |
|---|---|
| `targetRows` | Rows from the Target Features column (starts with one empty row) |
| `changeRows` | Rows from the Feature Changes column (starts with one empty row) |
| `transforms` | Result from `/api/phonemes/transform`, keyed by phoneme id string |
| `baseFeatures` | Feature bundles for each base phoneme in the inventory |
| `diacriticFeatures` | Feature bundles for diacritic+phoneme pairs |
| `contradictions` | Result from `/api/rules/check` — `{ target_contradictions, change_contradictions }` |

**Transform `useEffect`**

Fires whenever `targetRows`, `changeRows`, or `inventory` changes. It:

1. Filters each column's rows to only those with both a value and a feature selected
2. Clears `transforms` if both columns are completely empty, then returns early
3. Otherwise calls `POST /api/phonemes/transform` with the current inventory's phoneme ids, the target features, and the feature changes
4. Saves the result to `transforms`

Note: either column alone is enough to trigger the call — target features alone filters the inventory; feature changes alone applies to every phoneme.

**`visibleInventory`**

Computed inline each render (not memoized, to stay in sync):

```js
const rulesActive = Object.keys(transforms).length > 0
const visibleInventory = rulesActive
  ? inventory.filter((item) => transforms[String(item.phoneme_id)]?.matched)
  : inventory
```

When rules are active, only matched phonemes are passed to the views. Clearing both columns resets to the full inventory.

**`resolveFeatures(item)`**

Returns the feature bundle for a given inventory item. When a transform is active and matched, returns the transformed `result_bundle` instead of the original.

**Contradiction check `useEffect`**

Fires whenever `targetRows` or `changeRows` change. Calls `POST /api/rules/check` with the current (non-empty) target and change specs. Saves the result to `contradictions`. Clears immediately when both columns are empty.

**Minimality memos (`useMemo`)**

Two memos derived from already-loaded feature bundles — no extra network calls:

- `redundantTarget` — calls `hasRedundantTargetFeatures()` from `ruleValidation.js`. True when any target feature can be dropped without changing which phonemes are matched (strict redundancy), or when dropping it widens the class but every newly included phoneme already satisfies the change spec ("fire-and-rain").
- `redundantChanges` — calls `hasRedundantChangeFeatures()` from `ruleValidation.js`. True when any change feature is already at the target value on every matched phoneme.

---

### `src/pheatures/ruleValidation.js`

Pure utility functions for frontend minimality checks. No API calls — all checks use `baseFeatures` and `diacriticFeatures` already loaded in `pheatures.jsx`.

| Function | Description |
|---|---|
| `hasRedundantTargetFeatures(targetRows, changeRows, inventory, baseFeatures, diacriticFeatures)` | Returns `true` if any target feature is redundant (strict or fire-and-rain) |
| `hasRedundantChangeFeatures(changeRows, targetRows, inventory, baseFeatures, diacriticFeatures)` | Returns `true` if any change feature is already satisfied by every matched phoneme |

**Strict redundancy:** removing feature `f` from the target selects exactly the same phonemes as before — `f` didn't narrow the class at all.

**Fire-and-rain redundancy:** removing `f` widens the class, but every newly included phoneme already satisfies the entire change spec. The rule would be a no-op on those extras, so `f` is unnecessary. Example: target `[+voice]` with change `[-voice]` — dropping `+voice` adds all already-voiceless phonemes, which are already at the `-voice` target.

---

## Error and Warning Display

### `src/components/errorMsg.jsx`

Two new exported components handle rule validation feedback:

**`RuleContradictionError({ violations, title })`**

Shown when a feature spec violates a phonological contradiction rule from the database. `violations` is the array returned by `/api/rules/check`. `title` defaults to `'Contradictory feature combination'`. Displays each violated rule as a row of `FeatureValueBadge` + feature name pairs. Returns `null` when `violations` is empty.

**`RuleNonMinimalWarning({ message })`**

Shown when a rule spec is non-minimal. `message` is a plain string (e.g. `'Target features are non-minimal'`). Returns `null` when `message` is falsy.

---

## Backend

### Route: `POST /api/phonemes/transform`

Defined in `routes/phonemes.py`.

**Request body:**
```json
{
  "phoneme_ids": [1, 5, 12],
  "target_features": { "voice": "+", "nasal": "-" },
  "feature_changes": { "voice": "-" }
}
```

**Logic per phoneme:**

1. Fetch the phoneme's full feature bundle using `get_phoneme_features(pid)` (`backend/logic/phoneme_funcs.py`)
2. Check if the bundle matches **all** target features — if not, return `{ matched: false }`
3. If `feature_changes` is empty, return the match as-is with `transformed: false`
4. Apply each feature change to the bundle, then call `apply_dependencies()` (`backend/logic/dependency_funcs.py`) for each changed feature to propagate cascading consequences
5. Check `no_contradictions()` (`backend/logic/contradiction_funcs.py`) on the updated bundle
6. If valid, look up the resulting bundle against the **inventory only** (not the full database) to find a matching phoneme symbol — returns `null` if no inventory phoneme matches (shown as `?` in the UI)

**Response:**
```json
{
  "1": {
    "matched": true,
    "transformed": true,
    "original_symbol": "b",
    "result_bundle": { "voice": "-", "nasal": "-", ... },
    "result_symbol": "p",
    "valid": true
  },
  "5": { "matched": false }
}
```

### Backend Functions Used

| Function | File | Purpose |
|---|---|---|
| `get_phoneme_features(pid)` | `backend/logic/phoneme_funcs.py` | Returns the full feature bundle for a phoneme id |
| `find_phoneme_by_features(bundle)` | `backend/logic/phoneme_funcs.py` | Finds a phoneme symbol whose features exactly match the given bundle |
| `apply_dependencies(bundle, changed)` | `backend/logic/dependency_funcs.py` | Propagates cascading feature consequences after a change |
| `no_contradictions(bundle)` | `backend/logic/contradiction_funcs.py` | Checks whether a feature bundle violates any contradiction rules |
