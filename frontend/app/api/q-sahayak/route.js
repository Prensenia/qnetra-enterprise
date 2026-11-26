import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Q-Sahayak, Cybernautics' empathetic Indian Cyber Crisis & Golden-Hour Triage Companion. Be warm, human, reassuring. Support English, Hindi, Hinglish. If user greets, asks a joke, or vents, respond naturally (can tell a clean light one-line joke) before guiding to bank safety, calling 1930, and filling report. Use conversation history and current_form to avoid repeating questions. Always return valid JSON only: {"reply":"...","extracted_fields":{"scam_type":"","bank_name":"","amount_inr":"","utr":"","suspect_id":"","vasp_name":"","narrative":""},"quick_replies":["..."],"emotion_state":"calming|guiding|urgent_action"}.`

async function testGemini(apiKey, models) {
  let lastError = apiKey ? '' : 'GEMINI_API_KEY is empty in Vercel env'
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }] }),
      })
      if (r.ok) return { ok: true, model, error: '' }
      lastError = `HTTP ${r.status}: ${await r.text()}`
    } catch (e) {
      lastError = String(e)
    }
  }
  return { ok: false, model: null, error: lastError || 'API key missing' }
}

export async function GET() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  if (!apiKey) {
    return NextResponse.json({ has_key: false, engine_mode: 'local-fallback', model_used: null, debug_reason: 'GEMINI_API_KEY is empty in Vercel env' })
  }
  const res = await testGemini(apiKey, ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'])
  if (res.ok) {
    return NextResponse.json({ has_key: true, engine_mode: 'gemini-live', model_used: res.model, debug_reason: '' })
  }
  return NextResponse.json({ has_key: true, engine_mode: 'local-fallback', model_used: null, debug_reason: res.error })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const message = body.message || ''
    const history = body.history || []
    const currentForm = body.current_form || {}
    const language = body.language || 'en-IN'

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()

    if (apiKey) {
      const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash']
      let lastError = 'GEMINI_API_KEY is empty in Vercel env'
      for (const model of models) {
        try {
          const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation history:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\nCurrent form: ${JSON.stringify(currentForm)}\nUser message: ${message}`
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            }),
          })
          if (r.ok) {
            const data = await r.json()
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const rawClean = raw.replace(/```json|```/gi, '').trim()
            let parsed = {}
            try { parsed = JSON.parse(rawClean) } catch { parsed = {} }
            const replyText = parsed.reply || parsed.response || parsed.message || parsed.answer || rawClean || 'I am here with you. Tell me what happened and which bank or app was involved.'
            return NextResponse.json({ reply: replyText, extracted_fields: parsed.extracted_fields || {}, quick_replies: parsed.quick_replies || ['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form', 'Tell me a quick joke'], emotion_state: parsed.emotion_state || 'guiding', engine_mode: 'gemini-live', model_used: model, debug_reason: '' })
          } else {
            lastError = `HTTP ${r.status}: ${await r.text()}`
          }
        } catch (e) {
          lastError = String(e)
        }
      }
      // fallback
      const msg = message.toLowerCase()
      const extracted = {}
      const amtMatch = msg.match(/(\d[\d,]*)/)
      if (amtMatch && !currentForm.amount_inr) extracted.amount_inr = parseFloat(amtMatch[1].replace(/,/g,''))
      if (msg.includes('sbi')) extracted.bank_name = 'SBI'
      if (msg.includes('hdfc')) extracted.bank_name = 'HDFC'
      if (msg.includes('icici')) extracted.bank_name = 'ICICI'
      if (msg.includes('upi')) extracted.scam_type = 'UPI / QR Fraud'
      if (msg.includes('crypto') || msg.includes('usdt')) extracted.scam_type = 'Pig-Butchering / Fake Crypto Investment'
      if (msg.includes('don') && msg.includes('know')) {
        if (!currentForm.utr) extracted.utr = 'UNKNOWN_UTR_BANK_STATEMENT_PENDING'
        if (!currentForm.suspect_upi) extracted.suspect_id = 'UNKNOWN_SUSPECT_IDENTIFIER'
        if (!currentForm.exchange) extracted.vasp_name = 'UNKNOWN_PLATFORM'
      }
      let reply = ''
      if ((msg.includes('hi') || msg.includes('hello') || msg.includes('namaste')) && history.length <= 1) reply = 'Namaste! I am Q-Sahayak. I am here to help you. Take a deep breath.'
      else if (msg.includes('joke') || msg.includes('hasao')) reply = 'Why did the computer go to the doctor? Because it had a virus! Now, let us secure your account.'
      else if (msg.includes('dar') || msg.includes('scared') || msg.includes('panic')) reply = 'I hear you. It is completely normal to feel scared. You are not alone. We will act step by step.'
      else if (msg.includes('called') || msg.includes('1930')) reply = 'Good job calling 1930. That is the right first step.'
      else if (msg.includes('don') && msg.includes('know')) reply = 'No problem at all. We can proceed with the information we have.'
      else if (msg.includes('helpful') || msg.includes('how') || msg.includes('work') || msg.includes('what will') || msg.includes('name')) reply = 'I am Q-Sahayak, your Cybernautics crisis & triage companion. Q-Netra helps freeze funds during the Golden Hour by structuring your UTR and bank trail for 1930 / CFCFRMS and auto-dispatching BNSS Sec 94 notices to banks and exchanges. Please share your bank name or amount lost next.'
      else if (!currentForm.victim_bank && !extracted.bank_name) reply = 'First, which bank or UPI app did you use, and roughly how much money was lost?'
      else if (!currentForm.narrative) reply = 'Can you briefly describe how the scam happened?'
      else if (!currentForm.utr && !currentForm.suspect_upi) reply = 'Do you have the 12-digit UTR or suspect UPI/wallet? If not, type I don\'t know.'
      else reply = 'I have captured details. Please review and submit.'
      const lastBot = [...history].reverse().find(h => h.role === 'assistant')?.content
      if (lastBot && reply === lastBot) reply = 'Let us continue. ' + reply
      return NextResponse.json({ reply, extracted_fields: extracted, quick_replies: ['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form', 'Tell me a quick joke'], emotion_state: 'calming', engine_mode: 'local-fallback', debug_reason: lastError })
    }

    // no key fallback
    const msg = message.toLowerCase()
    const extracted = {}
    const amtMatch = msg.match(/(\d[\d,]*)/)
    if (amtMatch && !currentForm.amount_inr) extracted.amount_inr = parseFloat(amtMatch[1].replace(/,/g,''))
    if (msg.includes('sbi')) extracted.bank_name = 'SBI'
    if (msg.includes('hdfc')) extracted.bank_name = 'HDFC'
    if (msg.includes('icici')) extracted.bank_name = 'ICICI'
    if (msg.includes('upi')) extracted.scam_type = 'UPI / QR Fraud'
    if (msg.includes('crypto') || msg.includes('usdt')) extracted.scam_type = 'Pig-Butchering / Fake Crypto Investment'
    if (msg.includes('don') && msg.includes('know')) {
      if (!currentForm.utr) extracted.utr = 'UNKNOWN_UTR_BANK_STATEMENT_PENDING'
      if (!currentForm.suspect_upi) extracted.suspect_id = 'UNKNOWN_SUSPECT_IDENTIFIER'
      if (!currentForm.exchange) extracted.vasp_name = 'UNKNOWN_PLATFORM'
    }
    let reply = ''
    if ((msg.includes('hi') || msg.includes('hello') || msg.includes('namaste')) && history.length <= 1) reply = 'Namaste! I am Q-Sahayak. I am here to help you. Take a deep breath.'
    else if (msg.includes('joke') || msg.includes('hasao')) reply = 'Why did the computer go to the doctor? Because it had a virus! Now, let us secure your account.'
    else if (msg.includes('dar') || msg.includes('scared') || msg.includes('panic')) reply = 'I hear you. It is completely normal to feel scared. You are not alone. We will act step by step.'
    else if (msg.includes('called') || msg.includes('1930')) reply = 'Good job calling 1930. That is the right first step.'
    else if (msg.includes('don') && msg.includes('know')) reply = 'No problem at all. We can proceed with the information we have.'
    else if (msg.includes('helpful') || msg.includes('how') || msg.includes('work') || msg.includes('what will') || msg.includes('name')) reply = 'I am Q-Sahayak, your Cybernautics crisis & triage companion. Q-Netra helps freeze funds during the Golden Hour by structuring your UTR and bank trail for 1930 / CFCFRMS and auto-dispatching BNSS Sec 94 notices to banks and exchanges. Please share your bank name or amount lost next.'
    else if (!currentForm.victim_bank && !extracted.bank_name) reply = 'First, which bank or UPI app did you use, and roughly how much money was lost?'
    else if (!currentForm.narrative) reply = 'Can you briefly describe how the scam happened?'
    else if (!currentForm.utr && !currentForm.suspect_upi) reply = 'Do you have the 12-digit UTR or suspect UPI/wallet? If not, type I don\'t know.'
    else reply = 'I have captured details. Please review and submit.'
    const lastBot = [...history].reverse().find(h => h.role === 'assistant')?.content
    if (lastBot && reply === lastBot) reply = 'Let us continue. ' + reply
    return NextResponse.json({ reply, extracted_fields: extracted, quick_replies: ['I don\'t know the UTR', 'I don\'t have the suspect ID', 'I already called 1930', 'Help me fill the form', 'Tell me a quick joke'], emotion_state: 'calming', engine_mode: 'local-fallback', debug_reason: 'GEMINI_API_KEY is empty in Vercel env' })
  } catch (e) {
    return NextResponse.json({ reply: 'I am here to help. Please try again.', extracted_fields: {}, quick_replies: [], emotion_state: 'calming', engine_mode: 'local-fallback', debug_reason: String(e) }, { status: 200 })
  }
}
