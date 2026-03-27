'use client'

import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Footer() {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDark])

    return (
        <footer className="w-full border-t border-muted bg-background">
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h4 className="font-bold mb-4 text-sm text-foreground">Products</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Security</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm text-foreground">Company</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">About</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Careers</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-sm text-foreground">Legal</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Cookies</a></li>
                        </ul>
                    </div>
                    <div className="flex items-center justify-end">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-full bg-white hover:bg-gray-100 transition"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5 text-gray-800" />
                            ) : (
                                <Moon className="w-5 h-5 text-gray-800" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="border-t border-muted pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
                    <p>&copy; 2024 StyleFlow. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-foreground transition">Twitter</a>
                        <a href="#" className="hover:text-foreground transition">LinkedIn</a>
                        <a href="#" className="hover:text-foreground transition">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
