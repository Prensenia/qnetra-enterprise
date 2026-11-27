import { useState } from 'react'
import Papa from 'papaparse'

export function useFileIngest() {
  const [hash, setHash] = useState('')
  const [rows, setRows] = useState([])
  const [mapped, setMapped] = useState([])

  async function ingest(file) {
    const buf = await file.arrayBuffer()
    const hashBuf = await window.crypto.subtle.digest('SHA-256', buf)
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('')
    setHash(hashHex)
    const text = await file.text()
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
    setRows(parsed.data)
    const norm = parsed.data.map(r => ({
      utr: r.utr || r.UTR || r.RRN || r.transaction_id || '',
      amount: r.amount || r.Amount || r.debit || '',
      timestamp: r.timestamp || r.Timestamp || r.date || '',
      bank_name: r.bank_name || r.Bank || r.bank || '',
    }))
    setMapped(norm)
    return { hash: hashHex, rows: parsed.data, mapped: norm }
  }

  return { hash, rows, mapped, ingest }
}
