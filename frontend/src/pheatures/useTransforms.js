import { useEffect, useState } from 'react'
import { postJson } from '../api.js'

// Applies the rule (target features -> feature changes) to the inventory via POST /phonemes/transform.
// transforms: { item.key: { matched, transformed, original_symbol, result_symbol, result_bundle, valid } }
// is empty when there is nothing to apply.
export function useTransforms(inventory, targetFeatures, featureChanges, diacriticFeatures) {
  const [transforms, setTransforms] = useState({})
  const [transformsLoading, setTransformsLoading] = useState(false)

  useEffect(() => {
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
    postJson('/phonemes/transform', { phoneme_ids: phonemeIds, diacritic_items: diacriticItems, target_features: targetFeatures, feature_changes: featureChanges })
      .then((data) => { setTransforms(data); setTransformsLoading(false) })
      .catch(() => setTransformsLoading(false))
  }, [targetFeatures, featureChanges, inventory, diacriticFeatures])

  return { transforms, transformsLoading }
}
