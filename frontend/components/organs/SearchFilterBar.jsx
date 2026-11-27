'use client'
import { useState } from 'react'

export default function SearchFilterBar({ onFilter }) {
  const [query, setQuery] = useState('')
  const [minAmt, setMinAmt] = useState('')
  const [maxAmt, setMaxAmt] = useState('')
  const [risk, setRisk] = useState('ALL')
  const [limit, setLimit] = useState(50)

  function apply() {
    onFilter && onFilter({ query, minAmt, maxAmt, risk, limit })
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search wallet/UTR/hash" className="bg-obsidian border border-edge rounded px-2 py-1" />
      <input value={minAmt} onChange={e=>setMinAmt(e.target.value)} placeholder="Min INR" className="bg-obsidian border border-edge rounded px-2 py-1 w-20" />
      <input value={maxAmt} onChange={e=>setMaxAmt(e.target.value)} placeholder="Max INR" className="bg-obsidian border border-edge rounded px-2 py-1 w-20" />
      <select value={risk} onChange={e=>setRisk(e.target.value)} className="bg-obsidian border border-edge rounded px-2 py-1">
        <option>ALL</option><option>CRITICAL</option><option>HIGH</option>
      </select>
      <select value={limit} onChange={e=>setLimit(Number(e.target.value))} className="bg-obsidian border border-edge rounded px-2 py-1">
        <option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
      </select>
      <button onClick={apply} className="px-2 py-1 bg-cyan text-black rounded">Apply</button>
    </div>
  )
}
