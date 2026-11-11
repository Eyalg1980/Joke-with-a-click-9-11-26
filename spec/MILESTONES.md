# MILESTONES: בדיחה בלחיצה
כלל: בסוף כל Milestone ה-AI עוצר, וממתין לבדיקה ולאישור מפורש שלי לפני שהוא ממשיך.

שישה Milestones ובונוס. שלושת הראשונים כשעתיים בסך הכל. את המפתחות של OpenAI אף פעם לא נותנים ל-Claude: מפתח ה-production עובר ישר מ-OpenAI ל-Vercel, ומפתח ה-dev מודבק ביד ב-.env.local.

איפה מריצים: הבחירה שלי. אפשר לבדוק כל Milestone בכתובת של Vercel אחרי push, ואפשר גם להריץ במחשב עם vercel dev. הקוד זהה בשני המקרים.

## Milestone 1: Walking Skeleton
- המטרה: הדף והפונקציה באוויר ב-Vercel, באותה כתובת, ומדברים זה עם זה. המפתח כבר שמור ב-Vercel, אבל עוד בלי AI.
- מה מממשים:
  - index.html עם המסך הראשי לפי DESIGN.md: לוגו, הסבר, תווית, תיבה, כפתור, בועה עם הדמות, ושורת תחתית. הלוגו, ארבעת הציורים של הדמות והרקע מגיעים מתיקיית assets.
  - api/joke.js עם `export default` שבתוכו `fetch(request)`. מקבלת POST עם `{ "topic": "..." }` ומחזירה `{ "joke": "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא" }`, או "המפתח: חסר" כש-`process.env.OPENAI_API_KEY` ריק. רק כן או לא, אף פעם לא המפתח עצמו.
  - הכפתור שולח POST ל-/api/joke ומציג את `joke` בבועה, עם textContent.
  - package.json עם `"type": "module"`, בלי dependencies.
  - בדיקה ש-.gitignore, ‏.env.example ו-.claude/settings.json קיימים מההקמה. חסר אחד מהם? יוצרים אותו לפני כל commit.
  - push ל-main, ואז ב-Vercel: New Project, ‏Import לריפו, ‏Framework Preset: Other, ‏Deploy.
- ביד, אחרי הפריסה הראשונה:
  - ב-OpenAI, ב-API keys: יוצרים מפתח production בשם `joke-in-a-click`.
  - ב-Vercel, ב-Environment Variables: השם `OPENAI_API_KEY`, הסוג Secret, בסביבות Production ו-Preview. ואז Redeploy.
- הרצה מקומית, רשות:
  - ב-OpenAI: מפתח נוסף, מפתח dev, בשם `joke-in-a-click-dev`.
  - מעתיקים את .env.example ל-.env.local, ומדביקים את מפתח ה-dev אחרי הסימן =. ביד, לא דרך Claude. הקובץ מכיל רק את השורה OPENAI_API_KEY=, בלי הערות ובלי משתנים נוספים.
  - מתקינים את ה-CLI של Vercel: `npm i -g vercel`, ואז `vercel login` ו-`vercel link`.
  - `vercel dev` מריץ את האתר ואת הפונקציה בכתובת http://localhost:3000.
- התוצר המצופה: כתובת בסגנון my-joke-app.vercel.app. כותבים נושא, לוחצים, ומקבלים "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא".
- תנאי השלמה (Definition of Done):
  1. הכתובת נפתחת בטלפון, בעברית, מימין לשמאל, ובעיצוב של DESIGN.md.
  2. לחיצה מציגה "בדיחה זמנית מהשרת" עם הנושא, ו"המפתח: נמצא".
  3. בלשונית Network: בקשת POST אחת ל-/api/joke, באותה כתובת של האתר.
  4. ב-Logs של Vercel יש שורה לכל לחיצה.
  5. אין בקוד כותרות CORS, ואין טיפול ב-OPTIONS.
  6. בריפו ב-GitHub אין .env ואין .env.local. יש .env.example עם השורה OPENAI_API_KEY= בלבד, ויש .claude/settings.json.
  7. מי שמריץ מקומית: אותה תוצאה בכתובת http://localhost:3000.

