import { createClient } from "@supabase/supabase-js";

// DrukConnect · Supabase connection (these values are safe to be public;
// access is controlled by database rules, not by this key)
const SUPABASE_URL = "https://nxnsdnayzimzfiwjrkvv.supabase.co";
const SUPABASE_KEY = "sb_publishable_iyy5fJ0ZsVu8xhb8ZgD4Hw_CqzqTTra";

export const supabase = SUPABASE_URL.startsWith("https://")
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
