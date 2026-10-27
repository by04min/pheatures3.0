import { useState } from 'react'
import ManagingInventory from './sections/ManagingInventory.jsx'
import ApplyingRules from './sections/ApplyingRules.jsx'

/*
01. SECTIONS
    The guide's topics: the label shown in the side menu, and the page of tutorials it opens
*/
const SECTIONS = [
  { id: 'inventory', label: 'Manage Inventory', Component: ManagingInventory },
  { id: 'rules', label: 'Apply Rules', Component: ApplyingRules },
]

/*
02. ABOUT
    The guide page: a side menu of topics, and the tutorials for the selected topic
*/
function About() {
  // Which topic is open (starts on the first one)
  const [activeId, setActiveId] = useState(SECTIONS[0].id)

  // Styles for the selected topic and the others in the menu
  const activeClass = 'text-gray-900 dark:text-white'
  const inactiveClass = 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-200'

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-12">
      {/* Side menu (across the top on small screens): lists the topics */}
      <div className="flex flex-row items-center justify-between gap-3 lg:block lg:space-y-4">
        <p
          className={`inline-block w-fit text-center text-[14px] rounded-[20px] px-3 py-1 bg-gray-100 dark:bg-white dark:text-black`}
        >
          Guide
        </p>
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
              {/* Divider between topics, only shown when the menu runs across the top */}
              {i < SECTIONS.length - 1 && <span className={`lg:hidden text-gray-300 dark:text-gray-600`}>|</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* Main area: page title, then the tutorials for the selected topic */}
      <div className="flex-1 space-y-[32px]">
        <div className="space-y-[4px]">
          <h1 className="text-[28px]">Tutorials</h1>
          <p className={`text-[16px] font-light text-gray-500 dark:text-gray-400`}>Click dropdown to view tutorials</p>
        </div>
        {(() => {
          const ActiveComponent = SECTIONS.find((s) => s.id === activeId)?.Component
          return ActiveComponent ? <ActiveComponent /> : null
        })()}
      </div>
    </div>
  )
}

export default About
