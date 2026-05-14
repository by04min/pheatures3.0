import { Link } from 'react-router-dom'

function NavBar() {
  return (
    <nav className="flex flex-row justify-between">
      <Link to="/" className="font-light text-[16px] hover:text-gray-500">Home</Link>
      <div className="flex flex-row gap-8">
      <Link to="/inventory" className="font-light text-[16px] hover:text-gray-500">Inventory</Link>
      <Link to="/about" className="font-light text-[16px] hover:text-gray-500">About</Link>
      </div>
    </nav>
  )
}

export default NavBar
