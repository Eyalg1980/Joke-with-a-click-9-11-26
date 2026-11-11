# בדיחה בלחיצה: Milestones 5 ו-6, משתמשים וקהילה

הקובץ הזה מוסיף לפרויקט שני Milestones. הוא נכנס ל-spec/MILESTONES.md, ומעדכן את ARCHITECTURE.md, ‏DESIGN.md, ‏PRD.md ו-CLAUDE.md.
כלל: בסוף כל Milestone ה-AI עוצר, וממתין לבדיקה ולאישור מפורש שלי לפני שהוא ממשיך.

## מה משתנה, במשפט
עד עכשיו כולם היו אורחים. מעכשיו אפשר להירשם: כל משתמש מקבל קול אחד לכל בדיחה (אהבתי או לא אהבתי), רשימה אישית של הבדיחות שאהב, ומקום בקהילה. אורח ממשיך לבקש בדיחות ולקרוא את הקהילה, אבל כדי לדרג צריך חשבון.

## עקרונות שלא משתנים
- הדף מדבר רק עם /api. הוא לא קורא ולא כותב אף טבלה.
- הספרייה של Supabase בדפדפן משמשת רק לכניסה: הרשמה, כניסה, התנתקות ושמירת הטוקן. כתובת הפרויקט והמפתח הציבורי מגיעים מ-/api/config.
- כל פונקציה שצריכה לדעת מי שואל מקבלת את הטוקן בכותרת Authorization, ושואלת את Supabase עם supabase.auth.getUser(token). מזהה משתמש או שם שמגיעים מהדף, לא נחשבים.
- כל טבלה נעולה: RLS דולק בלי policy, revoke all מ-anon ומ-authenticated, ו-grant רק ל-service_role. כל פונקציה בבסיס הנתונים: revoke execute מ-public, anon ו-authenticated, ו-grant ל-service_role.
- כל SQL נשמר קודם כקובץ בתיקייה db, מוצג לי, ורץ דרך המחבר של Supabase רק אחרי אישור.
- כל טקסט מהשרת או מהמשתמש מוצג עם textContent, אף פעם לא innerHTML.
- אין טעינה בטיימר (polling). רשימה נטענת כשנכנסים ללשונית, ואחרי פעולה.

