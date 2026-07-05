import { useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'

const SECTIONS = [
  { id: 'views', title: '01. Selecting Views' },
  { id: 'sounds', title: '02. Isolating Target Sounds' },
  { id: 'rules', title: '03. Forming Phonetic Rules' },
]

function ApplyingRules() {
  const [openIds, setOpenIds] = useState(() => new Set(SECTIONS.map((s) => s.id)))

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-[24px]">
      {SECTIONS.map(({ id, title }) => {
        const isOpen = openIds.has(id)
        return (
          <div key={id}>
            <button
              onClick={() => toggle(id)}
              className="flex w-full items-center justify-start gap-2 text-left cursor-pointer"
            >
              {isOpen ? (
                <ExpandLessOutlinedIcon fontSize="small" />
              ) : (
                <ExpandMoreOutlinedIcon fontSize="small" />
              )}
              <h2 className="font-light text-[20px]">{title}</h2>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ApplyingRules
