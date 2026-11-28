'use client'
import { useState, useEffect } from 'react'
import { createCitizenCase } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import QSahayakBot from '../../../components/QSahayakBot'
import { lookupBank } from '../../../lib/bankHelplines'
import { t, LANGS } from '../../../lib/translations'
import { computeSha256Hex } from '../../../hooks/useFileIngest'
import GoldenHourBanner from '../../../components/GoldenHourBanner'
import Narrator from '../../../components/Narrator'

const DEMO_FORM = {
  scam_type: 'Pig-Butchering / Fake Crypto Investment',
  incident_time: '',
  narrative: 'Received WhatsApp link to a fake institutional USDT trading desk. Transferred ₹2,85,000 via HDFC UPI before realizing withdrawals were blocked and funds moved to CoinDCX.',
  victim_bank: 'HDFC Bank',
  victim_upi: 'arjun.sharma@okhdfcbank',
  suspect_upi: 'desk.settlement99@okicici',
  suspect_wallet: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
  exchange: 'CoinDCX (FIU-IND Registered)',
  amount_inr: '285000',
  utrs: ['432918475612'],
  time_approx: '',
}

// The scripted Q-Sahayak conversation for the demo account. Kept in one place so
// the first load, a restored draft and the "Re-Load Demo Details" button can
// never disagree about what the judge is looking at.
const DEMO_MESSAGES = [
  { role: 'assistant', text: 'Namaste! I am Q-Sahayak. Take a deep breath—you are safe, and acting right now within the Golden Hour gives us the strongest chance to freeze your money.' },
  { role: 'user', text: 'Muje bahut dar lag raha hai, maine 20 minute pehle galti se ₹2,85,000 transfer kar diye fake crypto link pe, ghar pe kya bolunga' },
  { role: 'assistant', text: 'Bilkul ghabraiye mat. Aap akela nahi hain, aur 20 minute ke andar report karne par RBI Zero-Liability aur 1930 CFCFRMS lien hold ka sabse zyada chance hota hai. Pehle aapki bank ka naam batayein taaki main turant block number de sakun.' },
  { role: 'user', text: 'HDFC Bank se Google Pay kiya tha, mere paas bank statement CSV bhi hai' },
  { role: 'assistant', text: 'Bahut badhiya! Maine HDFC Bank ka 24x7 Fraud Block Desk (1800-1600 / 1800-2600) neeche khol diya hai. Aap apna bank statement attach karke Submit dabayein—main aapki 1930 call script aur Cyber Cell packet turant taiyaar kar raha hoon.' },
]

