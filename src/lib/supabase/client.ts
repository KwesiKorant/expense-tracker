import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase browser credentials missing in NEXT_PUBLIC_* env vars.");
      return null;
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}
