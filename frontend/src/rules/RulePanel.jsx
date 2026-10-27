import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FEATURE_NAMES } from '../data/phonemeFeatures.js'
import { RuleContradictionError, RuleNonMinimalWarning } from '../components/ErrorMessages.jsx'
import { newRow } from './ruleValidation.js'

const VALUES = ['+', '-', '0']

/*
01. FEATURE ROW
    One row: a +/-/0 dropdown and a feature dropdown.
    Features already used in the other rows are left out, so the same feature can't be added twice.
*/
function FeatureRow({ row, onChange, onRemove, excludeFeatures = new Set() }) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value })}
        className={`border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[14px] font-light w-14 text-center text-black bg-white dark:bg-gray-100`}
      >
        <option value=""></option>
        {VALUES.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <select
        value={row.feature}
        onChange={(e) => onChange({ ...row, feature: e.target.value })}
        className={`border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[14px] font-light w-50 text-black bg-white dark:bg-gray-100`}
      >
        <option value=""></option>
        {FEATURE_NAMES.filter((f) => !excludeFeatures.has(f) || f === row.feature).map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      {onRemove && (
        <button
          onClick={onRemove}
          className="text-slate-300 hover:text-slate-500 transition-colors leading-none"
          aria-label="Remove row"
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  )
}

/*
02. FEATURE COLUMN
    A titled column of rows, with a "+" button to add a row
    and "Clear" to start over with one empty row
*/
function FeatureColumn({ label, rows, onChange }) {
  const addRow = () => onChange([...rows, newRow()])
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i))
  const updateRow = (i, updated) => onChange(rows.map((r, idx) => (idx === i ? updated : r)))
  const clearRows = () => onChange([newRow()])

  return (
    <div className="flex flex-col space-y-[8px] flex-1">
      <div className="flex justify-between items-center">
        <span className="text-[16px] font-light">{label}</span>
        <button
          onClick={clearRows}
          className={`text-[14px] font-light underline transition-colors hover:text-slate-600 dark:hover:text-gray-300`}
        >
          <span className="flex items-center gap-1">
            Clear
            <DeleteOutlinedIcon style={{ fontSize: 14 }} />
          </span>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row, i) => {
          const excludeFeatures = new Set(
            rows
              .filter((_, idx) => idx !== i)
              .map((r) => r.feature)
              .filter(Boolean),
          )
          return (
            <FeatureRow
              key={row.id}
              row={row}
              onChange={(updated) => updateRow(i, updated)}
              onRemove={i > 0 ? () => removeRow(i) : undefined}
              excludeFeatures={excludeFeatures}
            />
          )
        })}
      </div>
      <button
        onClick={addRow}
        className={`self-start border border-slate-200 flex items-center justify-center rounded-full w-[24px] h-[24px] bg-white transition-colors text-black hover:bg-slate-50 dark:hover:bg-gray-300`}
      >
        <AddIcon sx={{ fontSize: 14 }} />
      </button>
    </div>
  )
}

/*
03. DISMISSIBLE
    Shows a message until the user closes it. If the message changes, it reappears.
*/
function Dismissible({ children }) {
  const [dismissed, setDismissed] = useState(false)
  return dismissed ? null : children(() => setDismissed(true))
}

/*
04. RULE PANEL
    The panel where the user builds a rule, in two columns:
    - Target Features: which sounds the rule applies to
    - Feature Changes: what the rule does to them
    Each row is a value (+, -, or 0) plus a feature name, e.g. "+ voice".
    The page that uses this panel keeps track of the rows; the panel only reports edits.
*/
export default function RulePanel({ targetRows, featureChangeRows, onTargetChange, onChangesChange, validation = {} }) {
  const {
    targetContradictions = [],
    changeContradictions = [],
    redundantTarget = false,
    redundantChanges = false,
  } = validation

  return (
    <div className="flex flex-col gap-4">
      {/* Warning messages (contradictions, unneeded features); this area stays hidden when there are none */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-36 not-has-[[data-banner]]:hidden">
        <div className="flex flex-col gap-2 flex-1">
          <Dismissible key={`tc-${JSON.stringify(targetContradictions)}`}>
            {(close) => <RuleContradictionError violations={targetContradictions} onClose={close} />}
          </Dismissible>
          <Dismissible key={`tn-${redundantTarget}`}>
            {(close) => (
              <RuleNonMinimalWarning
                message={redundantTarget ? 'Target features are non-minimal' : null}
                variant="target"
                onClose={close}
              />
            )}
          </Dismissible>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <Dismissible key={`cc-${JSON.stringify(changeContradictions)}`}>
            {(close) => <RuleContradictionError violations={changeContradictions} onClose={close} />}
          </Dismissible>
          <Dismissible key={`cn-${redundantChanges}`}>
            {(close) => (
              <RuleNonMinimalWarning
                message={redundantChanges ? 'Feature changes are redundant' : null}
                variant="changes"
                onClose={close}
              />
            )}
          </Dismissible>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-64">
        <FeatureColumn label="Target Features" rows={targetRows} onChange={onTargetChange} />
        <FeatureColumn label="Feature Changes" rows={featureChangeRows} onChange={onChangesChange} />
      </div>
    </div>
  )
}
