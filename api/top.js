// "הכי מצחיקות": חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות.
import { getSupabase } from '../lib/supabase.js';

const ERROR = 'אי אפשר לטעון את הרשימה כרגע.';

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return Response.json({ error: 'אפשר לשלוח רק GET.' }, { status: 405 });
    }

    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: ERROR }, { status: 500 });

    const { data, error } = await supabase
      .from('jokes')
      .select('id, text, laughs')
      .gt('laughs', 0)
      .order('laughs', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error(`top failed: code=${error.code}, message=${error.message}`);
      return Response.json({ error: ERROR }, { status: 500 });
    }

    return Response.json(
      { jokes: data ?? [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  },
};
