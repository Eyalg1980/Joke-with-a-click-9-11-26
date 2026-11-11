// "הכי מצחיקות": חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות.
import { getSupabase } from '../lib/supabase.js';
import { json, error, methodNotAllowed } from '../lib/http.js';

const FAILED = 'אי אפשר לטעון את הרשימה כרגע.';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return methodNotAllowed('GET');

    const supabase = getSupabase();
    if (!supabase) return error(FAILED, 500);

    const { data, error: dbError } = await supabase
      .from('jokes')
      .select('id, text, laughs')
      .gt('laughs', 0)
      .order('laughs', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (dbError) {
      console.error(`top failed: code=${dbError.code}, message=${dbError.message}`);
      return error(FAILED, 500);
    }

    return json({ jokes: data ?? [] });
  },
};
