// renders +, -, 0 for feature
export function FeatureValueBadge({ value }) {
  if (value === '+')
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
        +
      </span>
    )
  if (value === '-')
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-200 text-red-800 text-xs font-bold">
        −
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs">
      0
    </span>
  )
}
