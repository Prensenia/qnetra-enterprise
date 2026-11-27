'use client'
import { useState } from 'react'
import { calculateDilution } from '../../lib/api'

export default function DilutionCalculator() {
  const [initial, setInitial] = useState(0.5)
  const [hops, setHops] = useState([{ wallet_address: 'W1', pre_balance: 1000, received_amount: 500 }])
  const [show, setShow] = useState(false)
  const [result, setResult] = useState(null)

  function addHop() {
    setHops([...hops, { wallet_address: `W${hops.length+1}`, pre_balance: 1000, received_amount: 500 }])
  }

  async function calc() {
    const res = await calculateDilution({ initial_taint_ratio: initial, hops })
    setResult(res)
  }

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <label>Initial Ratio:</label>
        <input type="number" step="0.01" value={initial} onChange={e=>setInitial(parseFloat(e.target.value))} className="bg-obsidian border border-edge rounded px-2 py-1 w-20" />
      </div>
      {hops.map((h,i) => (
        <div key={i} className="flex gap-2">
          <input value={h.wallet_address} onChange={e=>{const nh=[...hops]; nh[i].wallet_address=e.target.value; setHops(nh)}} className="bg-obsidian border border-edge rounded px-2 py-1 w-24" />
          <input type="number" value={h.pre_balance} onChange={e=>{const nh=[...hops]; nh[i].pre_balance=parseFloat(e.target.value); setHops(nh)}} className="bg-obsidian border border-edge rounded px-2 py-1 w-20" />
          <input type="number" value={h.received_amount} onChange={e=>{const nh=[...hops]; nh[i].received_amount=parseFloat(e.target.value); setHops(nh)}} className="bg-obsidian border border-edge rounded px-2 py-1 w-20" />
        </div>
      ))}
      <button onClick={addHop} className="px-2 py-1 border border-edge rounded">Add Hop</button>
      <button onClick={calc} className="px-3 py-1 bg-cyan text-black rounded">Calculate</button>
      <div className="text-[10px] text-slate-500">New Ratio = Dirty Received ÷ Total Balance Post-Receipt</div>
      <label className="flex items-center gap-1"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} /> Show Step-by-Step Calculation</label>
      {result && show && (
        <div className="space-y-1">
          {result.steps.map((s,i) => <div key={i}>{s.wallet_address}: New Ratio = ({s.received_amount} * ratio) / ({s.pre_balance} + {s.received_amount}) = {s.new_ratio.toFixed(4)}</div>)}
          <div className="text-[10px] text-slate-500">{result.legal_disclaimer}</div>
        </div>
      )}
    </div>
  )
}
