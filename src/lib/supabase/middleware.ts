import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: uniquement rafraîchir les tokens Supabase expirés.
 * La protection des routes est gérée dans les layouts Server Components
 * (dashboard/layout.tsx) qui lisent les cookies correctement.
 *
 * NE PAS faire de redirections ici — le middleware s'exécute avant que
 * les cookies posés par le client JS soient disponibles dans la request,
 * ce qui cause des boucles de redirection après signInWithPassword().
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          );
        },
      },
    }
  );

  // Rafraîchir le token si expiré — ne pas utiliser le résultat pour rediriger
  await supabase.auth.getUser();

  return supabaseResponse;
}
