'use client'
import { useState } from 'react'

export default function DilutionCalculator() {
  const [show, setShow] = useState(false)
  const [result, setResult] = useState(null)
  async function calc() {
    const res = await fetch('/api/dilution/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initial_taint_ratio: 0.5, hops: [{ wallet_address: '0xA7F367e92d11b890', pre_balance: 1000, received_amount: 500 }] }) })
    setResult(await res.json())
  }
  return (
    <div className="space-y-2">
      <button onClick={calc} className="px-3 py-1 bg-cyan text-black rounded text-xs">Calculate Dilution</button>
      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} /> Show Calculation</label>
      {result && show && (
        <div className="text-xs text-slate-400 space-y-1">
          {result.steps.map((s,i) => <div key={i}>{s.wallet_address}: New Ratio = ({s.received_amount} * ratio) / ({s.pre_balance} + {s.received_amount}) = {s.new_ratio.toFixed(4)}</div>)}
          <div className="text-[10px] text-slate-500">{result.legal_disclaimer}</div>
        </div>
      )}
    </div>
  )
}
