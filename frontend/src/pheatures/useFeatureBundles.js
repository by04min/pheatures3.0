import { useEffect, useMemo, useState } from 'react'
import { postJson } from '../api.js'

// Fetches the feature bundle for every inventory item whenever the inventory changes:
//   - base phonemes in one POST /phonemes/features call
//   - each phoneme+diacritic pair via POST /diacritics/apply
// Returns
//   bundles           { item.key: { feature: value, ... } } for all items ("phonemeId" or "phonemeId:diacriticId")
//   diacriticFeatures the same, restricted to phoneme+diacritic pairs
export function useFeatureBundles(inventory) {
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

    const fetchBase = postJson('/phonemes/features', { phoneme_ids: phonemeIds })

    const fetchDiacritics = Promise.all(
      diacriticItems.map((item) =>
        postJson('/diacritics/apply', { phoneme_id: item.phoneme_id, diacritic_id: item.diacritic_id })
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

  // base bundles are keyed by phoneme id, which is exactly item.key for non-diacritic items
  const bundles = useMemo(() => ({ ...baseFeatures, ...diacriticFeatures }), [baseFeatures, diacriticFeatures])

  return { bundles, diacriticFeatures }
}
