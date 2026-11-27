'use client'
import { useState } from 'react'

export default function AssistiveCoPilot({ caseId }) {
  const [lang, setLang] = useState('en')
  const summaryEn = 'Funds traced from victim bank to mule UPIs, then to FIU-IND VASP, and finally to offshore crypto wallet. Recommend immediate freeze of VASP nodal account and BNSS Sec 94 notice.'
  const summaryHi = 'Funds victim bank se mule UPIs, phir FIU-IND VASP, aur finally offshore crypto wallet tak trace hue. VASP nodal account ko turant freeze aur BNSS Sec 94 notice issue karna recommend hai.'
  const notice = `NOTICE u/s 94 BNSS 2023\nCase: ${caseId}\nTo: Bank/VASP Nodal Officer\nPlease produce KYC and freeze proceeds of crime for the listed UTRs and wallet addresses.\nThis is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.`

  function copyNotice() {
    navigator.clipboard.writeText(notice)
    alert('Copied')
  }
  function downloadNotice() {
    const blob = new Blob([notice], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${caseId}_bnss_notice.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-2">
        <button onClick={() => setLang('en')} className={`px-2 py-1 rounded ${lang==='en' ? 'bg-cyan text-black' : 'border border-edge'}`}>EN</button>
        <button onClick={() => setLang('hi')} className={`px-2 py-1 rounded ${lang==='hi' ? 'bg-cyan text-black' : 'border border-edge'}`}>हिंदी</button>
      </div>
      <div className="text-slate-300 leading-relaxed">{lang === 'en' ? summaryEn : summaryHi}</div>
      <div className="text-[10px] text-slate-500">
        This assistant translates graph findings into plain English/Hindi for non-crypto-expert officers. It highlights the freeze choke point, cross-case overlaps, and ready-to-send legal notices.
      </div>
      <div className="flex gap-2">
        <button onClick={copyNotice} className="px-2 py-1 border border-edge rounded">Copy Notice</button>
        <button onClick={downloadNotice} className="px-2 py-1 border border-edge rounded">Download .txt Notice</button>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-edge pt-2">
        Mandatory Statutory Notice: This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023. All actions must be reviewed by the Investigating Officer before dispatch.
      </div>
      <div className="text-[10px] text-slate-500">
        Compliance: BSA Section 63 Electronic Evidence Certificate • BNSS Sec 94 / 106 / 168 / 503 • FIU-IND PMLA Reporting • RBI Zero-Liability Guidelines
      </div>
    </div>
  )
}
