import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: any[]) {
                    cookiesToSet.forEach(({ name, value, options }: any) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log('Cookies disponibles:', request.cookies.getAll());
    console.log('User in middleware:', user);

    // ⭐ TEMPORAIRE : On désactive la protection
    // const protectedRoutes = ['/items', '/items/add', '/dashboard'];
    // const isProtectedRoute = protectedRoutes.some((route) =>
    //     request.nextUrl.pathname.startsWith(route)
    // );

    // if (!user && isProtectedRoute) {
    //     console.log('Redirecting to login - no user');
    //     return NextResponse.redirect(new URL('/auth/login', request.url));
    // }

    if (user && request.nextUrl.pathname.startsWith('/auth/login')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
