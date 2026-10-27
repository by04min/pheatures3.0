import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { newRow } from '../rules/ruleValidation.js'

/*
0.1 RULE STORE
    HOlds the rows typed into the rule panel, so they survive page naigation and regreshes.
    Saved in the borwser tab, so they are cleared when the tab is closed (like the inventory).
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

