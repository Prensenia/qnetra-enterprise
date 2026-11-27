import { useState } from 'react'
import Papa from 'papaparse'

export function useFileIngest() {
  const [hash, setHash] = useState('')
  const [rows, setRows] = useState([])
  const [mapped, setMapped] = useState([])

  function mapRowsToUnifiedSchema({ utrCol, amountCol, timeCol, bankName }) {
    return rows.map(r => ({
      utr: r[utrCol] || '',
      amount: r[amountCol] || '',
      timestamp: r[timeCol] || '',
      bank_name: bankName || r.bank_name || r.Bank || r.bank || '',
    }))
  }

  async function ingest(file) {
    const buf = await file.arrayBuffer()
    const hashBuf = await window.crypto.subtle.digest('SHA-256', buf)
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('')
    setHash(hashHex)
    const text = await file.text()
    const lines = text.split(/\r?\n/)
    let headerIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (/source_id|source|target_id|target|amount|asset|timestamp|utr/i.test(lines[i])) {
        headerIndex = i
        break
      }
    }
    const csvText = lines.slice(headerIndex).join('\n')
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    const data = parsed.data || []
    setRows(data)
    const norm = data.map(r => ({
      utr: r.utr || r.UTR || r.RRN || r.transaction_id || r.utr_number || '',
      amount: r.amount || r.Amount || r.debit || r.value || '',
      timestamp: r.timestamp || r.Timestamp || r.date || r.txn_date || '',
      bank_name: r.bank_name || r.Bank || r.bank || r.source_bank || '',
    }))
    setMapped(norm)
    return { hash: hashHex, rows: data, mapped: norm }
  }

  async function verifyHash(caseId, file) {
    const { hash: h } = await ingest(file)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('client_sha256', h)
    // use global fetch; apiUpload not imported here
    const token = typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/citizen/cases/${caseId}/evidence`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
    if (!res.ok) throw new Error('TAMPER_DETECTED')
    return res.json()
  }

  return { hash, rows, mapped, ingest, mapRowsToUnifiedSchema, verifyHash }
}
