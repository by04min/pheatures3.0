import { Link } from 'react-router-dom'
import { FEATURE_NAMES } from '../../inventory/format/phonemeFeatures.js'

// SHEET VIEW
// rows    → one per inventory item (base phoneme or base+diacritic pair)
// columns → phoneme symbol (sticky) + one column per feature in FEATURE_NAMES
//
// when transforms are active, the symbol column shows "original → result" (or "original → ?")
// and feature columns reflect the transformed bundle

export default function SheetView({ inventory, resolveFeatures, transforms = {} }) {
  if (inventory.length === 0) {
    // rules are active but nothing matched — don't prompt user to add phonemes
    const rulesActive = Object.keys(transforms).length > 0
    if (rulesActive) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <span className="text-[14px] font-light text-slate-400">no phonemes match the target features.</span>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Link
          to="/inventory"
          className="text-[14px] px-[8px] py-[8px] border rounded-[4px] font-light hover:bg-slate-50"
        >
          add to inventory
        </Link>
      </div>
    )
  }

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
            const baseLabel = item.diacritic_symbol
              ? `${item.symbol.trim()}${item.diacritic_symbol}`
              : item.symbol.trim()

            // when a transform matched and actually changed the phoneme, show "original → result"
            const t = transforms[String(item.phoneme_id)]
            const symbolCell = t?.matched && t.transformed
              ? `${t.original_symbol ?? baseLabel} → ${t.result_symbol ?? '?'}`
              : baseLabel

            return (
              <tr key={item.key}>
                {/* symbol column: sticky; shows transform arrow when rules are active */}
                <td className="border border-slate-200 px-5 py-2 bg-slate-50 sticky left-0 text-center text-[14px] font-mono whitespace-nowrap">
                  {symbolCell}
                </td>

                {/* feature value columns: reflect transformed bundle when applicable */}
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
