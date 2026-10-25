/**
 * PHONEME INVENTORY
 *
 * this is the interactive IPA chart (+ diacritics and whatnot) for users to choose their phoneme inventory
 *
 * DATA FLOW (see the hooks next to this file):
 * - useInventoryData: GET /api/phonemes and GET /api/diacritics match every phoneme and diacritic
 *   on the table to its corresponding id in the backend
 * - useDiacriticDrag: when a diacritic is dragged, POST /api/diacritics/applicable-phonemes returns
 *   which phoneme ids satisfy apply_diacritic; those phonemes light up as valid drop targets.
 * - usePresets: loads a preset inventory (data/*.csv) into the store
 *
 * DIACRITIC SUB-ROWS:
 * Each diacritic applied to a phoneme appears in its own sub-row directly beneath
 * that phoneme's base row. If two diacritics are applied to the same phoneme (e.g.
 * both applied to /p/), two sub-rows are rendered, each chip aligned to /p/'s column.
 */

import { useMemo, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { PHONEME_FEATURES } from './data/phonemeFeatures.js'
import {
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_HEIGHTS,
} from './data/phonemeLayout.js'
import { PRESETS } from './data/presetInventories.js'
import { getInventoryKey, makeInventoryItem } from './inventoryItems.js'
import { useInventoryData } from './useInventoryData.js'
import { diacriticDisplaySymbol, useDiacriticDrag } from './useDiacriticDrag.js'
import { usePresets } from './usePresets.js'
import { useDiacriticRows } from '../components/ipaTable/useDiacriticRows.js'
import { IpaTableGrid } from '../components/ipaTable/IpaTableGrid.jsx'
import InvalidDiacriticTarget from '../components/ErrorMsg.jsx'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { SymbolButton, DiacriticChip } from '../components/ipaTable/SymbolCells.jsx'


/** MAIN COMPONENT! **/

export default function PhonemeInventory() {
  const { inventory, toggleInventory, clearInventory } = useInventoryStore()
  const {
    phonemes,
    diacritics,
    phonemesBySymbol,
    diacriticsById,
    diacriticsBySymbol,
    loading,
    loadingSlow,
    error,
  } = useInventoryData()
  const { selectedPresetId, selectPreset, resetPreset } = usePresets({ phonemesBySymbol, diacriticsBySymbol })
  const {
    draggingDiacriticId,
    applicablePhonemeIds,
    loadingApplicable,
    touchIndicator,
    endDrag,
    dragHandlers,
  } = useDiacriticDrag({ phonemes, phonemesBySymbol })

  // null | { title, phonemeSymbol?, condition?, phonemeFeatures? }
  const [diacriticError, setDiacriticError] = useState(null)

  const {
    diacriticRowsByConsonant,
    diacriticRowsByVowel,
    diacriticRowsByOther,
  } = useDiacriticRows(inventory)

  const inventoryKeys = useMemo(() => new Set(inventory.map((item) => item.key)), [inventory])

  /** ERROR HANDLING: a cell is clickable only if the features CSV + API fetch both have the segment. */
  const canClickSymbol = (symbol) => {
    const cleanSymbol = symbol?.trim()
    if (!cleanSymbol) return false
    if (!PHONEME_FEATURES[cleanSymbol]) return false
    return !!phonemesBySymbol[cleanSymbol]
  }

  /** HANDLE CLICK: add/remove the base phoneme (no diacritic). */
  const onSelectSymbol = (rawSymbol) => {
    const symbol = rawSymbol?.trim()
    if (!canClickSymbol(symbol)) return
    setDiacriticError(null)
    toggleInventory(makeInventoryItem(phonemesBySymbol[symbol]))
  }

  /** Drop: add the phoneme+diacritic pair to inventory, or show an error if already applied. */
  const onDropSymbol = (rawSymbol, diacriticId) => {
    const symbol = rawSymbol?.trim()
    const phoneme = phonemesBySymbol[symbol]
    if (!phoneme || !applicablePhonemeIds.has(phoneme.id)) return
    const diacritic = diacriticsById[diacriticId]
    if (!diacritic) return
    const entry = makeInventoryItem(phoneme, diacritic)
    if (inventoryKeys.has(entry.key)) {
      setDiacriticError({ title: `'${diacritic.name}' is already applied to ${phoneme.symbol.trim()}` })
    } else {
      setDiacriticError(null)
      toggleInventory(entry)
    }
    endDrag()
  }

  /** Drop on an incompatible phoneme: compute required vs actual features and show mismatch error. */
  const onInvalidDropSymbol = (rawSymbol, diacriticId) => {
    const symbol = rawSymbol?.trim()
    const phoneme = phonemesBySymbol[symbol]
    if (!phoneme) return
    const diacritic = diacriticsById[diacriticId]
    if (!diacritic?.condition) return

    setDiacriticError({
      title: `Cannot apply ${diacritic.name} to`,
      phonemeSymbol: phoneme.symbol.trim(),
      condition: diacritic.condition,
      phonemeFeatures: PHONEME_FEATURES[symbol.normalize('NFC')] ?? {},
    })
    endDrag()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Factory passed into IpaTableGrid so each grid slot shares gating + inventory styling. */
  const renderSymbolButton = (symbol) => {
    if (!symbol) return <div className="w-14 h-10" />
    const cleanSymbol = symbol.trim()
    const phoneme = phonemesBySymbol[cleanSymbol]
    const key = phoneme ? getInventoryKey(phoneme.id, null) : null
    const canClick = canClickSymbol(cleanSymbol)
    const isDragTarget = !!(draggingDiacriticId && phoneme && applicablePhonemeIds.has(phoneme.id))
    const isInvalidDropTarget = !!(draggingDiacriticId && phoneme && !isDragTarget)
    const hasFeatureData = !!PHONEME_FEATURES[cleanSymbol]
    let title = cleanSymbol
    if (!hasFeatureData) title = `${cleanSymbol} (missing feature_table.csv data)`
    if (hasFeatureData && !phoneme) title = `${cleanSymbol} (missing backend phoneme id)`
    return (
      <SymbolButton
        key={`${cleanSymbol}-btn`}
        symbol={cleanSymbol}
        disabled={!canClick}
        isInInventory={key ? inventoryKeys.has(key) : false}
        isDragging={!!draggingDiacriticId}
        isDragTarget={isDragTarget}
        isInvalidDropTarget={isInvalidDropTarget}
        onSelect={onSelectSymbol}
        onDrop={(e) => {
          e.preventDefault()
          const diacriticId = parseInt(e.dataTransfer.getData('diacritic_id'), 10)
          onDropSymbol(cleanSymbol, diacriticId)
        }}
        onInvalidDrop={(e) => {
          e.preventDefault()
          const diacriticId = parseInt(e.dataTransfer.getData('diacritic_id'), 10)
          onInvalidDropSymbol(cleanSymbol, diacriticId)
        }}
        title={title}
      />
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">
      {/* ── Sticky top: title, errors, diacritics ── */}
      <div className={`shrink-0 space-y-[32px] pb-8 transition-colors duration-300 bg-white dark:bg-[#0E1116]`}>
        {/* Title + load / API error banners */}
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Phoneme Inventory</h1>
          <p className={`text-[16px] font-light text-gray-500 dark:text-gray-400`}>
            Click phonemes to add or remove from the inventory
          </p>
        </div>

        {/* ERROR HANDLING: error messages */}
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <InvalidDiacriticTarget message={diacriticError} onClose={() => setDiacriticError(null)} />

        {/* Diacritics: drag onto a phoneme to add the combined entry */}
        <section className="space-y-[32px] font-light">

          <div className="flex items-center justify-between">
            <select
              value={selectedPresetId}
              onChange={(e) => selectPreset(e.target.value)}
              className={`border border-slate-200 rounded-[4px] px-[8px] py-[6px] text-[14px] font-light text-black bg-white dark:bg-gray-100`}
            >
              <option value="" disabled>Select Preset</option>
              {PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => { clearInventory(); setDiacriticError(null); resetPreset() }}
              className={`text-[14px] font-light underline transition-colors hover:text-slate-600 dark:hover:text-gray-300`}
            >
              <span className="flex items-center gap-1">
                Clear Inventory
                <DeleteOutlinedIcon style={{ fontSize: 16 }} />
              </span>
            </button>
          </div>

          {/* loading message  */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-2">
              <span className="text-sm text-slate-600">Loading phoneme data...</span>
              {loadingSlow && (
                <span className="text-sm text-slate-600 italic text-center">Please don't leave!<br />Loading only takes a bit the first time (Free tiers am I right...)</span>
              )}
            </div>
          )}

          <div className="space-y-[8px]">
          <h3 className="text-[16px] font-light">Diacritics</h3>
          <div className="flex flex-wrap gap-1.5">
            {diacritics.map((d) => (
              <div key={d.id} className="relative group">
                <div
                  {...dragHandlers(d, { onDrop: onDropSymbol, onInvalidDrop: onInvalidDropSymbol })}
                  className={`w-9 h-8 border rounded flex items-center justify-center text-[16px] select-none cursor-grab active:cursor-grabbing ${
                    draggingDiacriticId === d.id
                      ? 'border-blue-100 bg-blue-100'
                      : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 dark:text-black dark:bg-white dark:hover:bg-gray-300'
                  }`}
                >
                  {diacriticDisplaySymbol(d)}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-slate-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                  {d.name}
                </div>
              </div>
            ))}
          </div>
          <p className={`text-[12px] font-light text-gray-500 dark:text-gray-400`}>
            Drag a diacritic onto a compatible phoneme to add it to the inventory.
          </p>
          </div>
        </section>
      </div>

      {/* ── Scrollable tables ── */}
      <div className="relative flex-1">
        {loadingApplicable && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-[#0E1116]/60`}>
            <span className="text-sm text-slate-600">Loading valid targets...</span>
          </div>
        )}
      <div className="absolute inset-0 overflow-y-auto space-y-[32px]">

      <IpaTableGrid
        activeManners={MANNERS}
        activePlaces={PLACES}
        activeVowelHeights={VOWEL_HEIGHTS}
        activeVowelBackness={VOWEL_BACKNESS}
        activeOtherGroups={OTHER_PHONEME_GROUPS}
        diacriticRowsByConsonant={diacriticRowsByConsonant}
        diacriticRowsByVowel={diacriticRowsByVowel}
        diacriticRowsByOther={diacriticRowsByOther}
        renderSymbol={renderSymbolButton}
        renderDiacriticChip={(item) => (
          <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={!!draggingDiacriticId} />
        )}
        cellWidth="w-28"
        slotWidth="w-14"
      />
      </div>
      </div>

      {/* Touch drag floating indicator */}
      {touchIndicator && (
        <div
          className="fixed z-50 pointer-events-none w-9 h-8 border border-blue-400 bg-blue-100 rounded flex items-center justify-center text-[16px] font-mono opacity-80 select-none"
          style={{ left: touchIndicator.x - 18, top: touchIndicator.y - 16 }}
        >
          {touchIndicator.displaySymbol}
        </div>
      )}
    </div>
  )
}
