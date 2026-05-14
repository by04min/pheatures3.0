import { useEffect, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { FEATURE_NAMES } from '../inventory/format/phonemeFeatures.js'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

export default function Pheatures() {
  const { inventory } = useInventoryStore()

  // { phoneme_id: { feature: value, ... } }
  const [baseFeatures, setBaseFeatures] = useState({})
  // { item.key: { feature: value, ... } } for diacritic+phoneme pairs
  const [diacriticFeatures, setDiacriticFeatures] = useState({})

  useEffect(() => {
    if (inventory.length === 0) {
      setBaseFeatures({})
      setDiacriticFeatures({})
      return
    }

    const phonemeIds = [...new Set(inventory.map((item) => item.phoneme_id))]
    const diacriticItems = inventory.filter((item) => item.diacritic_id != null)

    const fetchBase = fetch(`${API_BASE}/phonemes/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneme_ids: phonemeIds }),
    }).then((r) => r.json())

    const fetchDiacritics = Promise.all(
      diacriticItems.map((item) =>
        fetch(`${API_BASE}/diacritics/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneme_id: item.phoneme_id, diacritic_id: item.diacritic_id }),
        })
          .then((r) => r.json())
          .then((bundle) => ({ key: item.key, bundle }))
      )
    )

    Promise.all([fetchBase, fetchDiacritics]).then(([base, diacritics]) => {
      setBaseFeatures(base)
      const dMap = {}
      for (const { key, bundle } of diacritics) dMap[key] = bundle
      setDiacriticFeatures(dMap)
    })
  }, [inventory])

  const resolveFeatures = (item) =>
    item.diacritic_id != null
      ? diacriticFeatures[item.key]
      : baseFeatures[String(item.phoneme_id)]

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[12px] font-light">
        <thead>
          <tr>
            {/* empty top-left corner cell above the phoneme symbol column */}
            <th className="border border-slate-200 px-3 py-2 bg-slate-50 text-left sticky left-0 z-10 whitespace-nowrap"/>

            {/* feature name column headers */}
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
          {inventory.map((item) => {
            const features = resolveFeatures(item)
            const label = item.diacritic_symbol
              ? `${item.symbol.trim()}${item.diacritic_symbol}`
              : item.symbol.trim()
            return (
              <tr key={item.key}>
                {/* phoneme symbol — sticky so it stays visible when scrolling horizontally */}
                <td className="border border-slate-200 px-5 py-2 bg-slate-50 sticky left-0 text-center text-[16px] font-mono w-20">
                  {label}
                </td>
                {/* feature values each feature column */}
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
