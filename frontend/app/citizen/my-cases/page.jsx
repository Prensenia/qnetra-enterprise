'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'

export default function MyCases() {
  const [cases, setCases] = useState([])
  useEffect(() => { api('/api/v1/citizen/cases').then(setCases).catch(()=>{}) }, [])
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400">My Cases</h1>
      {cases.map(c => (
        <div key={c.case_id} className="bg-slate-800 border border-slate-700 rounded p-4">
          <div className="font-mono text-emerald-300">{c.case_id}</div>
          <div className="text-sm">{c.scam_type} - ₹{c.amount_inr}</div>
          <div className="text-xs text-slate-400">{c.description}</div>
        </div>
      ))}
    </div>
  )
}
