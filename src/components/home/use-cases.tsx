'use client'

const useCases = [
    {
        title: 'AI Outfit What-If Try-On',
        desc: 'See how different items look on you instantly',
    },
    {
        title: 'AI Glasses Virtual Try-On',
        desc: 'Find the perfect frame for your face shape',
    },
    {
        title: 'Virtual Hair Color Try-On',
        desc: 'Preview new colors before committing',
    },
    {
        title: 'Style Virtual Try-On',
        desc: 'Explore trending looks that suit you',
    },
]

export function UseCases() {
    return (
        <section className="w-full py-20 px-4 bg-background">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Virtual Try-On for Clothes, Glasses, Hair Color & Jewelry
                    </h2>
                    <p className="text-muted-foreground mt-4 text-sm">
                        Try on glasses, hair colors & jewelry with our advanced AI technology
                    </p>
                </div>

                <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {useCases.map((useCase, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition">
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500 text-sm">Image</p>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-gray-900 mb-2 text-sm">{useCase.title}</h3>
                                <p className="text-xs text-gray-600 mb-4">{useCase.desc}</p>
                                <button className="w-full py-2 bg-primary text-white rounded text-xs font-medium hover:bg-accent transition">
                                    Try This Feature
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
