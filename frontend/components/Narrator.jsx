'use client'
import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Square, Volume2, ChevronDown, ChevronUp } from 'lucide-react'
import { getNarration } from '../lib/narration'

const SPEECH_LANG = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN' }

function pickVoice(code) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null
  const exact = voices.find(v => v.lang?.replace('_', '-') === code)
  if (exact) return exact
  const prefix = code.split('-')[0]
  return voices.find(v => v.lang?.toLowerCase().startsWith(prefix)) || null
}

/**
 * Voice guide: reads the screen's narration aloud with live captions, so an
 * officer (or a judge) can understand the screen without being told about it.
 * Falls back to captions only when the browser has no speech engine.
 */
export default function Narrator({ screen, lang = 'en', className = '' }) {
  const beats = getNarration(screen, lang)
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState('idle') // idle | playing | paused
  const [supported, setSupported] = useState(true)
  const [showScript, setShowScript] = useState(false)
  const statusRef = useRef('idle')
  const timerRef = useRef(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function')
    return () => {
      clearTimeout(timerRef.current)
      try { window.speechSynthesis?.cancel() } catch {}
    }
  }, [])

  // Language or screen change abandons whatever is being spoken.
  useEffect(() => {
    stop()
    setIndex(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, lang])

  function speakAt(i) {
    if (!beats[i]) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(beats[i].text)
    utterance.lang = SPEECH_LANG[lang] || 'en-IN'
    const voice = pickVoice(utterance.lang)
    if (voice) utterance.voice = voice
    utterance.rate = 0.97
    utterance.pitch = 1
    utterance.onend = () => {
      if (statusRef.current !== 'playing') return
      if (i + 1 < beats.length) {
        setIndex(i + 1)
        timerRef.current = setTimeout(() => speakAt(i + 1), 380)
      } else {
        statusRef.current = 'idle'
        setStatus('idle')
        setIndex(0)
      }
    }
    utterance.onerror = () => {
      if (statusRef.current === 'playing') {
        statusRef.current = 'idle'
        setStatus('idle')
      }
    }
    synth.speak(utterance)
  }

  function play(from = index) {
    if (!supported) return
    statusRef.current = 'playing'
    setStatus('playing')
    setIndex(from)
    speakAt(from)
  }

  function pause() {
    if (!supported) return
    try { window.speechSynthesis.pause() } catch {}
    statusRef.current = 'paused'
    setStatus('paused')
  }

  function resume() {
    if (!supported) return
    try { window.speechSynthesis.resume() } catch {}
    statusRef.current = 'playing'
    setStatus('playing')
  }

  function stop() {
    clearTimeout(timerRef.current)
    try { window.speechSynthesis?.cancel() } catch {}
    statusRef.current = 'idle'
    setStatus('idle')
  }

  if (!beats.length) return null
  const current = beats[index]
  const active = status === 'playing' || status === 'paused'

  return (
    <div className={`rounded-xl border border-edge bg-panel ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        <Volume2 size={16} className={active ? 'text-cyan' : 'text-slate-400'} />
        <span className="text-xs font-semibold text-slate-200">Voice guide</span>
        <span className="text-[10px] text-slate-500">
          {supported ? `${index + 1} of ${beats.length}` : 'captions only — no speech engine'}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {!active && (
            <button
              onClick={() => play(0)}
              disabled={!supported}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-cyan text-black font-semibold disabled:opacity-40"
            >
              <Play size={12} /> Explain this screen
            </button>
          )}
          {status === 'playing' && (
            <button onClick={pause} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-edge text-slate-200">
              <Pause size={12} /> Pause
            </button>
          )}
          {status === 'paused' && (
            <button onClick={resume} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-cyan text-black font-semibold">
              <Play size={12} /> Resume
            </button>
          )}
          {active && (
            <button onClick={stop} aria-label="Stop narration" className="px-2 py-1 text-[11px] rounded border border-edge text-slate-300">
              <Square size={12} />
            </button>
          )}
          <button
            onClick={() => setShowScript(s => !s)}
            aria-expanded={showScript}
            className="px-2 py-1 text-[11px] rounded border border-edge text-slate-300 flex items-center gap-1"
          >
            {showScript ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Script
          </button>
        </div>
      </div>

      {(active || showScript) && (
        <div className="px-3 pb-3 space-y-2">
          <div className="rounded-lg bg-obsidian border border-edge p-3">
            <div className="text-[11px] font-semibold text-cyan">{current.title}</div>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">{current.text}</p>
            {active && beats[index + 1] && (
              <p className="text-[10px] text-slate-600 mt-2">Next: {beats[index + 1].title}</p>
            )}
          </div>
          {showScript && (
            <ol className="space-y-1.5">
              {beats.map((b, i) => (
                <li key={b.title} className={`text-[11px] leading-relaxed ${i === index && active ? 'text-slate-200' : 'text-slate-500'}`}>
                  <button onClick={() => play(i)} disabled={!supported} className="text-left hover:text-cyan disabled:hover:text-slate-500">
                    <span className="font-semibold">{i + 1}. {b.title}</span> — {b.text}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
