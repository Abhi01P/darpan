import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/sign-in')
  }

  return (
    <main className="w-full min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Basic header for the profile page to match layout, using Link back to home */}
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
            <Link href="/profile" className="text-white/80 hover:text-white transition-colors flex items-center gap-2" aria-label="Profile">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                <span className="text-white text-lg">👤</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <ProfileClient user={data.user} />
    </main>
  )
}
