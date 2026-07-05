import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import NavBar from './navigation/NavBar.jsx'
import PhonemeInventory from './inventory/PhonemeInventory.jsx'
import Pheatures from './pheatures/pheatures.jsx'
import About from './about/About.jsx'
import { useThemeStore } from './store/themeStore'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1], staggerChildren: 0.05 },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.18, ease: 'easeIn' } },
}

function App() {
  const location = useLocation()
  const { isDark } = useThemeStore()

  return (
    <div className={`min-h-screen px-10 sm:px-24 pt-28 pb-12 transition-colors duration-300 ${isDark ? 'bg-[#0E1116] text-white' : 'bg-white text-gray-900'}`}>
      <NavBar />
      <div className="mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.key}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Routes location={location}>
              <Route path="/" element={<Pheatures />} />
              <Route path="/inventory" element={<PhonemeInventory />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
