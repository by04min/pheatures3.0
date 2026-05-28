// RULE PANEL
// two columns: Target Features (which phonemes to match) and Feature Changes (what to apply)
// each column holds a list of {value: +/-/0, feature: <name>} rows
// parent owns the row state; RulePanel just fires onChange callbacks

import { FEATURE_NAMES } from '../inventory/format/phonemeFeatures.js'

const VALUES = ['+', '-', '0']

// a single row: value selector (small) + feature selector (wide)
function FeatureRow({ row, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {/* +/-/0 selector */}
      <select
        value={row.value}
        onChange={(e) => onChange({ ...row, value: e.target.value })}
        className="border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[12px] font-light bg-white w-14 text-center"
      >
        <option value=""></option>
        {VALUES.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>

      {/* feature name selector */}
      <select
        value={row.feature}
        onChange={(e) => onChange({ ...row, feature: e.target.value })}
        className="border border-slate-200 rounded-[4px] px-[6px] py-[4px] text-[12px] font-light bg-white w-50"
      >
        <option value=""></option>
        {FEATURE_NAMES.map((f) => (
          <option key={f} value={f}>{f.toLowerCase()}</option>
        ))}
      </select>
    </div>
  )
}

// a labeled column of FeatureRows; "clear" in the header resets to one empty row
function FeatureColumn({ label, rows, onChange }) {
  const addRow    = () => onChange([...rows, { value: '', feature: '' }])
  const updateRow = (i, updated) => onChange(rows.map((r, idx) => idx === i ? updated : r))
  const clearRows = () => onChange([{ value: '', feature: '' }])

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-light">{label}</span>
        <button
          onClick={clearRows}
          className="text-[12px] font-light underline hover:text-slate-600 transition-colors"
        >
          clear
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <FeatureRow
            key={i}
            row={row}
            onChange={(updated) => updateRow(i, updated)}
          />
        ))}
      </div>
      <button
        onClick={addRow}
        className="self-start border border-slate-200 rounded-[100px] px-[8px] py-[4px] text-[12px] font-light hover:bg-slate-50 transition-colors"
      >
        +
      </button>
    </div>
  )
}

export default function RulePanel({ targetRows, featureChangeRows, onTargetChange, onChangesChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-36">
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
  )
}
