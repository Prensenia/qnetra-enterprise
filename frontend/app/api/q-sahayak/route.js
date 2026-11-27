import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Q-Sahayak, Cybernautics' empathetic Indian Cyber Crisis & Golden-Hour Triage Companion. Be warm, human, reassuring. Support English, Hindi, Hinglish. If user greets, asks a joke, or vents, respond naturally (can tell a clean light one-line joke) before guiding to bank safety, calling 1930, and filling report. Use conversation history and current_form to avoid repeating questions. Always return valid JSON only: {"reply":"...","extracted_fields":{"scam_type":"","bank_name":"","amount_inr":"","utr":"","suspect_id":"","vasp_name":"","narrative":""},"quick_replies":["..."],"emotion_state":"calming|guiding|urgent_action"}.`

// Real, currently served Gemini models. The earlier list (gemini-3.x) does not
// exist, so a configured key could never reach a live model.
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

const QUICK_REPLIES = [
  "I don't know the UTR",
  "I don't have the suspect ID",
  'I already called 1930',
  'Help me fill the form',
  'Tell me a quick joke',
]

// Canonical display names, so extraction never title-cases "Hdfc" into the form.
const BANKS = [
  ['sbi', 'SBI'], ['state bank', 'SBI'], ['hdfc', 'HDFC Bank'], ['icici', 'ICICI Bank'],
  ['axis', 'Axis Bank'], ['kotak', 'Kotak Mahindra Bank'], ['pnb', 'Punjab National Bank'],
  ['yes bank', 'Yes Bank'], ['idfc', 'IDFC First Bank'], ['paytm', 'Paytm Payments Bank'],
  ['phonepe', 'PhonePe'], ['google pay', 'Google Pay'], ['gpay', 'Google Pay'],
]

function geminiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
}

// Deterministic extraction — runs whether or not a model key exists, so the
// triage form keeps filling on a keyless Vercel deployment.
function extract(message, currentForm = {}) {
  const msg = String(message || '')
  const lower = msg.toLowerCase()
  const out = {}

  const utr = msg.match(/\b\d{12}\b/)
  const ncrp = msg.match(/\b\d{14}\b/)
  const amount = msg.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i) || msg.match(/\b(\d{4,9}(?:,\d{3})+|\d{4,9})\b/)
  const wallet = msg.match(/\b0x[a-fA-F0-9]{6,40}\b/) || msg.match(/\bT[A-Za-z0-9]{30,40}\b/)
  const upi = msg.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z]{3,}/)

  // A message can carry both the bank UTR and the NCRP acknowledgement.
  if (utr && !currentForm.utr) out.utr = utr[0]
  if (ncrp) out.ncrp_id = ncrp[0]
  if (amount && !currentForm.amount_inr) {
    const value = parseFloat(String(amount[1]).replace(/,/g, ''))
    if (!Number.isNaN(value) && value > 0) out.amount_inr = value
  }
  if (wallet && !currentForm.suspect_wallet) out.suspect_id = wallet[0]
  if (upi && !currentForm.suspect_upi) out.suspect_id = upi[0]

  for (const [needle, label] of BANKS) {
    if (lower.includes(needle)) {
      out.bank_name = label
      break
    }
  }
  if (lower.includes('usdt') || lower.includes('crypto') || lower.includes('coindcx') || lower.includes('wazirx') || lower.includes('binance')) {
    out.scam_type = 'Pig-Butchering / Fake Crypto Investment'
    if (lower.includes('coindcx')) out.vasp_name = 'CoinDCX'
    if (lower.includes('wazirx')) out.vasp_name = 'WazirX'
    if (lower.includes('binance')) out.vasp_name = 'Binance'
  } else if (lower.includes('upi') || lower.includes('qr')) out.scam_type = 'UPI / QR Fraud'
  else if (lower.includes('apk') || lower.includes('remote access') || lower.includes('anydesk')) out.scam_type = 'APK / Remote Access Scam'
  else if (lower.includes('digital arrest') || lower.includes('cbi') || lower.includes('police')) out.scam_type = 'Digital Arrest / Impersonation'

  if ((lower.includes("don't know") || lower.includes('dont know') || lower.includes('pata nahi') || lower.includes('nahi pata')) && !currentForm.utr) {
    out.utr = 'UNKNOWN_UTR_BANK_STATEMENT_PENDING'
  }
  return out
}

function isHindi(language, message) {
  return String(language || '').toLowerCase().startsWith('hi') || /[\u0900-\u097F]/.test(String(message || ''))
}

