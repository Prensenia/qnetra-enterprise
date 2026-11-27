'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useFileIngest } from '../../../../hooks/useFileIngest'
import GraphCanvas from '../../../../components/organs/GraphCanvas'
import RiskInspectorDrawer from '../../../../components/organs/RiskInspectorDrawer'
import DilutionCalculator from '../../../../components/organs/DilutionCalculator'
import TimelineOrgan from '../../../../components/organs/TimelineOrgan'
import AuditTrailTable from '../../../../components/organs/AuditTrailTable'

export default function InvestigatePage() {
  const params = useParams()
  const caseId = params.caseId
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [audit, setAudit] = useState([])
  const [selected, setSelected] = useState(null)
  const [cy, setCy] = useState(null)
  const { hash, mapped, ingest } = useFileIngest()

  useEffect(() => {
    fetch(`/api/hops/0xA7F367e92d11b890`).then(r => r.json()).then(d => {
      setNodes(d.nodes || [])
      setEdges(d.edges || [])
    }).catch(() => toast.error('Hops load failed'))
    fetch(`/api/cases/${caseId}/audit`).then(r => r.json()).then(setAudit).catch(()=>{})
  }, [caseId])

  async function exportPdf() {
    const png = cy ? cy.png({ full: true, bg: '#060913' }) : null
    const base64 = png ? png.split(',')[1] : null
    const res = await fetch('/api/report/sec63-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ case_id: caseId, target_wallet: '0xA7F367e92d11b890', graph_snapshot_base64: base64 }) })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${caseId}_dossier.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b border-edge flex gap-2 items-center flex-wrap">
        <h1 className="text-lg font-bold text-cyan">Investigation: {caseId}</h1>
        <button onClick={exportPdf} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Export PDF</button>
      </div>
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <aside className="col-span-3 border-r border-edge p-3 overflow-y-auto space-y-4">
          <div>
            <input type="file" accept=".csv" onChange={e => e.target.files?.[0] && ingest(e.target.files[0])} className="text-xs" />
            {hash && <div className="text-[10px] text-emerald-400 mt-1">[✓] Hash Generated & Immutable Logged: {hash.slice(0,12)}...</div>}
            {mapped.length > 0 && (
              <div className="mt-2 max-h-32 overflow-auto text-[10px]">
                <table className="w-full">
                  <thead><tr><th>UTR</th><th>Amount</th><th>Time</th><th>Bank</th></tr></thead>
                  <tbody>
                    {mapped.slice(0,5).map((r,i) => <tr key={i}><td>{r.utr}</td><td>{r.amount}</td><td>{r.timestamp}</td><td>{r.bank_name}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <AuditTrailTable logs={audit} />
        </aside>
        <main className="col-span-6 relative">
          <GraphCanvas nodes={nodes} edges={edges} onNodeSelect={setSelected} onCyReady={setCy} />
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto space-y-4">
          <RiskInspectorDrawer walletId={selected} />
          <DilutionCalculator />
          <TimelineOrgan edges={edges} />
        </aside>
      </div>
    </div>
  )
}
