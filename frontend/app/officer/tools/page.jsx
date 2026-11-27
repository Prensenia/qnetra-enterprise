'use client'
import { useState } from 'react'
import { api, apiUpload, isBackendUnreachable } from '../../../lib/api'
import { toast } from 'sonner'

export default function OfficerTools() {
  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
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

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">Forensic Tools & Batch Ingest</h1>
      <label className="px-3 py-2 bg-panel border border-edge rounded cursor-pointer inline-block">Upload CSV/XLSX<input type="file" className="hidden" onChange={upload} /></label>
      <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded ml-2">Simulate Live Webhook</button>
    </div>
  )
}
