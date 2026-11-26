'use client'
import { useState } from 'react'
import { api } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import QSahayakBot from '../../../components/QSahayakBot'
import { lookupBank } from '../../../lib/bankHelplines'

export default function CitizenHelpdesk() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''], time_approx: '' })
  const [files, setFiles] = useState([])
  const [lang, setLang] = useState('en-IN')
  const [smsText, setSmsText] = useState('')
  const [ncrpId, setNcrpId] = useState('')
  const bankInfo = lookupBank(form.victim_bank)

  function parseSMS() {
    const t = smsText
    const amt = t.match(/(?:Rs\.?|INR|₹)\s*([\d,]+)/i)
    const utr = t.match(/\b\d{12}\b/)
    const upi = t.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z]+/i)
    const bankMatch = t.match(/SBI|HDFC|ICICI|Axis|PNB|Kotak|BoB|Canara|Union|IndusInd|Yes|IDFC|Paytm/i)
    const newForm = { ...form }
    if (amt) newForm.amount_inr = amt[1].replace(/,/g, '')
    if (utr) newForm.utrs = [utr[0]]
    if (upi) newForm.suspect_upi = upi[0]
    if (bankMatch) newForm.victim_bank = bankMatch[0]
    setForm(newForm)
  }

  async function submit() {
    try {
      const payload = { ...form, ncrp_id: ncrpId, amount_inr: parseFloat(form.amount_inr || 0), complainant_name: 'Demo Citizen', mobile: '9999999999', email: 'victim.demo@citizen.in', city: 'Chandigarh', evidence_hashes: files.map(f=>f.name) }
      const res = await api('/api/v1/citizen/cases', { method: 'POST', body: JSON.stringify(payload) })
      toast.success('Case registered')
      router.push(`/citizen/case-submitted/${res.case_id}`)
    } catch { toast.error('Submission failed') }
  }

  function setUnknown(field, value) {
    setForm({ ...form, [field]: value })
  }

  return (
    <div className="space-y-4">
      <div className="p-3 border border-emerald-700 rounded bg-emerald-950 text-emerald-200 text-sm">
        Voice-Guided Mode available in Q-Sahayak. Use mic/speaker controls.
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-bold text-emerald-400 mb-2">Paste Bank/UPI Debit SMS or Receipt Text</h3>
        <textarea value={smsText} onChange={e=>setSmsText(e.target.value)} placeholder="Paste SMS/receipt..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm" rows={3} />
        <button onClick={parseSMS} className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded text-sm">Auto-Fill Form</button>
      </div>
      {(form.scam_type === 'APK / Remote Access Scam' || smsText.toLowerCase().includes('http') || smsText.toLowerCase().includes('apk')) && (
        <div className="p-3 border border-red-600 rounded bg-red-950 text-red-200 text-sm">
          Device Containment: Turn ON Airplane Mode, disconnect Wi-Fi, uninstall unknown APKs, revoke Accessibility/Device Admin permissions, do not enter UPI PINs until passwords reset.
        </div>
      )}
      <div className="grid grid-cols-2 gap-6">
        <QSahayakBot form={form} setForm={setForm} lang={lang} setLang={setLang} />

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h2 className="text-lg font-bold text-emerald-400 mb-3">Register Fraud Complaint (Step {step}/3)</h2>
          {step === 1 && (
            <div className="space-y-3">
              <select value={form.scam_type} onChange={e=>setForm({...form, scam_type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2">
                <option>UPI / QR Fraud</option>
                <option>Pig-Butchering / Fake Crypto Investment</option>
                <option>Digital Arrest / Impersonation</option>
                <option>APK / Remote Access Scam</option>
                <option>Job / Task Scam</option>
              </select>
              <input type="datetime-local" value={form.incident_time} onChange={e=>setForm({...form, incident_time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <textarea value={form.narrative} onChange={e=>setForm({...form, narrative: e.target.value})} placeholder="Brief narrative" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" rows={4} />
              <button onClick={()=>setStep(2)} className="px-3 py-2 bg-emerald-600 text-white rounded">Next</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <input value={form.victim_bank} onChange={e=>setForm({...form, victim_bank: e.target.value})} placeholder="Victim Bank" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <input value={form.victim_upi} onChange={e=>setForm({...form, victim_upi: e.target.value})} placeholder="Victim UPI" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <div className="flex gap-2">
                <input value={form.suspect_upi} onChange={e=>setForm({...form, suspect_upi: e.target.value})} placeholder="Suspect UPI" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_upi', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">I Don't Know</button>
              </div>
              <div className="flex gap-2">
                <input value={form.suspect_wallet} onChange={e=>setForm({...form, suspect_wallet: e.target.value})} placeholder="Suspect Wallet" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_wallet', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">I Don't Know</button>
              </div>
              <div className="flex gap-2">
                <input value={form.exchange} onChange={e=>setForm({...form, exchange: e.target.value})} placeholder="Exchange Platform" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('exchange', 'UNKNOWN_PLATFORM')} className="px-2 py-1 text-xs border border-slate-600 rounded">I Don't Know</button>
              </div>
              <input type="number" value={form.amount_inr} onChange={e=>setForm({...form, amount_inr: e.target.value})} placeholder="Amount Lost (INR)" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <input value={ncrpId} onChange={e=>setNcrpId(e.target.value)} placeholder="14-digit NCRP Acknowledgement Number (optional)" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <div className="flex gap-2">
                <input value={form.utrs[0]} onChange={e=>setForm({...form, utrs: [e.target.value]})} placeholder="12-digit UTR" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('utrs', ['UNKNOWN_UTR_BANK_STATEMENT_PENDING'])} className="px-2 py-1 text-xs border border-slate-600 rounded">I Don't Know</button>
              </div>
              {form.utrs[0] === 'UNKNOWN_UTR_BANK_STATEMENT_PENDING' && <div className="text-xs text-emerald-300">No problem—your bank statement or SMS will have this, and officers can still trace using your bank account & timestamp.</div>}
              <div className="flex gap-2">
                <button onClick={()=>setStep(1)} className="px-3 py-2 bg-slate-700 text-white rounded">Back</button>
                <button onClick={()=>setStep(3)} className="px-3 py-2 bg-emerald-600 text-white rounded">Next</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files))} className="w-full" />
              <div className="flex gap-2">
                <button onClick={()=>setStep(2)} className="px-3 py-2 bg-slate-700 text-white rounded">Back</button>
                <button onClick={submit} className="px-3 py-2 bg-emerald-600 text-white rounded">Submit Complaint</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {bankInfo && (
        <div className="p-3 border border-emerald-600 rounded bg-emerald-900 text-xs text-emerald-100">
          <div className="font-bold mb-1">Emergency Bank Freeze Card</div>
          <div>National Cyber Helpline: <a href="tel:1930" className="underline">1930</a></div>
          <div>{bankInfo.name} 24x7 Fraud Desk: {bankInfo.numbers.map(n => <a key={n} href={`tel:${n}`} className="underline mr-2">{n}</a>)}</div>
        </div>
      )}
    </div>
  )
}
