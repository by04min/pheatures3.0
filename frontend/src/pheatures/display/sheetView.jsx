import { FEATURE_NAMES } from '../../inventory/format/phonemeFeatures.js'

// SHEET VIEW
// rows    → one per inventory item (base phoneme or base+diacritic pair)
// columns → phoneme symbol (sticky) + one column per feature in FEATURE_NAMES

export default function SheetView({ inventory, resolveFeatures }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[12px] font-light">
        <thead>
          <tr>
            {/* top-left corner: empty cell above the symbol column */}
            <th className="border border-slate-200 px-3 py-2 bg-slate-50 text-left sticky left-0 z-10 whitespace-nowrap" />

            {/* header row: one column per feature name */}
            {FEATURE_NAMES.map((f) => (
              <th
                key={f}
                className="border border-slate-200 px-3 py-2 bg-slate-50 whitespace-nowrap font-light"
              >
                {f.toLowerCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* one row per inventory item */}
          {inventory.map((item) => {
            const features = resolveFeatures(item)
            // display label: base symbol alone, or base+diacritic combined
            const label = item.diacritic_symbol
              ? `${item.symbol.trim()}${item.diacritic_symbol}`
              : item.symbol.trim()
            return (
              <tr key={item.key}>
                {/* symbol column: sticky so it stays visible on horizontal scroll */}
                <td className="border border-slate-200 px-5 py-2 bg-slate-50 sticky left-0 text-center text-[16px] font-mono w-20">
                  {label}
                </td>

                {/* feature value columns: one cell per feature */}
                {FEATURE_NAMES.map((f) => (
                  <td key={f} className="border border-slate-200 px-3 py-2 text-[14px] text-center">
                    {features?.[f.toLowerCase()] ?? ''}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
