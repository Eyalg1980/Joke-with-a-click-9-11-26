// הצבעה: "אהבתי" (1), "לא אהבתי" (1-), או ביטול (0). רק למשתמש מחובר.
// המצביע הוא רק מי שחזר מ-getUser. user_id בגוף הבקשה לא נחשב.
import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, error, authRequired, methodNotAllowed, readJson } from '../lib/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAILED = 'אי אפשר לשמור את ההצבעה כרגע. נסו שוב.';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return methodNotAllowed('POST');
    if (!hasToken(request)) return authRequired();

    const body = await readJson(request);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const value = body?.value;
    if (!UUID.test(id)) return error('הבדיחה לא מזוהה.', 400);
    if (typeof value !== 'number' || ![1, -1, 0].includes(value)) {
      return error('ההצבעה לא תקינה.', 400);
    }

    const supabase = getSupabase();
    let user;
    try {
      user = await getUserFromRequest(request, supabase);
    } catch (err) {
      console.error(`vote identify failed: ${err?.message}`);
      return error(FAILED, 500);
    }
    if (!user) return authRequired();

    const { data, error: dbError } = await supabase.rpc('cast_vote', {
      voter: user.id,
      target: id,
      new_value: value,
    });
    if (dbError) {
      if (dbError.code === 'P0002') return error('הבדיחה לא נמצאה.', 404);
      if (dbError.code === '22023') return error('ההצבעה לא תקינה.', 400);
      console.error(`cast_vote failed: code=${dbError.code}, message=${dbError.message}`);
      return error(FAILED, 500);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      console.error('cast_vote returned no row');
      return error(FAILED, 500);
    }

    console.log(`vote: value=${value}`);
    return json({
      likes: Number(row.likes) || 0,
      dislikes: Number(row.dislikes) || 0,
      my_vote: row.my_vote === 1 || row.my_vote === -1 ? row.my_vote : 0,
    });
  },
};
