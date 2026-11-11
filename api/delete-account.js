// מחיקת חשבון: רק המשתמש עצמו, לפי הטוקן.
// קודם מנקים את השם מהבדיחות שלו, ואז מוחקים את המשתמש. הבדיחות נשארות, בלי שם ובלי בעלים.
import { getSupabase, hasToken, getUserFromRequest } from '../lib/supabase.js';
import { json, error, authRequired, methodNotAllowed } from '../lib/http.js';

const FAILED = 'אי אפשר למחוק את החשבון כרגע. נסו שוב מאוחר יותר.';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return methodNotAllowed('POST');
    if (!hasToken(request)) return authRequired();

    const supabase = getSupabase();
    let user;
    try {
      user = await getUserFromRequest(request, supabase);
    } catch (err) {
      console.error(`delete-account identify failed: ${err?.message}`);
      return error(FAILED, 500);
    }
    if (!user) return authRequired();

    // שגיאה בניקוי השם: לא מוחקים את המשתמש, כדי שלא יישאר שם בלי בעלים
    const { error: clearError } = await supabase
      .from('jokes')
      .update({ author_name: null })
      .eq('user_id', user.id);
    if (clearError) {
      console.error(`clear author_name failed: code=${clearError.code}, message=${clearError.message}`);
      return error(FAILED, 500);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`deleteUser failed: status=${deleteError.status}, message=${deleteError.message}`);
      return error(FAILED, 500);
    }

    console.log('account deleted');
    return json({ deleted: true });
  },
};
