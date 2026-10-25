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
import {
  CONSONANT_CELLS,
  VOWEL_CELLS,
} from '../../inventory/format/phonemeLayout.js'

// Diacritic sub-rows stacked under a base row: one <tr> per diacritic applied to a base phoneme.
//   columns: [{ key, items, slots }] — items is { slotIdx: item[] } (or undefined), slots is the
//            number of phoneme slots in that column's cell (2 for consonants/vowels, group size for "other")
//   hasHeader: whether the table has a leading row-header column that needs an empty cell
function DiacriticSubRows({ columns, hasHeader, justify = '', cellCls, headerCls, slotWidth, renderDiacriticChip }) {
  const numRows = Math.max(
    0,
    ...columns.flatMap(({ items, slots }) =>
      Array.from({ length: slots }, (_, idx) => items?.[idx]?.length ?? 0)
    )
  )
  return Array.from({ length: numRows }, (_, rowIdx) => (
    <tr key={rowIdx}>
      {hasHeader && <td className={headerCls} />}
      {columns.map(({ key, items, slots }) => {
        if (!items) return <td key={key} className={cellCls} />
        return (
          <td key={key} className={cellCls}>
            <div className={`flex ${justify}`}>
              {Array.from({ length: slots }, (_, idx) => {
                const item = items[idx]?.[rowIdx]
                if (!item) return <div key={idx} className={`${slotWidth} h-10`} />
                return renderDiacriticChip(item)
              })}
            </div>
          </td>
        )
      })}
    </tr>
  ))
}

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

  const tableCls = `border-collapse text-xs text-black bg-white dark:bg-slate-50`
  const headerCellCls = `border border-slate-200 text-center font-light px-[8px] py-[12px] ${cellWidth} bg-slate-50 dark:bg-gray-100 text-[12px]`
  const rowHeaderCls = `border border-slate-200 px-[8px] py-[12px] text-[12px] bg-slate-50 dark:bg-gray-100 font-light whitespace-nowrap`
  const subRowHeaderCls = `border border-slate-200 bg-slate-50 dark:bg-gray-100`
  const dataCellCls = `border border-slate-200 ${cellWidth}`
  const subRowProps = { cellCls: dataCellCls, headerCls: subRowHeaderCls, slotWidth, renderDiacriticChip }

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
                  <th className={`border border-slate-200 w-36 bg-slate-50 dark:bg-gray-100`} />
                  {activePlaces.map(p => (
                    <th key={p} className={headerCellCls}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeManners.map(manner => (
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
                    <DiacriticSubRows
                      {...subRowProps}
                      hasHeader
                      columns={activePlaces.map(place => ({
                        key: place,
                        items: diacriticRowsByConsonant[manner]?.[place],
                        slots: 2,
                      }))}
                    />
                  </Fragment>
                ))}
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
                  <th className={`border border-slate-200 w-32 bg-slate-50 dark:bg-gray-100`} />
                  {activeVowelBackness.map(b => (
                    <th key={b} className={headerCellCls}>{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeVowelHeights.map(height => (
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
                    <DiacriticSubRows
                      {...subRowProps}
                      hasHeader
                      justify="justify-center"
                      columns={activeVowelBackness.map(backness => ({
                        key: backness,
                        items: diacriticRowsByVowel[height]?.[backness],
                        slots: 2,
                      }))}
                    />
                  </Fragment>
                ))}
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
                .map((groups, i) => (
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
                      <DiacriticSubRows
                        {...subRowProps}
                        columns={groups.map(group => ({
                          key: group.label,
                          items: diacriticRowsByOther[group.label],
                          slots: group.phonemes.length,
                        }))}
                      />
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
