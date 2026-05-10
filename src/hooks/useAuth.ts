// useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
    id: string
    email?: string
    [key: string]: any
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Vérifier l'utilisateur actuel
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user as User | null)
            setLoading(false)
        })

        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user as User | null || null)
            setLoading(false)
        })

        return () => subscription?.unsubscribe()
    }, [])

    return { user, loading }
}
