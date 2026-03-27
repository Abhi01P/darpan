'use client'

import Link from 'next/link'
import { Button } from '../ui/button'

export function Header() {
    return (
        <header className="w-full bg-black py-4">
            <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
                <span className="text-xl md:text-2xl font-bold tracking-tight text-white">Darpan</span>

                <nav className="hidden md:flex items-center gap-12">
                    <Link href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        Try On
                    </Link>
                    <Link href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        AI Chat
                    </Link>
                    <Link href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                        Compare
                    </Link>
                </nav>

                <Button asChild className='bg-gradient-to-br from-white/10 via-slate-950 to-white/5 px-6 py-4 rounded-xl text-sm font-semibold'>
                    <Link href="/sign-in">Sign in</Link>
                </Button>
            </div>
        </header>
    )
}
