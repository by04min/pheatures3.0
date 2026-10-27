import { TutorialSections } from '../tutorial.jsx'
import rulePageInventory from '../media/rule-page-inventory.gif'
import tableViewClick from '../media/table-view-click.gif'
import addTargetFeature from '../media/add-target-feature.gif'
import applyFeatureChange from '../media/apply-feature-change.gif'

/*
01. SECTIONS
    The tutorial content: each section has steps, and each step has a caption (one entry per line),
    a demo GIF, and a text description of the GIF for screen readers
*/
const SECTIONS = [
  {
    title: '01. Selecting Views',
    steps: [
      {
        lines: ['Updating inventory populates the Rules tab', 'Toggle between sheet or table view'],
        src: rulePageInventory,
        alt: 'Rule page inventory view',
      },
      {
        lines: ['In table view, click a phoneme to view feature values'],
        src: tableViewClick,
        alt: 'Clicking into table view',
      },
    ],
  },
  {
    title: '02. Isolating Target Sounds',
    steps: [
      {
        lines: ['Target features are the left hand side of a rule', 'Choose feature value(s) and feature(s)'],
        src: addTargetFeature,
        alt: 'Adding a target feature',
      },
    ],
  },
  {
    title: '03. Forming Phonetic Rules',
    steps: [
      {
        lines: [
          'Feature changes are the right hand side of a rule',
          'Warning and error messages appear above the respective side of the rule',
        ],
        src: applyFeatureChange,
        alt: 'Applying a feature change',
      },
    ],
  },
]

/*
02. APPLYING RULES
    The "Apply Rules" tutorials
*/
export default function ApplyingRules() {
  return <TutorialSections sections={SECTIONS} />
}
