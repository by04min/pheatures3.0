import { TutorialSections } from '../Tutorial.jsx'
import inventoryScrollChoose from '../media/inventory-scroll-choose.gif'
import viewAddDiacritic from '../media/view-add-diacritic.gif'
import invalidDiacritic from '../media/invalid-diacritic.gif'
import presets from '../media/presets.gif'

/*
01. SECTIONS
    The tutorial content: each section has steps, and each step has a caption (one entry per line),
    a demo GIF, and a text description of the GIF for screen readers
*/
const SECTIONS = [
  {
    title: '01. Select Phonemes',
    steps: [
      {
        lines: [
          'Scroll horizontally and vertically to view all phonemes',
          'Click a phoneme to add to inventory, and again to remove',
        ],
        src: inventoryScrollChoose,
        alt: 'Scrolling through and choosing phonemes in the inventory',
      },
    ],
  },
  {
    title: '02. Add Diacritics',
    steps: [
      {
        lines: [
          'Hover above a diacritic to view its label',
          'Drag a diacritic to view valid targets, and drop to apply',
        ],
        src: viewAddDiacritic,
        alt: 'Viewing and adding a diacritic',
      },
      {
        lines: ['Dragging to an invalid target displays an error message'],
        src: invalidDiacritic,
        alt: 'Invalid diacritic feedback',
      },
    ],
  },
  {
    title: '03. Load Presets',
    steps: [
      {
        lines: ['Select a preset to auto-populate the inventory', 'Add or remove phonemes as needed'],
        src: presets,
        alt: 'Loading presets',
      },
    ],
  },
]

/*
02. MANAGING INVENTORY
    The "Manage Inventory" tutorials
*/
export default function ManagingInventory() {
  return <TutorialSections sections={SECTIONS} />
}
