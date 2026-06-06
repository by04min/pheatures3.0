// TABLE VIEW
// displays the selected inventory laid out like an IPA chart:
//   consonants: rows = manner, columns = place, each cell holds [voiceless, voiced]
//   vowels:     rows = height, columns = backness, each cell holds [unrounded, rounded]
//   other:      rows = phoneme group label, columns = individual phonemes
//
// only rows/columns that contain at least one selected phoneme are rendered.
// diacritic items appear in a sub-row directly below their base phoneme's row.
// clicking any phoneme or diacritic chip opens a FeaturePanel modal.

import { Fragment, useMemo, useState } from 'react'
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
import { DiacriticChip } from '../../components/ipaTable/symbolCells.jsx'

// inventory prop overrides the store when rules are active (filtered to matched phonemes)
// transforms: { phoneme_id_str: { matched, original_symbol, result_symbol } } — drives chip labels
export default function TableView({ inventory: inventoryProp, transforms = {}, loading = false, diacriticFeatures = {} }) {
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
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          <span className="text-sm text-slate-600">Applying Rules...</span>
        </div>
      )}

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

      {/* CONSONANTS
          rows    = manner of articulation (activeManners)
          columns = place of articulation (activePlaces)
          each cell: [voiceless slot, voiced slot]
          sub-row: diacritic items grouped under their base phoneme's manner row */}
      {activeManners.length > 0 && (
        <section className="space-y-[8px] font-light">
          <h3 className="text-[16px]">Consonants</h3>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  {/* corner cell */}
                  <th className="border border-slate-200 w-36 bg-slate-50" />
                  {/* place of articulation column headers */}
                  {activePlaces.map(p => (
                    <th key={p} className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-40 bg-slate-50 text-[12px]">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeManners.map(manner => {
                  const diacriticCols = diacriticRowsByConsonant[manner]
                  return (
                    <Fragment key={manner}>
                      {/* base phoneme row */}
                      <tr>
                        {/* manner of articulation row header */}
                        <td className="border border-slate-200 px-[8px] py-[12px] text-[12px] bg-slate-50 font-light whitespace-nowrap">
                          {manner}
                        </td>
                        {activePlaces.map(place => {
                          const phonemes = CONSONANT_CELLS[manner]?.[place]
                          if (!phonemes) return <td key={place} className="border border-slate-200 w-40" />
                          return (
                            <td key={place} className="border border-slate-200 w-40">
                              <div className="flex">
                                {/* [0] = voiceless, [1] = voiced */}
                                {renderSelectedSymbol(phonemes[0])}
                                {renderSelectedSymbol(phonemes[1] ?? null)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                      {/* diacritic sub-row: only rendered when this manner has diacritic items */}
                      {diacriticCols && (
                        <tr>
                          <td className="border border-slate-200 bg-slate-50" />
                          {activePlaces.map(place => {
                            const cellItems = diacriticCols[place]
                            if (!cellItems) return <td key={place} className="border border-slate-200 w-40" />
                            return (
                              <td key={place} className="border border-slate-200 w-40">
                                <div className="flex">
                                  {[0, 1].map(idx => {
                                    const items = cellItems[idx]
                                    if (!items?.length) return <div key={idx} className="w-20 h-10" />
                                    return items.map(item => {
                                      const td = transforms[item.key]
                                      const chipLabel = td?.matched && td.transformed
                                        ? `${td.original_symbol ?? item.symbol.trim()} → ${td.result_symbol ?? '?'}`
                                        : undefined
                                      return <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={false} onClick={(item) => setActiveItem({ symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`, feats: diacriticFeatures[item.key] ?? null })} label={chipLabel} widthClass="w-20" textClass="text-[14px]" />
                                    })
                                  })}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-12">
        {/* VOWELS
            rows    = vowel height (activeVowelHeights)
            columns = backness (activeVowelBackness)
            each cell: [unrounded slot, rounded slot]
            sub-row: diacritic items grouped under their base phoneme's height row */}
        {activeVowelHeights.length > 0 && (
          <section className="space-y-[8px] font-light">
            <h3 className="text-[16px]">Vowels</h3>
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  {/* corner cell */}
                  <th className="border border-slate-200 w-40 bg-slate-50" />
                  {/* backness column headers */}
                  {activeVowelBackness.map(b => (
                    <th key={b} className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-40 bg-slate-50 text-[12px]">
                      {b}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeVowelHeights.map(height => {
                  const diacriticCols = diacriticRowsByVowel[height]
                  return (
                    <Fragment key={height}>
                      {/* base phoneme row */}
                      <tr>
                        {/* vowel height row header */}
                        <td className="border border-slate-200 px-[8px] py-[12px] text-[12px] bg-slate-50 font-light whitespace-nowrap">
                          {height}
                        </td>
                        {activeVowelBackness.map(backness => {
                          const phonemes = VOWEL_CELLS[height]?.[backness]
                          if (!phonemes) return <td key={backness} className="border border-slate-200 w-40" />
                          return (
                            <td key={backness} className="border border-slate-200 w-40">
                              <div className="flex justify-center">
                                {/* [0] = unrounded, [1] = rounded */}
                                {renderSelectedSymbol(phonemes[0])}
                                {renderSelectedSymbol(phonemes[1] ?? null)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                      {/* diacritic sub-row: only rendered when this height has diacritic items */}
                      {diacriticCols && (
                        <tr>
                          <td className="border border-slate-200 bg-slate-50" />
                          {activeVowelBackness.map(backness => {
                            const cellItems = diacriticCols[backness]
                            if (!cellItems) return <td key={backness} className="border border-slate-200 w-40" />
                            return (
                              <td key={backness} className="border border-slate-200 p-0 w-40">
                                <div className="flex justify-center">
                                  {[0, 1].map(idx => {
                                    const items = cellItems[idx]
                                    if (!items?.length) return <div key={idx} className="w-20 h-10" />
                                    return items.map(item => {
                                      const td = transforms[item.key]
                                      const chipLabel = td?.matched && td.transformed
                                        ? `${td.original_symbol ?? item.symbol.trim()} → ${td.result_symbol ?? '?'}`
                                        : undefined
                                      return <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={false} onClick={(item) => setActiveItem({ symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`, feats: diacriticFeatures[item.key] ?? null })} label={chipLabel} widthClass="w-20" textClass="text-[14px]" />
                                    })
                                  })}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* OTHER PHONEMES
            columns = phoneme group label (e.g. "lab-velar approx")
            rows    = base phoneme row + optional diacritic sub-row
            split into two sub-tables (groups 0–3 and 4+) to match the inventory layout */}
        {activeOtherGroups.length > 0 && (
          <section className="space-y-[8px] font-light">
            <h3 className="text-[16px]">Other Phonemes</h3>
            <div className="flex flex-col gap-2">
              {[activeOtherGroups.slice(0, 4), activeOtherGroups.slice(4)].filter(g => g.length > 0).map((groups, i) => (
                <table key={i} className="border-collapse text-xs">
                  <thead>
                    <tr>
                      {/* group label column headers */}
                      {groups.map(group => (
                        <th key={group.label} className="border border-slate-200 text-center font-light px-[8px] py-[12px] w-40 bg-slate-50 text-[12px]">
                          {group.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* base phoneme row */}
                    <tr>
                      {groups.map(group => (
                        <td key={group.label} className="border border-slate-200 w-40">
                          <div className="flex">
                            {group.phonemes.map(s => renderSelectedSymbol(s))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    {/* diacritic sub-row: only rendered when any group in this table has diacritic items */}
                    {groups.some(g => g.label in diacriticRowsByOther) && (
                      <tr>
                        {groups.map(group => {
                          const cellItems = diacriticRowsByOther[group.label]
                          if (!cellItems) return <td key={group.label} className="border border-slate-200 w-40" />
                          return (
                            <td key={group.label} className="border border-slate-200 w-40">
                              <div className="flex">
                                {group.phonemes.map((_, idx) => {
                                  const items = cellItems[idx]
                                  if (!items?.length) return <div key={idx} className="w-20 h-10" />
                                  return items.map(item => {
                                    const td = transforms[item.key]
                                    const chipLabel = td?.matched && td.transformed
                                      ? `${td.original_symbol ?? item.symbol.trim()} → ${td.result_symbol ?? '?'}`
                                      : undefined
                                    return <DiacriticChip key={item.key} item={item} onRemove={toggleInventory} isDragging={false} onClick={(item) => setActiveItem({ symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`, feats: diacriticFeatures[item.key] ?? null })} label={chipLabel} widthClass="w-20" textClass="text-[14px]" />
                                  })
                                })}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
