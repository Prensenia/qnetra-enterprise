'use client'
import { useEffect, useState } from 'react'
import { api, isBackendUnreachable, listDemoCases } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import AuditTrailTable from '../../../components/organs/AuditTrailTable'
import Narrator from '../../../components/Narrator'
import { toast } from 'sonner'
import { Upload, Play } from 'lucide-react'

// Seeded demo queue shown when the FastAPI backend is unreachable (Vercel demo build).
const DEMO_SUMMARY = {
  active_investigations: 3,
  total_traced_inr: 22750000,
  total_traced_usdt: 254166,
  flagged_mule_clusters: 4,
  bridge_queue: [
    { case_id: 'CYB-2026-089', title: 'UPI-to-USDT Mule Syndicate', risk_tier: 'CRITICAL', status: 'ACTIVE', total_inr: 14200000 },
    { case_id: 'CYB-2026-094', title: 'Cross-Border Peel Chain', risk_tier: 'HIGH', status: 'ACTIVE', total_inr: 8500000 },
    { case_id: 'CYB-2026-101', title: 'HDFC-to-CoinDCX Rs 2.85L Urgent Citizen Packet', risk_tier: 'HIGH', status: 'NEW_CITIZEN_REPORT', total_inr: 285000 },
  ],
}

export default function OfficerDashboard() {
  const router = useRouter()
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [citizenCount, setCitizenCount] = useState(0)
  const [offline, setOffline] = useState(false)

  async function load() {
    try {
      setSummary(await api('/api/v1/dashboard/summary'))
      const c = await api('/api/v1/citizen/cases')
      setCitizenCount(c.length)
      setOffline(false)
    } catch {
      // Show the complaint the citizen actually filed, under its own case id, so
      // the receipt and this queue never name the same submission differently.
      const local = listDemoCases()
      const base = DEMO_SUMMARY.bridge_queue.filter(q => q.status !== 'NEW_CITIZEN_REPORT')
      const submitted = local.slice(0, 3).map(c => {
        const bank = String(c.victim_bank || 'UPI').replace(/ Bank$/, '')
        const exchange = String(c.exchange || 'Bank').split(' (')[0]
        const lakhs = ((Number(c.amount_inr) || 0) / 100000).toFixed(2)
        return {
          case_id: c.case_id,
          title: `${bank} → ${exchange} ₹${lakhs}L Citizen Packet`,
          risk_tier: (Number(c.amount_inr) || 0) >= 200000 ? 'HIGH' : 'MEDIUM',
          status: 'NEW_CITIZEN_REPORT',
          total_inr: Number(c.amount_inr) || 0,
        }
      })
      setSummary({ ...DEMO_SUMMARY, bridge_queue: submitted.length ? [...base, ...submitted] : DEMO_SUMMARY.bridge_queue })
      setCitizenCount(local.length || 1)
      setOffline(true)
    }
  }
  useEffect(() => { load() }, [])

  async function webhook() {
    try {
      await api('/api/v1/ingest/webhook', { method:'POST', body: JSON.stringify({ event:'live', case_id:'CYB-2026-089' }) })
      toast.success('Webhook injected')
      load()
    } catch (err) {
      if (isBackendUnreachable(err)) {
        // Demo build: acknowledge the simulated event instead of a red toast on stage.
        toast.success('Live webhook simulated (demo mode) — CYB-2026-089 event accepted')
        load()
        return
      }
      toast.error('Webhook rejected by backend')
    }
  }

  if (!summary) return <div className="p-6">Loading...</div>
  // Keep the fiat KPI equal to the queue it sits above, so the top card and the
  // risk-tier footer can never show two different totals on stage.
  const queueFiat = (summary.bridge_queue || []).reduce((n, q) => n + (Number(q.total_inr) || 0), 0)
  const tracedFiat = queueFiat || summary.total_traced_inr
  const filtered = (summary.bridge_queue||[]).filter(q => q.case_id.toLowerCase().includes(search.toLowerCase()) || q.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 space-y-6">
      {offline && (
        <div className="px-3 py-2 bg-amber-950 border border-amber-700 rounded text-xs text-amber-200">
Offline demo mode — seeded case data. Start the FastAPI + Neo4j stack (docker compose up) for live ingestion, scoring and PDF generation; every screen below works either way.
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan">Officer Command Dashboard</h1>
        <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded flex items-center gap-2"><Play size={14} /> Simulate Live Webhook</button>
      </div>
      <Narrator screen="dashboard" />
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Active Investigations" value={summary.active_investigations} />
        <Kpi label="Traced Fiat (INR)" value={`₹${(tracedFiat/10000000).toFixed(2)} Cr`} />
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
                <td><span className="px-2 py-0.5 rounded text-xs bg-critical/20 text-critical">{q.risk_tier}</span>{q.status === 'NEW_CITIZEN_REPORT' && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-emerald-900 text-emerald-300 animate-pulse">NEW CITIZEN SUBMISSION • AI PRE-TRIAGED</span>}</td>
                <td>₹{(q.total_inr/100000).toFixed(1)}L</td>
                <td>
                  <button onClick={() => router.push(`/officer/investigate/${q.case_id}`)} className="text-cyan underline text-xs">Launch Investigation</button>
                  <button onClick={() => router.push(`/officer/cases/${q.case_id}/dispatch`)} className="ml-3 text-amber-300 underline text-xs">Dispatch</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold">Chain-of-Custody Ledger</h2>
          <p className="text-xs text-slate-400 mb-3">Every action on the case is hash-chained and re-verified against the stored SHA-256 digest — Section 63(4) BSA 2023 admissibility.</p>
          <AuditTrailTable caseId="CYB-2026-089" />
        </div>
        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold">Exposure by Risk Tier</h2>
          <p className="text-xs text-slate-400 mb-3">Where the seized volume actually sits across the open queue.</p>
          <RiskTiers queue={summary.bridge_queue || []} />
        </div>
      </div>
    </div>
  )
}

function RiskTiers({ queue }) {
  const rows = Object.values(queue.reduce((acc, q) => {
    const tier = q.risk_tier || 'UNRATED'
    acc[tier] = acc[tier] || { tier, cases: 0, volume: 0 }
    acc[tier].cases += 1
    acc[tier].volume += Number(q.total_inr) || 0
    return acc
  }, {})).sort((a, b) => b.volume - a.volume)
  const max = Math.max(1, ...rows.map(r => r.volume))
  const tone = { CRITICAL: 'bg-critical', HIGH: 'bg-amber-500', MEDIUM: 'bg-cyan', LOW: 'bg-emerald-500' }
  if (!rows.length) return <div className="text-xs text-slate-400">No open cases.</div>
  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.tier} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold">{r.tier} <span className="text-slate-500 font-normal">{r.cases} case{r.cases === 1 ? '' : 's'}</span></span>
            <span className="font-mono text-slate-300">₹{(r.volume / 100000).toFixed(1)}L</span>
          </div>
          <div className="h-2 bg-obsidian rounded overflow-hidden">
            <div className={`h-full ${tone[r.tier] || 'bg-slate-500'}`} style={{ width: `${(r.volume / max) * 100}%` }} />
          </div>
        </div>
      ))}
      <div className="text-[11px] text-slate-500 pt-1 border-t border-edge">
        {rows.reduce((n, r) => n + r.cases, 0)} open cases · ₹{(rows.reduce((n, r) => n + r.volume, 0) / 10000000).toFixed(2)} Cr in scope
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
