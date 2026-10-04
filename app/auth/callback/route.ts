import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Used by the password-reset flow to land on /reset-password instead of
  // / after the code exchange below (see resetPasswordForEmail's
  // redirectTo in app/forgot-password/page.tsx). Restricted to an
  // in-app path — never an absolute/protocol-relative URL — so a crafted
  // ?next= can't turn this into an open redirect.
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
