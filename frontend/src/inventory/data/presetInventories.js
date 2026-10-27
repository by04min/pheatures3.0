import koreanRaw from '../../../../data/inventories/korean.csv?raw'
import catalanRaw from '../../../../data/inventories/catalan.csv?raw'
import finnishRaw from '../../../../data/inventories/finnish.csv?raw'

/*
01. PARSE SYMBOLS
    Reads a preset spreadsheet (one symbol per line) into a list of symbols
*/
function parseSymbols(raw) {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/*
02. PRESETS
    The ready-made inventories shown in the dropdown
*/
export const PRESETS = [
  { id: 'korean', label: 'Korean', symbols: parseSymbols(koreanRaw) },
  { id: 'catalan', label: 'Catalan', symbols: parseSymbols(catalanRaw) },
  { id: 'finnish', label: 'Finnish', symbols: parseSymbols(finnishRaw) },
]
