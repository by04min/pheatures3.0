import { CONSONANT_CELLS, VOWEL_CELLS } from '../../inventory/format/phonemeLayout.js'

// 01. SYMBOL BUTTON: each symbol in the table is like a 'button' that the user can select
export function SymbolButton({ symbol, disabled, isActive, isInInventory, isDragging, isDragTarget, isInvalidDropTarget, onSelect, onDrop, onInvalidDrop, title }) {

  if (!symbol)
    return <div className="w-14 h-10" />

  return (
    <button
      type="button"
      onClick={() => onSelect(symbol)}
      disabled={disabled && !isDragTarget}
      title={title}
      onDragOver={(isDragTarget || isInvalidDropTarget) ? (e) => e.preventDefault() : undefined}
      onDrop={isDragTarget ? onDrop : isInvalidDropTarget ? onInvalidDrop : undefined}
      className={`w-14 h-10 text-base font-mono text-center transition-colors ${
        isDragging && !isDragTarget
          ? 'text-slate-300 cursor-not-allowed'
          : isDragTarget
          ? 'hover:bg-slate-100 cursor-copy'
          : isInInventory
          ? 'bg-blue-100'
          : disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'hover:bg-slate-100 cursor-pointer'
      }`}
    >
      {symbol}
    </button>
  )
}

// 02. CONSONANT LAYOUT: each cell in the table can have up to two sounds (voiceless on the left, voiced on the right)
export function ConsonantCell({ manner, place, renderSymbolButton }) {
  const phonemes = CONSONANT_CELLS[manner]?.[place]
  if (!phonemes) return <td className="border border-slate-200 w-28" />
  return (
    <td className="border border-slate-200 w-28">
      <div className="flex">
        {renderSymbolButton(phonemes[0])}
        {renderSymbolButton(phonemes[1] ?? null)}
      </div>
    </td>
  )
}

// 03. VOWEL LAYOUT: same as the consonant table! left is unrounded, right is rounded
export function VowelCell({ height, backness, renderSymbolButton }) {
  const phonemes = VOWEL_CELLS[height]?.[backness]
  if (!phonemes) return <td className="border border-slate-200 w-28" />
  return (
    <td className="border border-slate-200 p-0 w-28">
      <div className="flex justify-center">
        {renderSymbolButton(phonemes[0])}
        {renderSymbolButton(phonemes[1] ?? null)}
      </div>
    </td>
  )
}

// 04. DIACRITIC CHIP: a modified phoneme shown inline in the table row beneath its base phoneme.
//     clicking removes it from the inventory (same toggleInventory logic as SymbolButton).
//     pass `label` to override the display text (e.g. "pː → bː" when a rule is active).
export function DiacriticChip({ item, onRemove, isDragging, onClick, label }) {
  const display = label ?? `${(item.symbol ?? '').trim()}${item.diacritic_symbol ?? ''}`
  return (
    <button
      type="button"
      onClick={() => onClick ? onClick(item) : onRemove(item)}
      title={`${display} — click to remove`}
      className={`w-20 h-10 font-mono text-center transition-colors ${
        label ? 'text-[12px] px-0.5' : 'text-[14px]'
      } ${
        isDragging ? 'text-slate-300 cursor-not-allowed' : 'bg-blue-100 cursor-pointer'
      }`}
    >
      {display}
    </button>
  )
}
