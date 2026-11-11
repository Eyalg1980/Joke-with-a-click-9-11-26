# Milestone 5: האפליקציה מכירה אותך, תוכנית

## המטרה
הרשמה וכניסה עם מייל וסיסמה, שם לתצוגה, התנתקות ומחיקת חשבון. בדיחה של משתמש מחובר נשמרת עם user_id ועם השם שלו. "צחקתי" ו"הכי מצחיקות" נשארים כמו ב-Milestone 4.

## מה כבר ידוע
- Supabase: הפרויקט `fuseiotgtrlugyiwfsyp`. ב-`public` יש רק `jokes`, ‏13 שורות, RLS דולק, ובלי `user_id` ובלי `author_name`.
- ל-service_role על `jokes` יש רק select, ‏insert ו-update (מ-`limit_service_role`). זה מספיק גם לניקוי השם במחיקת חשבון.
- `@supabase/supabase-js` ‏2.119.0 נעול ב-`package-lock.json`. בדפדפן נשתמש באותה גרסה בדיוק, מ-jsDelivr.
- הכתובת החיה: https://jokewithaclick91126.vercel.app
- מ-Milestone 4: `SUPABASE_SECRET_KEY` הוגדר ב-Vercel רק ב-Production. לפי CLAUDE.md הוא צריך להיות גם ב-Preview.

## סדר העבודה וארבע העצירות

### שלב א: ביד, בדשבורד של Supabase (אתה)
1. Authentication, ואז Sign In / Providers: ‏Allow new users to sign up דולק. ‏Confirm email כבוי.
2. Authentication, ואז URL Configuration:
   - Site URL: ‏`https://jokewithaclick91126.vercel.app`
   - Redirect URLs: ‏`https://jokewithaclick91126.vercel.app/**`, ולהרצה מקומית גם `http://localhost:3000/**`.

### שלב ב: בסיס הנתונים (עצירה ראשונה)
1. כותבים את `db/add_joke_authors.sql` (הטיוטה למטה), ומציגים לך.
2. אחרי האישור שלך: migration בשם `add_joke_authors`, דרך המחבר.
3. `get_advisors` (security), והסבר בעברית מה נמצא.
4. **עוצרים.** אתה בודק בדשבורד.

טיוטת ה-SQL:
```sql
-- migration: add_joke_authors
-- שתי עמודות חדשות ב-public.jokes. הנעילה של הטבלה לא משתנה.

alter table public.jokes
  add column user_id uuid references auth.users (id) on delete set null,
  add column author_name text;

alter table public.jokes
  add constraint jokes_author_name_length
  check (author_name is null or char_length(btrim(author_name)) between 1 and 30);

create index jokes_user_id_idx on public.jokes (user_id);
```
- בלי grant ובלי policy חדשים. ה-RLS, ה-revoke מ-anon ומ-authenticated, וההרשאות של service_role נשארים בדיוק כמו שהם.
- ‏on delete set null: כשמשתמש נמחק, הבדיחות שלו נשארות בלי בעלים.

### שלב ג: הקוד
| קובץ | השינוי |
|---|---|
| `lib/http.js` | חדש. ‏`json(data, status)` עם `Cache-Control: no-store`. ‏`authRequired()`: ‏401 עם `{ error: "צריך להתחבר שוב.", code: "auth_required" }`. ‏`readJson(request, maxBytes)`: גוף עד 2KB, אחרת null |
| `lib/supabase.js` | נשאר הלקוח היחיד עם המפתח הסודי. נוספות `hasToken(request)`, ‏`getUserFromRequest(request, supabase)` ו-`displayName(user)` (פירוט למטה) |
| `api/config.js` | חדש. GET בלבד. ‏`{ url, publishableKey }`. חסר, או מפתח שמתחיל ב-`sb_secret_`: ‏500 עם `code: "auth_not_configured"` |
| `api/joke.js` | יש טוקן: מזהים את המשתמש **לפני** OpenAI. טוקן לא מוכר: ‏401, בלי OpenAI. ‏Supabase לא זמין: בדיחה בלי שמירה. שמירה עם `user_id` ו-`author_name` מהמשתמש בלבד. תשובה `{ joke, id, author_name }` |
| `api/delete-account.js` | חדש. POST עם טוקן בלבד. ‏`update jokes set author_name = null where user_id = <id>`, ואז `auth.admin.deleteUser(id)`. מחזירה `{ deleted: true }` |
| `api/laugh.js`, `api/top.js` | רק המעבר ל-`lib/http.js`, כדי שגם הן יחזירו `no-store`. ההתנהגות לא משתנה |
| `auth.js` | חדש, בשורש. כל הכניסה בדפדפן (פירוט למטה) |
| `index.html` | הספרייה מ-jsDelivr ואחריה `auth.js`. כפתור חשבון, שני חלונות dialog, טוקן בכל קריאה ל-`/api`, ו"נכתבה עכשיו בשבילך" |
| `sw.js` | ‏`joke-v3` ל-`joke-v4`, ו-`/auth.js` ב-PRECACHE |

