'use client'
import { useState } from 'react'
import { api, apiUpload } from '../../../lib/api'
import { toast } from 'sonner'

export default function OfficerTools() {
  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('case_id', 'CYB-2026-089')
    const data = await apiUpload('/api/v1/ingest/batch', fd)
    toast.success(`Ingested ${data.rows} rows`)
  }
  async function webhook() {
    await api('/api/v1/ingest/webhook', { method:'POST', body: JSON.stringify({ case_id: 'CYB-2026-089', amount: 50000 }) })
    toast.success('Webhook injected')
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-cyan">Forensic Tools & Batch Ingest</h1>
      <label className="px-3 py-2 bg-panel border border-edge rounded cursor-pointer inline-block">Upload CSV/XLSX<input type="file" className="hidden" onChange={upload} /></label>
      <button onClick={webhook} className="px-3 py-2 bg-panel border border-edge rounded ml-2">Simulate Live Webhook</button>
    </div>
  )
}
