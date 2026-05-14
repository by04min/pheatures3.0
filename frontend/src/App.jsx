import { Routes, Route } from 'react-router-dom'
import Layout from './layout.jsx'
import NavBar from './navigation/NavBar.jsx'
import PhonemeInventory from './inventory/PhonemeInventory.jsx'
import Pheatures from './pheatures/pheatures.jsx'
import About from './pages/About.jsx'

function App() {
  return (
    <Layout>
      <NavBar />
      <div className="mt-12">
        <Routes>
          <Route path="/" element={<Pheatures />} />
          <Route path="/inventory" element={<PhonemeInventory />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Layout>
  )
}

export default App
