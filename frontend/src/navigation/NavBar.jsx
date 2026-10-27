import { Link, useLocation } from 'react-router-dom'
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useThemeStore } from '../store/themeStore'

/*
01. NAV LINKS
    The options in the navigation bar, and which page each one leads to
*/
const NAV_LINKS = [
  { to: '/', label: 'Rules', Icon: RuleOutlinedIcon },
  { to: '/inventory', label: 'Inventory', Icon: TableChartOutlinedIcon },
  { to: '/about', label: 'About', Icon: HelpOutlineOutlinedIcon },
]

/*
02. NAV BAR
    The bar at the top of every page: links to each page, plus the light/dark switch
*/
function NavBar() {
  const location = useLocation()
  const { isDark, toggleTheme } = useThemeStore()

  const activeClass = 'text-gray-800 dark:text-white'
  const inactiveClass = 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'

  return (
    <nav
      className={`fixed top-10 left-1/2 -translate-x-1/2 z-50 flex flex-row items-center justify-center gap-10 rounded-[4px] px-10 py-3 transition-colors duration-300 bg-white dark:bg-[#0E1116]`}
    >
      {NAV_LINKS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex items-center gap-1.5 font-light text-[15px] transition-colors ${location.pathname === to ? activeClass : inactiveClass}`}
        >
          <Icon sx={{ fontSize: 16 }} />
          {label}
        </Link>
      ))}
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-1.5 font-light text-[15px] transition-colors cursor-pointer ${inactiveClass}`}
      >
        {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 16 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />}
        {isDark ? 'Light' : 'Dark'}
      </button>
    </nav>
  )
}

export default NavBar
