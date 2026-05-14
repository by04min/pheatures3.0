import { PHONEME_FEATURES } from "./format/phonemeFeatures";
import { FeatureValueBadge } from "../components/badges";

const FEATURE_GROUPS = [
  {
    label: "Prosodic",
    features: ["syllabic", "stress", "long", "tense"],
  },
  {
    label: "Manner",
    features: [
      "consonantal",
      "sonorant",
      "continuant",
      "delayed release",
      "approximant",
      "tap",
      "trill",
      "nasal",
      "lateral",
    ],
  },
  {
    label: "Laryngeal",
    features: ["voice", "spread gl", "constr gl"],
  },
  {
    label: "Labial",
    features: ["LABIAL", "round", "labiodental"],
  },
  {
    label: "Coronal",
    features: ["CORONAL", "anterior", "distributed", "strident"],
  },
  {
    label: "Dorsal",
    features: ["DORSAL", "high", "low", "front", "back"],
  },
];

// given a phoneme, provides all information about it!
export function FeaturePanel({ symbol, onClose }) {
  const feats = PHONEME_FEATURES[symbol];

  // error handling: show an error message if we can't get the features for a symbol
  if (!feats) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No feature data found for{" "}
        <span className="font-mono text-slate-700">{symbol}</span>.
      </div>
    );
  }

  // this is the actual view!
  return (
    <div className="rounded-[8px] border border-indigo-100 bg-indigo-50/40 p-6 space-y-[36px]">

      {/* phoneme symbol + close button */}
      <div className="flex flex-row justify-between items-center">
          <h2 className="text-[48px]">
            {symbol}
          </h2>
        <button
          onClick={onClose}
          className="hover:text-slate-400 text-[20px]"
          aria-label="close"
        >
          ×
        </button>
      </div>

      {/* feature specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[36px]">
        {FEATURE_GROUPS.map((group) => (
          <div key={group.label}>
            <h4 className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {group.label}
            </h4>
            <div className="space-y-[8px]">
              {group.features.map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <FeatureValueBadge value={feats[feat]} />
                  <label className="text-[12px] text-slate-700">{feat}</label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
