import { useMemo } from 'react'
import {
  CONSONANT_CELLS,
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_CELLS,
  VOWEL_HEIGHTS,
} from '../../inventory/data/phonemeLayout.js'

/*
01. SOUND POSITIONS
    For each sound, remembers where it sits in the chart (its row, column, and which spot in the cell).
    Used to sort sounds-with-diacritics into the right place.
*/
const consonantPositionOf = {}
for (const manner of MANNERS)
  for (const place of PLACES)
    CONSONANT_CELLS[manner]?.[place]?.forEach((sym, idx) => {
      if (sym) consonantPositionOf[sym.trim()] = { manner, place, idx }
    })

const vowelPositionOf = {}
for (const height of VOWEL_HEIGHTS)
  for (const backness of VOWEL_BACKNESS)
    VOWEL_CELLS[height]?.[backness]?.forEach((sym, idx) => {
      if (sym) vowelPositionOf[sym.trim()] = { height, backness, idx }
    })

const otherPositionOf = {}
for (const group of OTHER_PHONEME_GROUPS)
  group.phonemes.forEach((sym, idx) => {
    if (sym) otherPositionOf[sym.trim()] = { label: group.label, idx }
  })

/*
02. USE DIACRITIC ROWS
    Used by the Phoneme Inventory and Table View pages.
    Takes the user's chosen sounds and returns the ones with diacritics, grouped by where
    their plain sound sits in the chart (consonants, vowels, or other). If a sound has
    several diacritics, each one gets its own row beneath it.
*/
export function useDiacriticRows(inventory) {
  const inventoryWithDiacritic = useMemo(() => inventory.filter((i) => i.diacritic_id != null), [inventory])

  const diacriticRowsByConsonant = useMemo(() => {
    const out = {}
    for (const item of inventoryWithDiacritic) {
      const pos = consonantPositionOf[item.symbol.trim()]
      if (!pos) continue
      const cell = ((out[pos.manner] ??= {})[pos.place] ??= {})
      ;(cell[pos.idx] ??= []).push(item)
    }
    return out
  }, [inventoryWithDiacritic])

  const diacriticRowsByVowel = useMemo(() => {
    const out = {}
    for (const item of inventoryWithDiacritic) {
      const pos = vowelPositionOf[item.symbol.trim()]
      if (!pos) continue
      const cell = ((out[pos.height] ??= {})[pos.backness] ??= {})
      ;(cell[pos.idx] ??= []).push(item)
    }
    return out
  }, [inventoryWithDiacritic])

  const diacriticRowsByOther = useMemo(() => {
    const out = {}
    for (const item of inventoryWithDiacritic) {
      const pos = otherPositionOf[item.symbol.trim()]
      if (!pos) continue
      ;((out[pos.label] ??= {})[pos.idx] ??= []).push(item)
    }
    return out
  }, [inventoryWithDiacritic])

  return {
    diacriticRowsByConsonant,
    diacriticRowsByVowel,
    diacriticRowsByOther,
  }
}
