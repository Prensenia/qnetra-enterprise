'use client'
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'

if (typeof window !== 'undefined') {
  try { cytoscape.use(coseBilkent) } catch (e) {}
}

const NODE_COLOR = {
  Victim: '#10b981',
  Bank: '#3b82f6',
  Exchange: '#8b5cf6',
  Mixer: '#ef4444',
  Bridge: '#f97316',
}

const GraphCanvas = forwardRef(function GraphCanvas({ nodes, edges, onNodeSelect }, ref) {
  const boxRef = useRef(null)
  const cyRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getSnapshotBase64: () => {
      const cy = cyRef.current
      if (!cy) return null
      const png = cy.png({ full: true, scale: 1.5 })
      return png.split(',')[1]
    },
    getCy: () => cyRef.current,
  }))

  useEffect(() => {
    if (!boxRef.current) return
    let cy
    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      try { cytoscape.use(coseBilkent) } catch (e) {}
      const elements = [
        ...nodes.map(n => ({ data: { id: n.id, label: n.label || n.id, type: n.type, risk: n.risk_score || 0 } })),
        ...edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, label: `${e.amount} ${e.asset}`, amount: e.amount, asset: e.asset } })),
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
      setTimeout(() => { cy.resize(); cy.fit(undefined, 30) }, 300)
    })
    return () => { if (cy) cy.destroy() }
  }, [nodes, edges])

  return <div ref={boxRef} className="w-full h-full min-h-[400px]" />
})

export default GraphCanvas
