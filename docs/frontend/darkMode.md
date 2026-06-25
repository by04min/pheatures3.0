# Dark Mode

## Overview

Dark mode is toggled via a button on the rightmost side of the navbar (moon/sun icon). The preference is persisted to `localStorage` via a Zustand store (`src/store/themeStore.js`).

## Behavior

- **Background**: `#0E1116`
- **General text**: white
- **Table inner cells**: `bg-slate-50` — lighter gray, inherited from the `<table>` element
- **Table outer cells** (row/column headers): `bg-gray-100` — slightly darker gray
- **Form inputs / selects** (rule panel dropdowns, preset select): `bg-gray-100` with black text
- **Diacritic drag tiles**: white background, black text; hover `bg-gray-300`
- **`+` add-row button**: white background, black text; hover `bg-gray-300`
- **Clear / Clear Inventory buttons**: inherit white from parent; hover `text-gray-300`
- **Sheet / Table / nav link-style buttons**: inherit white from parent
- **Modal (FeaturePanel)**: always white background with black text
- **Sticky headers** (Rules + Inventory pages): follow page background with `transition-colors duration-300` to stay in sync

## Files Changed

- `store/themeStore.js` — new Zustand store for `isDark` / `toggleTheme`
- `navigation/NavBar.jsx` — dark/light toggle button; nav link colors adapt to mode
- `App.jsx` — top-level background and text color switch
- `pheatures/pheatures.jsx` — sticky header follows dark mode with transition; subtitle text goes white; Sheet/Table toggles inherit white
- `pheatures/RulePanel.jsx` — selects use `bg-gray-100`; `+` button white with `hover:bg-gray-300`; Clear button inherits white
- `pheatures/display/tableView.jsx` — table bg `bg-slate-50`, header cells `bg-gray-100`, all text black
- `pheatures/display/sheetView.jsx` — table bg `bg-slate-50`, header/sticky cells `bg-gray-100`, all text black
- `pheatures/display/featurePanel.jsx` — modal container pinned `bg-white text-black`
- `inventory/PhonemeInventory.jsx` — sticky header follows dark mode with transition; diacritic tiles white/black; subtitle texts white; table bg `bg-slate-50`, header cells `bg-gray-100`; preset select `bg-gray-100`; Clear Inventory inherits white
