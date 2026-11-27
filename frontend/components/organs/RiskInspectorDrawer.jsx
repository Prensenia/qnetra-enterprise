'use client'
import { useEffect, useState } from 'react'

export default function RiskInspectorDrawer({ walletId }) {
  const [risk, setRisk] = useState(null)
  useEffect(() => {
    if (!walletId) return
    fetch(`/api/risk/${walletId}`).then(r => r.json()).then(setRisk).catch(()=>{})
  }, [walletId])
  if (!risk) return <div className="text-xs text-slate-400">Select a node</div>
  return (
    <div className="space-y-2 text-sm">
      <div className="font-bold text-cyan">{walletId}</div>
      <div>Risk: {risk.overall_score}/100 ({risk.risk_level})</div>
      <div className="h-2 bg-obsidian rounded"><div className="h-2 bg-critical rounded" style={{width: `${risk.overall_score}%`}} /></div>
      <div className="text-xs text-slate-400">Breakdown:</div>
      {Object.entries(risk.score_breakdown || {}).map(([k,v]) => <div key={k} className="text-xs">{k}: +{v}</div>)}
      <div className="text-[10px] text-slate-500">{risk.legal_disclaimer}</div>
    </div>
  )
}
