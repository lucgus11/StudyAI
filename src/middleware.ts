import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, icons, manifest, service worker
     * - static files (.svg, .png, etc.)
     * - /auth/confirm (Supabase email callback — handled by route handler directly)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-.*.js|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
