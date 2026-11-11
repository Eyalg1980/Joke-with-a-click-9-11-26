# ARCHITECTURE: בדיחה בלחיצה

המסמך מתאר את המערכת אחרי Milestone 6. מה שהשתנה ב-Milestones 5 ו-6 מסומן בסוגריים.

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- (Milestone 5) auth.js בשורש: כל הכניסה בדפדפן, דרך הספרייה `@supabase/supabase-js` מ-jsDelivr, בגרסה קבועה. הספרייה משמשת רק לכניסה: הרשמה, כניסה, התנתקות ושמירת הטוקן. כתובת הפרויקט והמפתח הציבורי מגיעים מ-/api/config. flowType של pkce.
- (Milestone 5) כל קריאה ל-/api שולחת את טוקן הגישה בכותרת `Authorization: Bearer <token>`, אם יש. תשובת 401 עם `code: "auth_required"` כשנשלח טוקן: הדף מתנתק לבד, וכותב "צריך להתחבר שוב".
- (Milestone 6) שלוש לשוניות: ‏#joke, ‏#community, ‏#liked. רכיב הצבעה אחד, "אהבתי" ו"לא אהבתי", בכל מקום שיש בדיחה. "צחקתי" ו"הכי מצחיקות" מ-Milestone 4 יוצאים מהדף.
- רשימה נטענת כשנכנסים ללשונית, אחרי פעולה, ואחרי כניסה או יציאה. בלי polling.
- כל טקסט מהשרת או מהמשתמש מוצג עם textContent, אף פעם לא innerHTML.
- הדף לא קורא ולא כותב אף טבלה. בקשות ל-supabase.co רק לנתיב /auth/v1, ואף פעם לא ל-/rest/v1. בקוד הדף אין `sb_publishable_` ואין `sb_secret_`: המפתח הציבורי נטען בזמן ריצה מ-/api/config.
- רושם את sw.js כ-service worker.

### לוגיקה
- Vercel Functions, כל אחת עם `export default { async fetch(request) { ... } }`:
  - api/config.js (Milestone 5): GET בלבד. מחזירה `{ url, publishableKey }` מ-SUPABASE_URL ומ-SUPABASE_PUBLISHABLE_KEY. אם אחד חסר, או שהמפתח במשתנה הוא מפתח סודי: 500 עם `code: "auth_not_configured"`. אף פעם לא מחזירה מפתח סודי.
  - api/joke.js: מקבלת רק POST עם JSON: `{ "topic": "..." }`. חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא". אם יש טוקן, מזהה את המשתמש לפני הקריאה ל-OpenAI: טוקן ש-Supabase לא מכיר מחזיר 401 עם auth_required, בלי לפנות ל-OpenAI. Supabase לא זמין: הבדיחה בכל זאת מגיעה, בלי שמירה. בשמירה: user_id ו-author_name מהטוקן. אם השמירה נכשלת: הבדיחה חוזרת בלי id, והשגיאה ב-console.error.
  - api/feed.js (Milestone 6): GET עם mode של new, top או liked. new ו-top גם לאורח. liked רק עם טוקן, אחרת 401. קוראת ל-joke_feed דרך rpc. 20 שורות ל-new, 10 ל-top, 50 ל-liked. אף פעם לא מחזירה user_id.
  - api/vote.js (Milestone 6): POST עם טוקן בלבד. `{ id, value }`, ‏value הוא 1, 1- או 0 בדיוק, כמספר, ו-id הוא uuid. קוראת ל-cast_vote דרך rpc, עם voter מהטוקן. user_id בגוף לא נחשב. בדיחה שלא קיימת: 404.
  - api/delete-account.js (Milestone 5): POST עם טוקן בלבד. קודם מנקה את author_name בבדיחות של המשתמש, ואז `supabase.auth.admin.deleteUser`. הבדיחות נשארות, בלי שם ובלי בעלים. ההצבעות נמחקות ב-cascade.
  - (Milestone 6) api/laugh.js ו-api/top.js נמחקים. feed.js מחליפה את top.js.
- לקוח Supabase אחד, ב-lib/supabase.js, מחוץ לתיקיית api כדי שלא יקבל כתובת. רק הפונקציות בתיקיית api מייבאות אותו. (Milestone 5) נוספות בו שלוש פונקציות:
  - `hasToken(request)`.
  - `getUserFromRequest(request, supabase)`: קוראת את הטוקן מכותרת Authorization, ומזהה את המשתמש רק עם `supabase.auth.getUser(token)`. מחזירה את המשתמש או null, וזורקת שגיאה כש-Supabase לא זמין.
  - `displayName(user)`: מחזירה את `user_metadata.full_name`, עד 30 תווים.
