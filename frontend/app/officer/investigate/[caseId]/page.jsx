'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useFileIngest } from '../../../../hooks/useFileIngest'

const NODE_STYLE = {
  Victim: { shape: 'round-rectangle', color: '#10B981' },
  Bank: { shape: 'round-rectangle', color: '#3B82F6' },
  Exchange: { shape: 'hexagon', color: '#A855F7' },
  Wallet: { shape: 'octagon', color: '#EF4444' },
  Mixer: { shape: 'triangle', color: '#F59E0B' },
  Bridge: { shape: 'rectangle', color: '#F97316' },
}

export default function InvestigatePage() {
  const params = useParams()
  const caseId = params.caseId
  const boxRef = useRef(null)
  const cyRef = useRef(null)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [risk, setRisk] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const [dilution, setDilution] = useState(null)
  const { hash, mapped, ingest } = useFileIngest()

  async function loadHops(walletId) {
    try {
      const res = await fetch(`/api/hops/${walletId}`)
      const data = await res.json()
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch { toast.error('Hops load failed') }
  }

  useEffect(() => { loadHops('0xA7F367e92d11b890') }, [])

  useEffect(() => {
    if (!boxRef.current || !nodes.length) return
    let cy
    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      const elements = [
        ...nodes.map(n => ({ data: { id: n.id, label: n.label || n.id, type: n.type, risk: n.risk_score || 0 } })),
        ...edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, label: `₹${e.amount} • ${e.tx_hash || ''} • +1m`, amount: e.amount } })),
      ]
      cy = cytoscape({
        container: boxRef.current,
        elements,
        style: [
          { selector: 'node', style: { 'background-color': (n) => NODE_STYLE[n.data('type')]?.color || '#6b6579', shape: (n) => NODE_STYLE[n.data('type')]?.shape || 'ellipse', label: 'data(label)', color: '#e2e8f0', 'font-size': 9, 'text-valign': 'bottom', 'text-margin-y': 4 } },
          { selector: 'edge', style: { width: 2, 'line-color': '#475569', 'target-arrow-shape': 'triangle', label: (e) => (nodes.length > 200 ? '' : e.data('label')), 'font-size': 8, color: '#94a3b8', 'curve-style': 'bezier', 'text-rotation': 'autorotate' } },
        ],
        layout: { name: 'breadthfirst', directed: true, padding: 20, animate: true },
      })
      cy.on('tap', 'node', async evt => {
        const id = evt.target.id()
        setSelected(evt.target.data())
        try {
          const r = await fetch(`/api/risk/${id}`)
          setRisk(await r.json())
        } catch {}
      })
      cy.on('dblclick', 'node', evt => {
        loadHops(evt.target.id())
      })
      cyRef.current = cy
      setTimeout(() => { cy.resize(); cy.fit(undefined, 30) }, 300)
    })
    return () => { if (cy) cy.destroy() }
  }, [nodes, edges])

  async function runDilution() {
    const payload = { initial_taint_ratio: 0.5, hops: [{ wallet_address: '0xA7F367e92d11b890', pre_balance: 1000, received_amount: 500 }] }
    const res = await fetch('/api/dilution/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setDilution(await res.json())
  }

  async function exportPdf() {
    const cy = cyRef.current
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
        <button onClick={runDilution} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Dilution Calc</button>
        <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={showCalc} onChange={e=>setShowCalc(e.target.checked)} /> Show Calculation</label>
      </div>
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <aside className="col-span-3 border-r border-edge p-3 overflow-y-auto">
          <div className="mb-3">
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
        </aside>
        <main className="col-span-6 relative">
          <div ref={boxRef} className="absolute inset-0" />
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto">
          <h2 className="text-sm font-bold mb-2">Entity Inspector</h2>
          {selected && <div className="text-xs space-y-1">
            <div className="font-bold text-cyan">{selected.label}</div>
            <div>Type: {selected.type}</div>
            <div>Risk: {selected.risk || 0}/100</div>
            {risk && <div className="mt-2 space-y-1">{Object.entries(risk.score_breakdown || {}).map(([k,v]) => <div key={k}>{k}: +{v}</div>)}</div>}
          </div>}
          {dilution && showCalc && <div className="text-xs mt-3">
            {dilution.steps.map((s,i) => <div key={i}>{s.wallet_address}: {s.pre_balance} + {s.received_amount} to {s.new_ratio.toFixed(4)}</div>)}
          </div>}
        </aside>
      </div>
    </div>
  )
}
