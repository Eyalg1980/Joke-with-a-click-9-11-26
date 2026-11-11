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

  let client = null;
  let readyPromise = null;
  let current = null; // ה-session הנוכחי
  const listeners = new Set();

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
      let config;
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        config = await res.json().catch(() => ({}));
        if (!res.ok || !config.url || !config.publishableKey) throw new Error('config');
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

  window.jokeAuth = { ready, signUp, signIn, signOut, session, token, onChange };
})();
