# Phoneme Inventory

The Phoneme Inventory page is the interactive IPA chart where users build their phoneme inventory. Users click base phonemes to add or remove them, and drag diacritics onto compatible phonemes to add modified versions. The selected inventory is persisted in a Zustand store and shared across the app.

---

## How It Works (Overview)

1. On mount, the page fetches all phonemes and diacritics from the backend.
2. The IPA chart is rendered from static layout data — each cell is checked against the fetched phoneme list to determine whether it's clickable.
3. Clicking a phoneme toggles it in the shared inventory store.
4. Dragging a diacritic highlights only the phonemes it can legally apply to (fetched from the backend on drag start). Dropping it adds the phoneme+diacritic pair to the inventory.

---

## Component: `src/inventory/PhonemeInventory.jsx`

### State

| State | Description |
|---|---|
| `phonemes` | All phonemes fetched from the backend (`GET /api/phonemes`) |
| `diacritics` | All diacritics fetched from the backend (`GET /api/diacritics`) |
| `loading` | True while the initial phoneme/diacritic data is being fetched |
| `loadingApplicable` | True while the applicable-phonemes fetch is in flight after a drag starts; shows a viewport-centered overlay over the tables |
| `draggingDiacriticId` | The id of the diacritic currently being dragged, or `null` |
| `applicablePhonemeIds` | Set of phoneme ids that the dragged diacritic can legally apply to |
| `activeSymbol` | The most recently clicked phoneme symbol (used for visual feedback) |
| `diacriticError` | Error state shown when a diacritic is dropped on an incompatible phoneme |

