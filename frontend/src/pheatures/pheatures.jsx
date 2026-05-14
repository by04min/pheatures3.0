import { useEffect, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import SheetView from './display/sheetView.jsx'
import TableView from './display/tableView.jsx'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000/api')

export default function Pheatures() {
  const { inventory } = useInventoryStore()
  const [view, setView] = useState('sheet')

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
    <div className="space-y-[24px]">
      <div className="flex gap-2">
        {['sheet', 'table'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-[16px] py-[8px] rounded-[4px] text-[14px] font-light capitalize transition-colors ${
              view === v
                ? 'bg-gray-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {view === 'sheet'
        ? <SheetView inventory={inventory} resolveFeatures={resolveFeatures} />
        : <TableView />
      }
    </div>
  )
}
