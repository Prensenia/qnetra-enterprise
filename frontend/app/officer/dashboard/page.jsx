'use client'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Play } from 'lucide-react'

export default function OfficerDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [citizenCount, setCitizenCount] = useState(0)

  async function load() { try { setSummary(await api('/api/v1/dashboard/summary')); const c = await api('/api/v1/citizen/cases'); setCitizenCount(c.length) } catch {} }
  useEffect(() => { load() }, [])

  async function webhook() {
    try { await api('/api/v1/ingest/webhook', { method:'POST', body: JSON.stringify({ event:'live', case_id:'CYB-2026-089' }) }); toast.success('Webhook injected'); load() } catch { toast.error('Failed') }
  }

  if (!summary) return <div className="p-6">Loading...</div>
  const filtered = (summary.bridge_queue||[]).filter(q => q.case_id.toLowerCase().includes(search.toLowerCase()) || q.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan">Officer Command Dashboard</h1>
        <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded flex items-center gap-2"><Play size={14} /> Simulate Live Webhook</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Total Registered Cases" value={summary.active_investigations} />
        <Kpi label="Traced Fiat (INR)" value={`₹${(summary.total_traced_inr/10000000).toFixed(2)} Cr`} />
        <Kpi label="Traced Crypto (USDT)" value={`$${summary.total_traced_usdt.toLocaleString()}`} />
        <Kpi label="Mule & VASP Clusters" value={summary.flagged_mule_clusters} />
      </div>
      {citizenCount > 0 && <div className="px-3 py-2 bg-emerald-900/40 border border-emerald-700 rounded text-sm text-emerald-300">New Citizen Submissions: {citizenCount}</div>}
      <div className="bg-panel border border-edge rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold">Unified Case Queue</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="bg-obsidian border border-edge rounded px-3 py-1 text-xs" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-400 text-xs"><th className="text-left py-2">Case</th><th className="text-left">Title</th><th className="text-left">Risk</th><th className="text-left">Volume</th><th></th></tr></thead>
          <tbody>
            {filtered.map(q => (
              <tr key={q.case_id} className="border-t border-edge">
                <td className="py-2 font-mono text-xs">{q.case_id}</td>
                <td>{q.title}</td>
                <td><span className="px-2 py-0.5 rounded text-xs bg-critical/20 text-critical">{q.risk_tier}</span></td>
                <td>₹{(q.total_inr/100000).toFixed(1)}L</td>
                <td><button onClick={() => router.push(`/officer/investigate/${q.case_id}`)} className="text-cyan underline text-xs">Launch Investigation</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="bg-panel border border-edge rounded p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-cyan mt-1">{value}</div>
    </div>
  )
}
