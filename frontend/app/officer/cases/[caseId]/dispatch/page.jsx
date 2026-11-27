'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../../../lib/api'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

export default function DispatchPage() {
  const params = useParams()
  const caseId = params.caseId
  const [caseData, setCaseData] = useState(null)
  const [msg, setMsg] = useState('')
  const role = typeof window !== 'undefined' ? localStorage.getItem('qnetra_role') : null
  const isAuditor = role === 'Auditor'

  useEffect(() => { api(`/api/v1/cases/${caseId}/graph`).then(setCaseData).catch(()=>{}) }, [caseId])

  async function dispatchAll() {
    try {
      const res = await api(`/api/v1/cases/${caseId}/generate-notice`, { method: 'POST', body: JSON.stringify({ target: 'HDFC Bank, ICICI/Paytm Mule Nodal Desk, CoinDCX FIU-IND Compliance Desk' }) })
      setMsg(res.notice)
      toast.success('All notices dispatched')
    } catch { toast.error('Dispatch failed') }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">Zero-Touch Action & Legal Dispatch Center</h1>
      {isAuditor && <div className="px-3 py-2 border border-amber-600 rounded text-amber-300 text-sm">Read-Only Compliance Auditor Mode — BSA Sec 63 Verification</div>}
      <div className="text-sm text-slate-400">Case: {caseId}</div>
      <div className="bg-panel border border-edge rounded p-4 space-y-2">
        <div className="font-bold">Identified Institutions</div>
        <div className="text-xs text-slate-300">HDFC Bank — 1800-1600 / 1800-2600</div>
        <div className="text-xs text-slate-300">ICICI / Paytm Mule Nodal Desk — 1800-2662</div>
        <div className="text-xs text-slate-300">CoinDCX FIU-IND Compliance Desk — lea-compliance@coindcx.com</div>
      </div>
      <div className="bg-panel border border-edge rounded p-4">
        <div className="font-bold mb-2">Attached Evidence</div>
        <div className="text-xs text-slate-400">HDFC_Statement_Nov2026_UTR432918475612.csv — SHA-256: simulated</div>
      </div>
      <div className="bg-panel border border-edge rounded p-4">
        <div className="font-bold mb-2">Q-Sahayak Triage Summary</div>
        <div className="text-xs text-slate-400">{caseData ? `${caseData.nodes.length} nodes, ${caseData.edges.length} edges` : 'Loading...'}</div>
      </div>
      <button onClick={dispatchAll} disabled={isAuditor} className="px-4 py-2 bg-cyan text-black rounded font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Dispatch All Notices Simultaneously</button>
      {msg && <pre className="text-xs text-slate-400 bg-obsidian p-3 rounded whitespace-pre-wrap">{msg}</pre>}
    </div>
  )
}
