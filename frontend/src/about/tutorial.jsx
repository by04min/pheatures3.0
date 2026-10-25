import { Fragment, useState } from 'react'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'

// collapsible section: click the title to show or hide its steps
function Section({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-start gap-2 text-left cursor-pointer"
      >
        {isOpen ? (
          <ExpandLessOutlinedIcon fontSize="small" />
        ) : (
          <ExpandMoreOutlinedIcon fontSize="small" />
        )}
        <h2 className="font-light text-[20px]">{title}</h2>
      </button>
      {isOpen && <div className="mt-4 space-y-6">{children}</div>}
    </div>
  )
}

// one tutorial step: caption (one entry per line) above a GIF
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

// sections: [{ title, steps: [{ lines: string[], src, alt }] }]
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
