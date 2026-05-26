import { type NextRequest, NextResponse } from "next/server";

// Middleware minimal - aucune vérification d'auth
// La protection des routes est gérée par DashboardAuthGuard (client component)
// qui utilise getSession() depuis le SDK Supabase JS (mémoire locale)
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
