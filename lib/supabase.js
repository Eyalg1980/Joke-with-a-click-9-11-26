// לקוח Supabase אחד, לשימוש הפונקציות בתיקיית api בלבד.
// המקום היחיד שקורא את SUPABASE_SECRET_KEY.
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

// הטוקן מהכותרת Authorization: Bearer <token>, או null.
function readToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export function hasToken(request) {
  return readToken(request) !== null;
}

// מזהה את המשתמש רק עם supabase.auth.getUser(token). מזהה או שם מהדף לא נחשבים.
// אין טוקן, או טוקן ש-Supabase לא מכיר: null. Supabase לא זמין: זורקת שגיאה.
export async function getUserFromRequest(request, supabase) {
  const token = readToken(request);
  if (!token) return null;
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    const status = Number(error.status) || 0;
    if (error.name === 'AuthApiError' && status >= 400 && status < 500) return null;
    throw new Error(`getUser failed: ${error.name}, status=${status}`);
  }
  return data?.user ?? null;
}

// השם לתצוגה מ-user_metadata.full_name, עד 30 תווים. ריק: null.
export function displayName(user) {
  const name = user?.user_metadata?.full_name;
  if (typeof name !== 'string') return null;
  const trimmed = Array.from(name.trim()).slice(0, 30).join('').trim();
  return trimmed || null;
}
