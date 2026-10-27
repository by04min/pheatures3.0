import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInventoryStore } from '../store/inventoryStore'
import SheetView from './display/SheetView.jsx'
import TableView from './display/TableView.jsx'
import RulePanel from './RulePanel.jsx'
import { useFeatureBundles } from './useFeatureBundles.js'
import { useTransforms } from './useTransforms.js'
import { useRuleCheck } from './useRuleCheck.js'
import { hasRedundantTargetFeatures, hasRedundantChangeFeatures, newRow, rowsToSpec } from './ruleValidation.js'

/*
01. FEATURE PAD
    The rule application page: pick out sounds by their features,
    and apply rules that change those features
*/
export default function FeaturePad() {

  // The sounds the user chose on the Inventory page
  const { inventory } = useInventoryStore()

  // Whether results are shown as a "sheet" or a "table"
  const [view, setView] = useState('sheet')

  // The rows typed into the rule panel: "target" rows say which sounds the rule applies to,
  // "change" rows say what happens to them. Each starts with one empty row.
  const [targetRows, setTargetRows] = useState(() => [newRow()])
  const [changeRows, setChangeRows] = useState(() => [newRow()])

  // The rows turned into a rule; half-filled rows are ignored
  const targetFeatures = useMemo(() => rowsToSpec(targetRows), [targetRows])
  const featureChanges = useMemo(() => rowsToSpec(changeRows), [changeRows])

  const { bundles, diacriticFeatures, ready: bundlesReady, error: bundlesError } = useFeatureBundles(inventory)
  const {
    transforms,
    transformsLoading,
    error: transformsError,
  } = useTransforms(inventory, targetFeatures, featureChanges, diacriticFeatures, bundlesReady)
  
  // Flags rules that contradict themselves (e.g. asking for both + and - of the same feature)
  const { contradictions, error: ruleCheckError } = useRuleCheck(targetFeatures, featureChanges)
  const error = bundlesError ?? transformsError ?? ruleCheckError

  // Flags features in the rule that aren't needed (they don't change which sounds match or what changes)
  const redundantTarget = useMemo(
    () => hasRedundantTargetFeatures(targetRows, changeRows, inventory, bundles),
    [targetRows, changeRows, inventory, bundles],
  )
  const redundantChanges = useMemo(
    () => hasRedundantChangeFeatures(changeRows, targetRows, inventory, bundles),
    [changeRows, targetRows, inventory, bundles],
  )

  // Gets a sound's features: the changed version if the rule applies to it, otherwise the original
  const resolveFeatures = (item) => {
    const t = transforms[item.key]
    if (t?.matched && t.result_bundle) return t.result_bundle
    return bundles[item.key]
  }

  const rulesActive = Object.keys(transforms).length > 0
  // Show only matching sounds when a target is set; with no target, the rule applies to every sound
  const hasTargetFeatures = Object.keys(targetFeatures).length > 0
  const visibleInventory =
    rulesActive && hasTargetFeatures ? inventory.filter((item) => transforms[item.key]?.matched) : inventory

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">
      {/* Top section (stays in place): title, rule panel, and the Sheet/Table switch */}
      <div className={`shrink-0 space-y-[32px] pb-6 transition-colors duration-300 bg-white dark:bg-[#0E1116]`}>
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Rule Application</h1>
          <p className={`text-[16px] font-light text-gray-500 dark:text-gray-400`}>
            Pick out sounds by features, and apply feature rules
          </p>
        </div>

        {error && <div className="text-sm text-rose-600">{error}</div>}

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
            <button
              onClick={() => setView('sheet')}
              className="font-light text-[14px] hover:opacity-60 transition-opacity"
            >
              Sheet
            </button>
            <span className="font-light text-[10px] leading-none">|</span>
            <button
              onClick={() => setView('table')}
              className="font-light text-[14px] hover:opacity-60 transition-opacity"
            >
              Table
            </button>
          </div>
        )}
      </div>

      {/* Results (scrollable): a "no sounds" message, or the sheet/table view */}
      <div className="relative flex-1">
        {transformsLoading && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-[#0E1116]/60`}>
            <span className={`text-sm text-slate-600 dark:text-gray-400`}>Applying rules...</span>
          </div>
        )}
        <div className="absolute inset-0 overflow-y-auto">
          {inventory.length === 0 ? (
            <div className="flex h-full items-center justify-center gap-1">
              <span className={`text-[14px] font-light text-slate-600 dark:text-gray-400`}>
                The inventory is empty!
              </span>
              <Link
                to="/inventory"
                className={`text-[14px] font-light underline text-slate-600 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-300`}
              >
                Go to inventory
              </Link>
            </div>
          ) : visibleInventory.length === 0 ? (
            <div className="flex h-full items-center justify-center gap-1">
              <span className={`text-[14px] font-light text-slate-600 dark:text-gray-400`}>
                No phonemes match the target features.
              </span>
            </div>
          ) : view === 'sheet' ? (
            <SheetView inventory={visibleInventory} resolveFeatures={resolveFeatures} transforms={transforms} />
          ) : (
            <TableView inventory={visibleInventory} transforms={transforms} diacriticFeatures={diacriticFeatures} />
          )}
        </div>
      </div>
    </div>
  )
}
