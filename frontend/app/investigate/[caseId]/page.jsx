'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
export default function LegacyInvestigate() {
  const router = useRouter()
  const params = useParams()
  useEffect(() => { router.replace(`/officer/investigate/${params.caseId}`) }, [router, params.caseId])
  return null
}