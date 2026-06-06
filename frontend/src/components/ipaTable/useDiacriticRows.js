import { useMemo } from "react";
import {
  CONSONANT_CELLS,
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_CELLS,
  VOWEL_HEIGHTS,
} from "../../inventory/format/phonemeLayout.js";

// Shared hook used by PhonemeInventory and TableView.
//
// Given the full inventory array, returns the six values needed to render
// diacritic sub-rows in the IPA grid layout:
//
//   consonantPositionOf   symbol → { manner, place, idx }
//   vowelPositionOf       symbol → { height, backness, idx }
//   otherPositionOf       symbol → { label, idx }
//   diacriticRowsByConsonant  [manner][place][idx] → item[]
//   diacriticRowsByVowel      [height][backness][idx] → item[]
//   diacriticRowsByOther      [groupLabel][idx] → item[]
//
// item[] may contain more than one entry when multiple diacritics are applied
// to the same base phoneme. PhonemeInventory renders one sub-row per item in
// that array (each diacritic gets its own row under the base phoneme's row).

export function useDiacriticRows(inventory) {
  const inventoryWithDiacritic = useMemo(
    () => inventory.filter((i) => i.diacritic_id != null),
    [inventory],
  );

  // position lookup maps (layout constants never change → empty deps)
  const consonantPositionOf = useMemo(() => {
    const out = {};
    for (const manner of MANNERS)
      for (const place of PLACES)
        CONSONANT_CELLS[manner]?.[place]?.forEach((sym, idx) => {
          if (sym) out[sym.trim()] = { manner, place, idx };
        });
    return out;
  }, []);

  const vowelPositionOf = useMemo(() => {
    const out = {};
    for (const height of VOWEL_HEIGHTS)
      for (const backness of VOWEL_BACKNESS)
        VOWEL_CELLS[height]?.[backness]?.forEach((sym, idx) => {
          if (sym) out[sym.trim()] = { height, backness, idx };
        });
    return out;
  }, []);

  const otherPositionOf = useMemo(() => {
    const out = {};
    for (const group of OTHER_PHONEME_GROUPS)
      group.phonemes.forEach((sym, idx) => {
        if (sym) out[sym.trim()] = { label: group.label, idx };
      });
    return out;
  }, []);

  // diacritic grouping maps — keyed by base phoneme grid position
  const diacriticRowsByConsonant = useMemo(() => {
    const out = {};
    for (const item of inventoryWithDiacritic) {
      const pos = consonantPositionOf[item.symbol.trim()];
      if (!pos) continue;
      const cell = ((out[pos.manner] ??= {})[pos.place] ??= {});
      (cell[pos.idx] ??= []).push(item);
    }
    return out;
  }, [inventoryWithDiacritic, consonantPositionOf]);

  const diacriticRowsByVowel = useMemo(() => {
    const out = {};
    for (const item of inventoryWithDiacritic) {
      const pos = vowelPositionOf[item.symbol.trim()];
      if (!pos) continue;
      const cell = ((out[pos.height] ??= {})[pos.backness] ??= {});
      (cell[pos.idx] ??= []).push(item);
    }
    return out;
  }, [inventoryWithDiacritic, vowelPositionOf]);

  const diacriticRowsByOther = useMemo(() => {
    const out = {};
    for (const item of inventoryWithDiacritic) {
      const pos = otherPositionOf[item.symbol.trim()];
      if (!pos) continue;
      ((out[pos.label] ??= {})[pos.idx] ??= []).push(item);
    }
    return out;
  }, [inventoryWithDiacritic, otherPositionOf]);

  return {
    consonantPositionOf,
    vowelPositionOf,
    otherPositionOf,
    diacriticRowsByConsonant,
    diacriticRowsByVowel,
    diacriticRowsByOther,
  };
}
