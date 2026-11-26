'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { toast } from 'sonner'

export default function MyCases() {
  const [cases, setCases] = useState([])
  useEffect(() => { api('/api/v1/citizen/cases').then(setCases).catch(()=>{}) }, [])

  function copyEmail() {
    const text = 'Subject: Cyber Fraud Dispute - Lien Request\nI am reporting cyber fraud. Please place lien on disputed amount and escalate to Principal Nodal Officer.'
    navigator.clipboard.writeText(text)
    toast.success('Email copied')
  }

  function downloadCompLetter() {
    const letter = 'RBI Small-Value Fraud Compensation Request Letter (up to Rs 40,000)'
    const blob = new Blob([letter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'rbi_compensation_letter.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400">My Cases</h1>
      {cases.map(c => (
        <div key={c.case_id} className="bg-slate-800 border border-slate-700 rounded p-4 space-y-3">
          <div className="font-mono text-emerald-300">{c.case_id}</div>
          <div className="text-sm">{c.scam_type} - ₹{c.amount_inr}</div>
          <div className="text-xs text-slate-400">{c.description}</div>
          {c.ncrp_id && <div className="text-xs text-slate-400">NCRP ID: {c.ncrp_id}</div>}
          <div className="text-xs font-bold text-emerald-300">RBI Zero-Liability Timeline</div>
          <ol className="list-decimal pl-5 text-xs text-slate-300 space-y-1">
            <li>0-24 Hours: Call 1930 + send same-day written email.</li>
            <li>Day 1-15: Bank internal grievance & nodal officer escalation.</li>
            <li>Day 30-90: RBI Integrated Ombudsman filing (strict 90-day limit).</li>
            <li>Post-Hold: BNSS Sec 503 restoration (Indemnity Bond, Bank Statement, NCRP Ack).</li>
          </ol>
          <div className="flex gap-2">
            <button onClick={copyEmail} className="px-3 py-1 bg-slate-700 text-white rounded text-xs">Copy Same-Day Bank Dispute Email</button>
            <button onClick={downloadCompLetter} className="px-3 py-1 bg-slate-700 text-white rounded text-xs">Download RBI Compensation Letter</button>
          </div>
        </div>
      ))}
    </div>
  )
}
