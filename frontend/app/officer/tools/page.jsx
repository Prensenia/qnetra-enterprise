'use client'
import { useState } from 'react'
import { api, apiUpload, isBackendUnreachable, fetchWalletRisk } from '../../../lib/api'
import DilutionCalculator from '../../../components/organs/DilutionCalculator'
import { toast } from 'sonner'

const SAMPLE_CSV = `utr,amount,timestamp,bank_name,upi_id
420192830192,470000,2026-09-08T10:31:04+05:30,State Bank of India,victim@oksbi
420192830193,120000,2026-09-08T10:31:40+05:30,State Bank of India,victim@oksbi
420192830194,80000,2026-09-08T10:32:10+05:30,HDFC Bank,victim@okhdfc
420192830195,45000,2026-09-08T10:32:44+05:30,HDFC Bank,victim@okhdfc
420192830196,15000,2026-09-08T10:33:02+05:30,ICICI Bank,victim@okicici
`

function RiskScorer() {
  const [wallet, setWallet] = useState('0xA7F367e92d11b890')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    const target = wallet.trim()
    if (!target) return toast.error('Enter a wallet address first')
    setBusy(true)
    try {
      setResult(await fetchWalletRisk(target))
    } catch {
      toast.error('Risk engine rejected the request')
    } finally {
      setBusy(false)
    }
  }

  const breakdown = result?.score_breakdown || {}

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Behavioral scoring across mixer exposure, scam-cluster proximity, bridge traversal and fan-out velocity.
      </p>
      <div className="flex gap-2">
        <input
          value={wallet}
          onChange={e => setWallet(e.target.value)}
          placeholder="0x… wallet address"
          className="flex-1 bg-obsidian border border-edge rounded px-3 py-2 font-mono text-xs"
        />
        <button onClick={run} disabled={busy} className="px-4 py-2 bg-cyan text-black font-semibold rounded text-sm disabled:opacity-60">
          {busy ? 'Scoring…' : 'Score wallet'}
        </button>
      </div>
      {result && (
        <div className="space-y-3 pt-1">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-cyan">{result.overall_score}<span className="text-base text-slate-400">/100</span></span>
            <span className="px-2 py-0.5 rounded text-xs bg-critical/20 text-critical font-semibold">{result.risk_level}</span>
            {result.exchange && <span className="text-xs text-slate-400">{result.exchange}</span>}
          </div>
          <div className="space-y-1.5">
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-[11px]">
                <span className="w-44 shrink-0 text-slate-400 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="flex-1 h-1.5 bg-obsidian rounded overflow-hidden">
                  <span className="block h-full bg-cyan" style={{ width: `${Math.min(100, (Number(v) / 20) * 100)}%` }} />
                </span>
                <span className="w-8 text-right font-mono text-cyan">+{v}</span>
              </div>
            ))}
          </div>
          {(result.risk_reasons || []).slice(0, 4).map((r, i) => (
            <div key={i} className="text-[11px] text-slate-300">
              <span className="text-critical font-semibold">{r.rule}</span> — {r.description}
            </div>
          ))}
          {result.fiu_status && <div className="text-[11px] text-amber-300">{result.fiu_status}</div>}
        </div>
      )}
    </div>
  )
}

