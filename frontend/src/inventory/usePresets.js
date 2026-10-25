import { useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { PRESETS } from './data/presetInventories.js'
import { makeInventoryItem } from './inventoryItems.js'

// Preset inventories (korean.csv etc.): picking one replaces the current inventory.
export function usePresets({ phonemesBySymbol, diacriticsBySymbol }) {
  const { toggleInventory, clearInventory } = useInventoryStore()
  const [selectedPresetId, setSelectedPresetId] = useState('')

  /** Resolve a CSV symbol string to an inventory entry, handling base-only and base+diacritic forms. */
  const resolvePresetSymbol = (raw) => {
    const symbol = raw.trim().normalize('NFC')
    const phoneme = phonemesBySymbol[symbol]
    if (phoneme) return makeInventoryItem(phoneme)

    const diacriticSymbols = Object.keys(diacriticsBySymbol).sort((a, b) => b.length - a.length)
    for (const ds of diacriticSymbols) {
      if (ds && symbol.endsWith(ds)) {
        const basePhoneme = phonemesBySymbol[symbol.slice(0, -ds.length)]
        const diacritic = diacriticsBySymbol[ds]
        if (basePhoneme && diacritic) return makeInventoryItem(basePhoneme, diacritic)
      }
    }
    return null
  }

  const selectPreset = (presetId) => {
    setSelectedPresetId(presetId)
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    clearInventory()
    for (const sym of preset.symbols) {
      const entry = resolvePresetSymbol(sym)
      if (entry) toggleInventory(entry)
    }
  }

  const resetPreset = () => setSelectedPresetId('')

  return { selectedPresetId, selectPreset, resetPreset }
}
