'use client'
export default function TimelineOrgan({ edges = [], onNodeSelect }) {
  return (
    <div className="space-y-2 text-xs">
      {edges.map((e, i) => (
        <div key={e.id || i} className="border-l-2 border-cyan pl-3 pb-2 cursor-pointer" onClick={() => onNodeSelect && onNodeSelect(e.source)}>
          <div className="text-slate-300">{e.source} → {e.target}</div>
          <div className="text-slate-500">{e.amount} {e.asset} • {e.timestamp} {i > 0 && `[+${(i*13)} sec]`}</div>
        </div>
      ))}
    </div>
  )
}
