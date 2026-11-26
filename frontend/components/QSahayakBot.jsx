'use client'
import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api'
import { Mic, MicOff, Volume2, VolumeX, Bot } from 'lucide-react'
import { toast } from 'sonner'

export default function QSahayakBot({ form, setForm, lang, setLang }) {
  const [chat, setChat] = useState([{ role: 'assistant', text: 'Namaste! I am Q-Sahayak. Take a deep breath. I am here to help you through this.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [quickReplies, setQuickReplies] = useState(['I lost money on UPI', 'Muje dar lag raha hai', 'Tell me a quick joke to relax', 'I don\'t know my UTR'])
  const [emotion, setEmotion] = useState('calming')
  const recRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat, loading])

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
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onend = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  async function send(msgOverride) {
    const msg = msgOverride || input
    if (!msg.trim()) return
    setInput('')
    const newChat = [...chat, { role: 'user', text: msg }]
    setChat(newChat)
    setLoading(true)
    try {
      const res = await api('/api/q-sahayak', { method: 'POST', body: JSON.stringify({ message: msg, history: newChat.map(m => ({ role: m.role, content: m.text })), current_form: form, language: lang }) })
      setChat(c => [...c, { role: 'assistant', text: res.reply }])
      if (res.extracted_fields) {
        setForm(f => ({ ...f, ...res.extracted_fields }))
      }
      if (res.quick_replies) setQuickReplies(res.quick_replies)
      if (res.emotion_state) setEmotion(res.emotion_state)
    } catch {
      toast.error('Q-Sahayak unavailable')
    } finally {
      setLoading(false)
    }
  }

  const ringColor = emotion === 'urgent_action' ? 'ring-amber-500' : emotion === 'guiding' ? 'ring-cyan-500' : 'ring-emerald-500'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-slate-900 border-2 ${ringColor} flex items-center justify-center animate-pulse`}>
            <Bot className="text-cyan" size={20} />
          </div>
          <div>
            <div className="font-bold text-cyan">Q-Sahayak</div>
            <div className="text-[10px] text-slate-400">Live AI Crisis & Triage Companion</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en-IN' ? 'hi-IN' : 'en-IN')} className="px-2 py-1 text-xs border border-slate-600 rounded">{lang === 'en-IN' ? 'English' : 'हिंदी'}</button>
          <button onClick={() => setVoiceMode(v => !v)} className="px-2 py-1 text-xs border border-slate-600 rounded">{voiceMode ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>
          <button onClick={toggleMic} className={`px-2 py-1 text-xs border rounded ${listening ? 'bg-red-600 text-white animate-pulse' : 'border-slate-600'}`}>{listening ? <MicOff size={14}/> : <Mic size={14}/>}</button>
        </div>
      </div>

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
        {loading && (
          <div className="p-2 rounded text-sm bg-slate-700 flex items-center gap-2">
            <Bot size={14} className="text-cyan" />
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </span>
            <span className="text-xs text-slate-400 ml-1">Q-Sahayak is thinking...</span>
          </div>
        )}
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
