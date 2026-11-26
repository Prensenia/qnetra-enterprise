'use client'
import { useParams } from 'next/navigation'

export default function CaseSubmitted() {
  const params = useParams()
  const caseId = params.caseId
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-emerald-400">Case Registered Successfully</h1>
      <div className="bg-slate-800 border border-slate-700 rounded p-4">
        <div className="text-sm">Acknowledgement ID: <span className="font-mono text-emerald-300">{caseId}</span></div>
        <div className="text-sm mt-1">Assigned Cyber Cell Unit: Cyber Cell Chandigarh</div>
        <div className="text-sm mt-1">SHA-256 Evidence Receipt: computed on submission</div>
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
    </div>
  )
}
