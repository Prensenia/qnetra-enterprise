'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Bot, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { t, LANGS } from '../lib/translations'

function fallbackReply(msg, form, lang, history = []) {
  const m = msg.toLowerCase()
  let reply = 'Take a deep breath. You are not alone. Acting within the Golden Hour gives the strongest chance to freeze funds.'
  if ((m.includes('hi') || m.includes('hello') || m.includes('namaste')) && history.length <= 1) reply = 'Namaste! I am Q-Sahayak. I am here to help you. Take a deep breath.'
  else if (m.includes('joke') || m.includes('hasao')) reply = 'Why did the computer go to the doctor? Because it had a virus! Now, let us secure your account.'
  else if (m.includes('dar') || m.includes('scared') || m.includes('panic')) reply = 'I hear you. It is completely normal to feel scared. You are not alone. We will act step by step.'
  else if (m.includes('called') || m.includes('1930')) reply = 'Good job calling 1930. That is the right first step.'
  else if (m.includes('don') && m.includes('know')) reply = 'No problem at all. We can proceed with the information we have.'
  else if (m.includes('helpful') || m.includes('how') || m.includes('work') || m.includes('what will')) reply = 'Q-Netra helps freeze funds during the Golden Hour by structuring your UTR and bank trail for 1930 / CFCFRMS and auto-dispatching BNSS Sec 94 notices to banks and exchanges. Please share your bank name or amount lost next.'
  else if (!form.victim_bank) reply += ' First, which bank or UPI app did you use, and roughly how much money was lost?'
  else if (!form.narrative) reply += ' Can you briefly describe how the scam happened?'
  else if (!form.utr && !form.suspect_upi) reply += ' Do you have the 12-digit UTR or suspect UPI/wallet? If not, type I don\'t know.'
  else reply += ' I have captured details. Please review and submit.'
  const lastBot = [...history].reverse().find(h => h.role === 'assistant')?.content
  if (lastBot && reply === lastBot) reply = 'Let us continue. ' + reply
  return { reply, extracted_fields: {}, quick_replies: ['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form'], emotion_state: 'calming' }
}

export default function QSahayakBot({ form, setForm, lang, setLang }) {
  const [chat, setChat] = useState([{ role: 'assistant', text: 'Namaste! I am Q-Sahayak. Take a deep breath.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [quickReplies, setQuickReplies] = useState(['I lost money on UPI', 'Muje dar lag raha hai', 'Tell me a quick joke to relax', 'I don\'t know my UTR'])
  const [emotion, setEmotion] = useState('calming')
  const [engineMode, setEngineMode] = useState('local-fallback')
  const [debugReason, setDebugReason] = useState('')
  const [files, setFiles] = useState([])
  const recRef = useRef(null)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  const speechLang = (lang === 'hi' ? 'hi-IN' : lang === 'pa' ? 'pa-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat, loading])
  useEffect(() => {
    fetch('/api/q-sahayak').then(r => r.json()).then(d => {
      if (d.engine_mode) setEngineMode(d.engine_mode)
      if (d.debug_reason) setDebugReason(d.debug_reason)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (voiceMode && chat.length) {
      const last = chat[chat.length-1]
      if (last.role === 'assistant') {
        const u = new SpeechSynthesisUtterance(last.text)
        u.lang = speechLang
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(u)
      }
    }
  }, [chat, voiceMode, speechLang])

  function speak(text) {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = speechLang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  function toggleMic() {
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { toast.error('Voice not supported'); return }
    const rec = new SR()
    rec.lang = speechLang
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  async function send(msgOverride) {
    const msg = msgOverride || input
    if (!msg.trim() && files.length === 0) return
    setInput('')
    const newChat = [...chat, { role: 'user', text: msg || '(file attached)' }]
    setChat(newChat)
    setLoading(true)
    try {
      const res = await fetch('/api/q-sahayak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: newChat.map(m => ({ role: m.role, content: m.text })), current_form: form, language: speechLang }),
      })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setChat(c => [...c, { role: 'assistant', text: data.reply }])
      if (data.extracted_fields) setForm(f => ({ ...f, ...data.extracted_fields }))
      if (data.quick_replies) setQuickReplies(data.quick_replies)
      if (data.engine_mode) setEngineMode(data.engine_mode)
      if (data.debug_reason) setDebugReason(data.debug_reason)
    } catch {
      const data = fallbackReply(msg, form, speechLang, newChat)
      setChat(c => [...c, { role: 'assistant', text: data.reply }])
      if (data.extracted_fields) setForm(f => ({ ...f, ...data.extracted_fields }))
      if (data.quick_replies) setQuickReplies(data.quick_replies)
      setEngineMode('local-fallback')
      setDebugReason('network or parse error')
    } finally {
      setLoading(false)
    }
  }

  function handleFiles(e) {
    const fs = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...fs])
    if (fs.length) toast.success(`${fs.length} file(s) attached`)
  }

  const ringColor = emotion === 'urgent_action' ? 'ring-amber-500' : emotion === 'guiding' ? 'ring-cyan-500' : 'ring-emerald-500'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-slate-900 border-2 ${ringColor} flex items-center justify-center animate-pulse`}>
            <Bot className="text-cyan" size={20} />
          </div>
          <div>
            <div className="font-bold text-cyan">Q-Sahayak</div>
            <div className="text-[10px] text-slate-400">Live AI Crisis & Triage Companion</div>
            <span title={debugReason} className={`text-[10px] px-2 py-0.5 rounded border ${engineMode === 'gemini-live' ? 'border-emerald-600 text-emerald-300' : 'border-amber-600 text-amber-300'}`}>{engineMode === 'gemini-live' ? 'AI: Gemini Live' : 'AI: Edge Fallback'}{debugReason ? ` (${debugReason.slice(0,40)})` : ''}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1">
            {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button onClick={() => setVoiceMode(v => !v)} className="px-2 py-1 text-xs border border-slate-600 rounded">{voiceMode ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>
          <button onClick={toggleMic} className={`px-2 py-1 text-xs border rounded ${listening ? 'bg-red-600 text-white animate-pulse' : 'border-slate-600'}`}>{listening ? <MicOff size={14}/> : <Mic size={14}/>}</button>
          <button onClick={() => fileRef.current?.click()} className="px-2 py-1 text-xs border border-slate-600 rounded flex items-center gap-1"><Paperclip size={14}/> Add File</button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {files.map((f,i) => <span key={i} className="text-xs px-2 py-1 bg-slate-700 rounded">{f.name} ({Math.round(f.size/1024)}KB)</span>)}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[200px]">
        {chat.map((m,i) => (
          <div key={i} className={`p-2 rounded text-sm flex gap-2 ${m.role==='assistant' ? 'bg-slate-700' : 'bg-emerald-900'}`}>
            {m.role === 'assistant' && <Bot size={14} className="text-cyan mt-0.5 shrink-0" />}
            <div className="flex-1">
              {m.text}
              {m.role === 'assistant' && <button onClick={() => speak(m.text)} className="ml-2 text-xs text-emerald-300"><Volume2 size={12}/></button>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mb-2 flex-wrap">
        {quickReplies.map(q => (
          <button key={q} onClick={() => send(q)} className="px-2 py-1 text-xs border border-slate-600 rounded hover:bg-slate-700">{q}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && send()} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Talk to Q-Sahayak..." />
        <button onClick={() => send()} className="px-3 py-2 bg-emerald-600 text-white rounded">Send</button>
      </div>
    </div>
  )
}