## Milestone 5: האפליקציה מכירה אותך
- המטרה: הרשמה וכניסה עם מייל וסיסמה, שם לתצוגה, התנתקות ומחיקת חשבון. בדיחה של משתמש מחובר נשמרת עם השם שלו.
- רמת ההרשאות לפי course-stack.md: רמה 3, משתמשים אמיתיים עם הרשמה עצמית. כניסה עם Google היא בונוס, בסוף הקובץ, אחרי Milestone 6.
- לפני הקוד, ביד, בדשבורד של Supabase:
  - Authentication, ואז Sign In / Providers: מוודאים ש-Allow new users to sign up דולק, ומכבים את Confirm email.
  - Authentication, ואז URL Configuration: ב-Site URL הכתובת של האפליקציה ב-Vercel. ב-Redirect URLs אותה כתובת עם /** בסוף, ולמי שמריץ במחשב גם http://localhost:3000/**.
- בסיס הנתונים, migration בשם add_joke_authors, וקובץ db/add_joke_authors.sql:
  - בטבלה public.jokes שתי עמודות חדשות: user_id מסוג uuid, עם references auth.users (id) on delete set null, ו-author_name מסוג text. שתיהן לא חובה, כי אורח לא מחובר.
  - check: author_name ריק (null), או בין 1 ל-30 תווים אחרי btrim.
  - אינדקס על user_id.
  - הנעילה של הטבלה לא משתנה. לא מוחקים ולא משנים את העמודות הקיימות.
  - אחרי ההרצה: get_advisors, הסבר בעברית מה נמצא, ועצירה.
- מה מממשים:
  - api/config.js: GET בלבד. מחזירה { url, publishableKey } מ-SUPABASE_URL ומ-SUPABASE_PUBLISHABLE_KEY. אם אחד חסר, או שהמפתח במשתנה הוא מפתח סודי: 500, וקוד auth_not_configured. אף פעם לא מחזירה מפתח סודי.
  - lib/supabase.js: נשאר הלקוח היחיד עם המפתח הסודי. נוספות שלוש פונקציות: hasToken(request), getUserFromRequest(request, supabase) שמחזירה את המשתמש או null, וזורקת שגיאה כש-Supabase לא זמין, ו-displayName(user) שמחזירה את user_metadata.full_name, עד 30 תווים.
  - lib/http.js: עזרים קטנים. תשובת JSON עם Cache-Control: no-store, תשובת 401 עם code: "auth_required", וקריאת גוף עם מגבלת גודל.
  - api/joke.js: אם יש טוקן, מזהים את המשתמש לפני הקריאה ל-OpenAI. טוקן ש-Supabase לא מכיר: 401 עם auth_required, בלי לפנות ל-OpenAI. Supabase לא זמין: הבדיחה בכל זאת מגיעה, בלי שמירה. בשמירה: user_id ו-author_name מהטוקן. התשובה: { joke, id, author_name }, ו-author_name הוא null לאורח.
  - api/delete-account.js: POST עם טוקן בלבד. קודם מנקה את author_name בבדיחות של המשתמש, ואז supabase.auth.admin.deleteUser. הבדיחות נשארות, בלי שם ובלי בעלים.
  - auth.js בשורש: כל הכניסה בדפדפן. ready, signUp(name, email, password) עם full_name ב-user_metadata, signIn, signOut ב-scope מקומי, session, token, onChange, והודעות שגיאה בעברית. flowType של pkce, כדי שהבונוס של Google יעבוד.
  - index.html: הספרייה @supabase/supabase-js מ-jsDelivr, בגרסה קבועה, ואחריה auth.js.
  - כפתור חשבון בראש המסך: לאורח "כניסה". למחובר עיגול עם האות הראשונה, והשם.
  - חלון כניסה, תג dialog: שתי לשוניות, כניסה והרשמה. בהרשמה: "איך לקרוא לך?" עד 30 תווים, מייל וסיסמה של 6 תווים לפחות. הודעות בעברית.
  - חלון "החשבון שלי": השם, המייל, התנתקות, ומחיקת חשבון עם שאלת אישור.
  - כל קריאה ל-/api שולחת את הטוקן, אם יש. תשובת 401 עם auth_required כשנשלח טוקן: הדף מתנתק לבד, וכותב "צריך להתחבר שוב".
  - מתחת לבדיחה של משתמש מחובר: "נכתבה עכשיו בשבילך, " והשם שחזר מהשרת.
  - "צחקתי" ו"הכי מצחיקות" נשארים כמו ב-Milestone 4. הם מתחלפים ב-Milestone 6.
  - sw.js: גרסת מטמון חדשה, ו-/auth.js ברשימת הקבצים.
- ביד, אחרי שהקוד מוכן ולפני הדחיפה:
  - ב-Vercel, Environment Variables: SUPABASE_PUBLISHABLE_KEY מסוג Config, בכל הסביבות. את הערך Claude יכול להביא דרך המחבר, עם get_publishable_keys. הוא לא סוד.
  - SUPABASE_URL ו-SUPABASE_SECRET_KEY כבר שם מ-Milestone 4.
- התוצר המצופה: נרשמים, השם מופיע בראש המסך, ובדיחה חדשה נשמרת עם השם.
- תנאי השלמה (Definition of Done):
  1. אורח מקבל בדיחה כמו קודם, וב-Table Editor השורה שלה בלי user_id ובלי author_name.
  2. הרשמה עם שם, מייל וסיסמה: החלון נסגר, והשם מופיע בכפתור החשבון. ב-Authentication, ואז Users, המשתמש מופיע, וב-user_metadata יש full_name.
  3. בדיחה של משתמש מחובר: מתחתיה "נכתבה עכשיו בשבילך" עם השם, וב-Table Editor השורה עם user_id ו-author_name.
  4. סיסמה שגויה, מייל שכבר רשום, וסיסמה קצרה: שלוש הודעות ברורות בעברית.
  5. התנתקות, ורענון: נשארים אורח. כניסה, ורענון: נשארים מחוברים.
  6. משתמש בדיקה נוסף נמחק דרך "מחיקת החשבון": הוא נעלם מ-Users, והבדיחות שלו נשארות בלי שם.
  7. בלשונית Network: בקשות ל-supabase.co רק לנתיב /auth/v1. אין אף בקשה ל-/rest/v1. ב-Ctrl+U אין sb_publishable_ ואין sb_secret_.
  8. /api/config בדפדפן מחזיר את הכתובת ואת המפתח הציבורי בלבד.

## Milestone 6: הקהילה מדרגת
- המטרה: "אהבתי" ו"לא אהבתי" במקום "צחקתי", קול אחד לכל משתמש לכל בדיחה, לשונית קהילה, ולשונית אהבתי.
- בסיס הנתונים, migration בשם create_votes, וקובץ db/create_votes.sql:
  - טבלה public.votes: user_id מסוג uuid, חובה, references auth.users (id) on delete cascade. joke_id מסוג uuid, חובה, references public.jokes (id) on delete cascade. value מסוג smallint, חובה, עם check שהוא 1- או 1. voted_at מסוג timestamptz, חובה, ברירת מחדל now.
  - המפתח הראשי: (user_id, joke_id). זו השורה שמבטיחה קול אחד לכל משתמש לכל בדיחה.
  - אינדקס על joke_id.
  - הנעילה: RLS דולק בלי policy, revoke all מ-anon ומ-authenticated, ו-grant select, insert, update, delete ל-service_role.
  - פונקציה public.cast_vote(voter uuid, target uuid, new_value smallint), ב-plpgsql. 1 או 1-: insert עם on conflict (user_id, joke_id) do update של value ו-voted_at. 0: מוחקת את ההצבעה. כל ערך אחר: שגיאה. מחזירה שורה אחת: likes, dislikes ו-my_vote של הבדיחה.
  - פונקציה public.joke_feed(viewer uuid, mode text, max_rows integer default 20), ב-sql, stable. מחזירה id, created_at, topic, text, author_name, likes, dislikes ו-my_vote. שלושה מצבים: new לפי created_at מהחדש, top רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes, ואז לפי likes, ו-liked רק בדיחות ש-viewer סימן בהן 1, לפי voted_at. viewer הוא null לאורח. max_rows בין 1 ל-50.
  - בשתי הפונקציות: security invoker, ‏set search_path = '', ושמות מלאים כמו public.votes. revoke execute מ-public, anon ו-authenticated, ו-grant execute ל-service_role.
  - העמודה laughs והפונקציה add_laugh מ-Milestone 4 נשארות בבסיס הנתונים. לא מוחקים נתונים. האפליקציה פשוט מפסיקה להשתמש בהן.
  - אחרי ההרצה: get_advisors, הסבר בעברית, ועצירה. אני בודק שהטבלה נעולה.
- מה מממשים:
  - api/vote.js: POST עם טוקן בלבד. הגוף { id, value }, ו-value הוא 1, 1- או 0 בדיוק, כמספר. id חייב להיות uuid. קוראת ל-cast_vote דרך rpc, עם voter מהטוקן. user_id בגוף לא נחשב. בדיחה שלא קיימת: 404. מחזירה { likes, dislikes, my_vote }.
  - api/feed.js: GET עם mode של new, top או liked. new ו-top גם לאורח. liked רק עם טוקן, אחרת 401. קוראת ל-joke_feed דרך rpc. כמות השורות: 20 ל-new, 10 ל-top, 50 ל-liked. מחזירה { jokes }, ואף פעם לא user_id.
  - מוחקים את api/laugh.js ואת api/top.js. feed.js מחליפה את top.js.
  - רכיב הצבעה אחד, בכל מקום שיש בדיחה: שני כפתורים, "אהבתי" עם אגודל למעלה ו"לא אהבתי" עם אגודל למטה, וליד כל אחד המספר. ההצבעה שלי מסומנת ב-aria-pressed, בצבע ובאייקון מלא. לחיצה על אותו כפתור שוב מבטלת את ההצבעה. בזמן הבקשה שני הכפתורים נעולים.
  - אורח שלוחץ על הצבעה: נפתח חלון הכניסה עם ההסבר "כדי לדרג בדיחות צריך חשבון". אחרי הכניסה, ההצבעה שלו נשלחת לבד.
  - שלוש לשוניות בתחתית המסך: בדיחה, קהילה, אהבתי. כל לשונית היא כתובת עם # (‎#joke, ‎#community, ‎#liked), כדי שכפתור החזרה של הטלפון יעבוד.
  - קהילה: שני מיונים, "חדשות" ו"הכי מצחיקות". כל כרטיס: הבדיחה, הנושא, "של" והשם או "בדיחה אנונימית", ורכיב ההצבעה. ב"הכי מצחיקות" מספר דירוג על פינת הכרטיס.
  - אהבתי: לאורח מסך נעול עם הדמות, הסבר וכפתור כניסה. למחובר: הבדיחות שאהב. ביטול "אהבתי" מוציא את הבדיחה מהרשימה.
  - הלשונית "בדיחה" נשארת המסך מ-Milestones 1 עד 4, עם רכיב ההצבעה מתחת לבדיחה, וקישור לקהילה. "הכי מצחיקות" עובר ללשונית הקהילה.
  - כניסה או יציאה: הרשימה הפתוחה נטענת מחדש, כדי שההצבעות שלי יופיעו או ייעלמו.
  - sw.js: גרסת מטמון חדשה.
- ביד: אין משתנים חדשים ב-Vercel.
- התוצר המצופה: נועה אוהבת, דניאל לא אוהב, והמספרים זזים אצל שניהם. כל אחד רואה רק את מה שהוא אהב.
- תנאי השלמה (Definition of Done):
  1. אורח רואה את הקהילה ואת המספרים. לחיצה על "אהבתי" פותחת את חלון הכניסה, ואחרי הכניסה ההצבעה נשמרת.
  2. לחיצה על "אהבתי" מסמנת אותו ומעלה את המספר ב-1. לחיצה שנייה מבטלת. מעבר ל"לא אהבתי" מחליף.
  3. בשני חלונות, נועה ודניאל: נועה אוהבת, דניאל לא אוהב את אותה בדיחה. אחרי מעבר לשונית, שניהם רואים 1 ו-1, וכל אחד רואה את הסימון שלו בלבד.
  4. ב-Console, עם הטוקן של נועה: עשרים בקשות "אהבתי" לאותה בדיחה, וגם בקשה עם user_id של דניאל בגוף. ב-votes יש שורה אחת לנועה, ושום שורה חדשה לדניאל. value של 5: ‏400. בלי טוקן: ‏401.
  5. "הכי מצחיקות" ממוין לפי ההצבעות, עם מספר דירוג. "אהבתי" מראה רק את מה שהמשתמש המחובר אהב.
  6. בודק הנעילה מחזיר "נעול" על votes.
  7. מחיקת חשבון של משתמש שהצביע: ההצבעות שלו נמחקות, והמספרים יורדים.
  8. כפתור החזרה של הטלפון עובר בין הלשוניות.
  9. בלשונית Network: אין אף בקשה ל-/rest/v1.

## בונוס: כניסה עם Google
- המטרה: כפתור "המשך עם Google" בחלון הכניסה. אותו טוקן ואותן פונקציות. בשרת לא משתנה כלום.
- לפני הקוד, ביד:
  - ב-Supabase: Authentication, ואז Sign In / Providers, ואז Google. מעתיקים את Callback URL (for OAuth). עוד לא מדליקים.
  - ב-Google Cloud Console: פרויקט חדש. Google Auth Platform, ואז Get started: שם האפליקציה, מייל לתמיכה, Audience: External. אחר כך Clients, ואז Create client, מסוג Web application. ב-Authorized JavaScript origins: הכתובת של האפליקציה ב-Vercel, בלי / בסוף. ב-Authorized redirect URIs: ה-Callback URL מ-Supabase, בדיוק כמו שהוא. מעתיקים את Client ID ואת Client Secret.
  - חזרה ל-Supabase, לספק Google: Enable, ‏Client IDs, ‏Client Secret, ו-Save. הסוד נשאר רק שם: לא בקוד, לא בריפו ולא ב-Vercel.
  - הכתובת של האפליקציה, עם /** בסוף, כבר ב-Redirect URLs מ-Milestone 5.
- מה מממשים:
  - auth.js: פונקציה google() עם signInWithOAuth, ‏provider של google, ו-redirectTo לכתובת האתר עם / בסוף. לפני היציאה בודקים ב-/auth/v1/settings, שהיא ציבורית ועונה עם המפתח הציבורי, ש-Google דולק. כבוי: הודעה בעברית, בלי לצאת מהדף.
  - בחזרה: הספרייה מחליפה את ?code= בטוקן (pkce). ?error=, או קוד שלא הוחלף: הודעה בעברית בחלון הכניסה. הכתובת מתנקה בשני המקרים.
  - מה שהמשתמש עשה נשמר ב-sessionStorage לפני היציאה, ומשוחזר בחזרה: הלשונית, הבדיחה שעל המסך, וההצבעה שחיכתה לכניסה. ההצבעה נשלחת מיד אחרי החזרה.
  - השם מגיע מ-Google, ב-user_metadata.full_name, ולכן displayName לא משתנה.
  - בחלון הכניסה: כפתור לבן "המשך עם Google" מעל שתי הלשוניות, ומתחתיו קו מקווקו עם "או עם מייל וסיסמה". בלי הלוגו של Google.
- תנאי השלמה (Definition of Done):
  1. אורח לוחץ "אהבתי", בוחר Google, וחוזר מחובר: אותה בדיחה על המסך, וההצבעה כבר נספרה.
  2. ב-Users: משתמש חדש, ו-Provider של Google. כניסה שנייה עם Google: אותו משתמש, ולא חדש.
  3. ביטול במסך של Google: חוזרים, וחלון הכניסה אומר שהכניסה בוטלה. הכתובת בלי ?error=.
  4. Google כבוי ב-Supabase: לחיצה מציגה "עוד לא מוגדרת", ולא מסך שגיאה של Supabase.
  5. ה-Client Secret לא מופיע בשום קובץ ובשום משתנה ב-Vercel.

## עדכון ל-ARCHITECTURE.md
החוזה בין הדף לפונקציות, אחרי Milestone 6:

| הפונקציה | בקשה | טוקן | תשובה |
|---|---|---|---|
| /api/config | GET | לא | { url, publishableKey } |
| /api/joke | POST { topic } | רשות | { joke, id, author_name } |
| /api/feed?mode=new או top | GET | רשות | { jokes: [{ id, topic, text, author_name, likes, dislikes, my_vote, created_at }] } |
| /api/feed?mode=liked | GET | חובה | כמו למעלה |
| /api/vote | POST { id, value } | חובה | { likes, dislikes, my_vote } |
| /api/delete-account | POST | חובה | { deleted: true } |

- שגיאה: { error: "הודעה קצרה בעברית" }. כשצריך להתחבר: 401 עם { error, code: "auth_required" }.
- כל התשובות עם Cache-Control: no-store, כי הן תלויות במי ששואל.

המפתחות:

| השם | איפה | סוג |
|---|---|---|
| OPENAI_API_KEY | Vercel, Production ו-Preview | Secret |
| SUPABASE_URL | Vercel, כל הסביבות | Config |
| SUPABASE_SECRET_KEY | Vercel, Production ו-Preview | Secret |
| SUPABASE_PUBLISHABLE_KEY | Vercel, כל הסביבות | Config. חדש ב-Milestone 5 |
| Client Secret של Google | רק בדשבורד של Supabase, בספק Google | בונוס. לא בקוד ולא ב-Vercel |

.env.example לא משתנה: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY= בלבד. המפתח הציבורי אינו סוד, ולכן הוא לא בקובץ.

## עדכון ל-DESIGN.md
- כפתור החשבון: מדבקה לבנה עם מסגרת בצבע הדיו, בפינה העליונה בצד שמאל.
- חלונות: dialog שעולה מלמטה, פינות 26, מסגרת 3 וצל קשה 6. במחשב, באמצע המסך. Escape ולחיצה מחוץ לחלון סוגרים.
- כפתורי ההצבעה: גלולות עם מסגרת 2.5 וצל קשה 4 מתחת. "אהבתי" מסומן ברקע מנטה, ו"לא אהבתי" ברקע ורוד. הסימון גם באייקון מלא, לא רק בצבע.
- הלשוניות בתחתית: כרטיס לבן אחד, צף, עם שלוש לשוניות. הלשונית הפעילה ברקע הדיו ובטקסט לבן.
- כרטיסי הקהילה: כמו כרטיסי "הכי מצחיקות" מ-Milestone 4, מסובבים קצת לסירוגין. הבדיחה בכתב יד בגודל 19.
- בונוס Google: בחלון הכניסה, כפתור לבן "המשך עם Google" בגובה 54, עם מסגרת 3 וצל קשה 5, ומתחתיו קו מקווקו עם "או עם מייל וסיסמה".
- תמונת ייחוס: mockups-users.png.
