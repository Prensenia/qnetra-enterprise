'use client'
import { useDemoMode } from '../context/DemoModeContext'

export default function DemoOverlay() {
  const { isDemoMode } = useDemoMode()
  return (
    <>
      {isDemoMode && (
        <div className="fixed top-14 right-3 pointer-events-none z-[9999] select-none text-[9px] tracking-widest px-2 py-0.5 rounded border border-slate-700 bg-slate-900/80 text-slate-500">
          SANDBOX DATASET
        </div>
      )}
      <footer className="fixed bottom-0 left-0 right-0 pointer-events-none z-[9998] text-center text-[10px] text-slate-500 bg-black/40 py-1">
        This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.
      </footer>
    </>
  )
}
