'use client'
import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'

if (typeof window !== 'undefined') {
  try { cytoscape.use(coseBilkent) } catch (e) {}
}

const NODE_COLOR = {
  Victim: '#10B981',
  Bank: '#3B82F6',
  Exchange: '#A855F7',
  Wallet: '#EF4444',
  Mixer: '#F59E0B',
  Bridge: '#F97316',
}

export default function GraphCanvas({ nodes, edges, onNodeSelect, onCyReady }) {
  const boxRef = useRef(null)
  const cyRef = useRef(null)

  useEffect(() => {
    if (!boxRef.current) return
    let cy
    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      try { cytoscape.use(coseBilkent) } catch (e) {}
      const elements = [
        ...nodes.map(n => ({ data: { id: n.id, label: n.label || n.id, type: n.type, risk: n.risk_score || 0 } })),
        ...edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, label: `${e.amount} ${e.asset}`, amount: e.amount, asset: e.asset, utr: e.id } })),
      ]
      cy = cytoscape({
        container: boxRef.current,
        elements,
        style: [
          { selector: 'node', style: { 'background-color': (n) => NODE_COLOR[n.data('type')] || '#6b6579', label: 'data(label)', color: '#e2e8f0', 'font-size': 9, 'text-valign': 'bottom', 'text-margin-y': 4, width: 24, height: 24 } },
          { selector: 'edge', style: { width: 2, 'line-color': '#475569', 'target-arrow-shape': 'triangle', label: (e) => (nodes.length > 200 ? '' : e.data('label')), 'font-size': 8, color: '#94a3b8', 'curve-style': 'bezier', 'text-rotation': 'autorotate' } },
        ],
        layout: { name: 'cose-bilkent', animate: true },
      })
      cy.on('tap', 'node', evt => onNodeSelect && onNodeSelect(evt.target.id()))
      cy.on('dblclick', 'node', async evt => {
        const id = evt.target.id()
        try {
          const res = await fetch(`/api/hops/${id}`)
          const data = await res.json()
          data.nodes?.forEach(n => { if (cy.getElementById(n.id).empty()) cy.add({ data: { id: n.id, label: n.label || n.id, type: n.type, risk: n.risk_score || 0 } }) })
          data.edges?.forEach(e => { if (cy.getElementById(e.id).empty()) cy.add({ data: { id: e.id, source: e.source, target: e.target, label: `${e.amount} ${e.asset}`, amount: e.amount, asset: e.asset } }) })
          cy.layout({ name: 'cose-bilkent', animate: true }).run()
        } catch {}
      })
      cyRef.current = cy
      if (onCyReady) onCyReady(cy)
      setTimeout(() => { cy.resize(); cy.fit(undefined, 30) }, 300)
    })
    return () => { if (cy) cy.destroy() }
  }, [nodes, edges])

  return <div ref={boxRef} className="w-full h-full min-h-[400px]" />
}
