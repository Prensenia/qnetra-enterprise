// Spoken narration for the product. Each beat is one short paragraph so the
// voice guide stays under ~12 seconds per step and the caption always fits.

export const NARRATIONS = {
  dashboard: [
    {
      title: 'Officer Command Dashboard',
      text: 'This is where an Investigating Officer starts the day. Every open cyber-fraud case in one queue, already triaged, with the money trail attached.',
    },
    {
      title: 'The four numbers that matter',
      text: 'Three live cases, two point two seven crore rupees in traced fiat, two hundred fifty four thousand dollars of traced crypto, and four mule or exchange clusters. These are the numbers a cyber cell reports upward every morning.',
    },
    {
      title: 'Nothing here is typed by hand',
      text: 'A citizen submits a complaint, Q-Sahayak extracts the UTR, the amount and the bank, and the case appears here marked as a new submission before the officer has opened a single file.',
    },
    {
      title: 'Evidence that survives court',
      text: 'The chain-of-custody ledger below hash-chains every action on the case and re-verifies the client digest against the server digest on screen. That is what Section 63 of the Bharatiya Sakshya Adhiniyam asks for.',
    },
    {
      title: 'Where to act first',
      text: 'Exposure by risk tier tells the officer which case to freeze first. Critical cases at the top, rupees in scope underneath, so the golden hour goes to the case where the money is still recoverable.',
    },
  ],
  investigate: [
    {
      title: 'The investigation workbench',
      text: 'Three panes. Evidence and custody on the left, the money movement in the middle, the reasoning and the law on the right.',
    },
    {
      title: 'One trail, end to end',
      text: 'Four lakh seventy thousand rupees leave an SBI account by UPI, land on a WazirX deposit address, convert to five thousand two hundred USDT, then split across a bridge and a mixer. Five hops, twenty one minutes.',
    },
    {
      title: 'A score you can defend',
      text: 'Seventy out of one hundred, critical. Twenty points for mixer exposure, twenty for scam-cluster proximity, fifteen for crossing a bridge, fifteen for rapid fan-out. Every point points back to a transaction.',
    },
    {
      title: 'The hash is the handcuff',
      text: 'Upload the bank statement and its SHA-256 digest is computed in the browser, logged immutably, and shown against the ledger. If anyone edits the file later, the digest no longer matches.',
    },
    {
      title: 'Freeze only what is tainted',
      text: 'Proportional dilution answers the question courts actually ask: how much of this downstream balance is dirty? Sixty percent at the exchange decays to twelve percent after five hops, so the freeze order asks for twelve percent, not the whole account.',
    },
    {
      title: 'The dossier',
      text: 'One click produces the Section 63(4) certificate with the evidence table, the risk reasoning and the dilution maths. What used to take an officer four hours now takes under a second, and it carries the line that this is a lead, not a finding of guilt.',
    },
  ],
  helpdesk: [
    {
      title: 'Golden Hour helpdesk',
      text: 'You have lost money to a cyber scam. This screen exists for the next sixty minutes, because that is when the money can still be stopped.',
    },
    {
      title: 'The countdown is the whole product',
      text: 'The clock at the top is the golden hour. Reporting inside it gives the strongest chance of a bank lien hold, which is the difference between a recovery and a case file.',
    },
    {
      title: 'Three steps, no legal language',
      text: 'What happened, which bank and UTR, then review and submit. If you do not know a field, tap I do not know and the case still moves forward.',
    },
    {
      title: 'Q-Sahayak fills the form with you',
      text: 'Paste the debit SMS or just describe what happened. Q-Sahayak pulls out the UTR, the amount, the bank and the wallet, and answers in your language. You are never asked to type a hash or read a statute.',
    },
    {
      title: 'Two calls that matter right now',
      text: 'Call 1930, the national cyber helpline, and call your bank fraud desk. The emergency card below shows both numbers the moment you pick your bank.',
    },
  ],
  tools: [
    {
      title: 'Forensic tools',
      text: 'The same scoring, dilution and ingestion endpoints the case workspace uses, exposed for an analyst to test a hypothesis without opening a case.',
    },
    {
      title: 'Scoring is explainable by design',
      text: 'Four rules, fixed weights, one reason string per rule. Ask why a wallet scored seventy and the answer is on screen, not inside a model.',
    },
    {
      title: 'Dilution protects innocent money',
      text: 'The calculator shows the tainted proportion after each hop. That number is what a freeze notice may lawfully claim.',
    },
  ],
}

export const NARRATION_HI = {
  helpdesk: [
    {
      title: 'गोल्डन आवर हेल्पडेस्क',
      text: 'आपके साथ साइबर धोखाधड़ी हुई है। यह स्क्रीन अगले साठ मिनट के लिए है, क्योंकि इसी समय पैसा रोका जा सकता है।',
    },
    {
      title: 'उलटी गिनती ही असली उत्पाद है',
      text: 'ऊपर चल रही घड़ी गोल्डन आवर है। इसी समय शिकायत करने पर बैंक लियन लगने की संभावना सबसे अधिक होती है।',
    },
    {
      title: 'तीन कदम, कोई कानूनी भाषा नहीं',
      text: 'क्या हुआ, कौन सा बैंक और UTR, फिर समीक्षा करके जमा करें। कोई जानकारी न हो तो "मुझे नहीं पता" दबाएँ, केस फिर भी आगे बढ़ेगा।',
    },
    {
      title: 'क्यू-सहायक आपके साथ फॉर्म भरता है',
      text: 'डेबिट SMS पेस्ट करें या घटना बताएँ। क्यू-सहायक UTR, राशि, बैंक और वॉलेट निकाल लेता है और आपकी भाषा में जवाब देता है।',
    },
    {
      title: 'अभी दो कॉल ज़रूरी हैं',
      text: '1930 पर कॉल करें और अपने बैंक के फ्रॉड डेस्क को भी सूचित करें। बैंक चुनते ही दोनों नंबर नीचे दिख जाएंगे।',
    },
  ],
}

export function getNarration(screen, lang) {
  if (lang === 'hi' && NARRATION_HI[screen]) return NARRATION_HI[screen]
  return NARRATIONS[screen] || []
}

// Voice guides read these in order; the same text is what the team can rehearse
// from, so the product and the pitch never drift apart.
export const PRESENTER_SCRIPT = NARRATIONS
