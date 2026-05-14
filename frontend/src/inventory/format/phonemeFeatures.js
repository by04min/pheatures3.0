// Parses feature_table.csv at build time via Vite's ?raw import.
// Relative path goes up three levels: src/data/ → src/ → frontend/ → repo root → data/
import rawCSV from "../../../../data/feature_table.csv?raw";

const lines = rawCSV.trim().split("\n");
const headers = lines[0]
  .split(",")
  .slice(1)
  .map((h) => h.trim());

const features = {};
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(",");
  // normalize to NFC so lookups match phonemes returned by the API
  // (the CSV stores some symbols in NFD decomposed form)
  const symbol = parts[0].trim().normalize("NFC");
  if (!symbol) continue;
  features[symbol] = {};
  headers.forEach((h, j) => {
    features[symbol][h] = (parts[j + 1] ?? "").trim();
  });
}

export const FEATURE_NAMES = headers;
export const PHONEME_FEATURES = features;
