import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "recovery", "invite", "email_change"];

/**
 * Where links in auth emails land. Supports both link styles:
 * - `?token_hash=…&type=…` (recommended email templates; works on any device)
 * - `?code=…` (Supabase's default PKCE links; must be opened in the same browser)
 * The session is stored in HTTP-only cookies, then the user is sent on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createSupabaseServerClient();
  let ok = false;
  if (supabase && tokenHash && type && OTP_TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (supabase && code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }

  const destination = ok ? (type === "recovery" ? "/reset-password" : next) : "/sign-in?error=link";
  return NextResponse.redirect(new URL(destination, origin));
}