## Milestone 2: בדיחה מ-GPT-5
- המטרה: הבדיחה מגיעה מ-GPT-5 דרך הפונקציה, והמפתח נשאר בשרת.
- לפני הקוד, ביד: לוודא שב-OpenAI יש קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית. המפתח כבר ב-Vercel מ-Milestone 1.
- מה מממשים:
  - Claude קורא קודם בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה, ורק אחר כך כותב קוד.
  - api/joke.js פונה ל-Responses API עם fetch, לפי סעיף 4 ב-ARCHITECTURE.md: המפתח מ-`process.env.OPENAI_API_KEY`, המודל מ-`process.env.OPENAI_MODEL` או `gpt-5`, והפרומפט המרכזי.
  - הנושא נחתך ל-100 תווים. נושא ריק או גוף שבור: בדיחה כללית.
  - הטקסט נשלף מהתשובה, ורק הבדיחה חוזרת לדף.
  - כל שגיאה: הודעה קצרה בעברית לדף, והפרטים ב-console.error.
  - בדף: ארבעת המצבים, עם ארבעת הציורים של הדמות, "עוד בדיחה!" ו"לנסות שוב", לפי DESIGN.md.
  - push. אין צורך ב-Redeploy: המשתנה היה ב-Vercel עוד לפני הפריסה הזו.
- התוצר המצופה: בדיחה אמיתית על הנושא, בטלפון.
- תנאי השלמה (Definition of Done):
  1. "חתולים" מחזיר בדיחה על חתולים.
  2. תיבה ריקה מחזירה בדיחה כללית.
  3. התיבה לא מקבלת יותר מ-100 תווים.
  4. `OPENAI_MODEL` עם שם שגוי, ואחריו Redeploy: הדף מציג הודעה בעברית, וב-Logs יש שורה אדומה. אחר כך מוחקים את המשתנה, ועושים Redeploy שוב.
  5. בלשונית Network יש בקשה ל-/api/joke, ואין בקשה ל-api.openai.com.
  6. חיפוש בקוד הדף (Ctrl+U ואז Ctrl+F) על `sk-` לא מוצא כלום.
  7. Claude מסביר בחמש שורות פשוטות איפה המפתחות נמצאים, ולמה הם לא מגיעים לדפדפן. בלי לבקש אף מפתח.
  8. מי שמריץ מקומית: בדיחה אמיתית גם ב-localhost, עם מפתח ה-dev.

## Milestone 3: התקנה בטלפון
- המטרה: מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא.
- מה מממשים:
  - manifest.webmanifest עם `name: "בדיחה בלחיצה"`, ‏`short_name`, ‏`start_url`, ‏`display: standalone`, ‏`lang: he`, ‏`dir: rtl`, ‏`theme_color` ו-`background_color`, שניהם `#FFE15A`.
  - אייקונים מתיקיית assets: assets/icon-192.png, ‏assets/icon-512.png, ו-assets/icon-512-maskable.png עם `purpose: maskable`.
  - sw.js בגישת network-first, לפי סעיף 7 ב-ARCHITECTURE.md. בקשה ל-/api לא נשמרת במטמון אף פעם.
  - ב-index.html: קישור ל-manifest, ‏`theme-color`, אייקון, ורישום של sw.js.
  - push. אין צורך ב-Redeploy.
- התוצר המצופה: הכפתור האדום הצוחק במסך הבית של הטלפון.
- תנאי השלמה (Definition of Done):
  1. במחשב, בכלי המפתחים, Application ואז Manifest: אין שגיאות, ושני האייקונים מופיעים.
  2. בטלפון: "התקנת אפליקציה" או "הוספה למסך הבית" מופיע, והאפליקציה נפתחת בלי שורת כתובת.
  3. בתוך האפליקציה המותקנת מגיעה בדיחה חדשה בכל לחיצה.
  4. ב-Application ואז Cache Storage אין אף כתובת של /api.
  5. שינוי קטן בטקסט, push, ורענון: השינוי מופיע.

## Milestone 4: האפליקציה זוכרת
- המטרה: כל בדיחת AI נשמרת ב-Supabase. אפשר לצחוק עליה, ורואים את "הכי מצחיקות". רק הפונקציות בתיקיית api מדברות עם Supabase, והדף מדבר רק עם /api.
- מה רואים בדף:
  - מתחת לכל בדיחת AI: כפתור "צחקתי" עם מונה. אחרי לחיצה הכפתור ננעל.
  - רשימת "הכי מצחיקות": חמש הבדיחות עם הכי הרבה צחוקים, רק כאלה עם צחוק אחד לפחות. הרשימה מתעדכנת אחרי כל צחוק, בלי polling.
