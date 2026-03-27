'use client'

export function VirtualTryOn() {
    return (
        <section className="w-full py-20 px-4 bg-background">
            <div className="container mx-auto max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">
                        <span className="text-primary">Multi Garment</span> <span className="text-foreground">Virtual Try-On</span>
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Combine clothes, mix items and styles instantly with our AI
                    </p>
                </div>

                <div className="bg-gray-100 rounded-2xl p-8 md:p-12 min-h-96 flex items-center justify-center">
                    <div className="text-center">
                        <div className="flex gap-8 justify-center mb-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-8 h-8 rounded border-2 border-blue-400 mx-auto mb-2"></div>
                                        <div className="w-8 h-8 rounded-full bg-blue-300 mx-auto"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-8 h-8 rounded border-2 border-purple-400 mx-auto mb-2"></div>
                                        <div className="w-8 h-8 rounded-full bg-purple-300 mx-auto"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="px-8 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-accent transition">
                            Combine Garments Now
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
