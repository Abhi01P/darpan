'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
    {
        question: 'What is AI virtual try-on?',
        answer: 'AI virtual try-on uses advanced computer vision to virtually place clothing items on you, showing how they look before purchase.',
    },
    {
        question: 'How accurate is the virtual try-on?',
        answer: 'Our AI models are trained on millions of images to provide highly accurate visualization across different body types and poses.',
    },
    {
        question: 'Can I use this on mobile devices?',
        answer: 'Yes, our platform is fully responsive and works seamlessly on both mobile and desktop devices.',
    },
    {
        question: 'Do you store my data?',
        answer: 'We take privacy seriously. Your data is encrypted and processed securely according to GDPR standards.',
    },
    {
        question: 'Is there a subscription fee?',
        answer: 'We offer a free trial with unlimited try-ons. Premium plans with additional features start at $9.99/month.',
    },
    {
        question: 'Can I try on multiple items at once?',
        answer: 'Absolutely! Our multi-garment try-on lets you mix and match unlimited items to create complete outfits.',
    },
]

export function FAQ() {
    const [openIdx, setOpenIdx] = useState<number | null>(null)

    return (
        <section className="w-full py-20 px-4 bg-background">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Your AI Virtual Try-On Questions, Answered
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Everything you need to know about our platform
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <button
                            key={idx}
                            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                            className="w-full text-left p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 text-sm">{faq.question}</h3>
                                <ChevronDown
                                    className={`w-5 h-5 text-primary transition-transform ${openIdx === idx ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                            {openIdx === idx && (
                                <p className="text-gray-600 mt-4 text-sm">{faq.answer}</p>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}
