'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Menu, X, User as UserIcon } from 'lucide-react'

export function Header() {
    const [user, setUser] = useState<User | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const supabase = createClient()
        
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return (
        <header className="w-full bg-black py-4 sticky top-0 z-50">
            <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight text-white z-50">Darpan</Link>

                <nav className="hidden md:flex items-center gap-12">
                    <Link href="/try-on" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        Try On
                    </Link>
                    <Link href="/ai-chat" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        AI Chat
                    </Link>
                    <Link href="/wardrobe" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        Wardrobe
                    </Link>
                </nav>

                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <Link href="/profile" className="text-white/80 hover:text-white transition-colors flex items-center gap-2" aria-label="Profile">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                                <UserIcon className="w-5 h-5" />
                            </div>
                        </Link>
                    ) : (
                        <Button asChild className='bg-gradient-to-br from-white/10 via-slate-950 to-white/5 px-6 py-4 rounded-xl text-sm font-semibold'>
                            <Link href="/sign-in">Sign in</Link>
                        </Button>
                    )}
                </div>

                <button 
                    className="md:hidden text-white z-50 p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Menu"
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {isMenuOpen && (
                <div className="fixed inset-0 bg-black/95 z-40 flex flex-col items-center justify-center gap-8 md:hidden">
                    <Link href="/try-on" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-white/80 hover:text-white transition-colors">
                        Try On
                    </Link>
                    <Link href="/ai-chat" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-white/80 hover:text-white transition-colors">
                        AI Chat
                    </Link>
                    <Link href="/wardrobe" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-white/80 hover:text-white transition-colors">
                        Wardrobe
                    </Link>
                    {user ? (
                        <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-xl font-medium text-white/80 hover:text-white transition-colors mt-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <span>Profile</span>
                        </Link>
                    ) : (
                        <Button asChild onClick={() => setIsMenuOpen(false)} className='mt-4 bg-gradient-to-br from-white/10 via-slate-950 to-white/5 px-8 py-6 rounded-xl text-lg font-semibold'>
                            <Link href="/sign-in">Sign in</Link>
                        </Button>
                    )}
                </div>
            )}
        </header>
    )
}
