'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../../lib/api'
import { useParams } from 'next/navigation'

export default function InvestigatePage() {
  const params = useParams()
  const caseId = params.caseId
  const boxRef = useRef(null)
  const cyRef = useRef(null)
  const [graph, setGraph] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [audit, setAudit] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api(`/api/v1/cases/${caseId}/graph`).then(setGraph).catch(()=>{})
    api(`/api/v1/cases/${caseId}/audit`).then(setAudit).catch(()=>{})
  }, [caseId])

  useEffect(() => {
    if (!boxRef.current || !graph) return
    let cy
    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      cy = cytoscape({
        container: boxRef.current,
        elements: [
          ...graph.nodes.map(n => ({ data: { id: n.id, label: n.label, risk: n.risk_score } })),
          ...graph.edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, label: e.amount } })),
        ],
        style: [
          { selector: 'node', style: { 'background-color': '#06B6D4', label: 'data(label)', color: '#e2e8f0', 'font-size': 10 } },
          { selector: 'edge', style: { 'line-color': '#475569', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#475569', width: 2 } },
        ],
        layout: { name: 'breadthfirst', directed: true, padding: 10 },
      })
      cyRef.current = cy
    })
    return () => { if (cy) cy.destroy() }
  }, [graph])

  async function runAnalyze() {
    const res = await api(`/api/v1/analyze/${caseId}`, { method: 'POST' })
    setAnalysis(res)
  }

  async function exportPdf() {
    const res = await api(`/api/v1/cases/${caseId}/export-pdf`, { method: 'POST', body: JSON.stringify({}) })
    setMsg(JSON.stringify(res))
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 border-b border-edge flex gap-2 items-center">
        <h1 className="text-lg font-bold text-cyan">Investigation: {caseId}</h1>
        <button onClick={runAnalyze} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Analyze</button>
        <button onClick={exportPdf} className="px-3 py-1 bg-panel border border-edge rounded text-sm">Export PDF</button>
        {msg && <span className="text-xs text-slate-400 truncate max-w-md">{msg}</span>}
      </div>
      <div className="flex-1 grid grid-cols-12 min-h-0">
        <aside className="col-span-3 border-r border-edge p-3 overflow-y-auto">
          <h2 className="text-sm font-bold mb-2">Case / Evidence / Audit</h2>
          <div className="text-xs text-slate-400 mb-3">Nodes: {graph?.nodes?.length || 0} Edges: {graph?.edges?.length || 0}</div>
          <div className="space-y-1">
            {audit.map(a => (
              <div key={a.id} className="text-[10px] text-slate-500 border-b border-edge pb-1">{a.action} - {a.details}</div>
            ))}
          </div>
        </aside>
        <main className="col-span-6 relative">
          <div ref={boxRef} className="absolute inset-0" />
        </main>
        <aside className="col-span-3 border-l border-edge p-3 overflow-y-auto">
          <h2 className="text-sm font-bold mb-2">Inspector</h2>
          {analysis && (
            <div className="text-sm space-y-2">
              <div>Risk: {analysis.risk_score} ({analysis.risk_tier})</div>
              <ul className="text-xs text-slate-400 list-disc pl-4">
                {analysis.risk_reasons.map((r,i) => <li key={i}>{r.rule}: {r.description}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
