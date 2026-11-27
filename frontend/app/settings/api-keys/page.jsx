'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function LegacySettings() { const router = useRouter(); useEffect(() => { router.replace('/officer/settings/api-keys') }, [router]); return null }