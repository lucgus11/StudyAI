import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * POST /api/auth/login
 * Effectue le login côté SERVEUR pour que les cookies de session
 * soient posés via Set-Cookie dans la response HTTP.
 * Cela garantit que le middleware et les Server Components
 * lisent une session valide immédiatement après la redirection.
 */
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  // Réponse qu'on va enrichir avec les cookies
  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Poser les cookies directement sur la response HTTP
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            } as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Identifiants invalides" },
      { status: 401 }
    );
  }

  return response;
}
