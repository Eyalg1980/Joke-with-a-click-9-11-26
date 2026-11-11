// הרשימות: new (חדשות) ו-top (הכי מצחיקות) גם לאורח, liked (אהבתי) רק למחובר.
// הצופה הוא רק מי שחזר מ-getUser. אף פעם לא מחזירה user_id.
import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, error, authRequired, methodNotAllowed } from '../lib/http.js';

const ROWS = { new: 20, top: 10, liked: 50 };
const FAILED = 'אי אפשר לטעון את הרשימה כרגע.';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return methodNotAllowed('GET');

    const mode = new URL(request.url).searchParams.get('mode');
    if (!Object.hasOwn(ROWS, mode ?? '')) return error('הרשימה לא מוכרת.', 400);
    if (mode === 'liked' && !hasToken(request)) return authRequired();

    const supabase = getSupabase();
    if (!supabase) return error(FAILED, 500);

    // יש טוקן: מזהים. טוקן לא מוכר: 401, כדי שהדף יתנתק לבד.
    let user = null;
    if (hasToken(request)) {
      try {
        user = await getUserFromRequest(request, supabase);
      } catch (err) {
        console.error(`feed identify failed: ${err?.message}`);
        return error(FAILED, 500);
      }
      if (!user) return authRequired();
    }

    const { data, error: dbError } = await supabase.rpc('joke_feed', {
      viewer: user ? user.id : null,
      mode,
      max_rows: ROWS[mode],
    });
    if (dbError) {
      console.error(`joke_feed failed: code=${dbError.code}, message=${dbError.message}`);
      return error(FAILED, 500);
    }

    const jokes = (Array.isArray(data) ? data : []).map((j) => ({
      id: j.id,
      topic: j.topic ?? null,
      text: j.text,
      author_name: j.author_name ?? null,
      likes: Number(j.likes) || 0,
      dislikes: Number(j.dislikes) || 0,
      my_vote: j.my_vote === 1 || j.my_vote === -1 ? j.my_vote : 0,
      created_at: j.created_at,
    }));
    return json({ jokes });
  },
};
