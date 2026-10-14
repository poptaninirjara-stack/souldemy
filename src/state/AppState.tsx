import type { ReactNode } from 'react'
import { AppStateContext, useAppStateValue } from './useAppState'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const value = useAppStateValue()
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
