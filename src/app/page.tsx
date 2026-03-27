import { Header } from '@/components/home/header'
import { Hero } from '@/components/home/hero'
import { StyleSection } from '@/components/home/style-sections'
import { Occasions } from '@/components/home/occasions'
import { VirtualTryOn } from '@/components/home/virtual-tryon'
import { Gallery } from '@/components/home/gallery'
import { UseCases } from '@/components/home/use-cases'
import { FAQ } from '@/components/home/faq'
import { Footer } from '@/components/home/footer'

export default function Home() {
  return (
    <main className="w-full bg-background text-foreground overflow-x-hidden">
      <Header />
      <Hero />
      <StyleSection />
      <Occasions />
      <VirtualTryOn />
      <Gallery />
      <UseCases />
      <FAQ />
      <Footer />
    </main>
  )
}