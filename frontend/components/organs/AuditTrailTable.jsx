'use client'
export default function AuditTrailTable({ logs = [] }) {
  return (
    <div className="text-xs space-y-1">
      {logs.map((l, i) => (
        <div key={l.id || i} className="border-b border-edge pb-1">
          <div className="text-slate-300">{l.action} - {l.details}</div>
          <div className="text-slate-500">{l.timestamp_utc} • {l.payload_sha256?.slice(0,12)}...</div>
        </div>
      ))}
      <button className="mt-2 px-2 py-1 border border-edge rounded text-[10px]">Verify Integrity</button>
    </div>
  )
}
