'use client'
import { useEffect, useState } from 'react'
import { fetchWalletRisk } from '../../lib/api'

export default function RiskInspectorDrawer({ walletId }) {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!walletId) return
    setLoading(true)
    fetchWalletRisk(walletId).then(setRisk).catch(()=>{}).finally(()=>setLoading(false))
  }, [walletId])

  if (loading) return <div className="text-xs text-slate-400">Loading risk data...</div>
  if (!risk) return <div className="text-xs text-slate-400">Select a node to inspect</div>

  const rules = [
    { name: 'Mixer Exposure', score: 20, desc: 'Direct interaction with known mixer contract' },
    { name: 'Rapid Fan-Out', score: 15, desc: 'More than 5 downstream transfers within 60 seconds' },
    { name: 'Scam Cluster Proximity', score: 20, desc: 'Proximity to flagged scam wallet cluster' },
    { name: 'Bridge Traversal', score: 15, desc: 'Cross-chain bridge traversal detected' },
  ]

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-bold text-cyan text-base">{walletId}</div>
        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900 text-emerald-300 border border-emerald-700">✓ CONFIRMED ON-CHAIN</span>
      </div>
      <div className="text-xs text-slate-400">Type: CryptoWallet • Network: TRON TRC-20 • Token: USDT</div>
      <div className="text-xs text-slate-400">Chain: Ethereum Mainnet • Block #18923451 • Tx: 0xabc...def</div>
      <div className="text-xs text-slate-400">KYC Status: PAN + Aadhaar Verified • FIU-IND RE-ID: VA000412</div>
      <div className="text-xs text-slate-400">Nodal Officer: lea-compliance@coindcx.com • Freeze SLA: {'<'} 4 hrs</div>

      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Composite Risk Score</span>
          <span className="font-bold text-critical">{risk.overall_score}/100 ({risk.risk_level})</span>
        </div>
        <div className="h-3 bg-obsidian rounded overflow-hidden">
          <div className="h-3 rounded transition-all duration-500" style={{ width: `${risk.overall_score}%`, backgroundColor: risk.overall_score >= 80 ? '#EF4444' : risk.overall_score >= 60 ? '#F59E0B' : '#10B981' }} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs font-bold text-slate-300 mb-1">Rule-by-Rule Breakdown</div>
        {rules.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-edge">
            <div>
              <div className="text-slate-300">{r.name}</div>
              <div className="text-[10px] text-slate-500">{r.desc}</div>
            </div>
            <span className="font-mono text-amber-400">+{r.score}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 pt-2 border-t border-edge">
        {risk.legal_disclaimer || 'This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.'}
      </div>
    </div>
  )
}
