import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { FeatureValueBadge } from './badges'

/* 01. INVENTORY ERRORS: error messages for diacritic application

- displays simple error message if user attempts to apply a diacritic to a phoneme that already has that diacritic
- displays an error message that details why a diacritic cannot apply to a particular phoneme (prints required conditions and mismatching features)

*/

// 1.1 HELPER: formats details of invalid diacritic application
function featureInfo({ condition, phonemeFeatures = {}}) {
  if (!condition) return []
  return [
    {
      label: 'Requires',
      features: Object.entries(condition).map(([feat, val]) => ({ val, feat })),
    },
    {
      label: `Mismatching features`,
      features: Object.entries(condition)
        .filter(([feat, val]) => phonemeFeatures[feat] !== val)
        .map(([feat, val]) => ({ val: phonemeFeatures[feat], feat })),
    },
  ]
}

export default function InvalidDiacriticTarget({ message, onClose }) {
  if (!message) return null

  const title = typeof message === 'string' ? message : message.title
  const sections = typeof message === 'string' ? [] : featureInfo(message)

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[4px] border border-[#ffccc7] bg-[#fff2f0]">
      <div className="flex items-center gap-2">
        <ErrorOutlineIcon sx={{ color: '#ad1214', fontSize: 18, flexShrink: 0 }} />
        <p className="text-[14px] flex-1">
          {title}
          {<span className="font-mono ml-1">{message.phonemeSymbol}</span>}
        </p>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-[#ad1214] hover:opacity-70 flex-shrink-0">
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      {sections.map((section, i) => (
        <div key={i}>
          <p className="text-[11px] uppercase tracking-widest mb-1.5">
            {section.label}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {section.features.map(({ val, feat }, j) => (
              <div key={j} className="flex items-center gap-1.5">
                <FeatureValueBadge value={val} />
                <span className="text-[12px] text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


/* 02. RULE CONTRADICTION ERROR: shown when a feature spec violates a phonological
       contradiction rule (e.g. -sonorant +approximant cannot coexist).
       violations — array of violated rule objects [{ feature: value, ... }, ...]
*/
export function RuleContradictionError({ violations, title = 'Contradictory feature combination', onClose }) {
  if (!violations || violations.length === 0) return null
  return (
    <div className="flex flex-col gap-3 p-4 rounded-[4px] border border-[#ffccc7] bg-[#fff2f0]">
      <div className="flex items-center gap-2">
        <ErrorOutlineIcon sx={{ color: '#ad1214', fontSize: 18, flexShrink: 0 }} />
        <p className="text-[14px] flex-1">{title}</p>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-[#ad1214] hover:opacity-70 flex-shrink-0">
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      {violations.map((rule, i) => (
        <div key={i} className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(rule).map(([feat, val], j) => (
            <div key={j} className="flex items-center gap-1.5">
              <FeatureValueBadge value={val} />
              <span className="text-[12px] text-slate-700">{feat}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* 03. RULE NON-MINIMAL WARNING: shown when a rule spec is non-minimal
       (a feature can be removed without changing which phonemes are affected).
       message — descriptive string shown to the user
*/
export function RuleNonMinimalWarning({ message, onClose }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 p-4 rounded-[4px] border border-[#ffe58f] bg-[#fffbe6]">
      <WarningAmberOutlinedIcon sx={{ color: '#d46b08', fontSize: 18, flexShrink: 0 }} />
      <p className="text-[14px] flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-auto text-[#d46b08] hover:opacity-70 flex-shrink-0">
          <CloseIcon sx={{ fontSize: 16 }} />
        </button>
      )}
    </div>
  )
}