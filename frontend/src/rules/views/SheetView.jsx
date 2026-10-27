import { FEATURE_NAMES } from '../../data/phonemeFeatures.js'

/*
01. SHEET VIEW
    A spreadsheet of the chosen sounds: one row per sound, one column per feature.
    If a rule changes a sound, it shows "before → after" and the changed features.
*/
export default function SheetView({ inventory, resolveFeatures, transforms = {} }) {
  return (
    <div className="relative overflow-x-auto">
      <table className={`border-collapse text-[12px] font-light text-black bg-white dark:bg-slate-50`}>
        <thead>
          <tr>
            {/* empty corner cell above the sounds column */}
            <th
              className={`border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-gray-100 text-left sticky left-0 z-10 whitespace-nowrap`}
            />

            {/* column headings: the feature names */}
            {FEATURE_NAMES.map((f) => (
              <th
                key={f}
                className={`border border-slate-200 px-3 py-2 bg-slate-50 dark:bg-gray-100 whitespace-nowrap font-light`}
              >
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const features = resolveFeatures(item)
            // The sound's name: the plain symbol, or the symbol with its diacritic
            const baseLabel = item.diacritic_symbol
              ? `${item.symbol.trim()}${item.diacritic_symbol}`
              : item.symbol.trim()

            // If the rule changed this sound, show "before → after" ("?" if the result is unknown)
            const t = transforms[item.key]
            const symbolCell =
              t?.matched && t.transformed ? `${t.original_symbol ?? baseLabel} → ${t.result_symbol ?? '?'}` : baseLabel

            return (
              <tr key={item.key}>
                {/* the sound (stays visible when scrolling sideways) */}
                <td
                  className={`border border-slate-200 px-5 py-2 bg-slate-50 dark:bg-gray-100 sticky left-0 text-center text-[14px] font-mono whitespace-nowrap`}
                >
                  {symbolCell}
                </td>

                {/* the sound's value (+, -, 0) for each feature, after the rule is applied */}
                {FEATURE_NAMES.map((f) => (
                  <td key={f} className="border border-slate-200 px-3 py-2 text-[14px] text-center">
                    {features?.[f] ?? ''}
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
