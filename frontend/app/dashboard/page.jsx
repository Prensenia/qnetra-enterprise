'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function LegacyDashboard() { const router = useRouter(); useEffect(() => { router.replace('/officer/dashboard') }, [router]); return null }