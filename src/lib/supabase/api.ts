import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

/**
 * Crée un client Supabase authentifié depuis le token Bearer
 * présent dans le header Authorization de la requête API.
 * Utilisé dans tous les Route Handlers car la session est
 * gérée côté client (SDK JS) et non via les cookies HTTP.
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, supabase: null, error: "Token manquant" };
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  // Client Supabase avec le token JWT directement
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, supabase: null, error: "Token invalide" };
  }
  
  return { user, supabase, error: null };
}
