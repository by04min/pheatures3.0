import { Fragment } from 'react'
import { CONSONANT_CELLS, VOWEL_CELLS } from '../../inventory/data/phonemeLayout.js'

/*
01. DIACRITIC SUB ROWS
    The extra rows under a plain sound that show it with each diacritic applied.
    There are as many rows as the cell with the most diacritics needs.
*/
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

/*
02. MATRIX TABLE
    One chart (consonants or vowels): column labels across the top, row labels down the side,
    and up to two sounds per cell (e.g. voiceless and voiced). Diacritic rows sit under each row.
*/
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

/*
03. IPA TABLE GRID
    The chart layout shared by the Phoneme Inventory page and the Table View page.
    It has three sections (Consonants, Vowels, Other Phonemes), and sounds with
    diacritics appear in extra rows directly beneath their plain sound.

    Each page decides how a sound and a diacritic look by passing in two functions:
    - renderSymbol(symbol): draws one sound (or a blank space)
    - renderDiacriticChip(item): draws one sound-with-diacritic
*/
export function IpaTableGrid({
  // Which rows and columns to show (everything on the inventory page, only chosen ones on the table view)
  activeManners,
  activePlaces,
  activeVowelHeights,
  activeVowelBackness,
  activeOtherGroups,
  // Sounds with diacritics, grouped by where they belong in the chart
  diacriticRowsByConsonant,
  diacriticRowsByVowel,
  diacriticRowsByOther,
  // How each sound and each sound-with-diacritic is drawn
  renderSymbol,
  renderDiacriticChip,
  // Cell width, and the width of one sound within a cell
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

        {/* OTHER PHONEMES — split into two smaller tables (first four groups, then the rest) */}
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
                      <tr>
                        {groups.map((group) => (
                          <td key={group.label} className={dataCellCls}>
                            <div className="flex">{group.phonemes.map((s) => renderSymbol(s))}</div>
                          </td>
                        ))}
                      </tr>
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
