'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Play, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function load() {
    try { setSummary(await api('/api/v1/dashboard/summary')) } catch {}
  }

  useEffect(() => { load() }, [])

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('case_id', 'CYB-2026-089')
    const token = localStorage.getItem('qnetra_token')
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000')+'/api/v1/ingest/batch', { method:'POST', headers: token?{Authorization:`Bearer ${token}`}:{}, body: fd })
    const data = await res.json()
    toast.success(`Ingested ${file.name} (${data.rows || 0} rows)`)
    setDrawerOpen(false)
    load()
  }

  async function webhook() {
    try {
      const res = await api('/api/v1/ingest/webhook', { method:'POST', body: JSON.stringify({ event: 'live_suspicious_hop', case_id: 'CYB-2026-089' }) })
      toast.success('Live webhook injected')
      load()
    } catch { toast.error('Webhook failed') }
  }

  function downloadSample() {
    const csv = 'source_id,source_type,target_id,target_type,amount,asset,timestamp\nVICTIM_001,BankAccount,UPI_MULE_1,UPI,50000,INR,2026-03-15T10:05:00+05:30\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sample_evidence.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (!summary) return <div className="p-6">Loading...</div>

  const filtered = (summary.bridge_queue || []).filter(q => q.case_id.toLowerCase().includes(search.toLowerCase()) || q.title.toLowerCase().includes(search.toLowerCase()))

  const chartData = (summary.bridge_queue || []).map(q => ({ name: q.case_id, volume: q.total_inr / 100000 }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan">Executive Triage Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => setDrawerOpen(true)} className="px-3 py-2 bg-panel border border-edge rounded flex items-center gap-2"><Upload size={14} /> Ingest Evidence</button>
          <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded flex items-center gap-2"><Play size={14} /> Simulate Live Webhook</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Active Investigations" value={summary.active_investigations} />
        <Kpi label="Traced INR" value={`₹${(summary.total_traced_inr/10000000).toFixed(2)} Cr`} />
        <Kpi label="Traced USDT" value={`$${summary.total_traced_usdt.toLocaleString()}`} />
        <Kpi label="Mule Clusters" value={summary.flagged_mule_clusters} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold mb-3">Flow Volume (Lakhs INR)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip />
              <Bar dataKey="volume" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold mb-3">Risk Distribution</h2>
          <div className="space-y-2">
            {(summary.bridge_queue||[]).map(q => (
              <div key={q.case_id}>
                <div className="flex justify-between text-xs mb-1"><span>{q.case_id}</span><span className="text-critical">{q.risk_tier}</span></div>
                <div className="h-2 bg-obsidian rounded"><div className="h-2 bg-critical rounded" style={{width: `${Math.min(100, (q.total_inr/14200000)*100)}%`}} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-edge rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold">Live Suspicious Bridge Queue</h2>
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
                <td><button onClick={() => router.push(`/investigate/${q.case_id}`)} className="text-cyan underline text-xs">Open in Graph</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-96 bg-panel border-l border-edge p-6 space-y-4">
            <h2 className="text-lg font-bold text-cyan">Ingest Evidence</h2>
            <p className="text-xs text-slate-400">Upload CSV/XLSX with columns: source_id, source_type, target_id, target_type, amount, asset, timestamp</p>
            <button onClick={downloadSample} className="flex items-center gap-2 px-3 py-2 border border-edge rounded text-sm"><Download size={14} /> Download Sample CSV</button>
            <label className="block">
              <span className="px-3 py-2 bg-cyan text-black rounded cursor-pointer inline-block">Choose File</span>
              <input type="file" className="hidden" accept=".csv,.xlsx" onChange={upload} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="bg-panel border border-edge rounded p-4 glass">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-cyan mt-1">{value}</div>
    </div>
  )
}
