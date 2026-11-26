export const BANK_HELPLINES = {
  SBI: { name: 'State Bank of India', numbers: ['1800-11-1109', '1800-1234', '1800-11-2211'] },
  HDFC: { name: 'HDFC Bank', numbers: ['1800-1600', '1800-2600'] },
  ICICI: { name: 'ICICI Bank', numbers: ['1800-2662', '1800-1080'] },
  AXIS: { name: 'Axis Bank', numbers: ['1800-419-5577', '1860-419-5555'] },
  PNB: { name: 'Punjab National Bank', numbers: ['1800-180-2222', '1800-180-2345'] },
  KOTAK: { name: 'Kotak Mahindra Bank', numbers: ['1800-209-0000', '1860-266-2666'] },
  BOB: { name: 'Bank of Baroda', numbers: ['1800-258-4455', '1800-102-4455'] },
  CANARA: { name: 'Canara Bank', numbers: ['1800-103-0018', '1800-425-0018'] },
  UNION: { name: 'Union Bank of India', numbers: ['1800-22-2244', '1800-208-2244'] },
  INDUSIND: { name: 'IndusInd Bank', numbers: ['1860-267-7777', '022-44066666'] },
  YES: { name: 'Yes Bank', numbers: ['1800-1200', '1800-103-5485'] },
  IDFC: { name: 'IDFC First Bank', numbers: ['1800-419-4332', '1860-258-2000'] },
  PAYTM: { name: 'Paytm Payments Bank', numbers: ['0120-4456456'] },
  AIRTEL: { name: 'Airtel Payments Bank', numbers: ['88006-88006'] },
  INDIAPOST: { name: 'India Post Payments Bank', numbers: ['155299'] },
}

export function lookupBank(name) {
  if (!name) return null
  const key = name.toUpperCase().replace(/\s/g, '')
  for (const k in BANK_HELPLINES) {
    if (key.includes(k) || BANK_HELPLINES[k].name.toUpperCase().replace(/\s/g,'').includes(key)) return BANK_HELPLINES[k]
  }
  return null
}
