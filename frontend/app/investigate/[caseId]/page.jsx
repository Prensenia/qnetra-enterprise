import { redirect } from 'next/navigation'
export default function LegacyInvestigate({ params }) { redirect(`/officer/investigate/${params.caseId}`) }
