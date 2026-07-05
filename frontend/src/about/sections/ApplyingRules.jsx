import { useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import { useThemeStore } from '../../store/themeStore'
import rulePageInventory from '../media/rule page inventory.gif'
import tableViewClick from '../media/table view click.gif'
import addTargetFeature from '../media/add target feature.gif'
import applyFeatureChange from '../media/apply feature change.gif'

function Section({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-start gap-2 text-left cursor-pointer"
      >
        {isOpen ? (
          <ExpandLessOutlinedIcon fontSize="small" />
        ) : (
          <ExpandMoreOutlinedIcon fontSize="small" />
        )}
        <h2 className="font-light text-[20px]">{title}</h2>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  )
}

function ApplyingRules() {
  const { isDark } = useThemeStore()

  return (
    <div className="space-y-[24px]">
      <Section title="01. Selecting Views" className="space-y-4">
        <div className="ml-7 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Updating inventory populates the Rules tab
            <br/>
            Toggle between sheet or table view
          </p>
        <img
          src={rulePageInventory}
          alt="Rule page inventory view"
          className="mt-3 w-full rounded-[4px]"
        />
        </div>
        <div className="ml-7 mt-6 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            In sheet view, click a phoneme to view feature values
          </p>
        <img
          src={tableViewClick}
          alt="Clicking into table view"
          className="mt-3 w-full rounded-[4px]"
        />
        </div>
      </Section>
      <Section title="02. Isolating Target Sounds">
         <div className="ml-7 mt-6 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Target features are the left hand side of a rule
            <br/>
            Choose feature value(s) and feature(s)
          </p>
        <img
          src={addTargetFeature}
          alt="Adding a target feature"
          className="w-full rounded-[4px]"
        />
        </div>
      </Section>
      <Section title="03. Forming Phonetic Rules">
        <div className="ml-7 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Feature changes are the right hand side of a rule 
            <br/>
            Warning and error messages appear above the respective side of the rule
          </p>
        <img
          src={applyFeatureChange}
          alt="Applying a feature change"
          className="w-full rounded-[4px]"
        />
        </div>
      </Section>
    </div>
  )
}

export default ApplyingRules
