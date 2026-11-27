'use client'
import { useDemoMode } from '../context/DemoModeContext'

export default function DemoOverlay() {
  const { isDemoMode } = useDemoMode()
  return (
    <>
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
          <div className="text-6xl font-bold text-white/5 rotate-[-30deg] select-none">DEMO DATA - NOT FOR OPERATIONAL USE</div>
        </div>
      )}
      <footer className="fixed bottom-0 left-0 right-0 pointer-events-none z-[9998] text-center text-[10px] text-slate-500 bg-black/40 py-1">
        This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.
      </footer>
    </>
  )
}