#### השרת: שלוש הפונקציות ב-lib/supabase.js
- `hasToken(request)`: יש כותרת `Authorization: Bearer <משהו>`.
- `getUserFromRequest(request, supabase)`: אין טוקן: null. יש: ‏`supabase.auth.getUser(token)`. טוקן לא תקין או שפג (שגיאת 4xx מ-Supabase): null. ‏Supabase לא זמין (אין לקוח, שגיאת רשת או 5xx): זורקת שגיאה.
- `displayName(user)`: ‏`user_metadata.full_name`, אחרי trim, עד 30 תווים. ריק: null, כדי שה-check בטבלה לא ייכשל.
- ב-`api/joke.js` הסדר: יש טוקן ו-null חזר: ‏401. נזרקה שגיאה: ממשיכים כאורח לבדיחה, בלי שמירה (`console.error`). הבדיחה עצמה לא נחסמת בגלל Supabase.
- ב-`api/delete-account.js`: בלי טוקן, או טוקן לא מוכר: ‏401. ‏Supabase לא זמין: ‏500 בעברית. שגיאה בניקוי השם: ‏500, והמשתמש **לא** נמחק, כדי שלא יישאר שם בלי בעלים.

#### הדפדפן: auth.js
- `window.jokeAuth` עם: `ready()`, ‏`signUp(name, email, password)` (‏`full_name` ב-`options.data`), ‏`signIn(email, password)`, ‏`signOut()` ב-`scope: 'local'`, ‏`session()`, ‏`token()`, ‏`onChange(cb)`.
- `ready()` מביא את `/api/config` פעם אחת, ויוצר את הלקוח עם `flowType: 'pkce'`. נכשל: הכפתור כותב "הכניסה לא זמינה כרגע", והבדיחות ממשיכות לעבוד כאורח.
- הודעות שגיאה בעברית לפי `error.code` של Supabase:
  - `invalid_credentials`: "המייל או הסיסמה לא נכונים."
  - `user_already_exists`, ‏`email_exists`: "המייל הזה כבר רשום. אפשר להיכנס."
  - `weak_password`, וגם בדיקה בדף לפני השליחה: "הסיסמה צריכה לפחות 6 תווים."
  - `email_address_invalid`: "המייל לא נראה תקין."
  - `over_request_rate_limit`: "יותר מדי ניסיונות. חכו רגע ונסו שוב."
  - כל השאר: "הכניסה לא הצליחה. נסו שוב."
- הספרייה מדברת עם supabase.co רק דרך `/auth/v1`. לא קוראים בשום מקום ל-`.from()` או ל-`.rpc()` בדפדפן.

