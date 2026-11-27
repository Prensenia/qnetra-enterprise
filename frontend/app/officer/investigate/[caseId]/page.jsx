'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../../../lib/api'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react'

const NODE_STYLE = {
  BankAccount: { shape: 'round-rectangle', color: '#10B981' },
  UPI: { shape: 'diamond', color: '#F59E0B' },
  VASPExchange: { shape: 'hexagon', color: '#06B6D4' },
  CryptoWallet: { shape: 'octagon', color: '#EF4444' },
  Mixer: { shape: 'triangle', color: '#F59E0B' },
  SanctionedCluster: { shape: 'octagon', color: '#EF4444' },
  KYCEntity: { shape: 'rectangle', color: '#6366F1' },
}

export default function InvestigatePage() {
  const params = useParams()
  const caseId = params.caseId
  const boxRef = useRef(null)
  const cyRef = useRef(null)
  const [graph, setGraph] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [audit, setAudit] = useState([])
  const [correlations, setCorrelations] = useState([])
  const [selected, setSelected] = useState(null)
  const [layout, setLayout] = useState('breadthfirst')
  const [threshold, setThreshold] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [timeIndex, setTimeIndex] = useState(0)
  const [times, setTimes] = useState([])
  const [tab, setTab] = useState('entity')
  const [notes, setNotes] = useState('')
  const [notice, setNotice] = useState('')
  const [viewMode, setViewMode] = useState('graph')
  const [hopIndex, setHopIndex] = useState(0)

  useEffect(() => {
    api(`/api/v1/cases/${caseId}/graph`).then(g => {
      const edges = (g.edges || []).map((e, i) => ({ ...e, hop: i + 1, utr: e.id }))
      setGraph({ ...g, edges })
      const ts = [...new Set(edges.map(e => e.timestamp).filter(Boolean))].sort()
      setTimes(ts)
      setTimeIndex(ts.length)
      setHopIndex(edges.length)
    }).catch(()=>{})
    api(`/api/v1/cases/${caseId}/audit`).then(setAudit).catch(()=>{})
    api(`/api/v1/cases/${caseId}/correlations`).then(r => setCorrelations(r.correlations || [])).catch(()=>{})
  }, [caseId])

  useEffect(() => {
    if (!boxRef.current || !graph) return
    let cy
    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      const elements = [
        ...graph.nodes.map(n => ({ data: { id: n.id, label: n.label, type: n.type, risk: n.risk_score, meta: n.metadata || {} } })),
        ...graph.edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, amount: e.amount, asset: e.asset, type: e.type, ts: e.timestamp, evidence: e.evidence_type, hop: e.hop, utr: e.utr } })),
      ]
      cy = cytoscape({
        container: boxRef.current,
        elements,
        style: [
          { selector: 'node', style: { 'background-color': (n) => (NODE_STYLE[n.data('type')]?.color || '#6b6579'), shape: (n) => (NODE_STYLE[n.data('type')]?.shape || 'ellipse'), width: (n) => 22 + (n.data('risk')||0)/5, height: (n) => 22 + (n.data('risk')||0)/5, label: 'data(label)', color: '#e2e8f0', 'font-size': 9, 'text-valign': 'bottom', 'text-margin-y': 4, 'border-width': 2, 'border-color': '#1E293B' } },
          { selector: 'edge', style: { 'line-color': (e) => e.data('evidence') === 'inferred' ? '#F59E0B' : '#475569', 'target-arrow-shape': 'triangle', 'target-arrow-color': (e) => e.data('evidence') === 'inferred' ? '#F59E0B' : '#475569', width: 2, label: (e) => `₹${e.data('amount').toLocaleString()} • UTR ${String(e.data('utr')).slice(-6)} • +${e.data('hop')}m`, 'font-size': 8, color: '#94a3b8', 'curve-style': 'bezier', 'text-rotation': 'autorotate' } },
          { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#06B6D4' } },
          { selector: 'edge:selected', style: { 'line-color': '#06B6D4', 'target-arrow-color': '#06B6D4', width: 3 } },
        ],
        layout: { name: 'breadthfirst', directed: true, padding: 20, animate: true },
        wheelSensitivity: 0.2,
      })
      cy.on('tap', 'node', evt => setSelected({ type: 'node', data: evt.target.data() }))
      cy.on('tap', 'edge', evt => setSelected({ type: 'edge', data: evt.target.data() }))
      cy.on('tap', evt => { if (evt.target === cy) setSelected(null) })
      cyRef.current = cy
      applyFilters(cy, threshold, collapsed, times, timeIndex, hopIndex)
      setTimeout(() => {
        try {
          cy.resize(); cy.fit(undefined, 30)
          const highest = cy.nodes().max(n => n.data('risk') || 0)
          if (highest && !highest.empty()) {
            cy.$(':selected').unselect()
            highest.select()
            setSelected({ type: 'node', data: highest.data() })
          }
        } catch {}
      }, 500)
    })
    return () => { if (cy) cy.destroy() }
  }, [graph])

  function applyFilters(cy, thr, col, ts, ti, hi) {
    if (!cy) return
    cy.edges().forEach(e => {
      const amt = e.data('amount') || 0
      const visibleByThreshold = amt >= thr
      const visibleByTime = ts.length === 0 || ti >= ts.length || !e.data('ts') || ts.indexOf(e.data('ts')) <= ti
      const visibleByHop = hi === 0 || (e.data('hop') || 0) <= hi
      e.style('display', visibleByThreshold && visibleByTime && visibleByHop ? 'element' : 'none')
    })
    cy.nodes().forEach(n => {
      if (col && n.data('type') === 'UPI') n.style('display', 'none')
      else n.style('display', 'element')
    })
    if (col) {
      if (cy.getElementById('MULE_CLUSTER').empty()) {
        cy.add({ data: { id: 'MULE_CLUSTER', label: 'Mule Cluster', type: 'SanctionedCluster', risk: 90 }, position: { x: 200, y: 200 } })
      }
    } else {
      const cl = cy.getElementById('MULE_CLUSTER')
      if (!cl.empty()) cl.remove()
    }
  }

  useEffect(() => { applyFilters(cyRef.current, threshold, collapsed, times, timeIndex, hopIndex) }, [threshold, collapsed, timeIndex, times, hopIndex])

  function changeLayout(name) {
    setLayout(name)
    const cy = cyRef.current
    if (!cy) return
    const opts = name === 'concentric' ? { name: 'concentric', animate: true, animationDuration: 600 } :
                 name === 'cose' ? { name: 'cose', animate: true, animationDuration: 600 } :
                 { name: 'breadthfirst', directed: true, animate: true, animationDuration: 600 }
    cy.layout(opts).run()
  }

  function isolatePath() {
    const cy = cyRef.current
    if (!cy) return
    const victim = cy.nodes().filter(n => n.data('type') === 'BankAccount').first()
    const exit = cy.nodes().filter(n => n.data('type') === 'SanctionedCluster').first()
    if (victim.empty() || exit.empty()) return
    const dijkstra = cy.elements().dijkstra({ root: victim, directed: true })
    const path = dijkstra.pathTo(exit)
    cy.elements().not(path).not(path.nodes()).style('opacity', 0.15)
    path.style('opacity', 1)
    toast.success('Shortest path isolated')
  }

  function resetIsolate() {
    const cy = cyRef.current
    if (!cy) return
    cy.elements().style('opacity', 1)
  }

  useEffect(() => {
    if (!playing || times.length === 0) return
    const id = setInterval(() => {
      setTimeIndex(prev => {
        if (prev >= times.length) { setPlaying(false); return times.length }
        return prev + 1
      })
    }, 1000 / speed)
    return () => clearInterval(id)
  }, [playing, speed, times])

  async function runAnalyze() {
    try {
      const res = await api(`/api/v1/analyze/${caseId}`, { method: 'POST' })
      setAnalysis(res)
      toast.success('Analysis complete')
    } catch { toast.error('Analysis failed') }
  }

  async function exportPdf() {
    try {
      const cy = cyRef.current
      const png = cy ? cy.png({ full: true, bg: '#060913' }) : null
      const base64 = png ? png.split(',')[1] : null
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/cases/${caseId}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('qnetra_token') ? { Authorization: `Bearer ${localStorage.getItem('qnetra_token')}` } : {}) },
        body: JSON.stringify({ graph_png: base64 }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${caseId}_dossier.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch { toast.error('Export failed') }
  }

  async function generateNotice() {
    try {
      const target = nodeData?.meta?.exchange || nodeData?.meta?.ifsc || 'VASP'
      const res = await api(`/api/v1/cases/${caseId}/generate-notice`, { method: 'POST', body: JSON.stringify({ target }) })
      setNotice(res.notice)
      toast.success('Notice generated')
    } catch { toast.error('Notice failed') }
  }

  function saveNotes() {
    localStorage.setItem(`notes_${caseId}`, notes)
    toast.success('Notes saved')
  }

  useEffect(() => {
    setNotes(localStorage.getItem(`notes_${caseId}`) || '')
  }, [caseId])

  const nodeData = selected?.type === 'node' ? selected.data : null
  const edgeData = selected?.type === 'edge' ? selected.data : null

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b border-edge flex gap-2 items-center flex-wrap">
        <h1 className="text-lg font-bold text-cyan">Investigation: {caseId}</h1>
        <button onClick={runAnalyze} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Analyze</button>
        <button onClick={exportPdf} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Export PDF</button>
        <button onClick={isolatePath} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Isolate Shortest Path</button>
        <button onClick={resetIsolate} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Reset</button>
        <button onClick={() => setCollapsed(c => !c)} className="px-3 py-1 bg-panel border border-edge rounded text-sm">{collapsed ? 'Expand' : 'Collapse'} Mule Rings</button>
        <div className="flex gap-1 ml-2">
          {['breadthfirst','concentric','cose'].map(l => (
            <button key={l} onClick={() => changeLayout(l)} className={`px-2 py-1 text-xs border rounded ${layout===l ? 'bg-cyan/20 border-cyan text-cyan' : 'border-edge'}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-slate-400">Threshold:</span>
          <input type="range" min="0" max="10000000" value={threshold} onChange={e=>setThreshold(Number(e.target.value))} className="w-32" />
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => setViewMode('graph')} className={`px-2 py-1 text-xs border rounded ${viewMode==='graph' ? 'bg-cyan/20 border-cyan text-cyan' : 'border-edge'}`}>Interactive Network Graph</button>
          <button onClick={() => setViewMode('allocation')} className={`px-2 py-1 text-xs border rounded ${viewMode==='allocation' ? 'bg-cyan/20 border-cyan text-cyan' : 'border-edge'}`}>Fund-Split & Lien Allocation View</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 min-h-0">
        <aside className="col-span-3 border-r border-edge p-3 overflow-y-auto">
          <h2 className="text-sm font-bold mb-2">Case / Evidence / Audit</h2>
          <div className="text-xs text-slate-400 mb-3">Nodes: {graph?.nodes?.length || 0} Edges: {graph?.edges?.length || 0}</div>
          {correlations.length > 0 && (
            <div className="mb-3 p-2 border border-elevated rounded text-xs">
              <div className="font-bold text-elevated mb-1">Cross-Case Correlations</div>
              {correlations.map((c,i) => <div key={i}>{c.other_case}: {c.shared_nodes.join(', ')}</div>)}
            </div>
          )}
          <div className="space-y-1">
            {audit.map(a => (
              <div key={a.id} className="text-[10px] text-slate-500 border-b border-edge pb-1">{a.action} - {a.details}</div>
            ))}
          </div>
        </aside>
        <main className="col-span-6 relative flex flex-col">
          {viewMode === 'graph' ? (
            <>
              <div className="flex items-center gap-2 p-2 border-b border-edge">
                <button onClick={() => setPlaying(p => !p)} className="px-2 py-1 border border-edge rounded text-xs">{playing ? <Pause size={12}/> : <Play size={12}/>}</button>
                <button onClick={() => setHopIndex(i => Math.max(0, i-1))} className="px-2 py-1 border border-edge rounded text-xs"><SkipBack size={12}/></button>
                <button onClick={() => setHopIndex(i => Math.min(graph?.edges?.length || 0, i+1))} className="px-2 py-1 border border-edge rounded text-xs"><SkipForward size={12}/></button>
                <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="bg-obsidian border border-edge rounded text-xs px-1">
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                </select>
                <span className="text-xs text-slate-400 ml-2">Hop: {hopIndex}/{graph?.edges?.length || 0}</span>
              </div>
              <div ref={boxRef} className="flex-1 min-h-0" />
            </>
          ) : (
            <div className="p-4 overflow-y-auto">
              <h2 className="text-sm font-bold mb-3">Fund-Split & Freeze Allocation</h2>
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400"><th className="text-left py-1">Node</th><th className="text-left">Type</th><th className="text-left">Amount</th><th className="text-left">Status</th></tr></thead>
                <tbody>
                  {(graph?.nodes || []).map(n => (
                    <tr key={n.id} className="border-t border-edge">
                      <td className="py-1">{n.label || n.id}</td>
                      <td>{n.type}</td>
                      <td>{n.amount_inr ? `₹${n.amount_inr}` : n.amount_usdt ? `$${n.amount_usdt}` : '-'}</td>
                      <td>{n.type === 'CryptoWallet' || n.type === 'SanctionedCluster' ? 'Frozen On-Chain' : 'Lien Placed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-edge p-3 bg-panel/80">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPlaying(p => !p)} className="px-2 py-1 border border-edge rounded text-xs">{playing ? <Pause size={12}/> : <Play size={12}/>}</button>
              <button onClick={() => setTimeIndex(i => Math.max(0, i-1))} className="px-2 py-1 border border-edge rounded text-xs"><SkipBack size={12}/></button>
              <button onClick={() => setTimeIndex(i => Math.min(times.length, i+1))} className="px-2 py-1 border border-edge rounded text-xs"><SkipForward size={12}/></button>
              <select value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="bg-obsidian border border-edge rounded text-xs px-1">
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
              <span className="text-xs text-slate-400 ml-2">{times[timeIndex-1] || 'Start'}</span>
            </div>
            <input type="range" min="0" max={times.length} value={timeIndex} onChange={e=>setTimeIndex(Number(e.target.value))} className="w-full" />
          </div>
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setTab('entity')} className={`px-2 py-1 text-xs rounded ${tab==='entity' ? 'bg-cyan/20 text-cyan' : 'border border-edge'}`}>Entity Inspector</button>
            <button onClick={() => setTab('risk')} className={`px-2 py-1 text-xs rounded ${tab==='risk' ? 'bg-cyan/20 text-cyan' : 'border border-edge'}`}>Case Risk Analysis</button>
          </div>
          {tab === 'entity' && (
            <div className="space-y-3 text-sm">
              {nodeData && (
                <>
                  <div className="font-bold text-cyan">{nodeData.label || nodeData.id}</div>
                  <div className="text-xs text-slate-400">Type: {nodeData.type}</div>
                  <div className="text-xs">Risk: {nodeData.risk}/100</div>
                  <div className="h-2 bg-obsidian rounded"><div className="h-2 bg-critical rounded" style={{width: `${nodeData.risk}%`}} /></div>
                  <div className="text-xs text-slate-400 mt-2">MHA SOP 2026: {nodeData.type === 'CryptoWallet' || nodeData.type === 'SanctionedCluster' ? 'Primary Mule' : 'Lien-Only Protection'}</div>
                  <div className="text-xs text-slate-400 mt-2">Attribution:</div>
                  <div className="text-[10px] text-slate-400 bg-obsidian p-2 rounded space-y-1">
                    {Object.entries(nodeData.meta || {}).map(([k,v]) => (
                      <div key={k}><span className="text-cyan">{k}:</span> {String(v)}</div>
                    ))}
                  </div>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-obsidian border border-edge rounded p-2 text-xs" rows={4} placeholder="Investigator notes..." />
                  <div className="flex gap-2">
                    <button onClick={saveNotes} className="px-3 py-1 bg-cyan text-black rounded text-xs">Save Notes</button>
                    <button onClick={generateNotice} disabled={isAuditor} className="px-3 py-1 bg-panel border border-edge rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed">Draft BNSS Sec 94 Notice</button>
                  </div>
                  {notice && <pre className="text-[10px] text-slate-400 bg-obsidian p-2 rounded overflow-auto">{notice}</pre>}
                </>
              )}
              {edgeData && (
                <>
                  <div className="font-bold text-cyan">Edge</div>
                  <div className="text-xs">{edgeData.source} → {edgeData.target}</div>
                  <div className="text-xs">{edgeData.amount} {edgeData.asset}</div>
                  <div className="text-xs text-slate-400">{edgeData.evidence}</div>
                </>
              )}
              {!selected && <div className="text-xs text-slate-500">Click a node or edge</div>}
            </div>
          )}
          {tab === 'risk' && (
            <div className="space-y-3 text-sm">
              <button onClick={runAnalyze} className="px-3 py-1 bg-cyan text-black rounded text-xs">Run Analysis</button>
              {analysis && (
                <>
                  <div className="text-lg font-bold text-critical">{analysis.risk_score} ({analysis.risk_tier})</div>
                  <ul className="text-xs text-slate-400 list-disc pl-4">
                    {analysis.risk_reasons.map((r,i) => <li key={i}>{r.rule}: {r.description} (+{r.score})</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
