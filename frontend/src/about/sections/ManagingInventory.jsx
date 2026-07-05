import { useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import { useThemeStore } from '../../store/themeStore'
import inventoryScrollChoose from '../media/inventory scroll & choose.gif'
import viewAddDiacritic from '../media/view_add diacritic.gif'
import invalidDiacritic from '../media/invalid diacritic.gif'
import presets from '../media/presets.gif'

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

function ManagingInventory() {
  const { isDark } = useThemeStore()

  return (
    <div className="space-y-[24px]">
      <Section title="01. Select Phonemes">
        <div className="ml-7 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Scroll horizontally and vertically to view all phonemes
            <br />
            Click a phoneme to add to inventory, and again to remove
          </p>
        <img
          src={inventoryScrollChoose}
          alt="Scrolling through and choosing phonemes in the inventory"
          className="w-full rounded-[4px]"
        />
        </div>
      </Section>
      <Section title="02. Add Diacritics" className="space-y-4">
        <div className="ml-7 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Hover above a diacritic to view its label
            <br />
            Drag a diacritic to view valid targets, and drop to apply
          </p>
        <img
          src={viewAddDiacritic}
          alt="Viewing and adding a diacritic"
          className="w-full rounded-[4px]"
        />
        </div>
        <div className="ml-7 mt-6 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Dragging to an invalid target displays an error message
          </p>
        <img
          src={invalidDiacritic}
          alt="Invalid diacritic feedback"
          className="w-full rounded-[4px]"
        />
        </div>
      </Section>
      <Section title="03. Load Presets">
        <div className="ml-7 space-y-[12px]">
         <p className={`text-[16px] font-light ${isDark ? 'text-white' : 'text-gray-600'}`}>
            Select a preset to auto-populate the inventory
            <br/>
            Add or remove phonemes as needed
          </p>
        <img
          src={presets}
          alt="Loading presets"
          className="w-full rounded-[4px]"
        />
        </div>
      </Section>
    </div>
  )
}

export default ManagingInventory