function buildFallback({ message, history = [], currentForm = {}, language }) {
  const msg = String(message || '').toLowerCase()
  const extracted = extract(message, currentForm)
  const hindi = isHindi(language, message)
  const bank = extracted.bank_name || currentForm.victim_bank
  const amount = extracted.amount_inr || currentForm.amount_inr
  const utr = extracted.utr || currentForm.utr
  const ncrp = extracted.ncrp_id || currentForm.ncrp_id
  const scared = /dar|darr|scared|panic|ghabra|help me|bachao/.test(msg)
  const praised = /1930|called|complaint/.test(msg)

  let reply
  if (scared) {
    reply = hindi
      ? 'Main samajh sakta hoon — aap dar rahe hain, aur yeh swabhavik hai. Aap akele nahi hain. Sabse pehle 1930 par call karein: Golden Hour ke andar report karne se lien hold ka chance sabse zyada hota hai.'
      : 'I hear you — feeling scared is completely normal, and you are not alone. First step: call 1930 now, because reporting inside the Golden Hour gives the strongest chance of a lien hold.'
  } else if (/joke|hasao|hansao/.test(msg)) {
    reply = hindi
      ? 'Ek chhota sa joke: computer doctor ke paas kyun gaya? Kyunki usko virus tha! Ab chaliye, aapka account secure karte hain.'
      : 'A quick one: why did the computer go to the doctor? Because it had a virus! Now let us secure your account.'
  } else if (praised) {
    reply = hindi
      ? 'Bahut badhiya — 1930 par call karna sahi pehla kadam tha. Ab apna UTR aur bank statement taiyaar rakhein, main aage ka packet bana deta hoon.'
      : 'Good — calling 1930 was the right first step. Keep your UTR and bank statement ready; I will structure the packet from here.'
  } else if (!bank && !amount) {
    reply = hindi
      ? 'Pehle batayein: kaunsa bank ya UPI app use kiya, aur lagbhag kitne rupaye gaye?'
      : 'First, which bank or UPI app did you use, and roughly how much money was lost?'
  } else {
    const known = []
    if (bank) known.push(hindi ? `bank ${bank}` : `bank ${bank}`)
    if (amount) known.push(hindi ? `rakam ₹${amount}` : `amount ₹${amount}`)
    if (utr && !String(utr).startsWith('UNKNOWN')) known.push(hindi ? `UTR ${utr}` : `UTR ${utr}`)
    if (ncrp) known.push(hindi ? `NCRP ${ncrp}` : `NCRP ${ncrp}`)
    const captured = known.length ? known.join(', ') : (hindi ? 'aapki details' : 'your details')
    reply = hindi
      ? `Maine ${captured} note kar liya. Turant 1930 par call karein aur apne bank ke 24x7 fraud desk ko bhi inform karein — isse Golden Hour ke andar lien hold lagne ka chance badhta hai. Phir right side ka form submit kar dein, Cyber Cell packet ban jayega.`
      : `I have noted ${captured}. Call 1930 now and also inform your bank's 24x7 fraud desk — that is what turns the Golden Hour into an actual lien hold. Then submit the form on the right and the Cyber Cell packet is generated.`
  }

  const lastBot = [...history].reverse().find(h => h?.role === 'assistant')?.content
  if (lastBot && reply === lastBot) reply = (hindi ? 'Theek hai, aage badhein. ' : 'Let us continue. ') + reply

  return {
    reply,
    extracted_fields: extracted,
    quick_replies: QUICK_REPLIES,
    emotion_state: scared ? 'calming' : 'guiding',
    engine_mode: 'local-fallback',
  }
}

async function callGemini(apiKey, prompt) {
  let lastError = ''
  for (const model of MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      })
      if (r.ok) {
        const data = await r.json()
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const text = raw.replace(/```json|```/gi, '').trim()
        let parsed = {}
        try { parsed = JSON.parse(text) } catch { parsed = {} }
        return { ok: true, model, parsed, text }
      }
      lastError = `HTTP ${r.status}`
    } catch (e) {
      lastError = String(e)
    }
  }
  return { ok: false, error: lastError || 'no model reachable' }
}

export async function GET() {
  try {
    const apiKey = geminiKey()
    if (!apiKey) {
      return NextResponse.json({ has_key: false, engine_mode: 'local-fallback', model_used: null, debug_reason: 'GEMINI_API_KEY is empty' })
    }
    const res = await callGemini(apiKey, 'ping')
    return NextResponse.json({
      has_key: true,
      engine_mode: res.ok ? 'gemini-live' : 'local-fallback',
      model_used: res.ok ? res.model : null,
      debug_reason: res.ok ? '' : res.error,
    })
  } catch (e) {
    return NextResponse.json({ has_key: false, engine_mode: 'local-fallback', model_used: null, debug_reason: String(e) })
  }
}

export async function POST(req) {
  let body = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const message = body.message || ''
  const history = Array.isArray(body.history) ? body.history : []
  const currentForm = body.current_form || {}
  const language = body.language || 'en-IN'

  try {
    const apiKey = geminiKey()
    if (apiKey) {
      const prompt = `${SYSTEM_PROMPT}\n\nConversation history:\n${history.map(h => `${h?.role}: ${h?.content}`).join('\n')}\nCurrent form: ${JSON.stringify(currentForm)}\nUser message: ${message}`
      const res = await callGemini(apiKey, prompt)
      if (res.ok) {
        const p = res.parsed || {}
        const reply = p.reply || p.response || p.message || p.answer || res.text
        if (reply) {
          // Model output is advisory: entity extraction stays deterministic so a
          // hallucinated amount or UTR can never reach the complaint form.
          return NextResponse.json({
            reply,
            extracted_fields: { ...extract(message, currentForm), ...(p.extracted_fields || {}) },
            quick_replies: p.quick_replies?.length ? p.quick_replies : QUICK_REPLIES,
            emotion_state: p.emotion_state || 'guiding',
            engine_mode: 'gemini-live',
            model_used: res.model,
          })
        }
      }
      const fb = buildFallback({ message, history, currentForm, language })
      return NextResponse.json({ ...fb, debug_reason: res.error || 'model returned no text' })
    }

    return NextResponse.json({ ...buildFallback({ message, history, currentForm, language }), debug_reason: 'GEMINI_API_KEY is empty' })
  } catch (e) {
    // Absolute backstop: the assistant must answer, never 500.
    return NextResponse.json({ ...buildFallback({ message, history, currentForm, language }), debug_reason: String(e) }, { status: 200 })
  }
}
