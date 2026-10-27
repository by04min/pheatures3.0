import { Fragment, useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'

/*
01. SECTION
    A tutorial section that opens and closes when its title is clicked
*/
function Section({ title, children }) {
  // Starts closed
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-start gap-2 text-left cursor-pointer"
      >
        {isOpen ? <ExpandLessOutlinedIcon fontSize="small" /> : <ExpandMoreOutlinedIcon fontSize="small" />}
        <h2 className="font-light text-[20px]">{title}</h2>
      </button>
      {isOpen && <div className="mt-4 space-y-6">{children}</div>}
    </div>
  )
}

/*
02. TUTORIAL STEP
    One step: a short caption above an animated demo (GIF)
*/
function TutorialStep({ lines, src, alt }) {
  return (
    <div className="ml-7 space-y-[12px]">
      <p className="text-[16px] font-light text-gray-600 dark:text-white">
        {lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </p>
      <img src={src} alt={alt} className="w-full rounded-[4px]" />
    </div>
  )
}

/*
03. TUTORIAL SECTIONS
    Shows a list of tutorial sections, each with its steps. Used by both guide pages.
*/
export function TutorialSections({ sections }) {
  return (
    <div className="space-y-[24px]">
      {sections.map(({ title, steps }) => (
        <Section key={title} title={title}>
          {steps.map((step) => (
            <TutorialStep key={step.src} {...step} />
          ))}
        </Section>
      ))}
    </div>
  )
}
