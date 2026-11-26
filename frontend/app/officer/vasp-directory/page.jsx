'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { Search } from 'lucide-react'

export default function VaspDirectoryPage() {
  const [data, setData] = useState({ vasps: [], banks: [] })
  const [q, setQ] = useState('')
  useEffect(() => { api('/api/v1/vasp/directory').then(setData).catch(()=>{}) }, [])
  const filtered = data.vasps.filter(v => v.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">VASP & Exchange Intelligence Directory</h1>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search exchanges..." className="bg-panel border border-edge rounded px-3 py-2 w-64" />
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(v => (
          <div key={v.name} className="bg-panel border border-edge rounded p-4">
            <div className="font-bold text-cyan">{v.name}</div>
            <div className="text-xs text-slate-400 mt-1">FIU-IND: {v.fiu_registered ? `Registered (${v.re_id})` : 'Unregistered Offshore'}</div>
            <div className="text-xs text-slate-400">LEA Desk: {v.lea_email}</div>
            <div className="text-xs text-slate-400">Freeze SLA: {v.freeze_sla}</div>
            <div className="text-xs text-slate-400">KYC: {v.kyc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
