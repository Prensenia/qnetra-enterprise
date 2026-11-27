'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useFileIngest } from '../../../../hooks/useFileIngest'
import { fetchWalletHops, fetchWalletRisk, calculateDilution, downloadSec63Dossier } from '../../../../lib/api'
import GraphCanvas from '../../../../components/organs/GraphCanvas'
import RiskInspectorDrawer from '../../../../components/organs/RiskInspectorDrawer'
import DilutionCalculator from '../../../../components/organs/DilutionCalculator'
import TimelineOrgan from '../../../../components/organs/TimelineOrgan'
import AuditTrailTable from '../../../../components/organs/AuditTrailTable'
import SearchFilterBar from '../../../../components/organs/SearchFilterBar'
import AssistiveCoPilot from '../../../../components/organs/AssistiveCoPilot'
import { useDemoMode } from '../../../../context/DemoModeContext'

export default function InvestigatePage() {
  const params = useParams()
  const caseId = params.caseId
  const { isDemoMode } = useDemoMode()
  const graphRef = useRef(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [audit, setAudit] = useState([])
  const [selected, setSelected] = useState(null)
  const [risk, setRisk] = useState(null)
  const [dilution, setDilution] = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const { hash, mapped, ingest } = useFileIngest()

  useEffect(() => {
    fetchWalletHops('0xA7F367e92d11b890').then(d => {
      setNodes(d.nodes || [])
      setEdges(d.edges || [])
    }).catch(() => toast.error('Hops load failed'))
    fetch(`/api/cases/${caseId}/audit`).then(r => r.json()).then(setAudit).catch(()=>{})
  }, [caseId])

  useEffect(() => {
    if (!selected) return
    fetchWalletRisk(selected).then(setRisk).catch(()=>{})
  }, [selected])

  async function runDilution() {
    const res = await calculateDilution({ initial_taint_ratio: 0.5, hops: [{ wallet_address: '0xA7F367e92d11b890', pre_balance: 1000, received_amount: 500 }] })
    setDilution(res)
  }

  async function exportPdf() {
    const cy = graphRef.current?.getCy ? graphRef.current.getCy() : null
    const base64 = graphRef.current?.getSnapshotBase64 ? graphRef.current.getSnapshotBase64() : (cy ? cy.png({ full: true, scale: 1.5 }).split(',')[1] : null)
    if (isDemoMode) {
      const { blob, filename } = await downloadSec63Dossier({}, true)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      return
    }
    const { blob, filename } = await downloadSec63Dossier({ case_id: caseId, target_wallet: '0xA7F367e92d11b890', graph_snapshot_base64: base64 }, false)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function handleFilter(f) {
    // client-side filter could be applied; for now just log
    console.log('filter', f)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b border-edge flex gap-2 items-center flex-wrap">
        <h1 className="text-lg font-bold text-cyan">Investigation: {caseId}</h1>
        <button onClick={exportPdf} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Export Sec 63 BSA Dossier PDF</button>
        <SearchFilterBar onFilter={handleFilter} />
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
          <AuditTrailTable caseId={caseId} />
        </aside>
        <main className="col-span-6 relative">
          <GraphCanvas ref={graphRef} nodes={nodes} edges={edges} onNodeSelect={setSelected} />
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto space-y-4">
          <RiskInspectorDrawer walletId={selected} />
          <DilutionCalculator />
          <TimelineOrgan edges={edges} />
          <AssistiveCoPilot caseId={caseId} />
        </aside>
      </div>
    </div>
  )
}
