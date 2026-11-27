'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CaseSubmitted() {
  const params = useParams()
  const caseId = params.caseId
  const [hash, setHash] = useState('')
  const [ts, setTs] = useState('')
  useEffect(() => {
    const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    setTs(ist)
    const buf = new TextEncoder().encode(caseId + ist)
    window.crypto.subtle.digest('SHA-256', buf).then(b => {
      const hex = Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('')
      setHash(hex)
    })
  }, [caseId])

  function downloadReceipt() {
    const text = `Q-Netra Victim Acknowledgement Receipt\nCase ID: ${caseId}\nSHA-256: ${hash}\nIST Timestamp: ${ts}\nStatutory Reference: Section 94 BNSS 2023\n`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${caseId}_receipt.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400">Case Registered Successfully</h1>
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="text-sm">Acknowledgement ID: <span className="font-mono text-emerald-300">{caseId}</span></div>
        <div className="text-sm mt-1">SHA-256 Evidence Hash: <span className="font-mono text-emerald-300">{hash}</span></div>
        <div className="text-sm mt-1">IST Timestamp: {ts}</div>
        <div className="text-sm mt-1">Assigned Cyber Cell Unit: Cyber Cell Chandigarh</div>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <h2 className="font-bold mb-2">National Cyber Crime Helpline</h2>
        <a href="tel:1930" className="inline-block px-4 py-2 bg-red-600 text-white rounded">Call 1930</a>
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <h2 className="font-bold mb-2">Mandatory Next Steps</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1 text-slate-300">
          <li>Call 1930 with your UTR and case ID to trigger CFCFRMS lien hold.</li>
          <li>File acknowledgement on cybercrime.gov.in within 24 hours.</li>
          <li>Submit bank dispute & lien request letter to your home bank branch.</li>
          <li>Beware fake cyber recovery agents.</li>
        </ol>
      </div>
      <button onClick={downloadReceipt} className="px-4 py-2 bg-emerald-600 text-white rounded">Download / Print Victim Acknowledgement Receipt</button>
    </div>
  )
}
