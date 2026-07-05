import { useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'

const SECTIONS = [
  { id: 'select', title: '01. Select Phonemes' },
  { id: 'diacritics', title: '02. Add Diacritics' },
  { id: 'presets', title: '03. Load Presets' },
]

function ManagingInventory() {
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

export default ManagingInventory
