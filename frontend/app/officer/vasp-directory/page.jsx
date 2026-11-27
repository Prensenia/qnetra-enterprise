'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Search } from 'lucide-react'
import { VASP_FALLBACK } from '../../../lib/vaspFallback'

const TIER_CLASS = {
  LOW: 'bg-emerald-900 text-emerald-300 border-emerald-700',
  MEDIUM: 'bg-amber-900 text-amber-300 border-amber-700',
  HIGH: 'bg-orange-900 text-orange-300 border-orange-700',
  CRITICAL: 'bg-red-900 text-red-300 border-red-700',
}

export default function VaspDirectoryPage() {
  const [data, setData] = useState({ vasps: VASP_FALLBACK, banks: [] })
  const [q, setQ] = useState('')

  useEffect(() => {
    api('/api/v1/vasp/directory')
      .then(d => { if (d?.vasps?.length) setData(d) })
      .catch(() => setData({ vasps: VASP_FALLBACK, banks: [] }))
  }, [])

  const filtered = (data.vasps || []).filter(v => (v.name || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-cyan">VASP & Exchange Intelligence Directory</h1>
        <div className="text-xs text-slate-400 mt-1">FIU-IND reporting status, nodal compliance desk, Sec 94 BNSS response SLA and risk tier for Indian cyber-fraud triage.</div>
      </div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search exchanges..." className="bg-panel border border-edge rounded px-3 py-2 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(v => (
          <div key={v.name} className="bg-panel border border-edge rounded p-4 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <div className="font-bold text-cyan">{v.name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${TIER_CLASS[v.risk_tier] || TIER_CLASS.MEDIUM}`}>{v.risk_tier || 'MEDIUM'}</span>
            </div>
            <div className={`text-xs ${v.fiu_registered ? 'text-emerald-400' : 'text-red-400'}`}>
              {v.fiu_registered ? `FIU-IND Registered (${v.re_id})` : 'FIU-IND: Not Registered'}
            </div>
            {v.fiu_status && <div className="text-[11px] text-slate-500">{v.fiu_status}</div>}
            <div className="text-xs text-slate-400">Nodal compliance: {v.lea_email}</div>
            <div className="text-xs text-slate-400">Sec 94 BNSS freeze SLA: {v.freeze_sla}</div>
            <div className="text-xs text-slate-400">KYC: {v.kyc}</div>
            {v.notes && <div className="text-[11px] text-slate-500 pt-1 border-t border-edge">{v.notes}</div>}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-sm text-slate-400">No matching exchanges.</div>}
    </div>
  )
}
