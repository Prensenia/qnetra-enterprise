'use client'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api('/api/v1/dashboard/summary').then(setSummary).catch(()=>{})
  }, [])

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('qnetra_token')
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000')+'/api/v1/ingest/batch', { method:'POST', headers: token?{Authorization:`Bearer ${token}`}:{}, body: fd })
    const data = await res.json()
    setMsg(JSON.stringify(data))
  }

  async function webhook() {
    const res = await api('/api/v1/ingest/webhook', { method:'POST', body: JSON.stringify({ event: 'live_test' }) })
    setMsg(JSON.stringify(res))
  }

  if (!summary) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan">Executive Triage Dashboard</h1>
        <div className="flex gap-2">
          <label className="px-3 py-2 bg-panel border border-edge rounded cursor-pointer">
            Upload CSV
            <input type="file" className="hidden" onChange={upload} />
          </label>
          <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded">Simulate Live Webhook</button>
        </div>
      </div>
      {msg && <pre className="text-xs text-slate-400">{msg}</pre>}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Active Investigations" value={summary.active_investigations} />
        <Kpi label="Traced INR" value={summary.total_traced_inr} />
        <Kpi label="Traced USDT" value={summary.total_traced_usdt} />
        <Kpi label="Mule Clusters" value={summary.flagged_mule_clusters} />
      </div>
      <div className="bg-panel border border-edge rounded p-4">
        <h2 className="text-lg mb-3">Live Suspicious Bridge Queue</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-400"><th className="text-left">Case</th><th className="text-left">Title</th><th className="text-left">Risk</th><th className="text-left">Volume</th><th></th></tr></thead>
          <tbody>
            {summary.bridge_queue.map(q => (
              <tr key={q.case_id} className="border-t border-edge">
                <td className="py-2">{q.case_id}</td>
                <td>{q.title}</td>
                <td className="text-critical">{q.risk_tier}</td>
                <td>{q.total_inr}</td>
                <td><button onClick={() => router.push(`/investigate/${q.case_id}`)} className="text-cyan underline">Open in Graph</button></td>
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
