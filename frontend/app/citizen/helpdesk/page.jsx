'use client'
import { useState } from 'react'
import { api } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import QSahayakBot from '../../../components/QSahayakBot'
import { lookupBank } from '../../../lib/bankHelplines'
import { t, LANGS } from '../../../lib/translations'

export default function CitizenHelpdesk() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''], time_approx: '' })
  const [files, setFiles] = useState([])
  const [smsText, setSmsText] = useState('')
  const [ncrpId, setNcrpId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [stateSel, setStateSel] = useState('')
  const [citySel, setCitySel] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const bankInfo = lookupBank(form.victim_bank)

  async function handleOcrFile(file) {
    if (!file) return
    setOcrLoading(true)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(file)
      await worker.terminate()
      setSmsText(data.text || '')
      // auto parse
      setTimeout(() => {
        const t = data.text || ''
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
      }, 100)
    } catch (e) {
      toast.error('OCR failed')
    } finally {
      setOcrLoading(false)
    }
  }

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

  function handleFiles(fs) {
    setFiles(prev => [...prev, ...fs])
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
      {/* Top emergency strip */}
      <div className="p-3 border border-emerald-700 rounded bg-emerald-950 text-emerald-200 text-sm flex items-center justify-between flex-wrap gap-2">
        <div>{t(lang,'emergency')} — {t(lang,'goldenHour')}</div>
        <div className="flex gap-2">
          <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1">
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <a href="tel:1930" className="px-3 py-1 bg-red-600 text-white rounded text-xs">Call 1930</a>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 text-xs">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 p-2 rounded text-center ${step===s ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {s===1 ? t(lang,'step1') : s===2 ? t(lang,'step2') : t(lang,'step3')}
          </div>
        ))}
      </div>

      {/* SMS drawer */}
      <details className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <summary className="cursor-pointer text-sm font-bold text-emerald-400">{t(lang,'smsDrawer')}</summary>
        <textarea value={smsText} onChange={e=>setSmsText(e.target.value)} placeholder="Paste SMS/receipt..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm mt-2" rows={3} />
        <div className="mt-2 flex gap-2 items-center">
          <button onClick={parseSMS} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">{t(lang,'autoFill')}</button>
          <label className="px-3 py-1 bg-slate-700 text-white rounded text-sm cursor-pointer">
            {ocrLoading ? 'Extracting...' : 'Add File (OCR)'}
            <input type="file" accept="image/*" className="hidden" onChange={e=>handleOcrFile(e.target.files?.[0])} />
          </label>
        </div>
      </details>

      {(form.scam_type === 'APK / Remote Access Scam' || smsText.toLowerCase().includes('http') || smsText.toLowerCase().includes('apk')) && (
        <div className="p-3 border border-red-600 rounded bg-red-950 text-red-200 text-sm">
          Device Containment: Turn ON Airplane Mode, disconnect Wi-Fi, uninstall unknown APKs, revoke Accessibility/Device Admin permissions, do not enter UPI PINs until passwords reset.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 min-w-0">
          <QSahayakBot form={form} setForm={setForm} lang={lang} setLang={setLang} />
        </div>
        <div className="lg:col-span-7 min-w-0 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <h2 className="text-lg font-bold text-emerald-400 mb-3">{t(lang,'title')} — {step===1 ? t(lang,'step1') : step===2 ? t(lang,'step2') : t(lang,'step3')}</h2>
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-xs text-slate-400">{t(lang,'scamType')}</label>
              <select value={form.scam_type} onChange={e=>setForm({...form, scam_type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2">
                <option>UPI / QR Fraud</option>
                <option>Pig-Butchering / Fake Crypto Investment</option>
                <option>Digital Arrest / Impersonation</option>
                <option>APK / Remote Access Scam</option>
                <option>Job / Task Scam</option>
              </select>
              <label className="text-xs text-slate-400">{t(lang,'incidentTime')}</label>
              <input type="datetime-local" value={form.incident_time} onChange={e=>setForm({...form, incident_time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <label className="text-xs text-slate-400">{t(lang,'narrative')}</label>
              <textarea value={form.narrative} onChange={e=>setForm({...form, narrative: e.target.value})} placeholder={t(lang,'narrative')} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" rows={4} />
              <button onClick={()=>setStep(2)} className="px-3 py-2 bg-emerald-600 text-white rounded">{t(lang,'next')}</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs text-slate-400">{t(lang,'bank')}</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={stateSel} onChange={e=>{setStateSel(e.target.value);setCitySel('')}} className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-xs">
                  <option value="">Select State</option>
                  <option>Chandigarh</option><option>Delhi</option><option>Maharashtra</option><option>Karnataka</option><option>Tamil Nadu</option><option>Telangana</option><option>West Bengal</option>
                </select>
                <select value={citySel} onChange={e=>setCitySel(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-xs">
                  <option value="">Select City</option>
                  {stateSel==='Chandigarh' && <option>Chandigarh</option>}
                  {stateSel==='Delhi' && <option>New Delhi</option>}
                  {stateSel==='Maharashtra' && <option>Mumbai</option>}
                  {stateSel==='Karnataka' && <option>Bengaluru</option>}
                  {stateSel==='Tamil Nadu' && <option>Chennai</option>}
                  {stateSel==='Telangana' && <option>Hyderabad</option>}
                  {stateSel==='West Bengal' && <option>Kolkata</option>}
                </select>
                <select onChange={e=>setForm({...form, victim_bank: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-xs">
                  <option value="">Select Bank</option>
                  <option>SBI</option><option>HDFC</option><option>ICICI</option><option>Axis</option><option>PNB</option><option>Kotak</option><option>BoB</option><option>Canara</option><option>Union</option><option>IndusInd</option><option>Yes</option><option>IDFC</option>
                </select>
              </div>
              <input value={form.victim_bank} onChange={e=>setForm({...form, victim_bank: e.target.value})} placeholder={t(lang,'bank')} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <label className="text-xs text-slate-400">{t(lang,'victimUpi')}</label>
              <input value={form.victim_upi} onChange={e=>setForm({...form, victim_upi: e.target.value})} placeholder={t(lang,'victimUpi')} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <label className="text-xs text-slate-400">{t(lang,'suspectUpi')}</label>
              <div className="flex gap-2">
                <input value={form.suspect_upi} onChange={e=>setForm({...form, suspect_upi: e.target.value})} placeholder={t(lang,'suspectUpi')} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_upi', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>
              <label className="text-xs text-slate-400">{t(lang,'suspectWallet')}</label>
              <div className="flex gap-2">
                <input value={form.suspect_wallet} onChange={e=>setForm({...form, suspect_wallet: e.target.value})} placeholder={t(lang,'suspectWallet')} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_wallet', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>
              <label className="text-xs text-slate-400">{t(lang,'exchange')}</label>
              <div className="flex gap-2">
                <input value={form.exchange} onChange={e=>setForm({...form, exchange: e.target.value})} placeholder={t(lang,'exchange')} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('exchange', 'UNKNOWN_PLATFORM')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>
              <label className="text-xs text-slate-400">{t(lang,'amount')}</label>
              <input type="number" value={form.amount_inr} onChange={e=>setForm({...form, amount_inr: e.target.value})} placeholder={t(lang,'amount')} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <label className="text-xs text-slate-400">{t(lang,'utr')}</label>
              <div className="flex gap-2">
                <input value={form.utrs[0]} onChange={e=>setForm({...form, utrs: [e.target.value]})} placeholder={t(lang,'utr')} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('utrs', ['UNKNOWN_UTR_BANK_STATEMENT_PENDING'])} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>
              {form.utrs[0] === 'UNKNOWN_UTR_BANK_STATEMENT_PENDING' && <div className="text-xs text-emerald-300">No problem—your bank statement or SMS will have this, and officers can still trace using your bank account & timestamp.</div>}
              <label className="text-xs text-slate-400">{t(lang,'ncrp')}</label>
              <input value={ncrpId} onChange={e=>setNcrpId(e.target.value)} placeholder={t(lang,'ncrp')} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
              <div className="flex gap-2">
                <button onClick={()=>setStep(1)} className="px-3 py-2 bg-slate-700 text-white rounded">{t(lang,'back')}</button>
                <button onClick={()=>setStep(3)} className="px-3 py-2 bg-emerald-600 text-white rounded">{t(lang,'next')}</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <label className="text-xs text-slate-400">{t(lang,'upload')}</label>
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(Array.from(e.dataTransfer.files))}}
                className={`border-2 border-dashed rounded p-6 text-center ${dragOver ? 'border-emerald-500' : 'border-slate-600'}`}
              >
                Drag & drop evidence here
                <label className="mt-2 inline-block px-3 py-1 bg-emerald-600 text-white rounded cursor-pointer">Add File<input type="file" multiple className="hidden" onChange={e=>handleFiles(Array.from(e.target.files))} /></label>
              </div>
              {files.map((f,i) => <div key={i} className="text-xs text-slate-300">{f.name} ({Math.round(f.size/1024)}KB)</div>)}
              <div className="flex gap-2">
                <button onClick={()=>setStep(2)} className="px-3 py-2 bg-slate-700 text-white rounded">{t(lang,'back')}</button>
                <button onClick={submit} className="px-3 py-2 bg-emerald-600 text-white rounded">{t(lang,'submit')}</button>
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
