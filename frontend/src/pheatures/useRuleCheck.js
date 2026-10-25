import { useEffect, useState } from 'react'
import { isAbort, postJson } from '../api.js'

const NO_CONTRADICTIONS = { target_contradictions: [], change_contradictions: [] }

// Asks POST /rules/check whether the rule specs are phonologically impossible.
// Returns
//   contradictions  { target_contradictions: [...], change_contradictions: [...] }
//   error           message when the last check failed, else null
export function useRuleCheck(targetFeatures, featureChanges) {
  const [result, setResult] = useState({ contradictions: NO_CONTRADICTIONS, error: null })

  const idle = Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0

  useEffect(() => {
    if (idle) return

    const controller = new AbortController()
    postJson('/rules/check', { target_features: targetFeatures, feature_changes: featureChanges }, { signal: controller.signal })
      .then((contradictions) => setResult({ contradictions, error: null }))
      .catch((err) => {
        if (isAbort(err)) return
        console.error(err)
        setResult({ contradictions: NO_CONTRADICTIONS, error: 'Failed to check the rule for contradictions.' })
      })

    return () => controller.abort()
  }, [idle, targetFeatures, featureChanges])

  if (idle) return { contradictions: NO_CONTRADICTIONS, error: null }
  return { contradictions: result.contradictions, error: result.error }
}
