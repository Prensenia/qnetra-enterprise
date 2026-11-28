import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Q-Sahayak, Cybernautics' empathetic Indian Cyber Crisis & Golden-Hour Triage Companion. Be warm, human, reassuring. Support English, Hindi, Hinglish. If user greets, asks a joke, or vents, respond naturally (can tell a clean light one-line joke) before guiding to bank safety, calling 1930, and filling report. Use conversation history and current_form to avoid repeating questions. Always return valid JSON only: {"reply":"...","extracted_fields":{"scam_type":"","bank_name":"","amount_inr":"","utr":"","suspect_id":"","vasp_name":"","narrative":""},"quick_replies":["..."],"emotion_state":"calming|guiding|urgent_action"}.`

// Fallback model names, used only when the key cannot list its own models.
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']

// Production testing showed the configured key present while every hardcoded
// model returned HTTP 404. Ask the API which models this key may use (cached per
// isolate), and if none answer, stop retrying for a few minutes — otherwise each
// chat message pays four failed round trips before the local engine replies.
const MODEL_TTL_MS = 5 * 60 * 1000
let modelState = { checkedAt: 0, models: [], dead: false }

async function listUsableModels(apiKey) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  const names = (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => String(m.name || '').replace(/^models\//, ''))
    .filter(Boolean)
  const rank = n => (/flash/i.test(n) ? 2 : 0) + (/2\.5|3/.test(n) ? 1 : 0)
  return names.sort((a, b) => rank(b) - rank(a)).slice(0, 4)
}

async function modelCandidates(apiKey) {
  if (modelState.models.length) return modelState.models
  try {
    const found = await listUsableModels(apiKey)
    if (found.length) {
      modelState = { checkedAt: Date.now(), models: found, dead: false }
      return found
    }
    modelState = { checkedAt: Date.now(), models: [], dead: true }
  } catch {
    // Listing can fail for reasons that do not mean the key is useless; try the
    // fallback names once, and the dead-cache is set only if they all fail too.
  }
  return MODELS
}

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
  const amount = msg.match(/(?:₹|rs\.?|inr|rupees?|rupaye?)\s*([\d,]+(?:\.\d{1,2})?)/i) || msg.match(/\b(\d{1,3}(?:,\d{2,3})+|\d{4,9})\b/)
  const wallet = msg.match(/\b0x[a-fA-F0-9]{6,40}\b/) || msg.match(/\bT[A-Za-z0-9]{30,40}\b/)
  const upi = msg.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z]{3,}/)

  // A message can carry both the bank UTR and the NCRP acknowledgement.
  // What the citizen states now overrides prefilled demo data: the form must
  // never contradict the sentence they just typed on stage.
  if (utr) out.utr = utr[0]
  if (ncrp) out.ncrp_id = ncrp[0]
  {
    let value = null
    if (amount) {
      const raw = String(amount[1])
      const parsed = parseFloat(raw.replace(/,/g, ''))
      // 1930 is the helpline and 1800-numbers are bank desks — never a loss amount.
      const isHelpline = /^1800/.test(raw) || parsed === 1930 || parsed === 112
      if (!Number.isNaN(parsed) && parsed > 0 && !isHelpline) value = parsed
    }
    if (value === null) {
      // "2.85 lakh" / "1.2 crore" — how the loss is actually spoken in India.
      const scale = msg.match(/([\d,]+(?:\.\d{1,2})?)\s*(lakh|lacs?|crore|cr)\b/i)
      if (scale) {
        const base = parseFloat(scale[1].replace(/,/g, ''))
        if (Number.isFinite(base) && base > 0) value = Math.round(base * (/crore|cr/i.test(scale[2]) ? 1e7 : 1e5))
      }
    }
    if (value !== null) out.amount_inr = value
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

// Answers the local engine can give without a model. Every line is either a
// helpline fact or a product fact, so a keyless deployment never invents one.
const LOCAL = {
  en: {
    ask: 'First — which bank or UPI app was used, and roughly how much money went out?',
    call1930: 'Call 1930 now. Reporting inside the Golden Hour gives the strongest chance of a bank lien hold on the money.',
    prepare: 'Keep three things ready: the 12-digit UTR, your bank statement, and the SMS or receipt you received.',
    bankDesk: "Also call your bank's 24x7 fraud desk — the lien is executed by the bank, not by the helpline.",
    neverShare: 'Never share OTP, PIN or CVV with anyone, even someone claiming to be from the bank, Cyber Cell or police.',
    next: 'Then submit this form. Q-Netra hashes the evidence and generates the Cyber Cell packet plus the notice for the bank and the exchange.',
    unknown: 'I can only help with cyber-fraud reporting steps — the UTR, the bank, the freeze and the complaint. For case status, dial 1930.',
  },
  hi: {
    ask: 'पहले बताइए — कौन सा बैंक या UPI ऐप इस्तेमाल हुआ, और लगभग कितने रुपये गए?',
    call1930: 'अभी 1930 पर कॉल करें। गोल्डन आवर में शिकायत करने से बैंक लियन लगने की संभावना सबसे अधिक होती है।',
    prepare: 'तीन चीज़ें तैयार रखें: 12 अंकों का UTR, बैंक स्टेटमेंट, और मिला हुआ SMS या रसीद।',
    bankDesk: 'अपने बैंक के 24x7 फ्रॉड डेस्क को भी कॉल करें — लियन बैंक लगाता है, हेल्पलाइन नहीं।',
    neverShare: 'OTP, PIN या CVV किसी के साथ साझा न करें — बैंक, साइबर सेल या पुलिस कहने वाले के साथ भी नहीं।',
    next: 'इसके बाद यह फॉर्म जमा करें। क्यू-नेत्रा साक्ष्य का हैश बनाकर साइबर सेल पैकेट और बैंक/एक्सचेंज के लिए नोटिस तैयार कर देता है।',
    unknown: 'मैं केवल साइबर धोखाधड़ी की रिपोर्टिंग में मदद कर सकता हूँ — UTR, बैंक, फ्रीज और शिकायत। केस की स्थिति के लिए 1930 पर कॉल करें।',
  },
  pa: {
    ask: 'ਪਹਿਲਾਂ ਦੱਸੋ — ਕਿਹੜਾ ਬੈਂਕ ਜਾਂ UPI ਐਪ ਵਰਤਿਆ, ਅਤੇ ਲਗਭਗ ਕਿੰਨੇ ਰੁਪਏ ਗਏ?',
    call1930: 'ਹੁਣੇ 1930 ’ਤੇ ਕਾਲ ਕਰੋ। ਗੋਲਡਨ ਆਵਰ ਵਿੱਚ ਸ਼ਿਕਾਇਤ ਕਰਨ ਨਾਲ ਬੈਂਕ ਲੀਨ ਲੱਗਣ ਦੀ ਸੰਭਾਵਨਾ ਸਭ ਤੋਂ ਵੱਧ ਹੁੰਦੀ ਹੈ।',
    prepare: 'ਤਿੰਨ ਚੀਜ਼ਾਂ ਤਿਆਰ ਰੱਖੋ: 12 ਅੰਕਾਂ ਦਾ UTR, ਬੈਂਕ ਸਟੇਟਮੈਂਟ, ਅਤੇ ਮਿਲਿਆ SMS ਜਾਂ ਰਸੀਦ।',
    bankDesk: 'ਆਪਣੇ ਬੈਂਕ ਦੇ 24x7 ਫਰਾਡ ਡੈਸਕ ਨੂੰ ਵੀ ਕਾਲ ਕਰੋ — ਲੀਨ ਬੈਂਕ ਲਗਾਉਂਦਾ ਹੈ।',
    neverShare: 'OTP, PIN ਜਾਂ CVV ਕਿਸੇ ਨਾਲ ਸਾਂਝਾ ਨਾ ਕਰੋ — ਬੈਂਕ ਜਾਂ ਪੁਲਿਸ ਕਹਿਣ ਵਾਲੇ ਨਾਲ ਵੀ ਨਹੀਂ।',
    next: 'ਫਿਰ ਇਹ ਫਾਰਮ ਜਮ੍ਹਾਂ ਕਰੋ। ਕਿਊ-ਨੇਤਰਾ ਸਬੂਤ ਦਾ ਹੈਸ਼ ਬਣਾ ਕੇ ਸਾਈਬਰ ਸੈੱਲ ਪੈਕੇਟ ਤਿਆਰ ਕਰਦਾ ਹੈ।',
    unknown: 'ਮੈਂ ਸਿਰਫ਼ ਸਾਈਬਰ ਧੋਖਾਧੜੀ ਦੀ ਰਿਪੋਰਟਿੰਗ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ — UTR, ਬੈਂਕ, ਫ੍ਰੀਜ਼ ਅਤੇ ਸ਼ਿਕਾਇਤ। ਕੇਸ ਦੀ ਸਥਿਤੀ ਲਈ 1930 ’ਤੇ ਕਾਲ ਕਰੋ।',
  },
  ta: {
    ask: 'முதலில் சொல்லுங்கள் — எந்த வங்கி அல்லது UPI செயலி பயன்படுத்தப்பட்டது, தோராயமாக எவ்வளவு பணம் போனது?',
    call1930: 'இப்போதே 1930-ஐ அழைக்கவும். கோல்டன் அவரில் புகார் செய்தால் வங்கி லீன் வாய்ப்பு அதிகம்.',
    prepare: 'மூன்று விஷயங்களை தயாராக வைத்திருங்கள்: 12 இலக்க UTR, வங்கி அறிக்கை, வந்த SMS அல்லது ரசீது.',
    bankDesk: 'உங்கள் வங்கியின் 24x7 மோசடி உதவி மையத்தையும் அழைக்கவும் — லீனை வங்கிதான் விதிக்கிறது.',
    neverShare: 'OTP, PIN அல்லது CVV யாருக்கும் சொல்லாதீர்கள் — வங்கி, சைபர் செல் அல்லது போலீஸ் என்பவர்களுக்கும் கூட.',
    next: 'பிறகு இந்த படிவத்தை சமர்ப்பிக்கவும். க்யூ-நேத்ரா ஆதாரத்தை ஹாஷ் செய்து சைபர் செல் கட்டத்தை உருவாக்கும்.',
    unknown: 'சைபர் மோசடி புகார் படிகளில் மட்டுமே நான் உதவ முடியும் — UTR, வங்கி, ஃப்ரீஸ், புகார். வழக்கு நிலைக்கு 1930-ஐ அழைக்கவும்.',
  },
  te: {
    ask: 'మొదట చెప్పండి — ఏ బ్యాంక్ లేదా UPI యాప్ వాడారు, సుమారు ఎంత డబ్బు పోయింది?',
    call1930: 'ఇప్పుడే 1930కి కాల్ చేయండి. గోల్డెన్ అవర్‌లో ఫిర్యాదు చేస్తే బ్యాంక్ లీన్ వచ్చే అవకాశం ఎక్కువ.',
    prepare: 'మూడు విషయాలు సిద్ధంగా ఉంచండి: 12 అంకెల UTR, బ్యాంక్ స్టేట్‌మెంట్, వచ్చిన SMS లేదా రసీదు.',
    bankDesk: 'మీ బ్యాంక్ 24x7 ఫ్రాడ్ డెస్క్‌కు కూడా కాల్ చేయండి — లీన్ బ్యాంకే వేస్తుంది.',
    neverShare: 'OTP, PIN లేదా CVV ఎవరికీ చెప్పవద్దు — బ్యాంక్, సైబర్ సెల్ లేదా పోలీసు అని చెప్పినా.',
    next: 'తర్వాత ఈ ఫారమ్ సమర్పించండి. క్యూ-నేత్రా ఆధారాలను హాష్ చేసి సైబర్ సెల్ ప్యాకెట్ తయారు చేస్తుంది.',
    unknown: 'సైబర్ మోసం ఫిర్యాదు దశల్లో మాత్రమే నేను సహాయం చేయగలను — UTR, బ్యాంక్, ఫ్రీజ్, ఫిర్యాదు. కేసు స్థితి కోసం 1930కి కాల్ చేయండి.',
  },
  bn: {
    ask: 'প্রথমে বলুন — কোন ব্যাংক বা UPI অ্যাপ ব্যবহার হয়েছিল, আর আনুমানিক কত টাকা গেছে?',
    call1930: 'এখনই 1930-এ কল করুন। গোল্ডেন আওয়ারে অভিযোগ করলে ব্যাংক লিয়েনের সম্ভাবনা সবচেয়ে বেশি।',
    prepare: 'তিনটি জিনিস তৈরি রাখুন: ১২ সংখ্যার UTR, ব্যাংক স্টেটমেন্ট, এবং পাওয়া SMS বা রসিদ।',
    bankDesk: 'আপনার ব্যাংকের 24x7 ফ্রড ডেস্কেও কল করুন — লিয়েন ব্যাংকই দেয়।',
    neverShare: 'OTP, PIN বা CVV কারও সঙ্গে শেয়ার করবেন না — ব্যাংক, সাইবার সেল বা পুলিশ বললেও না।',
    next: 'তারপর এই ফর্ম জমা দিন। কিউ-নেত্রা প্রমাণের হ্যাশ তৈরি করে সাইবার সেল প্যাকেট বানায়।',
    unknown: 'আমি শুধু সাইবার প্রতারণার অভিযোগের ধাপে সাহায্য করতে পারি — UTR, ব্যাংক, ফ্রিজ, অভিযোগ। কেসের অবস্থার জন্য 1930-এ কল করুন।',
  },
}

function langKey(language, message) {
  const code = String(language || '').toLowerCase().slice(0, 2)
  if (LOCAL[code]) return code
  if (/[\u0900-\u097F]/.test(String(message || ''))) return 'hi'
  if (/[\u0A00-\u0A7F]/.test(String(message || ''))) return 'pa'
  if (/[\u0B80-\u0BFF]/.test(String(message || ''))) return 'ta'
  if (/[\u0C00-\u0C7F]/.test(String(message || ''))) return 'te'
  if (/[\u0980-\u09FF]/.test(String(message || ''))) return 'bn'
  return 'en'
}

function buildFallback({ message, history = [], currentForm = {}, language }) {
  const msg = String(message || '').toLowerCase()
  const code = langKey(language, message)
  const L = LOCAL[code]
  const extracted = extract(message, currentForm)
  const bank = extracted.bank_name || currentForm.victim_bank
  const amount = extracted.amount_inr || currentForm.amount_inr
  const utr = extracted.utr || currentForm.utr
  const ncrp = extracted.ncrp_id || currentForm.ncrp_id

  const scared = /dar|darr|scared|panic|ghabra|bachao|help me|pareshan|डर|ਡਰ|பயம்|భయం|ভয়/.test(msg)
  const joke = /joke|hasao|hansao|funny|majak/.test(msg)
  const called = /1930|called|complaint|shikayat/.test(msg)
  const otp = /otp|pin\b|cvv|password|share karna/.test(msg)
  const golden = /golden hour|kitna time|how long|time limit|deadline|30 min|kitne minute/.test(msg)
  const recover = /recover|paisa wapas|money back|refund|milega|wapas milega/.test(msg)
  const docs = /document|statement|proof|kya chahiye|what do i need|kagaz/.test(msg)
  const police = /police|fir|thana|station|complaint file|report likhwa/.test(msg)
  const exchangeQ = /exchange|binance|wazirx|coindcx|wallet|usdt|crypto/.test(msg)
  const thanks = /thank|dhanyavad|shukriya|shukria|thanks/.test(msg)
  const formHelp = /form|fill|bharo|kaise bhare|bhar na/.test(msg)

  const said = []
  const say = line => { if (line && !said.includes(line)) said.push(line) }

  if (otp) {
    say(L.neverShare)
    say(L.call1930)
  } else if (joke) {
    say(code === 'hi'
      ? 'एक छोटा सा जोक: कंप्यूटर डॉक्टर के पास क्यों गया? क्योंकि उसे वायरस था! अब चलिए, आपका अकाउंट सुरक्षित करते हैं।'
      : code === 'en'
        ? 'A quick one: why did the computer go to the doctor? Because it had a virus! Now let us secure your account.'
        : L.call1930)
    say(L.call1930)
  } else if (scared) {
    say(code === 'hi'
      ? 'मैं समझ सकता हूँ — डरना स्वाभाविक है, और आप अकेले नहीं हैं।'
      : code === 'en'
        ? 'I hear you — feeling scared is completely normal, and you are not alone.'
        : L.call1930)
    say(L.call1930)
    say(L.prepare)
  } else if (golden) {
    say(code === 'hi'
      ? 'गोल्डन आवर लगभग तीस मिनट का होता है — इसी समय पैसा उसी बैंक या एक्सचेंज में रुका रहता है। देरी हो तो भी शिकायत करें: लंबा ट्रेल मिलने की संभावना बनी रहती है।'
      : code === 'en'
        ? 'The Golden Hour is roughly the first thirty minutes, when the money is still sitting in the receiving bank or exchange. Report even if it is later than that — the trail is simply harder to freeze.'
        : L.call1930)
    say(L.call1930)
    say(L.prepare)
  } else if (recover) {
    say(code === 'hi'
      ? 'ईमानदार जवाब: रिकवरी की संभावना इस बात पर है कि पैसा कहाँ रुका है। बैंक में रुका है तो लियन से रुक सकता है; एक्सचेंज पहुँच गया तो VASP नोटिस से; मिक्सर तक जाने के बाद वसूली बहुत कठिन है। इसलिए अभी कॉल करें।'
      : code === 'en'
        ? 'Honest answer: recovery depends on where the money stopped. Still inside a bank — a lien can hold it. Already at an exchange — a VASP notice can freeze that account. Already through a mixer — recovery is very hard. Which is exactly why the next ten minutes matter.'
        : L.call1930)
    say(L.bankDesk)
    say(L.next)
  } else if (docs) {
    say(L.prepare)
    say(L.next)
  } else if (police) {
    say(code === 'hi'
      ? 'आपको थाने में कानूनी भाषा में लिखवाने की जरूरत नहीं। यह फॉर्म भरने से शिकायत दर्ज होती है और साइबर सेल को पैकेट मिल जाता है; 1930 पर रिपोर्ट अलग से दर्ज होती है।'
      : code === 'en'
        ? 'You do not need to draft anything in legal language at the station. Submitting this form registers the complaint and generates the Cyber Cell packet; the 1930 report is registered separately and both can run in parallel.'
        : L.next)
    say(L.next)
  } else if (exchangeQ) {
    say(L.bankDesk)
    say(code === 'en'
      ? 'Exchanges act only on a written notice from law enforcement, and Q-Netra generates that notice with the wallet, the amount and the hash of the evidence attached.'
      : code === 'hi'
        ? 'एक्सचेंज केवल लिखित नोटिस पर कार्रवाई करता है — क्यू-नेत्रा वही नोटिस वॉलेट, राशि और साक्ष्य के हैश के साथ बना देता है।'
        : L.next)
  } else if (thanks) {
    say(code === 'hi'
      ? 'आपने सही कदम उठाया। 1930 पर कॉल कर लिया हो तो सबसे जरूरी काम हो गया — अब फॉर्म जमा करें।'
      : code === 'en'
        ? 'You did the right thing by acting now. If 1930 is done, the hardest part is over — submit the form and the packet is generated.'
        : L.next)
  } else if (formHelp) {
    say(L.next)
  } else if (called) {
    say(L.prepare)
    say(L.next)
  } else if (!bank && !amount) {
    say(L.ask)
  } else {
    const known = []
    if (bank) known.push(bank)
    if (amount) known.push(`₹${amount}`)
    if (utr && !String(utr).startsWith('UNKNOWN')) known.push(`UTR ${utr}`)
    if (ncrp) known.push(`NCRP ${ncrp}`)
    if (known.length) {
      say(code === 'hi' ? `मैंने नोट कर लिया: ${known.join(', ')}।` : `${known.join(' · ')}.`)
    }
    say(L.call1930)
    say(L.next)
  }

  if (!said.length) say(L.unknown)

  let reply = said.join(' ')
  const lastBot = [...history].reverse().find(h => h?.role === 'assistant')?.content
  if (lastBot && reply === lastBot) {
    reply = (code === 'hi' ? 'ठीक है, आगे बढ़ें। ' : 'Let us continue. ') + reply
  }

  const quick = code === 'hi'
    ? ['मुझे UTR नहीं पता', 'मेरे पास संदिग्ध की जानकारी नहीं', 'मैंने 1930 पर कॉल कर लिया', 'फॉर्म भरने में मदद करें', 'एक छोटा जोक सुनाएँ']
    : code === 'en'
      ? QUICK_REPLIES
      : [...QUICK_REPLIES.slice(0, 2), L.prepare]

  return {
    reply,
    extracted_fields: extracted,
    quick_replies: quick,
    emotion_state: scared ? 'calming' : otp ? 'urgent_action' : 'guiding',
    engine_mode: 'local-fallback',
  }
}

async function callGemini(apiKey, prompt) {
  if (modelState.dead && Date.now() - modelState.checkedAt < MODEL_TTL_MS) {
    return { ok: false, error: 'no usable model for this key (cached) — local engine answered' }
  }
  let lastError = ''
  for (const model of await modelCandidates(apiKey)) {
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
  modelState = { checkedAt: Date.now(), models: modelState.models, dead: true }
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
          // Deterministic extraction wins over the model: a hallucinated amount or
          // UTR can fill a blank field, but can never overwrite one we parsed.
          return NextResponse.json({
            reply,
            extracted_fields: { ...(p.extracted_fields || {}), ...extract(message, currentForm) },
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
