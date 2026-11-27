'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function LegacyVasp() { const router = useRouter(); useEffect(() => { router.replace('/officer/vasp-directory') }, [router]); return null }