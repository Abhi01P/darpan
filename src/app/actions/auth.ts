'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(email: string, password: string, callbackUrl?: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, redirect: callbackUrl || '/' }
}

export async function registerAction(email: string, password: string, fullName: string, callbackUrl?: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: 'user'
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true, redirect: callbackUrl || '/' }
}

export async function loginWithGoogleAction(callbackUrl?: string) {
    const supabase = await createClient()

    // Need to get headers to build the absolute URL for the callback
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const origin = `${protocol}://${host}`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl || '/')}`,
        },
    })

    if (error) {
        console.error("Google login error:", error)
        return { error: "Could not initiate Google login" }
    }

    if (data.url) {
        return { url: data.url }
    }

    return { error: "No URL returned for Google login" }
}

export async function loginWithAzureAction(callbackUrl?: string) {
    const supabase = await createClient()

    // Need to get headers to build the absolute URL for the callback
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const origin = `${protocol}://${host}`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
            redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl || '/')}`,
            scopes: 'email profile offline_access',
        },
    })

    if (error) {
        console.error("Microsoft login error:", error)
        return { error: "Could not initiate Microsoft login" }
    }

    if (data.url) {
        return { url: data.url }
    }

    return { error: "No URL returned for Microsoft login" }
}
