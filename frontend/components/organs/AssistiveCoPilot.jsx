'use client'
import { useState } from 'react'

const DISCLAIMER =
  'This is an analytical lead, not a final finding of guilt. Output generated requires independent verification under Section 94 BNSS 2023.'

export default function AssistiveCoPilot({ caseId }) {
  const [lang, setLang] = useState('en')
  const summaryEn = 'Funds traced from the victim bank account through mule UPIs, into an FIU-IND reporting VASP nodal account, and finally out to offshore crypto wallets. Recommend an immediate lien on the VASP nodal account and a Section 168 read with Section 94 BNSS notice, limited to the tainted proportion of the balance.'
  const summaryHi = 'Funds victim bank account se mule UPIs, phir FIU-IND reporting VASP nodal account, aur aakhir mein offshore crypto wallets tak trace hue. VASP nodal account par turant lien aur Section 168 read with Section 94 BNSS notice issue karna recommend hai, sirf tainted proportion tak seemit.'

  const notice = `NOTICE UNDER SECTION 168 READ WITH SECTION 94 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(Immediate bank lien / hold on proceeds of crime)

Case ID: ${caseId}
To: Nodal / Compliance Officer, Bank & FIU-IND reporting VASP
Subject: Production of KYC records and lien hold on tainted proceeds

1. Whereas an investigation is in progress into an offence of cyber-enabled financial fraud, you are hereby directed under Section 94 BNSS 2023, read with the emergency production powers under Section 168 BNSS 2023, to:
   (a) produce complete KYC, onboarding, device and IP logs for the accounts, UPI handles and wallet addresses listed in the case annexure;
   (b) place an immediate lien / hold on the identified proceeds of crime;
   (c) preserve the transaction chain and confirm the hold in writing to the undersigned within the stipulated SLA.

2. Proportional dilution safeguard — Section 106(1) BNSS, 2023:
   The hold is limited to the tainted proportion of the balance computed by the proportional dilution method in the case annexure (per-hop decay of the taint ratio). Innocent customer balances, commingled exchange liquidity pools and third-party funds that are not traceable to the proceeds of crime shall NOT be frozen. A release of the untainted balance shall be processed by the intermediary on receipt of written intimation from the Investigating Officer.

3. Restoration of property is sought under Section 106(1) BNSS 2023; the affected person may apply for release of the untainted portion before the competent court.

4. This notice is issued in the public interest and must be acted upon within the Golden Hour wherever the transaction trail is still within the lien window.

Place: Cyber Cell, Chandigarh
Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
Issuing Authority: Investigating Officer, Cyber Cell (DSC to be affixed)

${DISCLAIMER}`

  function copyNotice() {
    navigator.clipboard.writeText(notice)
    alert('Notice copied to clipboard')
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
      <div className="border border-edge rounded p-2 text-[10px] text-slate-400 space-y-1">
        <div className="font-bold text-cyan">Statutory basis — MHA / I4C CFCFRMS SOP</div>
        <div>• Section 168 read with Section 94 BNSS, 2023 — immediate bank lien / production of records.</div>
        <div>• Section 106(1) BNSS, 2023 — restoration of property to the victim.</div>
        <div>• Proportional dilution safeguard — freeze only the tainted proportion, never innocent exchange liquidity pools.</div>
      </div>
      <div className="flex gap-2">
        <button onClick={copyNotice} className="px-2 py-1 border border-edge rounded">Copy Notice</button>
        <button onClick={downloadNotice} className="px-2 py-1 border border-edge rounded">Download .txt Notice</button>
      </div>
      <div className="text-[10px] text-slate-500 border-t border-edge pt-2">
        Mandatory Statutory Notice: {DISCLAIMER} All actions must be reviewed by the Investigating Officer before dispatch.
      </div>
      <div className="text-[10px] text-slate-500">
        Compliance: BSA Section 63(4) Electronic Evidence Certificate • BNSS Sec 94 / 106(1) / 168 / 503 • FIU-IND PMLA Reporting • RBI Zero-Liability Guidelines
      </div>
    </div>
  )
}
