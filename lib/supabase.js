// לקוח Supabase אחד, לשימוש הפונקציות בתיקיית api בלבד.
// המקום היחיד שקורא את SUPABASE_URL ואת SUPABASE_SECRET_KEY.
import { createClient } from '@supabase/supabase-js';

let client = null;

// מחזיר את הלקוח, או null כשהמשתנים חסרים.
export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error(`Supabase is not configured: url=${url ? 'set' : 'missing'}, key=${key ? 'set' : 'missing'}`);
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
