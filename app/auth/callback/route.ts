import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../lib/database.types';

function getRedirectOrigin(request: NextRequest) {
  const devOrigin = process.env.NEXT_PUBLIC_DEV_REDIRECT_ORIGIN?.trim();
  if (devOrigin) {
    return devOrigin.replace(/\/$/, '');
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

  if (forwardedHost) {
    const cleanHost = forwardedHost.split(',')[0].trim().replace(/:3000$/, '');
    return `${forwardedProto}://${cleanHost}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') ?? '/';

  const safeNext =
    next.startsWith('/') && !next.startsWith('//') ? next : '/';

  const redirectOrigin = getRedirectOrigin(request);
  const redirectUrl = `${redirectOrigin}${safeNext}`;

  let response = NextResponse.redirect(redirectUrl);

  if (!code) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.redirect(redirectUrl);

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Callback exchange error:', error);
    return NextResponse.redirect(`${redirectOrigin}/`);
  }

  return response;
}