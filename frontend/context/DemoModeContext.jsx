'use client'
import { createContext, useContext, useState } from 'react'

const DemoModeContext = createContext({ isDemoMode: true, setIsDemoMode: () => {} })

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(true)
  return <DemoModeContext.Provider value={{ isDemoMode, setIsDemoMode }}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() { return useContext(DemoModeContext) }
