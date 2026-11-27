import { useState } from 'react'
import Papa from 'papaparse'

const INDIAN_BANKS = ['SBI', 'HDFC', 'ICICI', 'AXIS', 'PNB', 'KOTAK', 'BOB', 'CANARA', 'UNION', 'INDUSIND', 'YES', 'IDFC', 'PAYTM', 'AIRTEL', 'INDIAPOST']

// Bank exports label the same columns differently ("UTR Number" vs "utr",
// "Amount (INR)" vs "amount", ...). Compare header keys with all punctuation,
// spaces and casing stripped so both the internal schema and real Indian bank
// CSVs map to the same unified fields.
const normalizeKey = (key) => String(key || '').toLowerCase().replace(/[^a-z]/g, '')

function field(row, aliases) {
  const wanted = new Set(aliases)
  for (const [key, value] of Object.entries(row || {})) {
    if (!wanted.has(normalizeKey(key))) continue
    if (value === undefined || value === null) continue
    if (String(value).trim() === '') continue
    return String(value).trim()
  }
  return ''
}

const UTR_KEYS = ['utr', 'utrnumber', 'utrno', 'rrn', 'transactionid', 'refno']
const AMOUNT_KEYS = ['amount', 'amountinr', 'debit', 'credit', 'value', 'txnamount']
const TIME_KEYS = ['timestamp', 'txndate', 'txndatetime', 'datetime', 'date', 'transactiondate', 'valuedate']
const BANK_KEYS = ['bankname', 'bank', 'sourcebank', 'sourcename']
const NARRATION_KEYS = ['narration', 'description', 'particulars', 'remarks', 'details']

function digestToHex(digest) {
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Shared SHA-256 helper for every evidence path (File / Blob / ArrayBuffer /
 * string). Returns a 64-character lowercase hex digest.
 */
export async function computeSha256Hex(input) {
  let buf
  if (typeof input === 'string') {
    buf = new TextEncoder().encode(input)
  } else if (input instanceof ArrayBuffer) {
    buf = input
  } else if (ArrayBuffer.isView(input)) {
    buf = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  } else if (input && typeof input.arrayBuffer === 'function') {
    buf = await input.arrayBuffer()
  } else {
    throw new Error('computeSha256Hex: unsupported input')
  }
  const digest = await window.crypto.subtle.digest('SHA-256', buf)
  return digestToHex(digest)
}

// Backwards-compatible alias for the earlier hook-internal helper.
export async function sha256Hex(data) {
  return computeSha256Hex(data)
}

export function useFileIngest() {
  const [hash, setHash] = useState('')
  const [rows, setRows] = useState([])
  const [mapped, setMapped] = useState([])
  const [verifyStatus, setVerifyStatus] = useState('')
  const [headerIndex, setHeaderIndex] = useState(0)

  function detectHeaderIndex(lines) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      if (line.includes('source_id') || line.includes('source') || line.includes('target_id') || line.includes('target') || line.includes('amount') || line.includes('asset') || line.includes('timestamp') || line.includes('utr') || line.includes('rrn')) {
        return i
      }
    }
    return 0
  }

  function normalizeBankName(raw) {
    if (!raw) return ''
    const upper = String(raw).toUpperCase()
    for (const b of INDIAN_BANKS) {
      if (upper.includes(b)) return b
    }
    return raw
  }

  function mapRowsToUnifiedSchema({ utrCol, amountCol, timeCol, bankName }) {
    return rows.map(r => ({
      utr: r[utrCol] || '',
      amount: r[amountCol] || '',
      timestamp: r[timeCol] || '',
      bank_name: bankName || normalizeBankName(r.bank_name || r.Bank || r.bank || r.source_bank || ''),
    }))
  }

  function normalizeToIST(value) {
    if (!value) return ''
    try {
      const d = new Date(value)
      if (isNaN(d.getTime())) return value
      return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } catch {
      return value
    }
  }

  async function ingest(file) {
    const hashHex = await sha256Hex(file)
    setHash(hashHex)
    const text = await file.text()
    const lines = text.split(/\r?\n/)
    const hi = detectHeaderIndex(lines)
    setHeaderIndex(hi)
    const csvText = lines.slice(hi).join('\n')
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
    const data = parsed.data || []
    setRows(data)
    const norm = data.map(r => ({
      utr: field(r, UTR_KEYS),
      amount: field(r, AMOUNT_KEYS),
      timestamp: normalizeToIST(field(r, TIME_KEYS)),
      bank_name: normalizeBankName(field(r, BANK_KEYS)),
      narration: field(r, NARRATION_KEYS),
    }))
    setMapped(norm)
    return { hash: hashHex, rows: data, mapped: norm, headerIndex: hi }
  }

  async function verifyHash(caseId, file) {
    const { hash: h } = await ingest(file)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('client_sha256', h)
    const token = typeof window !== 'undefined' ? localStorage.getItem('qnetra_token') : null
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/citizen/cases/${caseId}/evidence`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
    if (!res.ok) {
      setVerifyStatus('TAMPER_DETECTED')
      throw new Error('TAMPER_DETECTED')
    }
    const data = await res.json()
    setVerifyStatus('VERIFIED')
    return data
  }

  return { hash, rows, mapped, ingest, mapRowsToUnifiedSchema, verifyHash, verifyStatus, headerIndex, normalizeBankName, normalizeToIST }
}