#### מה רואים בדף
- **כפתור החשבון:** מדבקה לבנה, מסגרת בצבע הדיו וצל קשה, בפינה העליונה בצד שמאל, כמו ב-`mockups-users.png`. אורח: "כניסה". מחובר: עיגול סגול עם האות הראשונה, והשם (נחתך עם … אם ארוך).
- **חלון הכניסה** (`<dialog>`): עולה מלמטה בטלפון, באמצע במחשב. פינות 26, מסגרת 3, צל קשה 6. שתי לשוניות, "כניסה" ו"הרשמה". בהרשמה: "איך לקרוא לך?" (עד 30), מייל, סיסמה (6 לפחות). ההודעה ב-`role="alert"`. בזמן השליחה הכפתור נעול. הצלחה: החלון נסגר.
- **חלון "החשבון שלי":** השם, המייל, "התנתקות", ו"מחיקת החשבון". מחיקה: שלב אישור בתוך החלון, "למחוק לצמיתות? הבדיחות שלך יישארו, בלי השם." עם "כן, למחוק" ו"ביטול". אחרי מחיקה: התנתקות מקומית והחלון נסגר.
- Escape ולחיצה מחוץ לחלון סוגרים את שני החלונות.
- **כל קריאה ל-/api** עוברת דרך פונקציה אחת, `api(path, options)`, שמוסיפה `Authorization: Bearer` כשיש טוקן. ‏401 עם `auth_required` כשנשלח טוקן: התנתקות מקומית, וחלון הכניסה נפתח עם "צריך להתחבר שוב".
- **מתחת לבדיחה:** כש-`author_name` חזר מהשרת: "נכתבה עכשיו בשבילך, " והשם, בשורה קטנה מעל "צחקתי". אורח: בלי השורה.
- כל טקסט מהשרת או מהמשתמש עם textContent.

### שלב ד: ביד, לפני הדחיפה (עצירה שנייה)
1. ב-Vercel, Environment Variables: `SUPABASE_PUBLISHABLE_KEY` מסוג Config, בכל הסביבות. אני מביא לך את הערך עם `get_publishable_keys` (הוא לא סוד).
2. מומלץ: `SUPABASE_SECRET_KEY` גם ב-Preview, כמו שכתוב ב-CLAUDE.md.

אחר כך: commit ו-push ל-main.

### שלב ה: הרצה ובדיקה (עצירה שלישית)
אתה בודק לפי שמונה תנאי ההשלמה ב-MILESTONES. לפני כן אני בודק בעצמי:
- הפונקציות ב-Node עם Supabase ו-OpenAI מדומים: טוקן לא מוכר מחזיר 401 בלי לפנות ל-OpenAI. ‏Supabase שזורק: הבדיחה מגיעה. ‏`user_id` בגוף הבקשה לא נחשב. ‏config עם מפתח `sb_secret_`: ‏500.
- הדף ברוחב 375 מול api מדומה: שני החלונות, הודעות השגיאה, ואין גלילה לצד.
- אחרי הפריסה: `/api/config` מחזיר רק `url` ו-`publishableKey`, וב-Ctrl+U אין `sb_publishable_` ואין `sb_secret_`.

### שלב ו: אישור (עצירה רביעית)
מחכים לאישור המפורש שלך לפני Milestone 6.

## החלטות (אושרו בשלב התכנון)
1. **אישור מחיקה:** בתוך החלון ("כן, למחוק" / "ביטול"), ולא `confirm()` של הדפדפן, שנראה זר בעיצוב.
2. **שם ריק:** אם `full_name` ריק, `author_name` נשמר כ-null, והבדיחה מוצגת כמו של אורח.
3. **Supabase לא זמין עם טוקן:** הבדיחה מגיעה בלי שמירה ובלי שם, כמו שכתוב ב-spec. לא מנתקים את המשתמש, כי זה לא אומר שהטוקן פג.
4. **בלי שחזור סיסמה ובלי אימות מייל** ב-Milestone הזה. ה-PRD לא דורש אותם, ובלי Confirm email אין צורך ב-SMTP של Resend. המחיר: אפשר להירשם עם מייל שאינו שלך. בסדר לאפליקציית קורס.

## מה נבנה בפועל
### שלב ב: בסיס הנתונים
- migration ‏`add_joke_authors` (‏`db/add_joke_authors.sql`) רץ בהצלחה.
- בטבלה: `user_id` ‏(uuid, לא חובה, ‏`on delete set null`) ו-`author_name` ‏(text, לא חובה), ה-check ‏`jokes_author_name_length`, והאינדקס `jokes_user_id_idx`. ‏13 השורות הקיימות נשארו, בלי user_id.
- הנעילה לא השתנתה: RLS דולק, אין אף policy. ל-service_role רק select, ‏insert ו-update. ל-anon ול-authenticated אין שום הרשאה.
- ‏get_advisors (security): רק "RLS Enabled No Policy" על `jokes`, ברמת INFO. מכוון, כמו ב-Milestone 4.

