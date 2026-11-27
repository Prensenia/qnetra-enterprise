'use client'
import { useEffect, useState } from 'react'
import { PhoneCall, TimerReset } from 'lucide-react'

const GOLDEN_HOUR_SECONDS = 2 * 60 * 60

function format(total) {
  const s = Math.max(0, total)
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/**
 * Golden-Hour Freeze Window: the first two hours after a cyber-fraud debit are
 * when a 1930 / CFCFRMS lien hold has the highest chance of recovering funds.
 */
export default function GoldenHourBanner({ compact = false, incidentTime = '' }) {
  const [left, setLeft] = useState(GOLDEN_HOUR_SECONDS)

  useEffect(() => {
    const started = incidentTime ? new Date(incidentTime).getTime() : NaN
    const base = Number.isFinite(started) ? Math.min(Date.now(), started) : Date.now()
    const tick = () => {
      const elapsed = Math.floor((Date.now() - base) / 1000)
      setLeft(Math.max(0, GOLDEN_HOUR_SECONDS - (Number.isFinite(elapsed) ? elapsed : 0)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [incidentTime])

  const expired = left <= 0
  const tone = expired
    ? 'border-red-700 bg-red-950 text-red-200'
    : left < 30 * 60
      ? 'border-amber-600 bg-amber-950 text-amber-100'
      : 'border-emerald-700 bg-emerald-950 text-emerald-100'

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded border text-[10px] ${tone}`}>
        <TimerReset size={12} />
        <span className="font-mono font-bold">{format(left)}</span>
        <a href="tel:1930" className="underline font-bold">1930</a>
        <span>NCRP</span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-3 flex items-center justify-between flex-wrap gap-3 ${tone}`}>
      <div className="flex items-center gap-3">
        <TimerReset size={22} />
        <div>
          <div className="text-xs uppercase tracking-widest opacity-80">Golden-Hour Freeze Window</div>
          <div className="font-mono text-2xl font-bold" aria-live="polite">{format(left)}</div>
          <div className="text-[11px] opacity-80">
            {expired
              ? 'Window closed — funds can still be traced, file the NCRP immediately.'
              : 'Remaining time for the strongest chance of an IFSC / nodal-account lien hold.'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a href="tel:1930" className="px-3 py-2 bg-red-600 text-white rounded text-sm font-bold flex items-center gap-2">
          <PhoneCall size={14} /> Quick-dial 1930 (NCRP)
        </a>
        <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="px-3 py-2 border border-current rounded text-sm">
          cybercrime.gov.in
        </a>
      </div>
    </div>
  )
}
