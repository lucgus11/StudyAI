import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  const cookies = request.cookies.getAll();
  const supabaseCookies = cookies.filter(c => c.name.includes("supabase") || c.name.includes("sb-"));
  
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
    allCookieCount: cookies.length,
  });
}
