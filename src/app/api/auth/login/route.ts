import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // Collecter les cookies à poser APRÈS le login
    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            // Stocker les cookies pour les appliquer sur la réponse finale
            cookies.forEach((c) => cookiesToSet.push(c as typeof cookiesToSet[0]));
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Construire la réponse finale APRÈS avoir récupéré les cookies
    const response = NextResponse.json({ success: true });

    // Poser tous les cookies de session sur la réponse
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        ...(options ?? {}),
      } as Parameters<typeof response.cookies.set>[2]);
    });

    return response;

  } catch (err: unknown) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