export default function OfficerTools() {
  const [uploading, setUploading] = useState(false)

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('case_id', 'CYB-2026-089')
    try {
      const data = await apiUpload('/api/v1/ingest/batch', fd)
      toast.success(`Ingested ${data.rows} rows`)
    } catch (err) {
      if (!isBackendUnreachable(err)) {
        toast.error('Ingest rejected by backend')
        return
      }
      // Offline demo: parse the statement locally so the button still reports a
      // real row count instead of dying with an unhandled promise rejection.
      const text = await file.text().catch(() => '')
      const rows = Math.max(0, text.trim().split(/\r?\n/).filter(Boolean).length - 1)
      toast.success(`Demo mode: ${rows} row${rows === 1 ? '' : 's'} parsed locally — open the case workspace for SHA-256 and the graph`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function webhook() {
    try {
      await api('/api/v1/ingest/webhook', { method: 'POST', body: JSON.stringify({ case_id: 'CYB-2026-089', amount: 50000 }) })
      toast.success('Webhook injected')
    } catch (err) {
      if (isBackendUnreachable(err)) {
        toast.success('Webhook simulated (demo mode) — CYB-2026-089, +Rs 50,000 event')
        return
      }
      toast.error('Webhook rejected by backend')
    }
  }

  function downloadSample() {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'Demo_SBI_CyberFraud_Statement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-cyan">Forensic Tools &amp; Batch Ingest</h1>
        <p className="text-xs text-slate-400 mt-1">Scoring, proportional dilution and evidence ingestion — the same endpoints the case workspace calls.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold mb-1">Wallet Risk Scorer</h2>
          <RiskScorer />
        </div>

        <div className="bg-panel border border-edge rounded p-4">
          <h2 className="text-sm font-bold mb-1">Layering &amp; Proportional Dilution</h2>
          <p className="text-xs text-slate-400 mb-3">Only the tainted proportion of a downstream balance may be frozen — this is the calculation the court dossier cites.</p>
          <DilutionCalculator />
        </div>

        <div className="bg-panel border border-edge rounded p-4 xl:col-span-2">
          <h2 className="text-sm font-bold mb-1">Evidence Ingest</h2>
          <p className="text-xs text-slate-400 mb-3">Bank statements and webhook events land in the same graph, hashed with SHA-256 on arrival.</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`px-3 py-2 rounded text-sm cursor-pointer ${uploading ? 'bg-panel border border-edge text-slate-400' : 'bg-cyan text-black font-semibold'}`}>
              {uploading ? 'Parsing…' : 'Upload CSV / XLSX'}
              <input type="file" accept=".csv,.xlsx" className="hidden" onChange={upload} disabled={uploading} />
            </label>
            <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded text-sm">Simulate Live Webhook</button>
            <button onClick={downloadSample} className="px-3 py-2 text-cyan text-sm underline">Download sample statement</button>
            <span className="text-[11px] text-slate-500 ml-auto font-mono">POST /api/v1/ingest/batch · POST /api/v1/ingest/webhook</span>
          </div>
        </div>

        <div className="bg-panel border border-edge rounded p-4 xl:col-span-2">
          <h2 className="text-sm font-bold mb-1">Scoring Model — How the Score Is Built</h2>
          <p className="text-xs text-slate-400 mb-3">Each rule contributes only the evidence it can prove; the composite drives the freeze decision, not a black box.</p>
          <table className="w-full text-xs">
            <thead><tr className="text-slate-400 text-left"><th className="py-1">Rule</th><th>Signal</th><th className="w-20 text-right">Max points</th></tr></thead>
            <tbody className="[&>tr>td]:py-1.5 [&>tr]:border-t [&>tr]:border-edge">
              {[
                ['Mixer exposure', 'Direct interaction with a known mixer / tumbler contract', '20'],
                ['Scam-cluster proximity', 'Hops to a wallet already flagged in a scam cluster', '20'],
                ['Cross-chain bridge traversal', 'Value routed through a bridge to break the trail', '15'],
                ['Rapid fan-out', 'More than 5 downstream transfers within 60 seconds', '15'],
              ].map(([rule, signal, pts]) => (
                <tr key={rule}><td className="text-slate-200">{rule}</td><td className="text-slate-400">{signal}</td><td className="text-right font-mono text-cyan">{pts}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-2">70+ CRITICAL · 45–69 HIGH · 25–44 MEDIUM · below 25 LOW. Tier sets the escalation path and what the dossier may claim.</p>
        </div>
      </div>
    </div>
  )
}
