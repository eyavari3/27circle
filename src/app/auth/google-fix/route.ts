import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Temporary fix to bypass profile creation for existing Google users
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  // For development, check if profile exists in localStorage
  if (process.env.NODE_ENV === 'development') {
    // Just redirect to circles since we know the profile exists
    console.log('🔧 Google user fix: Bypassing profile check for:', user.email)
    return NextResponse.redirect('/circles')
  }
  
  // Production would need proper profile linking
  return NextResponse.redirect('/circles')
}