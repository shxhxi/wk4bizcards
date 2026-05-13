import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';
    const origin = requestUrl.origin;
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (code) {
      const cookieStore = await cookies();

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
              cookieStore.delete({ name, ...options });
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  } catch (err) {
    console.error('Callback Crash:', err);
  }

  return NextResponse.redirect(new URL('/', request.url));
}