The selected inventory itself lives in the **Zustand store** (`useInventoryStore`), not in local component state — see [Store](#store) below.

### Key Derived Values

**`phonemesBySymbol`** — a lookup map from symbol string to phoneme object, built from the fetched `phonemes` list. Used to resolve a clicked/dropped symbol to its backend id.

**`diacriticsById`** — a lookup map from diacritic id to diacritic object.

**`inventoryKeys`** — a `Set` of all `item.key` strings currently in the inventory, used for fast membership checks when styling cells.

### Interactions

**Clicking a phoneme (`onSelectSymbol`)**
- Looks up the phoneme in `phonemesBySymbol`
- Calls `toggleInventory` with `{ key, phoneme_id, symbol, diacritic_id: null, diacritic_symbol: null }`
- A phoneme is only clickable if it exists in both the features CSV (`PHONEME_FEATURES`) and the backend API response

**Dragging a diacritic**
- On `dragStart`: stores the diacritic id in `draggingDiacriticId` and fires `POST /api/diacritics/applicable-phonemes` to get the set of valid drop targets
- Valid targets highlight in the chart; incompatible cells are visually dimmed

**Dropping a diacritic (`onDropSymbol`)**
- Checks the target phoneme is in `applicablePhonemeIds`
- Calls `toggleInventory` with `{ key, phoneme_id, symbol, diacritic_id, diacritic_symbol }`
- If the pair is already in the inventory, shows a duplicate error instead

**Invalid drop (`onInvalidDropSymbol`)**
- Computes the mismatch between the diacritic's required condition and the phoneme's actual features
- Displays an error message explaining why the drop was rejected

### `renderSymbolButton(symbol)`

A factory function passed into the `IpaTableGrid`. Given a symbol string, it:
- Returns an empty placeholder `<div>` if the symbol is null/missing
- Resolves the phoneme and determines whether it is clickable, in the inventory, a valid drag target, or an invalid drag target
- Returns a `<SymbolButton>` with the appropriate props and drag/drop handlers

---

## Shared Table Layout: `src/components/ipaTable/IpaTableGrid.jsx`

`IpaTableGrid` owns the IPA chart skeleton — consonants, vowels, other phonemes — and is used by both `PhonemeInventory` and `TableView`. It handles:
- Rendering three sections (Consonants, Vowels, Other Phonemes) with correct row/column headers
- Diacritic sub-rows: one `<tr>` per diacritic stacked beneath its base phoneme's row (computed via `numDiacriticRows = max item-array length across all cells)
- Dark/light theming (`isDark` read from `useThemeStore` internally)

The caller controls cell content through two render props:

| Prop | Type | Used by |
|---|---|---|
| `renderSymbol(symbol)` | `(string) => ReactNode` | Called for every phoneme slot in base rows |
| `renderDiacriticChip(item)` | `(item) => ReactNode` | Called for each diacritic item in sub-rows |

Sizing props (`cellWidth`, `slotWidth`) accept Tailwind width classes and let each consumer set its own column widths:

| Consumer | `cellWidth` | `slotWidth` |
|---|---|---|
| `PhonemeInventory` | `w-28` | `w-14` |
| `TableView` | `w-40` | `w-20` |

Row/column filtering is the caller's responsibility — pass the full `MANNERS`/`PLACES`/etc. arrays for the full chart, or filtered arrays for the compact view.

---

## Routes Used

| Method | Endpoint | When |
|---|---|---|
| `GET` | `/api/phonemes` | On mount — fetches all phonemes to populate the chart |
| `GET` | `/api/diacritics` | On mount — fetches all diacritics for the diacritic tray |
| `POST` | `/api/diacritics/applicable-phonemes` | On diacritic drag start — returns which phoneme ids the diacritic can apply to |

---

## Store

**`src/store/inventoryStore.js`** (Zustand)

Shared across the whole app. Holds the list of selected inventory items and exposes:

| Action | Description |
|---|---|
| `toggleInventory(item)` | Adds the item if not present, removes it if already in the inventory (matched by `item.key`) |
| `clearInventory()` | Removes all items from the inventory |

Each inventory item has the shape:
```js
{
  key: "5" | "5:2",        // phoneme_id, or phoneme_id:diacritic_id for modified phonemes
  phoneme_id: number,
  symbol: string,           // base phoneme symbol
  diacritic_id: number | null,
  diacritic_symbol: string | null,
}
```

---

## Format Files

### `src/inventory/format/phonemeLayout.js`

Defines the static structure of the IPA chart — which symbols live in which cells. Nothing here is fetched; it's hardcoded layout data.

| Export | Type | Description |
|---|---|---|
| `PLACES` | `string[]` | Column headers for the consonant table (e.g. `"Bilabial"`, `"Alveolar"`) |
| `MANNERS` | `string[]` | Row headers for the consonant table (e.g. `"Plosive"`, `"Fricative"`) |
| `CONSONANT_CELLS` | `{ [manner]: { [place]: [voiceless, voiced] } }` | Maps each manner+place pair to a `[voiceless, voiced]` symbol pair |
| `VOWEL_HEIGHTS` | `string[]` | Row headers for the vowel table (e.g. `"Close"`, `"Open"`) |
| `VOWEL_BACKNESS` | `string[]` | Column headers for the vowel table (e.g. `"Front"`, `"Back"`) |
| `VOWEL_CELLS` | `{ [height]: { [backness]: [unrounded, rounded] } }` | Maps each height+backness pair to a `[unrounded, rounded]` symbol pair |
| `OTHER_PHONEME_GROUPS` | `{ label: string, phonemes: string[] }[]` | Groups of miscellaneous phonemes (clicks, lab-velars, etc.) rendered in a separate table |

### `src/inventory/format/phonemeFeatures.js`

Parses `data/feature_table.csv` at build time (via Vite's `?raw` import) and exports two values used throughout the app.

| Export | Type | Description |
|---|---|---|
| `FEATURE_NAMES` | `string[]` | Ordered list of all feature names, taken from the CSV header row (e.g. `"voice"`, `"nasal"`, `"high"`) |
| `PHONEME_FEATURES` | `{ [symbol]: { [feature]: value } }` | Full feature bundle for every phoneme in the CSV, keyed by NFC-normalized symbol |

`PHONEME_FEATURES` is used in the Inventory page to gate which symbols are clickable (a symbol must be present in both this map and the backend API response). `FEATURE_NAMES` is used in the Rule Panel to populate the feature dropdown and in the Sheet View to render column headers.