- (Milestone 5) lib/http.js: עזרים קטנים. תשובת JSON עם `Cache-Control: no-store`, תשובת 401 עם `code: "auth_required"`, וקריאת גוף עם מגבלת גודל.
- מזהה משתמש או שם שמגיעים מהדף, לא נחשבים. המשתמש הוא רק מי ש-getUser החזיר.
- כל הפונקציות מחזירות תמיד JSON, עם `Cache-Control: no-store`, כי התשובות תלויות במי ששואל. שגיאה: `{ "error": "..." }` בעברית, והפרטים ב-console.error.

### נתונים
- Supabase, שתי טבלאות: `public.jokes`, ו-(Milestone 6) `public.votes`. רק הפונקציות בתיקיית api מדברות איתן, עם המפתח הסודי.
- המשתמשים ב-Supabase Auth, בטבלה `auth.users`. השם לתצוגה ב-`user_metadata.full_name`.
- נשמרות רק בדיחות AI. הודעת שגיאה לא נשמרת.

## 2. מבנה הנתונים

### הטבלה public.jokes
נוצרת ב-migration בשם `create_jokes` (db/create_jokes.sql). שתי העמודות האחרונות נוספות ב-migration בשם `add_joke_authors` (db/add_joke_authors.sql), ב-Milestone 5.

| העמודה | הסוג | הגדרה |
|---|---|---|
| id | uuid | מפתח ראשי, ברירת מחדל `gen_random_uuid()` |
| created_at | timestamptz | ברירת מחדל `now()` |
| topic | text | הנושא אחרי החיתוך. ריק: null |
| text | text | חובה. הבדיחה |
| laughs | integer | חובה, ברירת מחדל 0. מ-Milestone 6 האפליקציה לא משתמשת בה, והיא נשארת |
| user_id | uuid | לא חובה. `references auth.users (id) on delete set null`. אינדקס. אורח: null |
| author_name | text | לא חובה. check: null, או בין 1 ל-30 תווים אחרי btrim |

### הטבלה public.votes (Milestone 6)
נוצרת ב-migration בשם `create_votes` (db/create_votes.sql).

| העמודה | הסוג | הגדרה |
|---|---|---|
| user_id | uuid | חובה. `references auth.users (id) on delete cascade` |
| joke_id | uuid | חובה. `references public.jokes (id) on delete cascade`. אינדקס |
| value | smallint | חובה. check: 1- או 1 |
| voted_at | timestamptz | חובה, ברירת מחדל `now()` |

- המפתח הראשי: `(user_id, joke_id)`. זה מה שמבטיח קול אחד לכל משתמש לכל בדיחה.

### הנעילה, בכל טבלה
- RLS דולק, בלי אף policy.
- `revoke all` מ-anon ומ-authenticated.
- grant רק ל-service_role: על jokes ‏`select, insert, update`, בלי delete. על votes ‏`select, insert, update, delete`.

### הפונקציות בבסיס הנתונים
- `public.add_laugh(joke_id uuid) returns integer` (Milestone 4): עדכון אחד, `laughs = laughs + 1`. מ-Milestone 6 האפליקציה לא קוראת לה, והיא נשארת.
- `public.cast_vote(voter uuid, target uuid, new_value smallint)` (Milestone 6), ב-plpgsql. 1 או 1-: insert עם `on conflict (user_id, joke_id) do update` של value ו-voted_at. 0: מוחקת את ההצבעה. כל ערך אחר: שגיאה. מחזירה שורה אחת: likes, dislikes ו-my_vote של הבדיחה.
- `public.joke_feed(viewer uuid, mode text, max_rows integer default 20)` (Milestone 6), ב-sql, stable. מחזירה id, created_at, topic, text, author_name, likes, dislikes ו-my_vote. new: לפי created_at מהחדש. top: רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes, ואז לפי likes. liked: רק בדיחות ש-viewer סימן בהן 1, לפי voted_at. viewer הוא null לאורח. max_rows בין 1 ל-50.
- בכל הפונקציות: security invoker, ‏`set search_path = ''`, ושמות מלאים כמו `public.votes`. `revoke execute` מ-public, ‏anon ו-authenticated, ו-`grant execute` ל-service_role.
- כל SQL נשמר קודם כקובץ בתיקייה db, מוצג לי, ורץ דרך המחבר של Supabase רק אחרי אישור. אחרי ההרצה: get_advisors, הסבר בעברית, ועצירה.

### החוזה בין הדף לפונקציות, אחרי Milestone 6

| הפונקציה | בקשה | טוקן | תשובה |
|---|---|---|---|
| /api/config | GET | לא | `{ url, publishableKey }` |
| /api/joke | POST `{ topic }` | רשות | `{ joke, id, author_name }`. ‏author_name הוא null לאורח. השמירה נכשלה: בלי id |
| /api/feed?mode=new או top | GET | רשות | `{ jokes: [{ id, topic, text, author_name, likes, dislikes, my_vote, created_at }] }` |
| /api/feed?mode=liked | GET | חובה | כמו למעלה |
| /api/vote | POST `{ id, value }` | חובה | `{ likes, dislikes, my_vote }` |
| /api/delete-account | POST | חובה | `{ deleted: true }` |

