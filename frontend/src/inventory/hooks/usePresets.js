import { useState } from 'react'
import { useInventoryStore } from '../../store/inventoryStore'
import { PHONEME_FEATURES } from '../../data/phonemeFeatures.js'
import { PRESETS } from '../../data/presetInventories.js'
import { makeInventoryItem } from '../inventoryItems.js'

/*
01. PICK DIACRITIC
    PURPOSE:
    - several diacritics can share one mark, so a mark alone doesn't say which diacritic a preset means
    - when that happens, pick the one whose condition the base sound meets
    - e.g. the postalveolar and backed velar diacritics share a mark: postalveolar needs a tongue-tip
      consonant and backed velar a back-of-tongue one, so only one fits any given sound

    PARAMS:
    - candidates: the diacritics that use the mark
    - baseSymbol: the sound the mark is attached to

    RETURNS:
    - the matching diacritic, or null if none fits
*/
function pickDiacritic(candidates, baseSymbol) {
  if (candidates.length === 1) return candidates[0]
  const features = PHONEME_FEATURES[baseSymbol]
  if (!features) return null
  return (
    candidates.find((d) => Object.entries(d.condition).every(([feature, value]) => features[feature] === value)) ?? null
  )
}

/*
02. RESOLVE PRESET SYMBOL
    PURPOSE:
    - turns a preset's plain-text symbol into an inventory item, whether it's a plain sound or sound + diacritic

    RETURNS:
    - the inventory item, or null if the symbol can't be matched
*/
export function resolvePresetSymbol(raw, { phonemesBySymbol, diacriticsBySymbol }) {
  const symbol = raw.trim().normalize('NFC')
  const phoneme = phonemesBySymbol[symbol]
  if (phoneme) return makeInventoryItem(phoneme)

  // try the longest diacritic marks first, so a multi-character mark isn't mistaken for a shorter one
  const diacriticSymbols = Object.keys(diacriticsBySymbol).sort((a, b) => b.length - a.length)
  for (const ds of diacriticSymbols) {
    if (ds && symbol.endsWith(ds)) {
      const baseSymbol = symbol.slice(0, -ds.length)
      const basePhoneme = phonemesBySymbol[baseSymbol]
      const diacritic = basePhoneme && pickDiacritic(diacriticsBySymbol[ds], baseSymbol)
      if (diacritic) return makeInventoryItem(basePhoneme, diacritic)
    }
  }
  return null
}

/*
03. USE PRESETS
    Loads a preset inventory: picking one clears the current inventory and replaces it with the preset
*/
export function usePresets({ phonemesBySymbol, diacriticsBySymbol }) {
  const { toggleInventory, clearInventory } = useInventoryStore()
  const [selectedPresetId, setSelectedPresetId] = useState('')

  // Clears the inventory, then adds every sound in the chosen preset
  const selectPreset = (presetId) => {
    setSelectedPresetId(presetId)
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    clearInventory()
    for (const sym of preset.symbols) {
      const entry = resolvePresetSymbol(sym, { phonemesBySymbol, diacriticsBySymbol })
      if (entry) toggleInventory(entry)
    }
  }

  const resetPreset = () => setSelectedPresetId('')

  return { selectedPresetId, selectPreset, resetPreset }
}
