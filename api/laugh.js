// "צחקתי": מוסיף צחוק אחד לבדיחה, דרך הפונקציה add_laugh בבסיס הנתונים.
import { getSupabase } from '../lib/supabase.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר לשלוח רק POST.' }, { status: 405 });
    }

    let id = null;
    try {
      const body = await request.json();
      if (typeof body?.id === 'string') id = body.id.trim();
    } catch {}

    if (!id || !UUID.test(id)) {
      return Response.json({ error: 'הבדיחה לא מזוהה.' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'אי אפשר לשמור צחוק כרגע. נסו שוב מאוחר יותר.' }, { status: 500 });
    }

    const { data, error } = await supabase.rpc('add_laugh', { joke_id: id });
    if (error) {
      console.error(`add_laugh failed: code=${error.code}, message=${error.message}`);
      return Response.json({ error: 'אי אפשר לשמור צחוק כרגע. נסו שוב מאוחר יותר.' }, { status: 500 });
    }
    if (data === null || data === undefined) {
      return Response.json({ error: 'הבדיחה לא נמצאה.' }, { status: 404 });
    }

    console.log(`laugh: id=${id}, laughs=${data}`);
    return Response.json({ laughs: data });
  },
};
