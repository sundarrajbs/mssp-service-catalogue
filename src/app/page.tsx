import { cookies } from "next/headers";

import { LandingPage } from "@/components/marketing/LandingPage";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function Home() {
  // Only ask Supabase who's signed in if there's a session cookie at all.
  const hasSession = (await cookies()).getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  const signedIn = hasSession && (await getCurrentUser()) !== null;
  return <LandingPage signedIn={signedIn} />;
}
