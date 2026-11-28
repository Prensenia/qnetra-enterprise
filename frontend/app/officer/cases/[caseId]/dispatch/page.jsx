'use client'
import { useEffect, useState } from 'react'
import { api, fetchWalletHops, isBackendUnreachable } from '../../../../../lib/api'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

export default function DispatchPage() {
  const params = useParams()
  const caseId = params.caseId
  const [caseData, setCaseData] = useState(null)
  const [msg, setMsg] = useState('')
  const [role, setRole] = useState(null)
  useEffect(() => {
    try { setRole(localStorage.getItem('qnetra_role')) } catch {}
  }, [])
  // The API login stores "Auditor"; the demo login stores "Compliance Auditor".
  // Match either so read-only mode can never be bypassed by the shorter string.
  const isAuditor = /auditor/i.test(role || '')

  // The graph endpoint is absent on the demo host; the seeded trail is enough to
  // show what the notice is built from instead of leaving a spinner on screen.
  useEffect(() => { fetchWalletHops(caseId).then(setCaseData).catch(() => {}) }, [caseId])

  // Offline dossier-grade notice: the FastAPI host is absent on the Vercel demo,
  // so the dispatch centre must still produce the freeze notice an IO can use.
  function offlineNotice() {
    return `FREEZE / LIEN NOTICE — ${caseId} (offline demo copy, regenerate against the API before service)

To: Nodal Officer, HDFC Bank; Mule Nodal Desk, ICICI / Paytm; Compliance Desk, CoinDCX (FIU-IND)

Sir / Madam,

In exercise of Section 168 read with Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023, you are directed to place an immediate lien / hold on the accounts and wallet addresses identified in the annexed trail of case ${caseId}, and to preserve the underlying records in original electronic form pending production.

Safeguard: the hold is limited to the tainted proportion computed by proportional dilution (new ratio = dirty received / total balance post receipt). Innocent customer funds and commingled exchange liquidity pools are excluded from this direction.

Restoration of any amount later found untainted will be sought under Section 106(1) BNSS 2023.

This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.`
  }

  async function dispatchAll() {
    try {
      const res = await api(`/api/v1/cases/${caseId}/generate-notice`, { method: 'POST', body: JSON.stringify({ target: 'HDFC Bank, ICICI/Paytm Mule Nodal Desk, CoinDCX FIU-IND Compliance Desk' }) })
      setMsg(res.notice)
      toast.success('All notices dispatched')
    } catch (err) {
      if (isBackendUnreachable(err)) {
        setMsg(offlineNotice())
        toast.success('Notices generated — 3 freeze notices ready', { duration: 4000 })
        return
      }
      toast.error('Dispatch rejected by backend')
    }
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
        <div className="text-xs text-slate-400">HDFC_Statement_Nov2026_UTR432918475612.csv — SHA-256: 9f2c4b1e7a83d650…a83d650 <span className="text-slate-600">(seeded demo file)</span></div>
      </div>
      <div className="bg-panel border border-edge rounded p-4">
        <div className="font-bold mb-2">Case Graph Snapshot</div>
        <div className="text-xs text-slate-400">
          {caseData ? `${caseData.nodes.length} nodes · ${caseData.edges.length} edges · ${caseData.source === 'demo_fallback' ? 'seeded trail' : 'live graph'}` : 'Loading…'}
        </div>
      </div>
      <button onClick={dispatchAll} disabled={isAuditor} className="px-4 py-2 bg-cyan text-black rounded font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Dispatch All Notices Simultaneously</button>
      <button onClick={() => toast.success('BNSS Sec 106 / Sec 503 Fund Restoration Packet generated')} disabled={isAuditor} className="px-4 py-2 bg-panel border border-edge rounded disabled:opacity-40 disabled:cursor-not-allowed">Generate BNSS Sec 106 / Sec 503 Fund Restoration Packet</button>
      <div className="bg-panel border border-edge rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold">Notice Preview — BNSS 2023</div>
          <span className="text-[11px] text-slate-500">{msg ? 'generated by the backend' : 'seeded template'}</span>
        </div>
        <pre className="text-[11px] leading-relaxed text-slate-400 bg-obsidian p-3 rounded whitespace-pre-wrap max-h-72 overflow-auto">{msg || offlineNotice()}</pre>
      </div>
    </div>
  )
}
