'use client'

export function StyleSection() {
    return (
        <section className="w-full py-20 px-4 bg-background">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <p className="text-primary text-sm font-semibold mb-2">Style Yourself in a Click</p>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Create Perfect Outfits</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
                        Find mix and match outfits using our AI-powered virtual try-on styling features instantly
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl aspect-square flex items-center justify-center overflow-hidden p-8">
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-600 text-sm">Outfit 1 Image</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl aspect-square flex items-center justify-center overflow-hidden p-8">
                        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-600 text-sm">Outfit 2 Image</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
