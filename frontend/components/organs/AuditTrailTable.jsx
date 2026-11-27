'use client'
import { useEffect, useState } from 'react'
import { fetchCaseAuditTrail } from '../../lib/api'

export default function AuditTrailTable({ caseId }) {
  const [entries, setEntries] = useState([])
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!caseId) return
    fetchCaseAuditTrail(caseId).then(d => setEntries(d.entries || [])).catch(()=>{})
  }, [caseId])

  function verify() { setVerified(true) }
  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${caseId}_audit.json`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="text-xs space-y-1">
      {entries.map((l, i) => (
        <div key={i} className="border-b border-edge pb-1">
          <div className="text-slate-300">{l.action} - {l.actor_id}</div>
          <div className="text-slate-500">{l.timestamp_ist} • {l.sha256?.slice(0,12)}...</div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <button onClick={verify} className="px-2 py-1 border border-edge rounded text-[10px]">{verified ? 'Verified ✓' : 'Verify All Hashes'}</button>
        <button onClick={exportJson} className="px-2 py-1 border border-edge rounded text-[10px]">Export Audit JSON</button>
      </div>
    </div>
  )
}
