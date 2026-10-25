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
import { CONSONANT_CELLS, VOWEL_CELLS } from '../../inventory/data/phonemeLayout.js'

// Diacritic sub-rows stacked under a base row: one <tr> per diacritic applied to a base phoneme.
//   columns: [{ key, items, slots }] — items is { slotIdx: item[] } (or undefined), slots is the
//            number of phoneme slots in that column's cell (2 for consonants/vowels, group size for "other")
//   hasHeader: whether the table has a leading row-header column that needs an empty cell
function DiacriticSubRows({ columns, hasHeader, justify = '', cellCls, headerCls, slotWidth, renderDiacriticChip }) {
  const numRows = Math.max(
    0,
    ...columns.flatMap(({ items, slots }) => Array.from({ length: slots }, (_, idx) => items?.[idx]?.length ?? 0)),
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

// One matrix table (consonants or vowels): a header of column labels, then one base row per row label
// followed by its diacritic sub-rows. Each cell holds up to two phoneme slots.
//   rows / cols: row and column labels to render
//   cells: cells[row][col] = [symbol, symbol?] (e.g. CONSONANT_CELLS)
//   diacriticRows: diacriticRows[row][col][slotIdx] = item[] (from useDiacriticRows)
//   cornerWidth: width class of the row-label column, wide enough for the longest label
//   scrollX: wrap the table so it scrolls horizontally
//   justify: flex justification for the slots inside a cell
//   styles: shared class strings and render props from IpaTableGrid
function MatrixTable({ title, rows, cols, cells, diacriticRows, cornerWidth, scrollX = false, justify = '', styles }) {
  const { tableCls, headerCellCls, rowHeaderCls, dataCellCls, subRowProps, renderSymbol } = styles
  const table = (
    <table className={tableCls}>
      <thead>
        <tr>
          <th className={`border border-slate-200 ${cornerWidth} bg-slate-50 dark:bg-gray-100`} />
          {cols.map((col) => (
            <th key={col} className={headerCellCls}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Fragment key={row}>
            {/* base phoneme row */}
            <tr>
              <td className={rowHeaderCls}>{row}</td>
              {cols.map((col) => {
                const phonemes = cells[row]?.[col]
                if (!phonemes) return <td key={col} className={dataCellCls} />
                return (
                  <td key={col} className={dataCellCls}>
                    <div className={`flex ${justify}`}>
                      {renderSymbol(phonemes[0])}
                      {renderSymbol(phonemes[1] ?? null)}
                    </div>
                  </td>
                )
              })}
            </tr>
            {/* one sub-row per diacritic stacked under this row */}
            <DiacriticSubRows
              {...subRowProps}
              hasHeader
              justify={justify}
              columns={cols.map((col) => ({ key: col, items: diacriticRows[row]?.[col], slots: 2 }))}
            />
          </Fragment>
        ))}
      </tbody>
    </table>
  )
  return (
    <section className="space-y-[8px] font-light">
      <h3 className="text-[16px]">{title}</h3>
      {scrollX ? <div className="overflow-x-auto">{table}</div> : table}
    </section>
  )
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
  const matrixStyles = { tableCls, headerCellCls, rowHeaderCls, dataCellCls, subRowProps, renderSymbol }

  return (
    <div className="space-y-[32px]">
      {/* ── CONSONANTS ── */}
      {activeManners.length > 0 && (
        <MatrixTable
          title="Consonants"
          rows={activeManners}
          cols={activePlaces}
          cells={CONSONANT_CELLS}
          diacriticRows={diacriticRowsByConsonant}
          cornerWidth="w-36"
          scrollX
          styles={matrixStyles}
        />
      )}

      {/* ── VOWELS + OTHER PHONEMES ── */}
      <div className="flex flex-wrap gap-12">
        {/* VOWELS */}
        {activeVowelHeights.length > 0 && (
          <MatrixTable
            title="Vowels"
            rows={activeVowelHeights}
            cols={activeVowelBackness}
            cells={VOWEL_CELLS}
            diacriticRows={diacriticRowsByVowel}
            cornerWidth="w-32"
            justify="justify-center"
            styles={matrixStyles}
          />
        )}

        {/* OTHER PHONEMES — split into two sub-tables (groups 0–3 and 4+) */}
        {activeOtherGroups.length > 0 && (
          <section className="space-y-[8px] font-light">
            <h3 className="text-[16px]">Other Phonemes</h3>
            <div className="flex flex-col gap-2">
              {[activeOtherGroups.slice(0, 4), activeOtherGroups.slice(4)]
                .filter((g) => g.length > 0)
                .map((groups, i) => (
                  <table key={i} className={tableCls}>
                    <thead>
                      <tr>
                        {groups.map((group) => (
                          <th key={group.label} className={headerCellCls}>
                            {group.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* base phoneme row */}
                      <tr>
                        {groups.map((group) => (
                          <td key={group.label} className={dataCellCls}>
                            <div className="flex">{group.phonemes.map((s) => renderSymbol(s))}</div>
                          </td>
                        ))}
                      </tr>
                      {/* one sub-row per diacritic stacked under each group */}
                      <DiacriticSubRows
                        {...subRowProps}
                        columns={groups.map((group) => ({
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
