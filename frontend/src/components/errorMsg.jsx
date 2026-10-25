import { useState } from 'react'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import CloseIcon from '@mui/icons-material/Close'
import { FeatureValueBadge } from './badges'

/* 00. SHARED PIECES */

const VARIANTS = {
  error: {
    Icon: ErrorOutlineIcon,
    color: '#ad1214',
    box: 'border-[#ffccc7] bg-[#fff2f0]',
  },
  warning: {
    Icon: WarningAmberOutlinedIcon,
    color: '#d46b08',
    box: 'border-[#ffe58f] bg-[#fffbe6]',
  },
}

// bordered banner: icon + title content + close button, with optional detail content below
function Banner({ variant, onClose, title, children }) {
  const { Icon, color, box } = VARIANTS[variant]
  return (
    <div data-banner className={`flex flex-col gap-3 p-4 rounded-[4px] border ${box}`}>
      <div className="flex items-center gap-2">
        <Icon sx={{ color, fontSize: 18, flexShrink: 0 }} />
        <div className="text-[14px] flex-1">{title}</div>
        {onClose && (
          <button onClick={onClose} style={{ color }} className="ml-auto hover:opacity-70 flex-shrink-0">
            <CloseIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// a wrapped row of "+/-/0 badge  feature name" pairs; features: [{ val, feat }]
function FeatureList({ features }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {features.map(({ val, feat }, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <FeatureValueBadge value={val} />
          <span className="text-[12px] text-slate-700">{feat}</span>
        </div>
      ))}
    </div>
  )
}

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

// message — null, a string, or { title, phonemeSymbol?, condition?, phonemeFeatures? }
export default function InvalidDiacriticTarget({ message, onClose }) {
  if (!message) return null

  const title = typeof message === 'string' ? message : message.title
  const sections = typeof message === 'string' ? [] : featureInfo(message)

  return (
    <Banner
      variant="error"
      onClose={onClose}
      title={
        <p>
          {title}
          <span className="font-mono ml-1">{message.phonemeSymbol}</span>
        </p>
      }
    >
      {sections.map((section, i) => (
        <div key={i}>
          <p className="text-[11px] uppercase tracking-widest mb-1.5">
            {section.label}
          </p>
          <FeatureList features={section.features} />
        </div>
      ))}
    </Banner>
  )
}


/* 02. RULE CONTRADICTION ERROR: shown when a feature spec violates a phonological
       contradiction rule (e.g. -sonorant +approximant cannot coexist).
       violations — array of violated rule objects [{ feature: value, ... }, ...]
*/
export function RuleContradictionError({ violations, title = 'Contradictory feature combination', onClose }) {
  if (!violations || violations.length === 0) return null
  return (
    <Banner variant="error" onClose={onClose} title={<p>{title}</p>}>
      {violations.map((rule, i) => (
        <FeatureList
          key={i}
          features={Object.entries(rule).map(([feat, val]) => ({ val, feat }))}
        />
      ))}
    </Banner>
  )
}

/* 03. RULE NON-MINIMAL WARNING: shown when a rule spec is non-minimal
       (a feature can be removed without changing which phonemes are affected).
       message — descriptive string shown to the user
*/
const NON_MINIMAL_DETAILS = {
  target: 'Removing feature(s) result in the same transformation and select a larger class of sounds. Try taking some features out for a minimal selection.',
  changes: 'One or more feature changes are already implied and have no effect on the output. Try removing some changes and see if the result stays the same.',
}

export function RuleNonMinimalWarning({ message, variant = 'target', onClose }) {
  const [expanded, setExpanded] = useState(false)
  if (!message) return null
  return (
    <Banner
      variant="warning"
      onClose={onClose}
      title={
        <>
          <span>{message}</span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="block sm:inline sm:ml-1.5 text-[12px] text-[#d46b08] underline hover:opacity-70"
          >
            {expanded ? 'see less' : 'see more'}
          </button>
        </>
      }
    >
      {expanded && (
        <p className="text-[13px] text-[#7c4a00]">
          {NON_MINIMAL_DETAILS[variant]}
        </p>
      )}
    </Banner>
  )
}
