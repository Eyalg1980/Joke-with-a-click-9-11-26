// כל הכניסה בדפדפן, דרך Supabase Auth.
// הספרייה משמשת רק לכניסה: הרשמה, כניסה, התנתקות ושמירת הטוקן. היא מדברת רק עם /auth/v1.
// הדף לא קורא ולא כותב אף טבלה: לנתונים יש רק /api.
// כתובת הפרויקט והמפתח הציבורי מגיעים מ-/api/config, בזמן ריצה.
(function () {
  const MESSAGES = {
    invalid_credentials: 'המייל או הסיסמה לא נכונים.',
    user_already_exists: 'המייל הזה כבר רשום. אפשר להיכנס.',
    email_exists: 'המייל הזה כבר רשום. אפשר להיכנס.',
    weak_password: 'הסיסמה צריכה לפחות 6 תווים.',
    email_address_invalid: 'המייל לא נראה תקין.',
    validation_failed: 'המייל לא נראה תקין.',
    over_request_rate_limit: 'יותר מדי ניסיונות. חכו רגע ונסו שוב.',
    over_email_send_rate_limit: 'יותר מדי ניסיונות. חכו רגע ונסו שוב.',
    signup_disabled: 'ההרשמה סגורה כרגע.',
    email_not_confirmed: 'צריך לאשר את המייל לפני הכניסה.',
  };
  const GENERAL = 'הכניסה לא הצליחה. נסו שוב.';
  const OFFLINE = 'אין חיבור לשרת כרגע. נסו שוב.';
  const UNAVAILABLE = 'הכניסה לא זמינה כרגע.';
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const GOOGLE_OFF = 'הכניסה עם Google עוד לא מוגדרת.';
  const GOOGLE_CANCELLED = 'הכניסה עם Google בוטלה.';
  const GOOGLE_FAILED = 'הכניסה עם Google לא הצליחה. נסו שוב.';

  let client = null;
  let config = null;
  let readyPromise = null;
  let current = null; // ה-session הנוכחי
  const listeners = new Set();

  // חזרה מ-Google: קוראים את הכתובת לפני שהספרייה נוגעת בה,
  // כי כשההחלפה מצליחה היא מוחקת את code מהכתובת.
  const landing = (() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const pick = (k) => url.searchParams.get(k) || hash.get(k);
    return {
      code: url.searchParams.has('code'),
      error: pick('error'),
      errorDescription: pick('error_description'),
      errorCode: pick('error_code'),
    };
  })();
  let landingChecked = false;

  function message(error) {
    if (!error) return GENERAL;
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    if (error.name === 'AuthRetryableFetchError') return OFFLINE;
    if (error.name === 'AuthWeakPasswordError') return MESSAGES.weak_password;
    return GENERAL;
  }

  function emit() {
    for (const cb of listeners) {
      try { cb(current); } catch (err) { console.error('auth listener', err); }
    }
  }

  // טוען את ההגדרות פעם אחת ויוצר את הלקוח. נכשל: זורק שגיאה עם הודעה בעברית.
  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error(UNAVAILABLE);
      }
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url || !data.publishableKey) throw new Error('config');
        config = data;
      } catch (err) {
        console.error('auth config failed', err?.message);
        throw new Error(UNAVAILABLE);
      }
      client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      const { data } = await client.auth.getSession();
      current = data?.session ?? null;
      // בלי await ובלי קריאות ל-Supabase בתוך ה-callback, רק עדכון ושליחה הלאה
      client.auth.onAuthStateChange((_event, session) => {
        current = session ?? null;
        setTimeout(emit, 0);
      });
      emit();
      return client;
    })();
    readyPromise.catch(() => { readyPromise = null; });
    return readyPromise;
  }

  async function withClient(run) {
    try {
      await ready();
    } catch (err) {
      return { error: err.message || UNAVAILABLE };
    }
    try {
      return await run(client);
    } catch (err) {
      console.error('auth failed', err?.name, err?.message);
      return { error: OFFLINE };
    }
  }

  function signUp(name, email, password) {
    name = String(name || '').trim();
    email = String(email || '').trim();
    password = String(password || '');
    if (!name) return Promise.resolve({ error: 'איך לקרוא לך? כתבו שם.' });
    if (Array.from(name).length > 30) return Promise.resolve({ error: 'השם ארוך מדי. עד 30 תווים.' });
    if (!EMAIL.test(email)) return Promise.resolve({ error: MESSAGES.email_address_invalid });
    if (password.length < 6) return Promise.resolve({ error: MESSAGES.weak_password });

    return withClient(async (c) => {
      const { data, error } = await c.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: message(error) };
      // Confirm email כבוי, ולכן יש session מיד. אם אין: האימות דולק בדשבורד.
      if (!data?.session) return { error: MESSAGES.email_not_confirmed };
      return { ok: true };
    });
  }

  function signIn(email, password) {
    email = String(email || '').trim();
    password = String(password || '');
    if (!EMAIL.test(email)) return Promise.resolve({ error: MESSAGES.email_address_invalid });
    if (!password) return Promise.resolve({ error: 'כתבו סיסמה.' });

    return withClient(async (c) => {
      const { error } = await c.auth.signInWithPassword({ email, password });
      if (error) return { error: message(error) };
      return { ok: true };
    });
  }

  // התנתקות מהמכשיר הזה בלבד
  async function signOut() {
    if (!client) {
      current = null;
      emit();
      return { ok: true };
    }
    try {
      await client.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('signOut failed', err?.message);
    }
    current = null;
    emit();
    return { ok: true };
  }

  // כניסה עם Google. קודם בודקים ב-/auth/v1/settings (נתיב ציבורי) ש-Google דולק.
  // כבוי: הודעה בעברית, בלי לצאת מהדף. דולק: הספרייה מעבירה את הדף ל-Google.
  function google() {
    return withClient(async (c) => {
      let enabled = false;
      try {
        const res = await fetch(`${config.url}/auth/v1/settings`, {
          headers: { apikey: config.publishableKey },
          cache: 'no-store',
        });
        const settings = await res.json().catch(() => ({}));
        enabled = res.ok && settings?.external?.google === true;
      } catch (err) {
        console.error('auth settings failed', err?.message);
        return { error: OFFLINE };
      }
      if (!enabled) return { error: GOOGLE_OFF };

      const { error } = await c.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) {
        console.error('google sign-in failed', error.name, error.message);
        return { error: GOOGLE_FAILED };
      }
      return { ok: true, leaving: true };
    });
  }

  // אחרי ready(): האם חזרנו מ-Google עם בעיה? מחזירה הודעה בעברית או null, פעם אחת בלבד.
  // ביטול או שגיאה (?error=), או קוד שלא הוחלף בטוקן: הודעה, והכתובת מתנקה.
  function returnError() {
    if (landingChecked) return null;
    landingChecked = true;

    let msg = null;
    if (landing.error || landing.errorDescription || landing.errorCode) {
      console.error('google returned error', landing.error, landing.errorCode);
      msg = landing.error === 'access_denied' ? GOOGLE_CANCELLED : GOOGLE_FAILED;
    } else if (landing.code && !current) {
      msg = GOOGLE_FAILED;
    }

    // מנקים את הכתובת: בלי code, ‏error ושאר הפרמטרים של החזרה, ובלי # של שגיאה
    const url = new URL(window.location.href);
    const keys = ['code', 'error', 'error_description', 'error_code', 'sb_flow_id'];
    let dirty = false;
    for (const k of keys) {
      if (url.searchParams.has(k)) { url.searchParams.delete(k); dirty = true; }
    }
    const hash = new URLSearchParams(url.hash.slice(1));
    if (hash.has('error') || hash.has('error_description') || hash.has('access_token')) {
      url.hash = '';
      dirty = true;
    }
    if (dirty) window.history.replaceState(window.history.state, '', url.toString());
    return msg;
  }

  function session() {
    return current;
  }

  // הטוקן העדכני. הספרייה מרעננת אותו לבד כשצריך.
  async function token() {
    // הטעינה עוד באמצע: מחכים לה, כדי שבקשה מוקדמת לא תצא בטעות כאורח
    if (!client && readyPromise) await readyPromise.catch(() => null);
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      current = data?.session ?? null;
      return current?.access_token ?? null;
    } catch {
      return current?.access_token ?? null;
    }
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  window.jokeAuth = { ready, signUp, signIn, google, returnError, signOut, session, token, onChange };
})();
