export const PLACES = [
  "Bilabial",
  "Labiodental",
  "Dental",
  "Alveolar",
  "Postalveolar",
  "Retroflex",
  "Alveo-palatal",
  "Palatal",
  "Velar",
  "Uvular",
  "Pharyngeal",
  "Glottal",
];

export const MANNERS = [
  "Plosive",
  "Nasal",
  "Trill",
  "Tap/Flap",
  "Fricative",
  "Lateral Fric",
  "Affricate",
  "Lateral Affr",
  "Approximant",
  "Lateral Approx",
];

// Each entry: [voiceless, voiced] — omit second element if no voiced counterpart
export const CONSONANT_CELLS = {
  Plosive: {
    Bilabial: ["p", "b"],
    Alveolar: ["t", "d"],
    Retroflex: ["ʈ", "ɖ"],
    Palatal: ["c", "ɟ"],
    Velar: ["k", "ɡ"],
    Uvular: ["q", "ɢ"],
    Glottal: ["ʔ"],
  },
  Nasal: {
    Bilabial: ["", "m"],
    Labiodental: ["", "ɱ"],
    Alveolar: ["", "n"],
    Retroflex: ["", "ɳ"],
    Palatal: ["", "ɲ"],
    Velar: ["", "ŋ"],
    Uvular: ["", "ɴ"],
  },
  Trill: {
    Bilabial: ["", "ʙ"],
    Alveolar: ["", "r"],
    Uvular: ["", "ʀ"],
  },
  "Tap/Flap": {
    Alveolar: ["", "ɾ"],
    Retroflex: ["", "ɽ"],
  },
  Fricative: {
    Bilabial: ["ɸ", "β"],
    Labiodental: ["f", "v"],
    Dental: ["θ", "ð"],
    Alveolar: ["s", "z"],
    Postalveolar: ["ʃ", "ʒ"],
    Retroflex: ["ʂ", "ʐ"],
    "Alveo-palatal": ["ɕ", "ʑ"],
    Palatal: ["ç", "ʝ"],
    Velar: ["x", "ɣ"],
    Uvular: ["χ", "ʁ"],
    Pharyngeal: ["ħ", "ʕ"],
    Glottal: ["h", "ɦ"],
  },
  "Lateral Fric.": {
    Alveolar: ["ɬ", "ɮ"],
  },
  Affricate: {
    Bilabial: ["p͡ɸ", "b͡β"],
    Labiodental: ["p͡f", "b͡v"],
    Dental: ["t̪͡θ", "d̪͡ð"],
    Alveolar: ["t͡s", "d͡z"],
    Postalveolar: ["t͡ʃ", "d͡ʒ"],
    Retroflex: ["ʈ͡ʂ", "ɖ͡ʐ"],
    "Alveo-palatal": ["t͡ɕ", "d͡ʑ"],
    Palatal: ["c͡ç", "ɟ͡ʝ"],
    Velar: ["k͡x", "ɡ͡ɣ"],
    Uvular: ["q͡χ", "ɢ͡ʁ"],
  },
  "Lateral Affr.": {
    Alveolar: ["t͡ɬ", "d͡ɮ"],
  },
  Approximant: {
    Labiodental: ["", "ʋ"],
    Alveolar: ["", "ɹ"],
    Retroflex: ["", "ɻ"],
    Palatal: ["", "j"],
    Velar: ["", "ɰ"],
  },
  "Lateral Approx.": {
    Alveolar: ["", "l"],
    Retroflex: ["", "ɭ"],
    Palatal: ["", "ʎ"],
    Velar: ["", "ʟ"],
  },
};

export const VOWEL_HEIGHTS = [
  "High",
  "High lax",
  "Upper-mid",
  "Lower-mid",
  "Low",
];
export const VOWEL_BACKNESS = ["Front", "Central", "Back"];

// Pairs are [unrounded, rounded] following IPA chart convention
export const VOWEL_CELLS = {
  High: { Front: ["i", "y"], Central: ["ɨ", "ʉ"], Back: ["ɯ", "u"] },
  "High lax": { Front: ["ɪ", "ʏ"], Back: ["", "ʊ"] },
  "Upper-mid": { Front: ["e", "ø"], Central: ["ɘ", "ɵ"], Back: ["ɤ", "o"] },
  "Lower-mid": { Front: ["ɛ", "œ"], Central: ["ə", "ɞ"], Back: ["ʌ", "ɔ"] },
  Low: { Front: ["æ", "ɶ"], Central: ["a", ""], Back: ["ɑ", "ɒ"] },
};

export const OTHER_PHONEME_GROUPS = [
  { label: "lab-velar approx", phonemes: ["ʍ", "w"] },
  { label: "lab-pal approx", phonemes: ["ɥ"] },
  { label: "dark l", phonemes: ["ɫ"] },
  { label: "S + x", phonemes: ["ɧ"] },
  { label: "lab-velar stop", phonemes: ["k͡p", "ɡ͡b"] },
  { label: "lab-alv stop", phonemes: ["p͡t", "b͡d"] },
  { label: "dental sib affr", phonemes: ["t̪͡s̪", "d̪͡z̪"] },
  { label: "lat alveolar tap", phonemes: ["ɺ"] },
];
