'use client'
import { useState } from 'react'

export default function TimelineOrgan({ edges = [], onNodeSelect }) {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('ALL')

  // Graph edges carry an asset, not a type: INR hops are bank/UPI, anything
  // else (USDT etc.) is a crypto hop.
  const isCrypto = e => String(e.asset || '').toUpperCase() !== 'INR'
  const filtered = edges.filter(e => {
    if (filter === 'ALL') return true
    if (filter === 'BANK') return !isCrypto(e)
    if (filter === 'CRYPTO') return isCrypto(e)
    return true
  })
  const secondsBetween = (a, b) => {
    const t1 = Date.parse(a?.timestamp), t2 = Date.parse(b?.timestamp)
    if (!Number.isFinite(t1) || !Number.isFinite(t2)) return null
    return Math.max(0, Math.round((t2 - t1) / 1000))
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-cyan">Chronological Timeline</div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-obsidian border border-edge rounded text-[10px] px-1">
          <option value="ALL">All Events</option>
          <option value="BANK">Bank Hops</option>
          <option value="CRYPTO">Crypto Hops</option>
        </select>
      </div>
      {filtered.map((e, i) => (
        <div key={e.id || i} className={`border-l-2 pl-3 pb-3 cursor-pointer transition-colors ${selected === i ? 'border-cyan bg-cyan/5' : 'border-slate-600 hover:border-slate-400'}`} onClick={() => { setSelected(i); onNodeSelect && onNodeSelect(e.source) }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCrypto(e) ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
              {isCrypto(e) ? 'CRYPTO' : 'BANK'}
            </span>
            <span className="text-slate-300 font-medium">{e.source} → {e.target}</span>
            {i > 0 && secondsBetween(filtered[i - 1], e) !== null && <span className="text-amber-400 text-[10px]">[+{secondsBetween(filtered[i - 1], e)} sec]</span>}
          </div>
          <div className="text-slate-500 mt-1">
            {e.amount} {e.asset} • {e.timestamp}
          </div>
          {i > 0 && secondsBetween(filtered[i - 1], e) !== null && <div className="text-[10px] text-slate-600 mt-1">Elapsed from previous hop: {secondsBetween(filtered[i - 1], e)} seconds</div>}
          <div className="text-[10px] text-slate-600 mt-1">Evidence: {e.evidence_type || 'confirmed'} • Hop #{i + 1}</div>
        </div>
      ))}
      {filtered.length === 0 && <div className="text-slate-500 text-center py-4">No timeline events</div>}
      <div className="text-[10px] text-slate-600 pt-2 border-t border-edge">
        Total hops: {edges.length} • Last event: {edges.length ? edges[edges.length - 1].timestamp : 'N/A'}
      </div>
      <div className="text-[10px] text-slate-600">Timestamps are IST; elapsed time is computed between adjacent hops.</div>
    </div>
  )
}
