import rawCSV from '../../../../data/feature_table.csv?raw'

/*
01. PHONEME FEATURES
    Reads feature_table.csv when the app is built, and builds
    a list of feature names and a lookup of each symbol's feature values
*/
const lines = rawCSV.trim().split('\n')
const headers = lines[0]
  .split(',')
  .slice(1)
  // uses lowercase to match the backend, which stores feature names in lowercase
  .map((h) => h.trim().toLowerCase())

const data = {}
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',')
  // normalize to NFC so lookups match phonemes returned by the API
  // (the CSV stores some symbols in NFD decomposed form)
  const symbol = parts[0].trim().normalize('NFC')
  if (!symbol) continue
  data[symbol] = {}
  headers.forEach((h, j) => {
    data[symbol][h] = (parts[j + 1] ?? '').trim()
  })
}

export const FEATURE_NAMES = headers
export const PHONEME_FEATURES = data
