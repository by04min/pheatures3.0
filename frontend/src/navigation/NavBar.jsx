import { Link, useLocation } from 'react-router-dom'
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'

const NAV_LINKS = [
  { to: '/', label: 'Rules', Icon: RuleOutlinedIcon },
  { to: '/inventory', label: 'Inventory', Icon: TableChartOutlinedIcon },
  { to: '/about', label: 'About', Icon: HelpOutlineOutlinedIcon },
]

function NavBar() {
  const location = useLocation()

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-row justify-center gap-10 shadow-sm rounded-[4px] px-10 py-3">
      {NAV_LINKS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex items-center gap-1.5 font-light text-[15px] transition-colors ${location.pathname === to ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Icon sx={{ fontSize: 16 }} />
          {label}
        </Link>
      ))}
    </nav>
  )
}

export default NavBar
