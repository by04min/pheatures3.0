/**
 * IPA TABLE GRID
 *
 * Shared table layout used by both PhonemeInventory and TableView.
 * Renders three sections — Consonants, Vowels, Other Phonemes — with
 * diacritic items appearing in individual sub-rows beneath their base row.
 *
 * The caller controls what goes inside each cell by passing two render props:
 *   renderSymbol(symbol)      — renders one phoneme slot (base phoneme or placeholder)
 *   renderDiacriticChip(item) — renders one diacritic chip in a sub-row
 *
 * Differences between PhonemeInventory and TableView are isolated to those
 * two callbacks and the cellWidth / slotWidth sizing props.
 */

import { Fragment } from 'react'
import { useThemeStore } from '../../store/themeStore'
import {
  CONSONANT_CELLS,
  VOWEL_CELLS,
} from '../../inventory/format/phonemeLayout.js'

export function IpaTableGrid({
  // rows / columns to render (pass full MANNERS/PLACES/etc. for PhonemeInventory;
  // filtered arrays for TableView)
  activeManners,
  activePlaces,
  activeVowelHeights,
  activeVowelBackness,
  activeOtherGroups,
  // diacritic grouping data from useDiacriticRows()
  diacriticRowsByConsonant,
  diacriticRowsByVowel,
  diacriticRowsByOther,
  // render props
  renderSymbol,
  renderDiacriticChip,
  // sizing: data-cell width and half-cell slot placeholder width
  cellWidth = 'w-28',
  slotWidth = 'w-14',
}) {
  const { isDark } = useThemeStore()

  const tableCls = `border-collapse text-xs text-black ${isDark ? 'bg-slate-50' : 'bg-white'}`
  const headerCellCls = `border border-slate-200 text-center font-light px-[8px] py-[12px] ${cellWidth} ${isDark ? 'bg-gray-100' : 'bg-slate-50'} text-[12px]`
  const rowHeaderCls = `border border-slate-200 px-[8px] py-[12px] text-[12px] ${isDark ? 'bg-gray-100' : 'bg-slate-50'} font-light whitespace-nowrap`
  const subRowHeaderCls = `border border-slate-200 ${isDark ? 'bg-gray-100' : 'bg-slate-50'}`
  const dataCellCls = `border border-slate-200 ${cellWidth}`

  return (
    <div className="space-y-[32px]">

      {/* ── CONSONANTS ── */}
      {activeManners.length > 0 && (
        <section className="space-y-[8px] font-light">
          <h3 className="text-[16px]">Consonants</h3>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr>
                  {/* corner cell — w-36 gives enough room for manner labels */}
                  <th className={`border border-slate-200 w-36 ${isDark ? 'bg-gray-100' : 'bg-slate-50'}`} />
                  {activePlaces.map(p => (
                    <th key={p} className={headerCellCls}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeManners.map(manner => {
                  const diacriticCols = diacriticRowsByConsonant[manner]
                  const numDiacriticRows = diacriticCols
                    ? Math.max(...activePlaces.flatMap(place =>
                        [0, 1].map(idx => diacriticCols[place]?.[idx]?.length ?? 0)
                      ))
                    : 0
                  return (
                    <Fragment key={manner}>
                      {/* base phoneme row */}
                      <tr>
                        <td className={rowHeaderCls}>{manner}</td>
                        {activePlaces.map(place => {
                          const phonemes = CONSONANT_CELLS[manner]?.[place]
                          if (!phonemes) return <td key={place} className={dataCellCls} />
                          return (
                            <td key={place} className={dataCellCls}>
                              <div className="flex">
                                {renderSymbol(phonemes[0])}
                                {renderSymbol(phonemes[1] ?? null)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                      {/* one sub-row per diacritic stacked under this manner */}
                      {Array.from({ length: numDiacriticRows }, (_, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className={subRowHeaderCls} />
                          {activePlaces.map(place => {
                            const cellItems = diacriticCols[place]
                            if (!cellItems) return <td key={place} className={dataCellCls} />
                            return (
                              <td key={place} className={dataCellCls}>
                                <div className="flex">
                                  {[0, 1].map(idx => {
                                    const item = cellItems[idx]?.[rowIdx]
                                    if (!item) return <div key={idx} className={`${slotWidth} h-10`} />
                                    return renderDiacriticChip(item)
                                  })}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── VOWELS + OTHER PHONEMES ── */}
      <div className="flex flex-wrap gap-12">

        {/* VOWELS */}
        {activeVowelHeights.length > 0 && (
          <section className="space-y-[8px] font-light">
            <h3 className="text-[16px]">Vowels</h3>
            <table className={tableCls}>
              <thead>
                <tr>
                  {/* corner cell — w-32 gives enough room for height labels */}
                  <th className={`border border-slate-200 w-32 ${isDark ? 'bg-gray-100' : 'bg-slate-50'}`} />
                  {activeVowelBackness.map(b => (
                    <th key={b} className={headerCellCls}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeVowelHeights.map(height => {
                  const diacriticCols = diacriticRowsByVowel[height]
                  const numDiacriticRows = diacriticCols
                    ? Math.max(...activeVowelBackness.flatMap(backness =>
                        [0, 1].map(idx => diacriticCols[backness]?.[idx]?.length ?? 0)
                      ))
                    : 0
                  return (
                    <Fragment key={height}>
                      {/* base phoneme row */}
                      <tr>
                        <td className={rowHeaderCls}>{height}</td>
                        {activeVowelBackness.map(backness => {
                          const phonemes = VOWEL_CELLS[height]?.[backness]
                          if (!phonemes) return <td key={backness} className={dataCellCls} />
                          return (
                            <td key={backness} className={dataCellCls}>
                              <div className="flex justify-center">
                                {renderSymbol(phonemes[0])}
                                {renderSymbol(phonemes[1] ?? null)}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                      {/* one sub-row per diacritic stacked under this height */}
                      {Array.from({ length: numDiacriticRows }, (_, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className={subRowHeaderCls} />
                          {activeVowelBackness.map(backness => {
                            const cellItems = diacriticCols[backness]
                            if (!cellItems) return <td key={backness} className={dataCellCls} />
                            return (
                              <td key={backness} className={`border border-slate-200 p-0 ${cellWidth}`}>
                                <div className="flex justify-center">
                                  {[0, 1].map(idx => {
                                    const item = cellItems[idx]?.[rowIdx]
                                    if (!item) return <div key={idx} className={`${slotWidth} h-10`} />
                                    return renderDiacriticChip(item)
                                  })}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* OTHER PHONEMES — split into two sub-tables (groups 0–3 and 4+) */}
        {activeOtherGroups.length > 0 && (
          <section className="space-y-[8px] font-light">
            <h3 className="text-[16px]">Other Phonemes</h3>
            <div className="flex flex-col gap-2">
              {[activeOtherGroups.slice(0, 4), activeOtherGroups.slice(4)]
                .filter(g => g.length > 0)
                .map((groups, i) => {
                  const numDiacriticRows = groups.some(g => g.label in diacriticRowsByOther)
                    ? Math.max(...groups.flatMap(group =>
                        group.phonemes.map((_, idx) => diacriticRowsByOther[group.label]?.[idx]?.length ?? 0)
                      ))
                    : 0
                  return (
                    <table key={i} className={tableCls}>
                      <thead>
                        <tr>
                          {groups.map(group => (
                            <th key={group.label} className={headerCellCls}>{group.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* base phoneme row */}
                        <tr>
                          {groups.map(group => (
                            <td key={group.label} className={dataCellCls}>
                              <div className="flex">
                                {group.phonemes.map(s => renderSymbol(s))}
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* one sub-row per diacritic stacked under each group */}
                        {Array.from({ length: numDiacriticRows }, (_, rowIdx) => (
                          <tr key={rowIdx}>
                            {groups.map(group => {
                              const cellItems = diacriticRowsByOther[group.label]
                              if (!cellItems) return <td key={group.label} className={dataCellCls} />
                              return (
                                <td key={group.label} className={dataCellCls}>
                                  <div className="flex">
                                    {group.phonemes.map((_, idx) => {
                                      const item = cellItems[idx]?.[rowIdx]
                                      if (!item) return <div key={idx} className={`${slotWidth} h-10`} />
                                      return renderDiacriticChip(item)
                                    })}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
