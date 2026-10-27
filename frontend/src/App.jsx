import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import NavBar from './navigation/NavBar.jsx'
import InventoryPage from './inventory/InventoryPage.jsx'
import RulesPage from './rules/RulesPage.jsx'
import AboutPage from './about/AboutPage.jsx'

/*
01. PAGE TRANSITION
    How a page fades and slides in and out when switching between tabs
*/
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1], staggerChildren: 0.05 },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.18, ease: 'easeIn' } },
}

/*
02. APP
    The app's frame: creates the navigation bar and sets which page
    each tab opens (rules, inventory, about)
*/
function App() {
  const location = useLocation()

  return (
    <div
      className={`min-h-screen px-10 sm:px-24 pt-28 pb-12 transition-colors duration-300 bg-white text-gray-900 dark:bg-[#0E1116] dark:text-white`}
    >
      <NavBar />
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={location.key} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Routes location={location}>
              <Route path="/" element={<RulesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
