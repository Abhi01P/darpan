'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/button'

export function Hero() {
    return (
        <section className="relative w-full px-1 md:px-2 bg-black pb-4">
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 min-h-[85vh] flex items-center justify-center pt-32 pb-24 group">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero_bg.png"
                        alt="Fashion Model"
                        fill
                        className="object-cover object-top opacity-80"
                        priority
                    />
                    {/* Gradient Overlays for textbook contrast */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                </div>

                <div className="relative z-10 container mx-auto px-6 flex flex-col items-center text-center">
                    {/* Badge Pill */}
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#3b82f6] uppercase">
                            Next Gen Fashion
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-semibold tracking-tighter text-white mb-6 leading-[1.05]">
                        Experience Fashion in a<br className="hidden md:block" />
                        <span className="md:mt-2 inline-block">New Dimension</span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-16 font-thin">
                        Try on collections instantly in 2D, 3D and AR. Compare prices, build your digital wardrobe for personalised recommendations.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                        <Button className="rounded-full px-8 py-6 bg-white/10 hover:bg-white/5 text-white font-semibold text-[16px] flex items-center justify-center group/btn shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
                            onClick={() => window.location.href = "/try-on"}>
                            Start Trying On
                            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                        </Button>
                        <Button className="rounded-full px-8 py-6 bg-white/10 hover:bg-white/5 text-white font-semibold text-[16px] flex items-center justify-center group/btn shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
                            onClick={() => window.location.href = "/ai-chat"}>
                            Chat with AI
                            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
