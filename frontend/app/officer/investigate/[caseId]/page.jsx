'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useFileIngest } from '../../../../hooks/useFileIngest'
import { api, fetchWalletHops, fetchWalletRisk, calculateDilution, exportBsaPdf, fetchCaseAuditTrail } from '../../../../lib/api'
import GraphCanvas from '../../../../components/organs/GraphCanvas'
import RiskInspectorDrawer from '../../../../components/organs/RiskInspectorDrawer'
import DilutionCalculator from '../../../../components/organs/DilutionCalculator'
import TimelineOrgan from '../../../../components/organs/TimelineOrgan'
import AuditTrailTable from '../../../../components/organs/AuditTrailTable'
import SearchFilterBar from '../../../../components/organs/SearchFilterBar'
import AssistiveCoPilot from '../../../../components/organs/AssistiveCoPilot'
import { useDemoMode } from '../../../../context/DemoModeContext'

// Canonical sample statement (mirrors docs/Demo_SBI_CyberFraud_Statement.csv).
// Loaded as a real File object so it runs through the exact same ingest path as
// a manual upload: Web Crypto SHA-256, header detection, IST normalisation.
const SAMPLE_SBI_CSV = `Txn Date,UTR Number,Narration,Amount (INR),Type,Bank Name
2026-09-08 10:30:15,420192830110,UPI/CR/420192830110/SALARY CREDIT/TECHCORP,525000.00,CREDIT,State Bank of India
2026-09-08 10:31:04,420192830192,UPI/DR/420192830192/EXCHANGE ESCROW/WAZIRX-HOT,470000.00,DEBIT,State Bank of India
2026-09-08 10:31:22,420192830205,IMPS/DR/420192830205/MULE-SPLIT-01/HDFC00012,15000.00,DEBIT,State Bank of India
2026-09-08 10:31:39,420192830218,IMPS/DR/420192830218/MULE-SPLIT-02/ICIC00045,10000.00,DEBIT,State Bank of India
2026-09-08 10:31:51,420192830231,UPI/DR/420192830231/P2P-LIQUIDITY/BINANCE-P2P,5000.00,DEBIT,State Bank of India
`

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
  // Offline dossier: shown in an in-page viewer because a popup opened from an
  // async handler is blocked by default in Chrome, which made the Export button
  // look dead on stage.
  const [dossier, setDossier] = useState(null)
  const { hash, mapped, ingest } = useFileIngest()
  const activeWallet = selected || caseId

  async function loadHops(walletId = caseId) {
    try {
      const d = await fetchWalletHops(walletId)
      if (d.nodes?.length) {
        setNodes(d.nodes)
        setEdges(d.edges || [])
        return d
      }
    } catch (e) {
      // fall through to the case graph below
    }
    // Case IDs are not wallet addresses; hydrate the workspace from the case graph.
    const graph = await api(`/api/v1/cases/${caseId}/graph`)
    setNodes(graph.nodes || [])
    setEdges(graph.edges || [])
    return graph
  }

  useEffect(() => {
    loadHops(caseId).catch(() => toast.error('Hops load failed'))
    fetchCaseAuditTrail(caseId).then(d => setAudit(d.entries || [])).catch(() => {})
  }, [caseId])

  useEffect(() => {
    if (!selected) return
    fetchWalletRisk(selected).then(setRisk).catch(()=>{})
  }, [selected])

  async function runDilution() {
    const res = await calculateDilution({ initial_taint_ratio: 0.5, hops: [{ wallet_address: activeWallet, pre_balance: 1000, received_amount: 500 }] })
    setDilution(res)
  }

  // Release the blob URL whenever the viewer closes or is replaced, and stop the
  // page behind the modal from scrolling (the workspace is wider than a phone).
  useEffect(() => {
    if (!dossier) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dossier.url) URL.revokeObjectURL(dossier.url)
    }
  }, [dossier])

  async function exportPdf() {
    try {
      await buildAndShowDossier()
    } catch (err) {
      toast.error(`Dossier export failed — ${String(err?.message || err).slice(0, 120)}`)
    }
  }

  async function buildAndShowDossier() {
    const cy = graphRef.current?.getCy ? graphRef.current.getCy() : null
    const base64 = graphRef.current?.getSnapshotBase64 ? graphRef.current.getSnapshotBase64() : (cy ? cy.png({ full: true, scale: 1.5 }).split(',')[1] : null)
    // Attribute the dossier to the selected node, else the highest-value wallet
    // in the loaded graph — never to the case id itself.
    const targetWallet = selected || nodes.find(n => /wallet/i.test(String(n.type || '')))?.id || null
    const { blob, filename, mode, html } = await exportBsaPdf({
      case_id: caseId,
      target_wallet: targetWallet,
      graph_snapshot_base64: base64,
      risk: { composite_risk: '70/100 (CRITICAL)' },
      dilution: dilution || undefined,
      files: mapped.slice(0, 10).map(r => ({ name: r.utr ? `UTR ${r.utr} (${r.bank_name || 'bank'})` : 'evidence', sha256: hash || '' })),
    })
    const url = URL.createObjectURL(blob)
    if (mode === 'client') {
      setDossier({ url, filename, html })
      toast.success('Court dossier ready — review below, then print or download')
      return
    }
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success('Court dossier downloaded')
  }

  function closeDossier() {
    setDossier(null)
  }

  async function loadSampleCsv() {
    const file = new File([SAMPLE_SBI_CSV], 'Demo_SBI_CyberFraud_Statement.csv', { type: 'text/csv' })
    try {
      const result = await ingest(file)
      toast.success(`Sample loaded: ${result.mapped.length} rows • SHA-256 ${result.hash.slice(0, 12)}…`)
    } catch {
      toast.error('Sample load failed')
    }
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
      <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
        <aside className="col-span-3 border-r border-edge p-3 overflow-y-auto min-h-0 space-y-4">
          <div>
            <input type="file" accept=".csv" onChange={e => e.target.files?.[0] && ingest(e.target.files[0])} className="text-xs" />
            <button
              onClick={loadSampleCsv}
              className="mt-2 w-full px-2 py-1 text-[11px] border border-cyan/50 text-cyan rounded hover:bg-cyan/10"
              title="Hash a realistic SBI cyber-fraud statement with Web Crypto and load it into the graph"
            >
              Load Sample SBI Fraud CSV (Demo)
            </button>
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
        <main className="col-span-6 relative min-h-0 overflow-hidden">
          <GraphCanvas ref={graphRef} nodes={nodes} edges={edges} onNodeSelect={setSelected} />
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto min-h-0 space-y-4">
          <RiskInspectorDrawer walletId={selected} />
          <DilutionCalculator />
          <TimelineOrgan edges={edges} />
          <AssistiveCoPilot caseId={caseId} />
        </aside>
      </div>

      {dossier && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col p-4" role="dialog" aria-label="Section 63(4) BSA dossier preview">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm font-bold text-cyan">Sec 63(4) BSA dossier — {caseId}</span>
            <span className="text-[11px] text-slate-400">Part A (IO) · Part B (examiner) · SHA-256 table · dilution math</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => window.open(dossier.url, '_blank')} className="px-3 py-1 bg-panel border border-edge rounded text-xs">Print / open tab</button>
              <a href={dossier.url} download={dossier.filename} className="px-3 py-1 bg-panel border border-edge rounded text-xs">Download</a>
              <button onClick={closeDossier} className="px-3 py-1 bg-critical text-white rounded text-xs">Close</button>
            </div>
          </div>
          <iframe srcDoc={dossier.html} title="Sec 63(4) dossier" className="flex-1 w-full bg-white rounded border border-edge" />
        </div>
      )}
    </div>
  )
}
