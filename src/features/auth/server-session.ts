import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type AuthenticatedClaims = {
  email: string | null;
  userId: string;
};

export const getAuthenticatedClaims = cache(async (): Promise<AuthenticatedClaims | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) return null;

  return {
    email: typeof claims.email === "string" ? claims.email : null,
    userId: claims.sub,
  };
});