- שגיאה: `{ error: "הודעה קצרה בעברית" }`. כשצריך להתחבר: 401 עם `{ error, code: "auth_required" }`. value לא תקין או id שאינו uuid: 400. בדיחה שלא קיימת: 404. מתודה לא נכונה: 405.
- כל התשובות עם `Cache-Control: no-store`.

## 3. התחברות והרשאות
רמה 3 לפי course-stack.md: משתמשים אמיתיים עם הרשמה עצמית, ב-Supabase Auth. (עד Milestone 4: רמה 0, בלי כניסה.)
- הרשמה וכניסה עם מייל וסיסמה (6 תווים לפחות), ושם לתצוגה עד 30 תווים ב-`user_metadata.full_name`. התנתקות ב-scope מקומי. מחיקת חשבון דרך api/delete-account, כי היא דורשת את המפתח הסודי.
- בדשבורד של Supabase: Allow new users to sign up דולק, ו-Confirm email כבוי. Site URL הוא הכתובת ב-Vercel. ב-Redirect URLs: אותה כתובת עם `/**`, ו-`http://localhost:3000/**` להרצה מקומית.
- בונוס: כניסה עם Google, דרך `signInWithOAuth` ב-Supabase Auth, עם pkce. אותו טוקן ואותן פונקציות, ובשרת לא משתנה כלום. ה-Client Secret של Google נשמר רק בדשבורד של Supabase.
- הטוקן עובר בכותרת Authorization. כל פונקציה שצריכה לדעת מי שואל מזהה את המשתמש רק עם `supabase.auth.getUser(token)`, ומסננת לפי המזהה שקיבלה מהאימות.
- אורח: מבקש בדיחות וקורא את הקהילה (new ו-top). הצבעה, "אהבתי" ומחיקת חשבון דורשים טוקן.
- הנעילה בבסיס הנתונים, לא בדף: לתפקידים anon ו-authenticated אין גישה לטבלאות ולפונקציות. המפתח הציבורי בדף לא פותח אף טבלה. רק service_role, דרך הפונקציות.
- Supabase עשוי להציע policy או grant ל-anon או ל-authenticated. לא מקבלים את ההצעה.

## 4. שכבת ה-AI
- הקריאה: POST אל `https://api.openai.com/v1/responses`, מתוך הפונקציה בלבד, עם הכותרת `Authorization: Bearer <OPENAI_API_KEY>`.
- הגוף: `model` מ-OPENAI_MODEL או `gpt-5`, ‏`instructions` עם הפרומפט המרכזי, `input` עם הנושא, ‏`reasoning: { effort: "low" }` ו-`max_output_tokens`.
- הפרומפט המרכזי: "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה."
- ה-input: "נושא הבדיחה: [הנושא]". בלי נושא: "אין נושא. ספר בדיחה כללית על החיים."
- התשובה: לוקחים את `output_text` אם קיים. אחרת, את הטקסט מהפריטים מסוג `message` במערך `output`, בחלקים מסוג `output_text`. אין טקסט: שגיאה.
- שגיאה מ-OpenAI: הסטטוס והקוד נרשמים ב-console.error, והדף מקבל הודעה קצרה בעברית לפי הקוד: 401, נגמר הקרדיט, מגבלת הוצאה, 429, 404.
- שם המשתמש ופרטיו לא נשלחים למודל. רק הנושא.
- לפני כתיבת הקוד בודקים בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה.

## 5. אינטגרציות, APIs ואוטומציות
- OpenAI Responses API, מ-api/joke.js בלבד.
- Supabase, דרך `@supabase/supabase-js`, מהפונקציות בתיקיית api בלבד, לנתונים.
- (Milestone 5) Supabase Auth מהדפדפן, דרך `@supabase/supabase-js` מ-jsDelivr, רק לנתיב /auth/v1.
- (בונוס) Google כספק כניסה ב-Supabase Auth, עם לקוח OAuth בפרויקט ב-Google Cloud.
- אין אוטומציות ואין שירותים נוספים. אין SMTP מותאם, כי Confirm email כבוי.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק api/joke.js קורא אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל. בלי המשתנה: gpt-5 |
| SUPABASE_URL | Vercel, Environment Variables, בכל הסביבות | Config | כתובת הפרויקט ב-Supabase. נקראת ב-lib/supabase.js וב-api/config.js |
| SUPABASE_SECRET_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק lib/supabase.js קורא אותו |
| SUPABASE_SECRET_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | הסטודנט מדביק אותו ביד |
| SUPABASE_PUBLISHABLE_KEY | Vercel, Environment Variables, בכל הסביבות | Config. חדש ב-Milestone 5 | המפתח הציבורי, רק לכניסה. רק api/config.js קורא אותו. אינו סוד. Claude יכול להביא את הערך דרך המחבר, עם get_publishable_keys |
| Client Secret של Google | רק בדשבורד של Supabase, בספק Google | בונוס | לא בקוד, לא בריפו ולא ב-Vercel |

