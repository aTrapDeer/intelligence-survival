import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/database';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=${error}`);
  }

  if (code && supabase) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=exchange_failed`);
      }

      // Successful authentication - redirect to main game
      return NextResponse.redirect(`${requestUrl.origin}/`);
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?error=unknown`);
    }
  }

  // No code received - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
} 