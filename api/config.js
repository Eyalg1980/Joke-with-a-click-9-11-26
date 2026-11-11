// הכתובת של Supabase והמפתח הציבורי, רק בשביל הכניסה בדפדפן.
// אף פעם לא מחזירה מפתח סודי.
import { json, error, methodNotAllowed } from '../lib/http.js';

// מפתח סודי: החדש מתחיל ב-sb_secret_. הישן הוא JWT עם role של service_role.
function isSecretKey(key) {
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload?.role !== 'anon';
  } catch {
    return true;
  }
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return methodNotAllowed('GET');

    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    const looksSecret = typeof publishableKey === 'string' && isSecretKey(publishableKey.trim());

    if (!url || !publishableKey || looksSecret) {
      console.error(
        `auth config: url=${url ? 'set' : 'missing'}, publishable=${publishableKey ? (looksSecret ? 'SECRET KEY - refused' : 'set') : 'missing'}`,
      );
      return error('הכניסה עוד לא מוגדרת.', 500, 'auth_not_configured');
    }

    return json({ url: url.trim(), publishableKey: publishableKey.trim() });
  },
};