- המפתחות הסודיים לא מופיעים בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- מפתח ה-production של OpenAI נשמר ב-Vercel כבר ב-Milestone 1. SUPABASE_URL ו-SUPABASE_SECRET_KEY ב-Milestone 4. SUPABASE_PUBLISHABLE_KEY ב-Milestone 5, לפני הדחיפה. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם שתי שורות בלבד: `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`. הוא לא משתנה ב-Milestones 5 ו-6: המפתח הציבורי אינו סוד, ולכן הוא לא בקובץ. ערכים שאינם סוד, שם המודל, כתובת Supabase והמפתח הציבורי, לא נכנסים ל-.env.local.
- הדפדפן מקבל רק את כתובת הפרויקט ואת המפתח הציבורי, מ-/api/config, בזמן ריצה, ורק בשביל הכניסה. אף פעם לא מפתח סודי.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html                 המסך, עם ה-CSS וה-JavaScript
auth.js                    (M5) כל הכניסה בדפדפן, דרך Supabase Auth
manifest.webmanifest       name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                      service worker, network-first, בלי /api
package.json               "type": "module", ו-dependencies רק עם @supabase/supabase-js
.gitignore                 .env, .env.*, !.env.example, .vercel, node_modules
.env.example               שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים ובלי הערות
.claude/settings.json      חוסם ל-Claude את הקריאה של .env ושל .env.*
assets/logo.svg
assets/mascot-idle.svg, mascot-think.svg, mascot-joke.svg, mascot-error.svg
assets/bg-dots.svg, bg-doodles.svg
assets/icon.svg, icon-maskable.svg
assets/icon-192.png, icon-512.png, icon-512-maskable.png
api/config.js              (M5) כתובת הפרויקט והמפתח הציבורי
api/joke.js                בדיחה מ-OpenAI, ושמירה בטבלה. המקום היחיד שקורא את OPENAI_API_KEY
api/feed.js                (M6) קהילה: new, top ו-liked
api/vote.js                (M6) הצבעה: rpc ל-cast_vote
api/delete-account.js      (M5) מחיקת חשבון
lib/supabase.js            לקוח Supabase אחד, ו-getUserFromRequest. המקום היחיד שקורא את SUPABASE_SECRET_KEY
lib/http.js                (M5) עזרים: JSON עם no-store, 401, קריאת גוף
db/create_jokes.sql        ה-SQL של create_jokes
db/add_joke_authors.sql    (M5) ה-SQL של add_joke_authors
db/create_votes.sql        (M6) ה-SQL של create_votes
spec/                      מסמכי האיפיון, ו-spec/plans
```
api/laugh.js ו-api/top.js מ-Milestone 4 נמחקים ב-Milestone 6.

ה-service worker:
- באירוע install שומר במטמון את /, את ה-manifest, את /auth.js (מ-Milestone 5), את קבצי ה-SVG מתיקיית assets ואת שני האייקונים.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api, בקשה שאינה GET, או בקשה לכתובת אחרת (כולל supabase.co ו-jsDelivr): לא נוגע בה.
- בכל שינוי בדף או בקבצים שנשמרים במטמון מעלים את הגרסה בשם המטמון (`joke-v1`, ‏`joke-v2` וכן הלאה), כדי שהמטמון הישן יימחק.

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript בתוך index.html. הכניסה בקובץ נפרד, auth.js, כדי שתהיה במקום אחד.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
- שתי טבלאות, jokes ו-votes, בתוך המגבלה של שלוש טבלאות בסטאק. המשתמשים ב-auth.users של Supabase, ואין טבלת פרופילים: השם ב-user_metadata.
- הקולות נספרים מטבלת votes, ולא במונה בעמודה. המפתח הראשי (user_id, joke_id) מונע הצבעה כפולה גם כשנשלחות כמה בקשות יחד.
- laughs ו-add_laugh מ-Milestone 4 נשארים בבסיס הנתונים. לא מוחקים נתונים. האפליקציה פשוט מפסיקה להשתמש בהם.
- רשימות מתעדכנות רק אחרי פעולה, מעבר לשונית, או כניסה ויציאה. בלי polling ובלי עדכון בזמן אמת, שאינו בסטאק.
- אין שחזור סיסמה ואין SMTP מותאם, כי Confirm email כבוי והמילסטונים לא דורשים מייל.
