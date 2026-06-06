# Preset Inventories

The `/data/inventories/` folder contains pre-defined phoneme inventories that users can load directly in the Phoneme Inventory UI.

## File format

Each inventory is a plain UTF-8 text file with one IPA symbol per line and no header row.

```
p
t
k
pʰ
a
```

A line can be:
- **A base phoneme** — a single IPA symbol that exists on the chart (e.g. `p`, `a`, `ŋ`)
- **A base + diacritic** — a phoneme with a modifier attached (e.g. `pʰ` = aspirated p, `p'` = ejective p). The app splits these automatically using the known diacritic list.

Lines that don't match any phoneme in the database are silently skipped.

## Adding a new preset

1. Create a new CSV file in `/data/inventories/` (e.g. `spanish.csv`)
2. Open `frontend/src/inventory/format/presetInventories.js`
3. Add one import and one entry to the `PRESETS` array:

```js
import spanishRaw from '../../../../data/inventories/spanish.csv?raw'

export const PRESETS = [
  { id: 'korean',  label: 'Korean',  symbols: parseSymbols(koreanRaw) },
  { id: 'spanish', label: 'Spanish', symbols: parseSymbols(spanishRaw) },
]
```

That's it — the preset will appear in the "Load preset" dropdown automatically.
