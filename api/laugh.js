// "צחקתי": מוסיף צחוק אחד לבדיחה, דרך הפונקציה add_laugh בבסיס הנתונים.
import { getSupabase } from '../lib/supabase.js';
import { json, error, methodNotAllowed, readJson } from '../lib/http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAILED = 'אי אפשר לשמור צחוק כרגע. נסו שוב מאוחר יותר.';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return methodNotAllowed('POST');

    const body = await readJson(request);
    const id = typeof body?.id === 'string' ? body.id.trim() : null;
    if (!id || !UUID.test(id)) return error('הבדיחה לא מזוהה.', 400);

    const supabase = getSupabase();
    if (!supabase) return error(FAILED, 500);

    const { data, error: dbError } = await supabase.rpc('add_laugh', { joke_id: id });
    if (dbError) {
      console.error(`add_laugh failed: code=${dbError.code}, message=${dbError.message}`);
      return error(FAILED, 500);
    }
    if (data === null || data === undefined) return error('הבדיחה לא נמצאה.', 404);

    console.log(`laugh: id=${id}, laughs=${data}`);
    return json({ laughs: data });
  },
};
