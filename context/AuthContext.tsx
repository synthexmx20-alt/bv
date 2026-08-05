import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
    session: Session | null
    user: User | null
    loading: boolean
    isAdmin: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Timeout promise to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth timeout')), 5000)
                );

                const sessionPromise = supabase.auth.getSession();

                const { data: { session } } = await Promise.race([
                    sessionPromise,
                    timeoutPromise
                ]) as any;

                if (!mounted) return;

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Check admin but don't block loading state indefinitely
                    checkAdmin(session.user.id).catch(console.error)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                checkAdmin(session.user.id).catch(console.error)
            } else {
                setIsAdmin(false)
            }

            // Only set loading false if it was true? 
            // Actually usually we want to ensure it's false after any auth change processed
            setLoading(false)
        })

        return () => {
            mounted = false;
            subscription.unsubscribe()
        }
    }, [])

    // ... checkAdmin ...

    const checkAdmin = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                return
            }

            setIsAdmin(data?.role === 'admin')
        } catch (error) {
            console.error('Error checking admin status:', error)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setIsAdmin(false)
    }

    return (
        <AuthContext.Provider value={{ session, user, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
