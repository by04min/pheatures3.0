/*
01. GET BUNDLE
    Looks up a sound's features (e.g. voice: +, nasal: -) from the list of loaded features.
    The checks in this file make sure a rule doesn't include features it doesn't need
    (rules that contradict themselves are checked separately, by the server).
*/
function getBundle(item, bundles) {
  return bundles[item.key]
}

/*
02. NEW ROW
    Makes a blank rule row; the id lets the page keep track of each row
    even if one is removed from the middle
*/
export function newRow() {
  return { id: crypto.randomUUID(), value: '', feature: '' }
}

/*
03. ROWS TO SPEC
    Turns the rows into a rule like { voice: '+' }, skipping rows that aren't fully filled in
*/
export function rowsToSpec(rows) {
  return Object.fromEntries(rows.filter((r) => r.value && r.feature).map((r) => [r.feature, r.value]))
}

/*
04. HAS REDUNDANT TARGET FEATURES
    Is there a target feature that isn't needed? Returns true if so, false otherwise.
    A target feature is unneeded in either of two cases:
      (A) removing it picks out exactly the same sounds, so it isn't narrowing anything
      (B) removing it picks out extra sounds, but the rule's change wouldn't affect them
          anyway because they already have that value
    Example of (B): target [+voice] with change [-voice]. Without +voice, the rule would
    also pick up the sounds that are already -voice, but changing them to -voice does nothing.
*/
export function hasRedundantTargetFeatures(targetRows, changeRows, inventory, bundles) {
  const targetSpec = rowsToSpec(targetRows)
  const changeSpec = rowsToSpec(changeRows)
  const entries = Object.entries(targetSpec)
  if (entries.length === 0) return false

  const matchesSpec = (item, featureSpec) => {
    const bundle = getBundle(item, bundles)
    return bundle != null && Object.entries(featureSpec).every(([f, v]) => bundle[f] === v)
  }

  const fullMatched = inventory.filter((item) => matchesSpec(item, targetSpec))
  const fullMatchedKeys = new Set(fullMatched.map((item) => item.key))

  return entries.some(([feat]) => {
    const reduced = Object.fromEntries(entries.filter(([f]) => f !== feat))
    const reducedMatched = inventory.filter((item) => matchesSpec(item, reduced))

    // (A) removing this feature picks out the same sounds
    if (reducedMatched.length === fullMatched.length) return true

    // (B) removing it picks out extra sounds, but the change wouldn't affect any of them
    if (Object.keys(changeSpec).length > 0) {
      const extras = reducedMatched.filter((item) => !fullMatchedKeys.has(item.key))
      if (extras.length > 0 && extras.every((item) => matchesSpec(item, changeSpec))) return true
    }

    return false
  })
}

/*
05. HAS REDUNDANT CHANGE FEATURES
    Is there a change that does nothing? Returns true if so, false otherwise.
    A change does nothing when every sound the rule picks out already has that value.
*/
export function hasRedundantChangeFeatures(changeRows, targetRows, inventory, bundles) {
  const targetSpec = rowsToSpec(targetRows)
  const changeSpec = rowsToSpec(changeRows)
  if (Object.keys(changeSpec).length === 0) return false

  const matched = inventory.filter((item) => {
    const bundle = getBundle(item, bundles)
    return bundle != null && Object.entries(targetSpec).every(([f, v]) => bundle[f] === v)
  })
  if (matched.length === 0) return false

  return Object.entries(changeSpec).some(([feat, val]) =>
    matched.every((item) => {
      const bundle = getBundle(item, bundles)
      return bundle != null && bundle[feat] === val
    }),
  )
}
