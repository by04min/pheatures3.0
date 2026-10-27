import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInventoryStore } from '../../store/inventoryStore'
import { FeaturePanel } from '../../components/FeaturePanel.jsx'
import {
  CONSONANT_CELLS,
  MANNERS,
  OTHER_PHONEME_GROUPS,
  PLACES,
  VOWEL_BACKNESS,
  VOWEL_CELLS,
  VOWEL_HEIGHTS,
} from '../../inventory/data/phonemeLayout.js'
import { useDiacriticRows } from '../../components/ipaTable/useDiacriticRows.js'
import { IpaTableGrid } from '../../components/ipaTable/IpaTableGrid.jsx'
import { DiacriticChip } from '../../components/ipaTable/SymbolCells.jsx'

/*
01. ACTIVE AXES
    Works out which rows and columns of the chart to show: those with at least one chosen sound
*/
function activeAxes(rows, cols, cells, baseSymbols, diacriticRows) {
  const isFilled = (row, col) =>
    cells[row]?.[col]?.some((s) => s && baseSymbols.has(s.trim())) || diacriticRows[row]?.[col] != null
  return {
    rows: rows.filter((row) => cols.some((col) => isFilled(row, col))),
    cols: cols.filter((col) => rows.some((row) => isFilled(row, col))),
  }
}

/*
02. TABLE VIEW
    Shows the chosen sounds laid out like an IPA chart. Only rows and columns that contain
    a chosen sound are shown, and clicking a sound opens a pop-up with its features.

    PARAMS:
    - inventory: the sounds to show (already narrowed down by the rule, if there is one)
    - transforms: how the rule changes each sound, used to show "before → after" labels
*/
export default function TableView({ inventory, transforms = {}, diacriticFeatures = {} }) {
  const { toggleInventory } = useInventoryStore()
  // The sound whose features pop-up is open (null = closed)
  const [activeItem, setActiveItem] = useState(null)

  // The plain sounds (no diacritic) that are being shown
  const baseSymbols = useMemo(
    () => new Set(inventory.filter((i) => i.diacritic_id == null).map((i) => i.symbol.trim())),
    [inventory],
  )

  const { diacriticRowsByConsonant, diacriticRowsByVowel, diacriticRowsByOther } = useDiacriticRows(inventory)

  // Hide empty rows and columns, so the chart only shows what's relevant
  const { rows: activeManners, cols: activePlaces } = useMemo(
    () => activeAxes(MANNERS, PLACES, CONSONANT_CELLS, baseSymbols, diacriticRowsByConsonant),
    [baseSymbols, diacriticRowsByConsonant],
  )
  const { rows: activeVowelHeights, cols: activeVowelBackness } = useMemo(
    () => activeAxes(VOWEL_HEIGHTS, VOWEL_BACKNESS, VOWEL_CELLS, baseSymbols, diacriticRowsByVowel),
    [baseSymbols, diacriticRowsByVowel],
  )

  const activeOtherGroups = useMemo(
    () =>
      OTHER_PHONEME_GROUPS.filter(
        (g) => g.phonemes.some((s) => s && baseSymbols.has(s.trim())) || g.label in diacriticRowsByOther,
      ),
    [baseSymbols, diacriticRowsByOther],
  )

  // Lets us find a sound's id from its symbol, to look up how the rule changes it
  const symbolToPhonemeId = useMemo(() => {
    const map = {}
    for (const item of inventory) {
      if (item.diacritic_id == null) map[item.symbol.trim()] = item.phoneme_id
    }
    return map
  }, [inventory])

  // Draws one spot in the chart: blank if the sound isn't chosen, otherwise a button that opens its features.
  // If the rule changes the sound, the button shows "before → after" ("?" if the result is unknown).
  const renderSelectedSymbol = (symbol) => {
    if (!symbol) return <div className="w-20 h-10" />
    const clean = symbol.trim()
    if (!baseSymbols.has(clean)) return <div className="w-20 h-10" />

    const pid = symbolToPhonemeId[clean]
    const t = pid != null ? transforms[String(pid)] : null
    const hasArrow = t?.matched && t.transformed
    const label = hasArrow ? `${t.original_symbol ?? clean} → ${t.result_symbol ?? '?'}` : clean

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
      {/* Features pop-up, shown on top of the whole page; click outside it to close */}
      {activeItem &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setActiveItem(null)}
          >
            <div className="w-[60%]" onClick={(e) => e.stopPropagation()}>
              <FeaturePanel symbol={activeItem.symbol} feats={activeItem.feats} onClose={() => setActiveItem(null)} />
            </div>
          </div>,
          document.body,
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
          // Same "before → after" label for sounds with a diacritic
          const t = transforms[item.key]
          const chipLabel =
            t?.matched && t.transformed
              ? `${t.original_symbol ?? item.symbol.trim()} → ${t.result_symbol ?? '?'}`
              : undefined
          return (
            <DiacriticChip
              key={item.key}
              item={item}
              onRemove={toggleInventory}
              isDragging={false}
              onClick={(item) =>
                setActiveItem({
                  symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`,
                  feats: diacriticFeatures[item.key] ?? null,
                })
              }
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