- הטבלה, דרך המחבר של Supabase:
  - אם יש יותר מפרויקט אחד: Claude שואל באיזה לעבוד.
  - migration בשם `create_jokes`, עם הטבלה `public.jokes` וחמש עמודות:

    | העמודה | הסוג | הגדרה |
    |---|---|---|
    | id | uuid | מפתח ראשי, ברירת מחדל `gen_random_uuid()` |
    | created_at | timestamptz | ברירת מחדל `now()` |
    | topic | text | |
    | text | text | חובה |
    | laughs | integer | חובה, ברירת מחדל 0 |

- הנעילה, כדי שרק השרת ייגש לטבלה:
  - RLS דולק, בלי אף policy.
  - `grant select, insert, update` על הטבלה ל-service_role בלבד.
  - `revoke all` מ-anon ומ-authenticated.
- ספירת הצחוקים, כדי ששתי לחיצות באותו רגע לא ידרסו זו את זו:
  - הפונקציה `public.add_laugh(joke_id uuid)`: מוסיפה 1 למונה בעדכון אחד, ומחזירה את המספר החדש.
  - בתוכה: security invoker, ‏search_path ריק, ושמות מלאים כמו `public.jokes`.
  - הרשאות: `revoke execute` מ-public, ‏anon ו-authenticated, ו-`grant execute` ל-service_role.
- עצירה ראשונה, סביב ה-SQL:
  - ה-SQL נשמר גם כקובץ `db/create_jokes.sql`, ו-Claude מציג אותו לפני ההרצה.
  - אחרי ההרצה: Claude מריץ get_advisors, מסביר בעברית מה נמצא, ועוצר. אני בודק שהטבלה נעולה.
- הקוד בשרת:
  - לקוח אחד בקובץ `lib/supabase.js`, מהחבילה `@supabase/supabase-js`, ב-dependencies של package.json. הכתובת מ-`process.env.SUPABASE_URL`, והמפתח מ-`process.env.SUPABASE_SECRET_KEY`.
  - `api/joke.js` שומרת כל בדיחת AI בטבלה, ומחזירה `{ "joke": "...", "id": "..." }`. אם השמירה נכשלת, הבדיחה עדיין מגיעה למשתמש, בלי id, והשגיאה נרשמת ב-console.error.
  - `api/laugh.js` מקבלת POST עם `{ "id": "..." }`, בודקת שזה uuid, וקוראת ל-add_laugh דרך rpc. מחזירה `{ "laughs": N }`.
  - `api/top.js` מחזירה את רשימת "הכי מצחיקות": `{ "jokes": [ { "id", "text", "laughs" } ] }`.
- עצירה שנייה, לפני הדחיפה:
  - Claude עוצר לפני ה-push. אני שם ב-Vercel את `SUPABASE_URL` מסוג Config ואת `SUPABASE_SECRET_KEY` מסוג Secret, בסביבות Production ו-Preview. Claude לא מבקש את המפתח.
  - בשביל הרצה מקומית: מוסיפים ביד ל-.env.local את השורה `SUPABASE_SECRET_KEY=` עם המפתח, ואת `SUPABASE_URL` שומרים ב-Vercel גם בסביבת Development.
  - service worker: מעלים את הגרסה ב-sw.js, כדי שהדף החדש ייטען.
- התוצר המצופה: בדיחה עם כפתור "צחקתי", ורשימת "הכי מצחיקות" שמתמלאת.
- תנאי השלמה (Definition of Done):
  1. בדיחה חדשה מופיעה בטבלה `public.jokes`, עם הנושא והטקסט, ו-laughs שווה 0.
  2. לחיצה על "צחקתי" מעלה את המונה ב-1, והכפתור ננעל.
  3. הבדיחה עולה לרשימת "הכי מצחיקות" מיד אחרי הצחוק. בלשונית Network אין בקשות שחוזרות לבד.
  4. ברשימה לכל היותר חמש בדיחות, כולן עם צחוק אחד לפחות, מהגבוהה לנמוכה.
  5. `/api/laugh` עם id שאינו uuid מחזיר שגיאה בעברית, ולא נוגע בטבלה.
  6. בלשונית Network יש בקשות רק ל-/api, ואין אף בקשה לכתובת של Supabase. חיפוש בקוד הדף על `supabase` לא מוצא כלום.
  7. get_advisors לא מראה בעיית אבטחה בטבלה. קריאה לטבלה עם המפתח הציבורי נכשלת.
  8. אם Supabase לא זמין, הבדיחה עדיין מגיעה, ושגיאה נרשמת ב-Logs.
  9. בריפו יש `db/create_jokes.sql`, ו-.env.example מכיל רק `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`, בלי ערכים.

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
