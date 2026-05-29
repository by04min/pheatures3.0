import { Routes, Route } from 'react-router-dom'
import NavBar from './navigation/NavBar.jsx'
import PhonemeInventory from './inventory/PhonemeInventory.jsx'
import Pheatures from './pheatures/pheatures.jsx'
import About from './pages/About.jsx'

function App() {
  return (
    <div className="min-h-screen bg-white px-24 pt-24 pb-12">
      <NavBar />
      <div className="mt-4">
        <Routes>
          <Route path="/" element={<Pheatures />} />
          <Route path="/inventory" element={<PhonemeInventory />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
