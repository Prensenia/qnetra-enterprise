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

// Walk the trail from the victim so the graph draws in the order the money moved
// instead of appearing all at once.
function trailOrder(nodes, edges) {
  const forward = new Map()
  edges.forEach(e => {
    if (!forward.has(e.source)) forward.set(e.source, [])
    forward.get(e.source).push(e.target)
  })
  const start = nodes.find(n => /victim/i.test(String(n.type || '')))?.id || nodes[0]?.id
  const order = []
  const seen = new Set()
  const walk = id => {
    if (!id || seen.has(id)) return
    seen.add(id)
    order.push(id)
    ;(forward.get(id) || []).forEach(walk)
  }
  walk(start)
  nodes.forEach(n => { if (!seen.has(n.id)) order.push(n.id) })
  return order
}

const GraphCanvas = forwardRef(function GraphCanvas({ nodes, edges, onNodeSelect }, ref) {
  const boxRef = useRef(null)
  const cyRef = useRef(null)
  const rafRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getSnapshotBase64: () => {
      const cy = cyRef.current
      if (!cy) return null
      try {
        // The dossier must show the finished trail, never a half-drawn frame.
        cy.elements().forEach(el => { el.style('opacity', 1) })
        cy.resize()
      } catch {}
      const png = cy.png({ full: true, scale: 1.5 })
      return png.split(',')[1]
    },
    getCy: () => cyRef.current,
  }))

  useEffect(() => {
    if (!boxRef.current) return
    let cy
    let cancelled = false

    import('cytoscape').then(mod => {
      const cytoscape = mod.default
      if (cancelled || !boxRef.current) return
      try { cytoscape.use(coseBilkent) } catch (e) {}

      const elements = [
        ...nodes.map(n => ({ data: { id: n.id, label: n.label || n.id, type: n.type, risk: n.risk_score || 0 } })),
        ...edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, label: `${e.amount} ${e.asset}`, amount: e.amount, asset: e.asset } })),
      ]

      const animate = nodes.length + edges.length <= 120 && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

      cy = cytoscape({
        container: boxRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (n) => NODE_COLOR[n.data('type')] || '#6b6579',
              label: 'data(label)',
              color: '#e2e8f0',
              'font-size': 9,
              'text-valign': 'bottom',
              'text-margin-y': 4,
              width: 24,
              height: 24,
              'border-width': 0,
              'border-color': '#ef4444',
              'border-opacity': 0.85,
            },
          },
          { selector: 'edge', style: { width: 2, 'line-color': '#475569', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#475569', label: (e) => (nodes.length > 200 ? '' : e.data('label')), 'font-size': 8, color: '#94a3b8', 'curve-style': 'bezier', 'text-rotation': 'autorotate' } },
          { selector: '.qs-lit', style: { 'line-color': '#22d3ee', 'target-arrow-color': '#22d3ee', width: 2.5, 'line-style': 'dashed', 'line-dash-pattern': [7, 5], 'line-dash-offset': 0 } },
          { selector: '.qs-hot', style: { 'border-width': 5 } },
        ],
        layout: { name: 'cose-bilkent', animate: animate ? 'end' : false, animationDuration: 700, idealEdgeLength: 110, nodeRepulsion: 6000 },
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
      setTimeout(() => { try { cy.resize(); cy.fit(undefined, 40) } catch {} }, 260)

      if (!animate) return

      // Staged reveal: nodes light up in trail order, edges fade in behind them,
      // then the chain keeps a slow dash travelling towards the cash-out.
      const order = trailOrder(nodes, edges)
      const position = new Map(order.map((id, i) => [id, i]))
      const revealedAt = new Map()

      cy.nodes().forEach(n => n.style('opacity', 0))
      cy.edges().forEach(e => e.style('opacity', 0))
      cy.nodes().forEach(n => {
        if ((n.data('risk') || 0) >= 85 || /mixer/i.test(String(n.data('type')))) n.addClass('qs-hot')
      })

      const start = performance.now()
      let lastPulse = 0
      let pulseOn = true
      let dash = 0

      const frame = now => {
        if (!cy || cy.destroyed()) return
        const elapsed = now - start
        const shown = Math.min(order.length, Math.floor(elapsed / 230) + 1)

        order.slice(0, shown).forEach(id => {
          const n = cy.getElementById(id)
          if (n.nonempty() && !revealedAt.has(id)) {
            revealedAt.set(id, now)
            n.style('opacity', 1)
          }
          if (n.nonempty() && n.style('opacity') < 1) n.style('opacity', 1)
        })
        cy.edges().forEach(e => {
          const from = position.get(e.data('source'))
          if (from !== undefined && from < shown) {
            e.style('opacity', 1)
            e.addClass('qs-lit')
          }
        })

        if (now - lastPulse > 850) {
          lastPulse = now
          pulseOn = !pulseOn
          cy.nodes('.qs-hot').style({ 'border-width': pulseOn ? 5 : 1, 'border-opacity': pulseOn ? 0.9 : 0.25 })
        }

        dash = (dash + 0.6) % 24
        cy.edges('.qs-lit').style('line-dash-offset', dash)

        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    })

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      cyRef.current = null
      if (cy) cy.destroy()
    }
  }, [nodes, edges])

  return <div ref={boxRef} className="w-full h-full min-h-[400px]" />
})

export default GraphCanvas
