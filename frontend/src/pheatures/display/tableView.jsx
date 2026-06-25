// TABLE VIEW
// displays the selected inventory laid out like an IPA chart:
//   consonants: rows = manner, columns = place, each cell holds [voiceless, voiced]
//   vowels:     rows = height, columns = backness, each cell holds [unrounded, rounded]
//   other:      rows = phoneme group label, columns = individual phonemes
//
// only rows/columns that contain at least one selected phoneme are rendered.
// diacritic items appear in a sub-row directly below their base phoneme's row.
// clicking any phoneme or diacritic chip opens a FeaturePanel modal.

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInventoryStore } from '../../store/inventoryStore'
import { FeaturePanel } from './featurePanel.jsx'
import {
  CONSONANT_CELLS,
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_CELLS,
  VOWEL_HEIGHTS,
} from '../../inventory/format/phonemeLayout.js'
import { useDiacriticRows } from '../../components/ipaTable/useDiacriticRows.js'
import { IpaTableGrid } from '../../components/ipaTable/IpaTableGrid.jsx'
import { DiacriticChip } from '../../components/ipaTable/symbolCells.jsx'

// inventory prop overrides the store when rules are active (filtered to matched phonemes)
// transforms: { phoneme_id_str: { matched, original_symbol, result_symbol } } — drives chip labels
export default function TableView({ inventory: inventoryProp, transforms = {}, diacriticFeatures = {} }) {
  const { inventory: storeInventory, toggleInventory } = useInventoryStore()
  // prefer the filtered prop passed from pheatures.jsx; fall back to full store inventory
  const inventory = inventoryProp ?? storeInventory
  const [activeItem, setActiveItem] = useState(null)

  // set of base phoneme symbols (no diacritics) that are in the (possibly filtered) inventory
  const baseSymbols = useMemo(
    () => new Set(inventory.filter((i) => i.diacritic_id == null).map((i) => i.symbol.trim())),
    [inventory]
  )

  const {
    diacriticRowsByConsonant,
    diacriticRowsByVowel,
    diacriticRowsByOther,
  } = useDiacriticRows(inventory)

  /* ACTIVE ROW/COLUMN FILTERS
   * Only render rows and columns that have at least one selected phoneme
   * (either a base phoneme or a diacritic item whose base lives in that slot).
   */
  const activePlaces = useMemo(
    () => PLACES.filter(place =>
      MANNERS.some(manner => CONSONANT_CELLS[manner]?.[place]?.some(s => s && baseSymbols.has(s.trim()))) ||
      MANNERS.some(manner => diacriticRowsByConsonant[manner]?.[place] != null)
    ),
    [baseSymbols, diacriticRowsByConsonant]
  )
  const activeManners = useMemo(
    () => MANNERS.filter(manner =>
      PLACES.some(place => CONSONANT_CELLS[manner]?.[place]?.some(s => s && baseSymbols.has(s.trim()))) ||
      (diacriticRowsByConsonant[manner] != null)
    ),
    [baseSymbols, diacriticRowsByConsonant]
  )

  const activeVowelBackness = useMemo(
    () => VOWEL_BACKNESS.filter(backness =>
      VOWEL_HEIGHTS.some(height => VOWEL_CELLS[height]?.[backness]?.some(s => s && baseSymbols.has(s.trim()))) ||
      VOWEL_HEIGHTS.some(height => diacriticRowsByVowel[height]?.[backness] != null)
    ),
    [baseSymbols, diacriticRowsByVowel]
  )
  const activeVowelHeights = useMemo(
    () => VOWEL_HEIGHTS.filter(height =>
      VOWEL_BACKNESS.some(backness => VOWEL_CELLS[height]?.[backness]?.some(s => s && baseSymbols.has(s.trim()))) ||
      (diacriticRowsByVowel[height] != null)
    ),
    [baseSymbols, diacriticRowsByVowel]
  )

  const activeOtherGroups = useMemo(
    () => OTHER_PHONEME_GROUPS.filter(g =>
      g.phonemes.some(s => s && baseSymbols.has(s.trim())) || (g.label in diacriticRowsByOther)
    ),
    [baseSymbols, diacriticRowsByOther]
  )

  // map symbol → phoneme_id so renderSelectedSymbol can look up transforms
  const symbolToPhonemeId = useMemo(() => {
    const map = {}
    for (const item of inventory) {
      if (item.diacritic_id == null) map[item.symbol.trim()] = item.phoneme_id
    }
    return map
  }, [inventory])

  // renders a single phoneme cell: empty placeholder if not in inventory,
  // otherwise a clickable button that opens the FeaturePanel.
  // when a transform is active, shows "original → result" (or "→ ?") inside the chip.
  const renderSelectedSymbol = (symbol) => {
    if (!symbol) return <div className="w-20 h-10" />
    const clean = symbol.trim()
    if (!baseSymbols.has(clean)) return <div className="w-20 h-10" />

    const pid = symbolToPhonemeId[clean]
    const t = pid != null ? transforms[String(pid)] : null
    const hasArrow = t?.matched && t.transformed
    const label = hasArrow
      ? `${t.original_symbol ?? clean} → ${t.result_symbol ?? '?'}`
      : clean

    return (
      <button
        key={clean}
        type="button"
        onClick={() => setActiveItem({ symbol: clean, feats: null })}
        className={`w-20 h-10 font-mono text-center flex items-center justify-center bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer ${
          hasArrow ? 'text-[12px] px-0.5' : 'text-[14px]'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="relative space-y-[32px]">
      {/* FeaturePanel modal — portaled to document.body to escape any overflow/stacking constraints */}
      {activeItem && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="w-[60%]"
            onClick={(e) => e.stopPropagation()}
          >
            <FeaturePanel symbol={activeItem.symbol} feats={activeItem.feats} onClose={() => setActiveItem(null)} />
          </div>
        </div>,
        document.body
      )}

      <IpaTableGrid
        activeManners={activeManners}
        activePlaces={activePlaces}
        activeVowelHeights={activeVowelHeights}
        activeVowelBackness={activeVowelBackness}
        activeOtherGroups={activeOtherGroups}
        diacriticRowsByConsonant={diacriticRowsByConsonant}
        diacriticRowsByVowel={diacriticRowsByVowel}
        diacriticRowsByOther={diacriticRowsByOther}
        renderSymbol={renderSelectedSymbol}
        renderDiacriticChip={(item) => {
          const t = transforms[item.key]
          const chipLabel = t?.matched && t.transformed
            ? `${t.original_symbol ?? item.symbol.trim()} → ${t.result_symbol ?? '?'}`
            : undefined
          return (
            <DiacriticChip
              key={item.key}
              item={item}
              onRemove={toggleInventory}
              isDragging={false}
              onClick={(item) => setActiveItem({ symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`, feats: diacriticFeatures[item.key] ?? null })}
              label={chipLabel}
              widthClass="w-20"
              textClass="text-[14px]"
            />
          )
        }}
        cellWidth="w-40"
        slotWidth="w-20"
      />
    </div>
  )
}
