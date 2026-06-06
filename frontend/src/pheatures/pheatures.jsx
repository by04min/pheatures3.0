import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInventoryStore } from '../store/inventoryStore'
import SheetView from './display/sheetView.jsx'
import TableView from './display/tableView.jsx'
import RulePanel from './RulePanel.jsx'
import { hasRedundantTargetFeatures, hasRedundantChangeFeatures } from './ruleValidation.js'

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

  // rule panel row state: [{value: '+'/'-'/'0', feature: string}]
  // start with one empty row so the panel always shows inputs on load
  const [targetRows, setTargetRows] = useState([{ value: '', feature: '' }])
  const [changeRows, setChangeRows] = useState([{ value: '', feature: '' }])

  // transform results from /api/phonemes/transform: { phoneme_id_str: { matched, original_symbol, result_symbol, result_bundle, valid } }
  const [transforms, setTransforms] = useState({})
  const [transformsLoading, setTransformsLoading] = useState(false)

  // fetch base feature bundles whenever inventory changes
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

  // call the transform endpoint whenever rules or inventory changes
  useEffect(() => {
    // only rows where both value and feature are filled count
    const targetFeatures = Object.fromEntries(
      targetRows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value])
    )
    const featureChanges = Object.fromEntries(
      changeRows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value])
    )

    // clear only when both columns are empty; either alone is enough to call the backend:
    // - target only → filter inventory to matching phonemes
    // - changes only → apply to all inventory phonemes (empty target matches everything)
    if (Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0) {
      setTransforms({})
      setTransformsLoading(false)
      return
    }

    const phonemeIds = [...new Set(inventory.map((item) => item.phoneme_id))]
    if (phonemeIds.length === 0) {
      setTransforms({})
      setTransformsLoading(false)
      return
    }

    // send all diacritic items; include the pre-fetched bundle when available so the backend
    // can skip its own DB lookup, otherwise the backend derives it from phoneme_id + diacritic_id
    const diacriticItems = inventory
      .filter((item) => item.diacritic_id != null)
      .map((item) => ({
        key: item.key,
        phoneme_id: item.phoneme_id,
        diacritic_id: item.diacritic_id,
        symbol: `${item.symbol.trim()}${item.diacritic_symbol ?? ''}`,
        bundle: diacriticFeatures[item.key] ?? null,
      }))

    setTransformsLoading(true)
    fetch(`${API_BASE}/phonemes/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneme_ids: phonemeIds, diacritic_items: diacriticItems, target_features: targetFeatures, feature_changes: featureChanges }),
    })
      .then((r) => r.json())
      .then((data) => { setTransforms(data); setTransformsLoading(false) })
      .catch(() => setTransformsLoading(false))
  }, [targetRows, changeRows, inventory, diacriticFeatures])

  // contradiction results from /api/rules/check: { target_contradictions: [...], change_contradictions: [...] }
  const [contradictions, setContradictions] = useState({ target_contradictions: [], change_contradictions: [] })

  // call /api/rules/check whenever the rule rows change to detect phonologically impossible specs
  useEffect(() => {
    const targetFeatures = Object.fromEntries(
      targetRows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value])
    )
    const featureChanges = Object.fromEntries(
      changeRows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value])
    )

    if (Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0) {
      setContradictions({ target_contradictions: [], change_contradictions: [] })
      return
    }

    fetch(`${API_BASE}/rules/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_features: targetFeatures, feature_changes: featureChanges }),
    })
      .then((r) => r.json())
      .then(setContradictions)
  }, [targetRows, changeRows])

  // minimality checks computed from the already-loaded feature bundles
  const redundantTarget = useMemo(
    () => hasRedundantTargetFeatures(targetRows, changeRows, inventory, baseFeatures, diacriticFeatures),
    [targetRows, changeRows, inventory, baseFeatures, diacriticFeatures]
  )
  const redundantChanges = useMemo(
    () => hasRedundantChangeFeatures(changeRows, targetRows, inventory, baseFeatures, diacriticFeatures),
    [changeRows, targetRows, inventory, baseFeatures, diacriticFeatures]
  )

  // resolve the feature bundle for a given inventory item, applying transforms when matched
  const resolveFeatures = (item) => {
    const key = item.diacritic_id != null ? item.key : String(item.phoneme_id)
    const t = transforms[key]
    if (t?.matched && t.result_bundle) return t.result_bundle
    return item.diacritic_id != null
      ? diacriticFeatures[item.key]
      : baseFeatures[String(item.phoneme_id)]
  }

  const rulesActive = Object.keys(transforms).length > 0
  // only filter when target features are set; changes-only applies to the whole inventory
  const hasTargetFeatures = targetRows.some((r) => r.value && r.feature)
  const visibleInventory = rulesActive && hasTargetFeatures
    ? inventory.filter((item) => {
        const key = item.diacritic_id != null ? item.key : String(item.phoneme_id)
        return transforms[key]?.matched
      })
    : inventory

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">

      {/* fixed top: title + rule panel + view toggle */}
      <div className="shrink-0 space-y-[32px] pb-6 bg-white">
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Rule Application</h1>
          <p className="text-[16px] text-gray-500 font-light">
            Pick out sounds by features, and apply feature rules
          </p>
        </div>

        <RulePanel
          targetRows={targetRows}
          featureChangeRows={changeRows}
          onTargetChange={setTargetRows}
          onChangesChange={setChangeRows}
          validation={{
            targetContradictions: contradictions.target_contradictions,
            changeContradictions: contradictions.change_contradictions,
            redundantTarget,
            redundantChanges,
          }}
        />

        {inventory.length > 0 && visibleInventory.length > 0 && (
          <div className="flex gap-2 justify-start items-center">
            <button onClick={() => setView('sheet')} className="font-light text-[14px] hover:opacity-60 transition-opacity">Sheet</button>
            <span className="font-light text-[10px] leading-none">|</span>
            <button onClick={() => setView('table')} className="font-light text-[14px] hover:opacity-60 transition-opacity">Table</button>
          </div>
        )}
      </div>

      {/* scrollable view */}
      <div className="relative flex-1">
        {transformsLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <span className="text-sm text-slate-600">Applying rules...</span>
          </div>
        )}
        <div className="absolute inset-0 overflow-y-auto">
          {inventory.length === 0
            ? <div className="flex h-full items-center justify-center gap-1">
                <span className="text-[14px] font-light text-slate-600">The inventory is empty!</span>
                <Link to="/inventory" className="text-[14px] font-light text-slate-600 underline hover:text-slate-600">Go to inventory</Link>
              </div>
            : visibleInventory.length === 0
              ? <div className="flex h-full items-center justify-center gap-1">
                  <span className="text-[14px] font-light text-slate-600">No phonemes match the target features.</span>
                </div>
            : view === 'sheet'
              ? <SheetView inventory={visibleInventory} resolveFeatures={resolveFeatures} transforms={transforms} />
              : <TableView inventory={visibleInventory} transforms={transforms} diacriticFeatures={diacriticFeatures} />
          }
        </div>
      </div>
    </div>
  )
}
