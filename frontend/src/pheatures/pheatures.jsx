import { useEffect, useMemo, useState } from 'react'
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
      return
    }

    const phonemeIds = [...new Set(inventory.map((item) => item.phoneme_id))]
    if (phonemeIds.length === 0) {
      setTransforms({})
      return
    }

    fetch(`${API_BASE}/phonemes/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneme_ids: phonemeIds, target_features: targetFeatures, feature_changes: featureChanges }),
    })
      .then((r) => r.json())
      .then(setTransforms)
  }, [targetRows, changeRows, inventory])

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
    const t = transforms[String(item.phoneme_id)]
    if (t?.matched && t.result_bundle) return t.result_bundle
    return item.diacritic_id != null
      ? diacriticFeatures[item.key]
      : baseFeatures[String(item.phoneme_id)]
  }

  // when transforms has results, filter the inventory to only matched phonemes;
  // computed inline each render so it's always in sync with transforms
  const rulesActive = Object.keys(transforms).length > 0
  const visibleInventory = rulesActive
    ? inventory.filter((item) => transforms[String(item.phoneme_id)]?.matched)
    : inventory

  return (
    <div className="space-y-[32px]">

       <div className="space-y-[4px]">
          <h1 className="text-[28px]">Pheatures</h1>
          <p className="text-[16px] text-gray-500 font-light">
            Pick out sounds by features, and apply feature rules
          </p>
        </div>

      {/* phonological rule panel */}
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

      <div className="space-y-[20px]">
      <div className="flex gap-2 justify-end items-center">
        {/* view toggle */}
        <button onClick={() => setView('sheet')} className="font-light text-[16px] hover:opacity-60 transition-opacity">Sheet</button>
        <span className="font-light text-[10px] leading-none">|</span>
        <button onClick={() => setView('table')} className="font-light text-[16px] hover:opacity-60 transition-opacity">Table</button>
      </div>

      {view === 'sheet'
        ? <SheetView inventory={visibleInventory} resolveFeatures={resolveFeatures} transforms={transforms} />
        : <TableView inventory={visibleInventory} transforms={transforms} />
      }
      </div>
    </div>
  )
}