export default function CitizenHelpdesk() {
  const router = useRouter()
  // Held in state and filled after mount: reading localStorage during render
  // changed the banner markup between server and client (hydration mismatch).
  const [email, setEmail] = useState('')
  useEffect(() => {
    try { setEmail(localStorage.getItem('qnetra_user_email') || '') } catch {}
  }, [])
  const isDemo = email === 'victim.demo@citizen.in'
  const storageKey = `qnetra_citizen_draft_${email}`

  const [step, setStep] = useState(1)
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''], time_approx: '' })
  const [files, setFiles] = useState([])
  const [fileObjects, setFileObjects] = useState([])
  const [messages, setMessages] = useState([])
  const [smsText, setSmsText] = useState('')
  const [ncrpId, setNcrpId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [stateSel, setStateSel] = useState('')
  const [citySel, setCitySel] = useState('')
  const bankInfo = lookupBank(form.victim_bank)
  const ncrpValid = /^\d{14}$/.test(ncrpId)
  const ncrpI4C = ncrpValid && ncrpId.startsWith('3')

  // restore
  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey)
    if (raw) {
      try {
        const d = JSON.parse(raw)
        // Only resume a draft that carries real user input; the default form
        // persisted during the first mount must not mask the demo preset.
        const hasContent = Boolean(d?.form?.narrative) || Boolean(d?.form?.utrs?.[0]) || Number(d?.step || 1) > 1
        if (hasContent) {
          if (d.step) setStep(d.step)
          if (d.form) setForm(d.form)
          if (d.messages) setMessages(d.messages)
          if (d.files) setFiles(d.files)
          if (d.lang) setLang(d.lang)
          if (d.ncrpId) setNcrpId(d.ncrpId)
          return
        }
      } catch {}
    }
    if (isDemo) {
      setForm({ ...DEMO_FORM })
      setNcrpId('30811260048912')
      setMessages(DEMO_MESSAGES.map(m => ({ ...m })))
    }
  }, [email])

  // persist
  useEffect(() => {
    const draft = { step, form, messages, files, lang, ncrpId }
    sessionStorage.setItem(storageKey, JSON.stringify(draft))
  }, [step, form, messages, files, lang, ncrpId, storageKey])

  function resetForm() {
    setForm({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''], time_approx: '' })
    setNcrpId('')
    setFiles([])
    setFileObjects([])
    setMessages([])
    sessionStorage.removeItem(storageKey)
  }

  function loadDemo() {
    setForm({ scam_type: 'Pig-Butchering / Fake Crypto Investment', incident_time: '', narrative: 'Received WhatsApp link to a fake institutional USDT trading desk. Transferred ₹2,85,000 via HDFC UPI before realizing withdrawals were blocked and funds moved to CoinDCX.', victim_bank: 'HDFC Bank', victim_upi: 'arjun.sharma@okhdfcbank', suspect_upi: 'desk.settlement99@okicici', suspect_wallet: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', exchange: 'CoinDCX (FIU-IND Registered)', amount_inr: '285000', utrs: ['432918475612'], time_approx: '' })
    setNcrpId('30811260048912')
    // Rewrite the saved draft as well, otherwise a stale draft keeps restoring
    // the old conversation over the scripted one on the next reload.
    setMessages(DEMO_MESSAGES.map(m => ({ ...m })))
    setStep(1)
    sessionStorage.removeItem(storageKey)
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

  async function handleOcrFile(file) {
    if (!file) return
    setOcrLoading(true)
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(file)
      await worker.terminate()
      setSmsText(data.text || '')
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

  function handleFiles(fs) {
    const mapped = fs.map(f => ({ name: f.name, size: f.size, type: f.type }))
    setFiles(prev => [...prev, ...mapped])
    setFileObjects(prev => [...prev, ...fs])
  }

  async function submit() {
    try {
      // Hash every attachment on the device first: the same digest then travels
      // with the complaint whether it reaches FastAPI or is kept offline.
      const evidence = []
      for (const f of fileObjects) {
        evidence.push({ name: f.name, size: f.size, sha256: await computeSha256Hex(f) })
      }
      // Attribute the complaint to the signed-in account instead of a hardcoded
      // demo name, and never send NaN for a blank amount.
      let stored = null
      try { stored = JSON.parse(localStorage.getItem('qnetra_user') || 'null') } catch {}
      const payload = { ...form, ncrp_id: ncrpId, amount_inr: Number(form.amount_inr) || 0, complainant_name: stored?.name || 'Demo Citizen', mobile: '9999999999', email: stored?.email || email || 'victim.demo@citizen.in', city: 'Chandigarh', evidence_hashes: evidence.map(e => e.sha256) }
      const res = await createCitizenCase(payload, evidence)

      // Evidence upload only applies to a live case; an offline case already
      // carries its hashes in the local record above.
      if (!res.demo) {
        for (let i = 0; i < fileObjects.length; i++) {
          const fd = new FormData()
          fd.append('file', fileObjects[i])
          fd.append('client_sha256', evidence[i].sha256)
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/citizen/cases/${res.case_id}/evidence`, { method: 'POST', body: fd })
          } catch {
            toast(`Case saved, but evidence upload failed — retry from My Cases (hash ${evidence[i].sha256.slice(0, 12)}…)`)
          }
        }
      }

      toast.success(res.demo ? `Case registered (Demo Mode) — ${res.case_id}` : `Case registered — ${res.case_id}`)
      sessionStorage.removeItem(storageKey)
      router.push(`/citizen/case-submitted/${res.case_id}`)
    } catch (err) {
      // Surface the server's reason (validation, auth) instead of a dead end.
      let detail = String(err?.message || '').trim()
      try { detail = JSON.parse(detail).detail || detail } catch {}
      toast.error(detail && detail !== 'Submission failed' ? `Submission failed — ${String(detail).slice(0, 140)}` : 'Submission failed — backend unreachable, retry in a moment')
    }
  }

  function setUnknown(field, value) {
    setForm({ ...form, [field]: value })
  }

  function setNow() {
    const now = new Date()
    const pad = n => String(n).padStart(2,'0')
    const val = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setForm({ ...form, incident_time: val })
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="p-3 border border-emerald-700 rounded bg-emerald-950 text-emerald-200 text-sm flex items-center justify-between flex-wrap gap-2">
          <span>{t(lang,'demoBadge')}</span>
          <div className="flex gap-2">
            <button onClick={loadDemo} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs">{t(lang,'demoReload')}</button>
            <button onClick={resetForm} className="px-3 py-1 bg-slate-700 text-white rounded text-xs">{t(lang,'demoClear')}</button>
          </div>
        </div>
      )}

      <GoldenHourBanner incidentTime={form.incident_time} />

      <div className="p-3 border border-emerald-700 rounded bg-emerald-950 text-emerald-200 text-sm flex items-center justify-between flex-wrap gap-2">
        <div>{t(lang,'emergency')} — {t(lang,'goldenHour')}</div>
        <div className="flex gap-2">
          <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1">
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <a href="tel:1930" className="px-3 py-1 bg-red-600 text-white rounded text-xs">Call 1930</a>
        </div>
      </div>

            <Narrator screen="helpdesk" lang={lang} />
      <div className="flex gap-2 text-xs">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 p-2 rounded text-center ${step===s ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {s===1 ? t(lang,'step1') : s===2 ? t(lang,'step2') : s===3 ? t(lang,'step3') : ''}
          </div>
        ))}
      </div>

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
          <QSahayakBot form={form} setForm={setForm} lang={lang} setLang={setLang} demoMode={isDemo} initialMessages={messages} onMessagesChange={setMessages} />
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
              <label className="text-xs text-slate-400">{t(lang,'incidentTime')} (IST UTC+5:30)</label>
              <div className="flex gap-2">
                <input type="datetime-local" max={new Date().toISOString().slice(0,16)} value={form.incident_time} onChange={e=>setForm({...form, incident_time: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={setNow} className="px-3 py-2 bg-slate-700 text-white rounded text-xs">Just Now</button>
                <button onClick={() => setForm({...form, incident_time: ''})} className="px-3 py-2 bg-slate-700 text-white rounded text-xs">I Don't Know Exact Time</button>
              </div>
              <label className="text-xs text-slate-400">{t(lang,'narrative')}</label>
              <textarea value={form.narrative} onChange={e=>setForm({...form, narrative: e.target.value})} placeholder="What happened? Amount, UPI ID, bank and time — in English, Hindi or Punjabi. You can also paste the SMS you received." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" rows={4} />
              <button onClick={()=>setStep(2)} className="px-3 py-2 bg-emerald-600 text-white rounded">{t(lang,'next')}</button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <label className="text-xs text-slate-400">{t(lang,'bank')}</label>
              <select value={form.victim_bank} onChange={e=>setForm({...form, victim_bank: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2">
                <option value="">Select Bank</option>
                <option>State Bank of India (SBI)</option>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Punjab National Bank (PNB)</option>
                <option>Kotak Mahindra Bank</option>
                <option>Bank of Baroda</option>
                <option>Canara Bank</option>
                <option>Union Bank of India</option>
                <option>IndusInd Bank</option>
                <option>Yes Bank</option>
                <option>IDFC First Bank</option>
                <option>Paytm Payments Bank</option>
                <option>Airtel Payments Bank</option>
                <option>Other Bank</option>
              </select>
              <button onClick={() => setForm({...form, victim_bank: 'UNKNOWN'})} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>

              <label className="text-xs text-slate-400">{t(lang,'victimUpi')}</label>
              <input value={form.victim_upi} onChange={e=>setForm({...form, victim_upi: e.target.value})} placeholder="e.g., yourname@okicici or mobile@ybl" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />

              <label className="text-xs text-slate-400">{t(lang,'suspectUpi')}</label>
              <div className="flex gap-2">
                <input value={form.suspect_upi} onChange={e=>setForm({...form, suspect_upi: e.target.value})} placeholder="e.g., scammer@paytm or 918273645512" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_upi', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>

              <label className="text-xs text-slate-400">{t(lang,'suspectWallet')}</label>
              <div className="flex gap-2">
                <input value={form.suspect_wallet} onChange={e=>setForm({...form, suspect_wallet: e.target.value})} placeholder="e.g., TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE (TRC-20)" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('suspect_wallet', 'UNKNOWN_SUSPECT_IDENTIFIER')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>

              <label className="text-xs text-slate-400">{t(lang,'exchange')}</label>
              <div className="flex gap-2">
                <select value={form.exchange} onChange={e=>setForm({...form, exchange: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2">
                  <option value="">None / Pure UPI-Bank Fraud</option>
                  <option>CoinDCX (FIU-IND Registered)</option>
                  <option>Mudrex (FIU-IND Registered)</option>
                  <option>ZebPay (FIU-IND Registered)</option>
                  <option>CoinSwitch</option>
                  <option>Binance Global</option>
                  <option>KuCoin</option>
                  <option>Bybit</option>
                  <option>Telegram / WhatsApp P2P Group</option>
                  <option>Other Platform</option>
                </select>
                <button onClick={() => setUnknown('exchange', 'UNKNOWN_PLATFORM')} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>

              <label className="text-xs text-slate-400">{t(lang,'amount')}</label>
              <input type="number" value={form.amount_inr} onChange={e=>setForm({...form, amount_inr: e.target.value})} placeholder="e.g., 45000" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />

              <label className="text-xs text-slate-400">{t(lang,'utr')}</label>
              <div className="flex gap-2">
                <input value={form.utrs[0]} onChange={e=>setForm({...form, utrs: [e.target.value.replace(/\D/g,'').slice(0,12)]})} placeholder="e.g., 432918475612 (from bank SMS or UPI receipt)" pattern="\d{12}" inputMode="numeric" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2" />
                <button onClick={() => setUnknown('utrs', ['UNKNOWN_UTR_BANK_STATEMENT_PENDING'])} className="px-2 py-1 text-xs border border-slate-600 rounded">{t(lang,'dontKnow')}</button>
              </div>
              {form.utrs[0] === 'UNKNOWN_UTR_BANK_STATEMENT_PENDING' && <div className="text-xs text-emerald-300">No problem—your bank statement or SMS will have this, and officers can still trace using your bank account & timestamp.</div>}

              <label className="text-xs text-slate-400">{t(lang,'ncrp')}</label>
              <input
                value={ncrpId}
                onChange={e=>setNcrpId(e.target.value.replace(/\D/g,'').slice(0,14))}
                placeholder={t(lang,'ncrp')}
                inputMode="numeric"
                pattern="\d{14}"
                aria-invalid={ncrpId.length > 0 && !ncrpValid}
                aria-describedby="ncrp-help"
                className={`w-full bg-slate-900 border rounded px-3 py-2 ${ncrpId.length > 0 && !ncrpValid ? 'border-red-500' : ncrpId.length === 0 ? 'border-slate-700' : 'border-emerald-500'}`}
              />
              <div id="ncrp-help" className="text-[11px]">
                {ncrpId.length === 0 && <span className="text-slate-500">14 digits — accepts 12-digit UTRs separately above; NCRP acknowledgement appears on the cybercrime.gov.in receipt.</span>}
                {ncrpId.length > 0 && !ncrpValid && <span className="text-red-400">NCRP acknowledgement must be exactly 14 digits ({ncrpId.length}/14).</span>}
                {ncrpValid && ncrpI4C && <span className="text-emerald-300">[✓] I4C XXNCRP acknowledgement recognised (14 digits, I4C series starting with 3).</span>}
                {ncrpValid && !ncrpI4C && <span className="text-amber-300">[✓] 14-digit NCRP acknowledgement valid (standard series — I4C IDs start with 3).</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={()=>setStep(1)} className="px-3 py-2 bg-slate-700 text-white rounded">{t(lang,'back')}</button>
                <button onClick={()=>setStep(3)} className="px-3 py-2 bg-emerald-600 text-white rounded">{t(lang,'next')}</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              {/* Read-only recap of what is about to be filed, so the last step
                  is a review and not just an upload box. */}
              <div className="border border-slate-700 rounded p-3 space-y-2 bg-slate-900/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    [t(lang,'scamType'), form.scam_type],
                    [t(lang,'amount'), form.amount_inr ? `₹${Number(form.amount_inr).toLocaleString('en-IN')}` : '—'],
                    [t(lang,'bank'), form.victim_bank || '—'],
                    [t(lang,'utr'), (form.utrs || []).filter(Boolean).join(', ') || '—'],
                    [t(lang,'suspectUpi'), form.suspect_upi || form.suspect_wallet || '—'],
                    [t(lang,'ncrp'), ncrpId || '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
                      <div className="text-slate-200 break-words">{value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{t(lang,'narrative')}</div>
                  <p className="text-xs text-slate-300 leading-snug max-h-24 overflow-auto whitespace-pre-wrap">{form.narrative || '—'}</p>
                </div>
              </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          ['1', t(lang,'stepCard1Title'), t(lang,'stepCard1Body')],
          ['2', t(lang,'stepCard2Title'), t(lang,'stepCard2Body')],
          ['3', t(lang,'stepCard3Title'), t(lang,'stepCard3Body')],
        ].map(([n, title, body]) => (
          <div key={n} className="p-3 rounded-xl border border-slate-700 bg-slate-800">
            <div className="text-emerald-400 text-xs font-bold mb-1">{t(lang,'stepTag')} {n}</div>
            <div className="text-sm font-semibold text-slate-100">{title}</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{body}</div>
          </div>
        ))}
      </div>
      {bankInfo && (
        <div className="p-3 border border-emerald-600 rounded bg-emerald-900 text-xs text-emerald-100">
          <div className="font-bold mb-1">{t(lang,'freezeCard')}</div>
          <div>{t(lang,'nationalHelpline')} <a href="tel:1930" className="underline">1930</a></div>
          <div>{bankInfo.name} {t(lang,'fraudDesk')} {bankInfo.numbers.map(n => <a key={n} href={`tel:${n}`} className="underline mr-2">{n}</a>)}</div>
        </div>
      )}
    </div>
  )
}
