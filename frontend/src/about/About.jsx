import { useState } from 'react'
import { useThemeStore } from '../store/themeStore'
import ManagingInventory from './sections/ManagingInventory.jsx'
import ApplyingRules from './sections/ApplyingRules.jsx'

const SECTIONS = [
  { id: 'inventory', label: 'Manage Inventory', Component: ManagingInventory },
  { id: 'rules', label: 'Apply Rules', Component: ApplyingRules },
]

function About() {
  const { isDark } = useThemeStore()
  const [activeId, setActiveId] = useState(SECTIONS[0].id)

  const activeClass = isDark ? 'text-white' : 'text-gray-900'
  const inactiveClass = isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-500'

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      <div className="flex flex-row items-center justify-between gap-3 lg:block lg:space-y-4">
        <p className={`inline-block w-fit text-center text-[14px] rounded-[20px] px-3 py-1 ${isDark ? 'bg-white text-black' : 'bg-gray-100'}`}>Guide</p>
      <nav className="flex flex-row items-center gap-3 lg:shrink-0 lg:w-40 lg:flex-col lg:items-start lg:gap-4 lg:space-y-3 lg:pl-1">
        {SECTIONS.map(({ id, label }, i) => (
          <div key={id} className="flex items-center gap-3 lg:contents">
            <button
              onClick={() => setActiveId(id)}
              className={`block text-left text-[15px] font-light transition-colors cursor-pointer ${
                activeId === id ? activeClass : inactiveClass
              }`}
            >
              {label}
            </button>
            {i < SECTIONS.length - 1 && (
              <span className={`lg:hidden ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>|</span>
            )}
          </div>
        ))}
      </nav>
      </div>
      <div className="flex-1">
        {(() => {
          const ActiveComponent = SECTIONS.find((s) => s.id === activeId)?.Component
          return ActiveComponent ? <ActiveComponent /> : null
        })()}
      </div>
    </div>
  )
}

export default About
