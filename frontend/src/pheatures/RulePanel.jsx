// RULE PANEL
// two columns: Target Features (which phonemes to match) and Feature Changes (what to apply)
// each column holds a list of {value: +/-/0, feature: <name>} rows
// parent owns the row state; RulePanel just fires onChange callbacks

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { FEATURE_NAMES } from '../inventory/format/phonemeFeatures.js'
import { RuleContradictionError, RuleNonMinimalWarning } from '../components/errorMsg.jsx'

const VALUES = ['+', '-', '0']

// a single row: value selector (small) + feature selector (wide)
// excludeFeatures — Set of feature names already selected in sibling rows (i.e. if you add +voice, can't add voice again)
function FeatureRow({ row, onChange, onRemove, excludeFeatures = new Set() }) {
  return (
    <div className="flex items-center gap-2">
      {/* +/-/0 selector */}
      <select
        value={row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value })}
        className="border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[14px] font-light bg-white w-14 text-center"
      >
        <option value=""></option>
        {VALUES.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      {/* feature name selector — omits features already used in other rows */}
      <select
        value={row.feature}
        onChange={(e) => onChange({ ...row, feature: e.target.value })}
        className="border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[14px] font-light bg-white w-50"
      >
        <option value=""></option>
        {FEATURE_NAMES
          .filter((f) => !excludeFeatures.has(f) || f === row.feature)
          .map((f) => (
            <option key={f} value={f}>{f.toLowerCase()}</option>
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

// a labeled column of FeatureRows; "clear" in the header resets to one empty row
function FeatureColumn({ label, rows, onChange }) {
  const addRow    = () => onChange([...rows, { value: '', feature: '' }])
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i))
  const updateRow = (i, updated) => onChange(rows.map((r, idx) => idx === i ? updated : r))
  const clearRows = () => onChange([{ value: '', feature: '' }])

  return (
    <div className="flex flex-col space-y-[8px] flex-1">
      <div className="flex justify-between items-center">
        <span className="text-[16px] font-light">{label}</span>
        <button
          onClick={clearRows}
          className="text-[14px] font-light underline hover:text-slate-600 transition-colors"
        >
          clear
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row, i) => {
          const excludeFeatures = new Set(
            rows.filter((_, idx) => idx !== i).map((r) => r.feature).filter(Boolean)
          )
          return (
            <FeatureRow
              key={i}
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
        className="self-start border border-slate-200 flex items-center justify-center rounded-full w-[24px] h-[24px] hover:bg-slate-50 transition-colors"
      >
        <AddIcon sx={{ fontSize: 14 }} />
      </button>
    </div>
  )
}

export default function RulePanel({ targetRows, featureChangeRows, onTargetChange, onChangesChange, validation = {} }) {
  const {
    targetContradictions = [],
    changeContradictions = [],
    redundantTarget = false,
    redundantChanges = false,
  } = validation

  const hasErrors =
    targetContradictions.length > 0 || changeContradictions.length > 0 ||
    redundantTarget || redundantChanges

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <div className="flex flex-col md:flex-row gap-8 md:gap-36">
          <div className="flex flex-col gap-2 flex-1">
            <RuleContradictionError violations={targetContradictions} />
            <RuleNonMinimalWarning message={redundantTarget ? 'Target features are non-minimal' : null} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <RuleContradictionError violations={changeContradictions} />
            <RuleNonMinimalWarning message={redundantChanges ? 'Feature changes are redundant' : null} />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 md:gap-64">
        <FeatureColumn
          label="Target Features"
          rows={targetRows}
          onChange={onTargetChange}
        />
        <FeatureColumn
          label="Feature Changes"
          rows={featureChangeRows}
          onChange={onChangesChange}
        />
      </div>
    </div>
  )
}
