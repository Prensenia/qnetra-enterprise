'use client'
import { useState, useRef, useEffect } from 'react'
import { api } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { lookupBank } from '../../../lib/bankHelplines'

export default function CitizenHelpdesk() {
  const router = useRouter()
  const [chat, setChat] = useState([{ role: 'assistant', text: 'Take a deep breath. You are not alone. Acting within the Golden Hour gives us the strongest chance to freeze the funds.' }])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''], time_approx: '' })
  const [files, setFiles] = useState([])
  const [lang, setLang] = useState('en-IN')
  const [listening, setListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const recRef = useRef(null)
  const bankInfo = lookupBank(form.victim_bank)

  useEffect(() => {
    if (voiceMode && chat.length) {
      const last = chat[chat.length-1]
      if (last.role === 'assistant') {
        const u = new SpeechSynthesisUtterance(last.text)
        u.lang = lang
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(u)
      }
    }
  }, [chat, voiceMode, lang])

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  function toggleMic() {
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Voice not supported'); return }
    const rec = new SR()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript
      setInput(t)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  async function send() {
    const msg = input
    setInput('')
    setChat(c => [...c, { role: 'user', text: msg }])
    try {
      const res = await api('/api/v1/citizen/ai-helper', { method: 'POST', body: JSON.stringify({ message: msg, history: chat, current_form: form, language: lang }) })
      setChat(c => [...c, { role: 'assistant', text: res.reply }])
      if (res.extracted_fields) {
        setForm(f => ({ ...f, ...res.extracted_fields }))
      }
    } catch { toast.error('AI helper failed') }
  }

  async function submit() {
    try {
      const payload = { ...form, amount_inr: parseFloat(form.amount_inr || 0), complainant_name: 'Demo Citizen', mobile: '9999999999', email: 'victim.demo@citizen.in', city: 'Chandigarh', evidence_hashes: files.map(f=>f.name) }
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
      <div className="p-3 border border-emerald-700 rounded bg-emerald-950 text-emerald-200 text-sm flex items-center gap-3">
        <span>Voice-Guided Mode available. Toggle speaker/mic below.</span>
        <button onClick={() => setVoiceMode(v => !v)} className="px-2 py-1 border border-emerald-600 rounded text-xs">{voiceMode ? <VolumeX size={14}/> : <Volume2 size={14}/>} {voiceMode ? 'Voice On' : 'Voice Off'}</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* AI helper */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-emerald-400">AI Cyber Sahayak</h2>
            <div className="flex gap-2">
              <button onClick={() => setLang(lang === 'en-IN' ? 'hi-IN' : 'en-IN')} className="px-2 py-1 text-xs border border-slate-600 rounded">{lang === 'en-IN' ? 'English' : 'हिंदी'}</button>
              <button onClick={toggleMic} className={`px-2 py-1 text-xs border rounded ${listening ? 'bg-red-600 text-white animate-pulse' : 'border-slate-600'}`}>{listening ? <MicOff size={14}/> : <Mic size={14}/>} {listening ? 'Listening...' : 'Mic'}</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[200px]">
            {chat.map((m,i) => (
              <div key={i} className={`p-2 rounded text-sm ${m.role==='assistant' ? 'bg-slate-700' : 'bg-emerald-900'}`}>
                {m.text}
                {m.role === 'assistant' && <button onClick={() => speak(m.text)} className="ml-2 text-xs text-emerald-300"><Volume2 size={12}/></button>}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-2 flex-wrap">
            {['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form'].map(q => (
              <button key={q} onClick={() => { setInput(q); }} className="px-2 py-1 text-xs border border-slate-600 rounded hover:bg-slate-700">{q}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Describe what happened..." />
            <button onClick={send} className="px-3 py-2 bg-emerald-600 text-white rounded">Send</button>
          </div>
          <div className="mt-3 p-3 border border-emerald-700 rounded bg-emerald-950 text-xs text-emerald-200">
            Golden Hour: Call 1930 immediately. Call your bank fraud desk. Preserve screenshots.
          </div>
          {bankInfo && (
            <div className="mt-3 p-3 border border-emerald-600 rounded bg-emerald-900 text-xs text-emerald-100">
              <div className="font-bold mb-1">Emergency Bank Freeze Card</div>
              <div>National Cyber Helpline: <a href="tel:1930" className="underline">1930</a></div>
              <div>{bankInfo.name} 24x7 Fraud Desk: {bankInfo.numbers.map(n => <a key={n} href={`tel:${n}`} className="underline mr-2">{n}</a>)}</div>
              <div className="mt-1">Ask the bank agent to immediately block UPI/NetBanking/Cards and raise a cyber fraud dispute ticket.</div>
            </div>
          )}
        </div>

        {/* Wizard */}
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
    </div>
  )
}
