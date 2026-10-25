import { useEffect, useState } from 'react'
import { postJson } from '../api.js'

const NO_CONTRADICTIONS = { target_contradictions: [], change_contradictions: [] }

// Asks POST /rules/check whether the rule specs are phonologically impossible.
// Returns { target_contradictions: [...], change_contradictions: [...] }
export function useRuleCheck(targetFeatures, featureChanges) {
  const [contradictions, setContradictions] = useState(NO_CONTRADICTIONS)

  useEffect(() => {
    if (Object.keys(targetFeatures).length === 0 && Object.keys(featureChanges).length === 0) {
      setContradictions(NO_CONTRADICTIONS)
      return
    }

    postJson('/rules/check', { target_features: targetFeatures, feature_changes: featureChanges })
      .then(setContradictions)
  }, [targetFeatures, featureChanges])

  return contradictions
}
