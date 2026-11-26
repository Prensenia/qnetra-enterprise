'use client'
import { useState } from 'react'
import { api } from '../../../lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CitizenHelpdesk() {
  const router = useRouter()
  const [chat, setChat] = useState([{ role: 'assistant', text: 'Take a deep breath. You are not alone. Acting within the Golden Hour gives us the strongest chance to freeze the funds.' }])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ scam_type: 'UPI / QR Fraud', incident_time: '', narrative: '', victim_bank: '', victim_upi: '', suspect_upi: '', suspect_wallet: '', exchange: '', amount_inr: '', utrs: [''] })
  const [files, setFiles] = useState([])

  async function send() {
    const msg = input
    setInput('')
    setChat([...chat, { role: 'user', text: msg }])
    try {
      const res = await api('/api/v1/citizen/ai-helper', { method: 'POST', body: JSON.stringify({ message: msg }) })
      setChat(c => [...c, { role: 'assistant', text: res.guidance }])
      if (res.extracted) {
        setForm(f => ({ ...f, ...res.extracted }))
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

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* AI helper */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col">
        <h2 className="text-lg font-bold text-emerald-400 mb-3">AI Cyber Sahayak</h2>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {chat.map((m,i) => (
            <div key={i} className={`p-2 rounded text-sm ${m.role==='assistant' ? 'bg-slate-700' : 'bg-emerald-900'}`}>{m.text}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Describe what happened..." />
          <button onClick={send} className="px-3 py-2 bg-emerald-600 text-white rounded">Send</button>
        </div>
        <div className="mt-3 p-3 border border-emerald-700 rounded bg-emerald-950 text-xs text-emerald-200">
          Golden Hour: Call 1930 immediately. Call your bank fraud desk. Preserve screenshots.
        </div>
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
            <input value={form.suspect_upi} onChange={e=>setForm({...form, suspect_upi: e.target.value})} placeholder="Suspect UPI" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
            <input value={form.suspect_wallet} onChange={e=>setForm({...form, suspect_wallet: e.target.value})} placeholder="Suspect Wallet" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
            <input value={form.exchange} onChange={e=>setForm({...form, exchange: e.target.value})} placeholder="Exchange Platform" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
            <input type="number" value={form.amount_inr} onChange={e=>setForm({...form, amount_inr: e.target.value})} placeholder="Amount Lost (INR)" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
            <input value={form.utrs[0]} onChange={e=>setForm({...form, utrs: [e.target.value]})} placeholder="12-digit UTR" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2" />
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
  )
}
