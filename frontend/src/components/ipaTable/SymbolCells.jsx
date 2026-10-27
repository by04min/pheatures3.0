/*
01. SYMBOL BUTTON
    Each symbol in the table is a button the user can select
*/
export function SymbolButton({
  symbol,
  disabled,
  isInInventory,
  isDragging,
  isDragTarget,
  isInvalidDropTarget,
  onSelect,
  onDrop,
  onInvalidDrop,
  title,
}) {
  return (
    <button
      type="button"
      data-phoneme-symbol={symbol}
      onClick={() => onSelect(symbol)}
      disabled={disabled && !isDragTarget}
      title={title}
      onDragOver={isDragTarget || isInvalidDropTarget ? (e) => e.preventDefault() : undefined}
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

/*
02. DIACRITIC CHIP
    A sound with a diacritic, shown in the row beneath its plain sound.
    Clicking removes it from the inventory (same toggle as the symbol button).
    A custom label can replace the text, e.g. "pː → bː" when a rule is active.
*/
export function DiacriticChip({
  item,
  onRemove,
  isDragging,
  onClick,
  label,
  widthClass = 'w-14',
  textClass = 'text-base',
}) {
  const display = label ?? `${(item.symbol ?? '').trim()}${item.diacritic_symbol ?? ''}`
  return (
    <button
      type="button"
      onClick={() => (onClick ? onClick(item) : onRemove(item))}
      title={`${display} — click to remove`}
      className={`${widthClass} h-10 font-mono text-center transition-colors ${
        label ? 'text-[12px] px-0.5' : textClass
      } ${isDragging ? 'text-slate-300 cursor-not-allowed' : 'bg-blue-100 cursor-pointer'}`}
    >
      {display}
    </button>
  )
}
