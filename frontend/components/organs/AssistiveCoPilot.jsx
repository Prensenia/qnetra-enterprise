'use client'
export default function AssistiveCoPilot({ caseId }) {
  function copyNotice() {
    const text = `NOTICE u/s 94 BNSS 2023\nCase: ${caseId}\nPlease produce KYC and freeze proceeds of crime.`
    navigator.clipboard.writeText(text)
    alert('Copied')
  }
  return (
    <div className="space-y-2 text-xs">
      <div className="text-slate-300">Plain-English summary: Funds traced from victim to VASP and offshore wallet. Recommend immediate freeze.</div>
      <button onClick={copyNotice} className="px-2 py-1 border border-edge rounded">Draft Section 94 BNSS Freeze Notice</button>
      <div className="text-[10px] text-slate-500">This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.</div>
    </div>
  )
}
