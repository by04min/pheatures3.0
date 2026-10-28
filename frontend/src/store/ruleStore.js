import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { newRow } from '../rules/ruleValidation.js'

/*
01. RULE STORE
    Holds the rows typed into the rule panel, so they survive page navigation and refreshes.
    Saved in the browser tab, so they are cleared when the tab is closed (like the inventory).
    Each row has the shape: { id, value: '+'|'-'|'0'|'', feature: string }
*/
export const useRuleStore = create(
  persist(
    (set) => ({
      targetRows: [newRow()],
      changeRows: [newRow()],
      setTargetRows: (rows) => set({ targetRows: rows }),
      setChangeRows: (rows) => set({ changeRows: rows }),
    }),
    {
      name: 'rule-rows',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
