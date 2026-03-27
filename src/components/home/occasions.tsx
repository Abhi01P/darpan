'use client'

const occasions = [
    { title: 'Office Essentials', desc: 'Professional wear for work' },
    { title: 'Weekend Vibes', desc: 'Casual and comfortable styles' },
    { title: 'Night Elegance', desc: 'Evening and formal occasions' },
    { title: 'Sportswear', desc: 'Active and athleisure looks' },
]

export function Occasions() {
    return (
        <section className="w-full py-20 px-4 bg-background">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect for Every Occasion</h2>
                    <p className="text-muted-foreground text-sm">
                        Find and style outfits for any situation with our AI-powered matching technology
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {occasions.map((occasion, idx) => (
                        <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition cursor-pointer"
                        >
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500 text-sm">Image</p>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 mb-1 text-sm">{occasion.title}</h3>
                                <p className="text-xs text-gray-600">{occasion.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
