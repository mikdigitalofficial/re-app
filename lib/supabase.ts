import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Export this (fix your error)
export const hasSupabaseConfig = !!supabaseUrl && !!supabaseKey;

// ✅ Still fail fast in production usage
if (!hasSupabaseConfig) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);