### שלב ג: הקוד
- `lib/http.js`: ‏`json`, ‏`error`, ‏`authRequired`, ‏`methodNotAllowed`, ‏`readJson` (גוף עד 2KB). כל התשובות עם `no-store`.
- `lib/supabase.js`: ‏`hasToken`, ‏`getUserFromRequest` ו-`displayName`. שגיאת AuthApiError ‏4xx מ-getUser: ‏null. כל שגיאה אחרת (רשת, 5xx, אין לקוח): נזרקת.
- `api/config.js`: מסרבת למפתח `sb_secret_`, וגם ל-JWT ישן שה-role שלו אינו `anon`.
- `api/joke.js`: מזהה לפני OpenAI. ‏`user_id` ו-`author_name` בגוף הבקשה לא נחשבים. ‏`author_name` חוזר רק כשהבדיחה באמת נשמרה עם השם.
- `api/delete-account.js`: ניקוי השם, ואז `deleteUser`. ניקוי שנכשל עוצר את המחיקה.
- `api/laugh.js`, ‏`api/top.js`: עברו ל-`lib/http.js`. ההתנהגות זהה, ועכשיו גם laugh עם `no-store`.
- `auth.js`: ‏`window.jokeAuth`. ‏`token()` מחכה לטעינה שבאמצע, כדי שבקשה מוקדמת לא תצא כאורח. הודעות בעברית לפי `error_code`.
- `index.html`: הספרייה מ-jsDelivr ב-2.119.0 עם `integrity` (‏SRI. ה-hash נבדק מול הקובץ ב-node_modules ומול jsDelivr, והם זהים). כפתור חשבון, חלון כניסה עם שתי לשוניות, חלון "החשבון שלי" עם אישור מחיקה בתוך החלון, ופונקציה אחת `api()` לכל הקריאות.
- `sw.js`: ‏`joke-v4`, ו-`/auth.js` ב-PRECACHE.

### נבדק לפני ה-push
- 15 בדיקות של הפונקציות ב-Node, מול Supabase ו-OpenAI מדומים. כולן עברו: בדיחת אורח בלי user_id, בדיחה של משתמש עם user_id ושם מהטוקן (וגוף עם `user_id` מזויף לא נחשב), טוקן לא מוכר מחזיר 401 בלי לפנות ל-OpenAI, ‏Supabase נפל והבדיחה בכל זאת מגיעה, config מסרב למפתח סודי, ו-delete-account מנקה את השם לפני המחיקה.
- הדף ברוחב 375, מול שרת מקומי שמדמה את `/api` ואת `/auth/v1`: בדיחת אורח בלי שורת שם. הרשמה: סיסמה קצרה ומייל רשום מקבלים הודעה בעברית, והצלחה סוגרת את החלון ומציגה "נ נועה". בדיחה עם "נכתבה עכשיו בשבילך, נועה". רענון: נשארים מחוברים. התנתקות: חוזרים ל"כניסה" והטוקן נמחק. סיסמה שגויה: הודעה בעברית. טוקן שפג: התנתקות לבד, וחלון הכניסה עם "צריך להתחבר שוב". מחיקה: אישור, ביטול, ומחיקה שמנתקת. אין גלילה לצד.
- בקשות הדף ל-Supabase: רק `/auth/v1`, אף לא אחת ל-`/rest/v1`.

### שלב ד: Vercel
- לבקשתך, Claude הוסיף את `SUPABASE_PUBLISHABLE_KEY` דרך המחבר של Vercel: הערך `sb_publishable_` מ-`get_publishable_keys`, מסוג plain (Config), בשלוש הסביבות. הוא לא נכנס לשום קובץ.
- `SUPABASE_SECRET_KEY` ו-`OPENAI_API_KEY` מוגדרים רק ב-Production. זו בחירה: העבודה רק בסביבת Production, ולכן הסודות לא נוספים ל-Preview ול-Development.
