# Milestone 4: האפליקציה זוכרת, תוכנית

## המטרה
כל בדיחת AI נשמרת ב-Supabase. מתחת לבדיחה יש כפתור "צחקתי" עם מונה, ובדף יש רשימת "הכי מצחיקות". רק הפונקציות בתיקיית `api` מדברות עם Supabase, והדף מדבר רק עם `/api`.

## מה כבר ידוע
- פרויקט Supabase אחד בחשבון: `Joke-with-a-click-9-11-26` ‏(`fuseiotgtrlugyiwfsyp`), פעיל. לכן לא צריך לבחור פרויקט.
- הסכימה `public` ריקה. אין עדיין טבלאות.
- הכתובת החיה: https://joke-app-ebon-nu.vercel.app

## סדר העבודה ושתי העצירות

### שלב א: הטבלה (עצירה ראשונה)
1. כותבים את `db/create_jokes.sql` (הטיוטה למטה), ומציגים לך אותו.
2. אחרי האישור שלך: מריצים אותו כ-migration בשם `create_jokes`, דרך המחבר של Supabase.
3. מריצים `get_advisors` (security), ומסבירים בעברית מה נמצא.
4. **עוצרים.** אתה בודק בדשבורד שהטבלה נעולה.

טיוטת ה-SQL:
```sql
create table public.jokes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text,
  text text not null,
  laughs integer not null default 0
);

alter table public.jokes enable row level security;
revoke all on public.jokes from anon, authenticated;
grant select, insert, update on public.jokes to service_role;

create function public.add_laugh(joke_id uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  update public.jokes
  set laughs = laughs + 1
  where id = joke_id
  returning laughs;
$$;

revoke execute on function public.add_laugh(uuid) from public, anon, authenticated;
grant execute on function public.add_laugh(uuid) to service_role;
```
- בלי אף policy. ‏service_role עוקף את ה-RLS, ולכן הפונקציות ב-Vercel עובדות, ו-anon נחסם.
- אין שורה עם ה-id הזה: `add_laugh` מחזירה null, ו-`api/laugh.js` מחזירה 404.

### שלב ב: הקוד
| קובץ | השינוי |
|---|---|
| `package.json` | ‏`dependencies` עם `@supabase/supabase-js` בלבד. גם `package-lock.json` נכנס לריפו |
| `lib/supabase.js` | לקוח אחד, `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)`, בלי שמירת session. המקום היחיד שקורא את שני המשתנים |
| `api/joke.js` | אחרי שיש בדיחה: `insert` עם `topic` (ריק: null) ו-`text`, ומחזיר `{ joke, id }`. שמירה שנכשלה או משתנים חסרים: `console.error`, והבדיחה חוזרת בלי `id` |
| `api/laugh.js` | רק POST. ‏`id` שאינו uuid: ‏400 בעברית, בלי לגעת בטבלה. ‏`rpc('add_laugh', { joke_id })`. ‏null: ‏404. מחזיר `{ laughs }` |
| `api/top.js` | רק GET. ‏`laughs > 0`, מהגבוה לנמוך, ובשוויון החדשה קודם. עד חמש. מחזיר `{ jokes: [{ id, text, laughs }] }` |
| `index.html` | כפתור "צחקתי" בבועה, ורשימת "הכי מצחיקות" מתחת לבועה (פירוט למטה) |
| `sw.js` | ‏`joke-v2` ל-`joke-v3` |

- `.env.example` כבר מכיל את שתי השורות. בודקים את זה דרך `git show`, בלי לקרוא את הקובץ ישירות, כי הוא נחסם ב-`.env.*`.
- לפני הכתיבה: בודקים בתיעוד העדכני של `supabase-js` את `createClient`, ‏`insert().select()` ו-`rpc`, ובודקים שהמפתח החדש מסוג `sb_secret_` נתמך.
- כל ההודעות לדף בעברית. הפרטים ב-`console.error`.

### מה רואים בדף
- **"צחקתי":** כפתור גלולה קטן בתוך הבועה, מתחת לבדיחה. לבן, מסגרת 3 בצבע הדיו, וצל קשה. הטקסט "צחקתי · 0".
  - בלחיצה: נעול, ו-POST ל-`/api/laugh`. הצלחה: "צחקת! · 1", נשאר נעול, ונטענת מחדש הרשימה.
  - שגיאה: הודעה קצרה בעברית ליד הכפתור, והכפתור נפתח שוב.
  - בדיחה בלי `id`, או מצב שגיאה: אין כפתור.
  - בדיחה חדשה: כפתור חדש, פתוח.
  - הנעילה בדף בלבד, בלי localStorage. רענון מאפס אותה.
- **"הכי מצחיקות":** כרטיס מתחת לבועה, באותו סגנון (נייר, מסגרת, צל קשה, קצת מסובב). כותרת, ורשימה ממוספרת (`<ol>`). בכל פריט: הבדיחה בכתב יד, ולידה "3 צחוקים".
  - נטענת מ-`/api/top` בפתיחת הדף, ושוב אחרי כל צחוק מוצלח. בלי polling.
  - כל טקסט עם textContent.
  - `aria-live` על הרשימה, כדי שקורא מסך ישמע עדכון.

### שלב ג: עצירה שנייה, לפני ה-push
אתה עושה ביד:
1. ב-Supabase: ‏Project Settings, ואז API Keys. מעתיקים מפתח secret (או יוצרים אחד חדש בשם `joke-app`).
2. ב-Vercel, ב-Environment Variables:
   - `SUPABASE_URL` = ‏`https://fuseiotgtrlugyiwfsyp.supabase.co`, מסוג Config, ב-Production, ב-Preview וב-Development.
   - `SUPABASE_SECRET_KEY`, מסוג Secret, ב-Production וב-Preview.
3. להרצה מקומית בלבד: מוסיפים ביד ל-`.env.local` את השורה `SUPABASE_SECRET_KEY=` עם מפתח dev נפרד, מריצים `npm install`. את `SUPABASE_URL` ‏`vercel dev` טוען לבד מסביבת Development.

אחר כך: push ל-main. המשתנים הוגדרו לפני הפריסה, ולכן אין צורך ב-Redeploy.

### שלב ד: הרצה ובדיקה
לפי תנאי ההשלמה ב-MILESTONES, ובנוסף:
- קריאה ל-`/rest/v1/jokes` עם המפתח הציבורי (publishable) מחזירה שגיאה או רשימה ריקה. אני מריץ אותה עם ה-publishable key, ולא נוגע במפתח הסודי.
- בדיקת "Supabase לא זמין": מוחקים זמנית את `SUPABASE_URL` ב-Preview, או מריצים מקומית בלי `SUPABASE_SECRET_KEY`. הבדיחה מגיעה, ושגיאה ב-Logs.

## החלטות (הוכרעו בשלב התכנון)
1. **נתוני דוגמה:** חמש בדיחות דוגמה בעברית, עם צחוקים (למשל 5, 4, 3, 2, 1), כדי שהרשימה לא תתחיל ריקה. הן נשמרות בקובץ נפרד, `db/seed_jokes.sql`, ומוצגות לך לפני ההרצה, בשלב א, אחרי ה-migration.
2. **רשימה ריקה:** הכרטיס נשאר, ובתוכו "עוד אין כאן בדיחות. צחקו על אחת, והיא תופיע כאן".
3. **העיצוב:** לפי ההצעה בסעיף "מה רואים בדף". אושר.

## מה נבנה בפועל

### שלב א: הטבלה
- migration ‏`create_jokes` (‏`db/create_jokes.sql`): הטבלה, RLS, ‏revoke מ-anon ומ-authenticated, ו-`add_laugh` עם ההרשאות שלה.
- נתוני דוגמה (‏`db/seed_jokes.sql`): חמש בדיחות, עם 5, 4, 3, 2 ו-1 צחוקים.
- פער שהתגלה: הפרויקט נתן ל-service_role את כל ההרשאות על הטבלה, כולל delete ו-truncate. תוקן ב-migration שני, ‏`limit_service_role` (‏`db/limit_service_role.sql`).
- המצב אחרי התיקון: ל-service_role יש רק select, ‏insert ו-update, ורק הוא יכול להריץ את `add_laugh`. ל-anon ול-authenticated אין שום הרשאה. RLS דולק, ואין אף policy.
- ‏get_advisors (security): רק "RLS Enabled No Policy", ברמת INFO. זה מכוון. לא מוסיפים policy.

### שלב ב: הקוד
- `package.json`: ‏`@supabase/supabase-js` ‏2.119 (תומך במפתח `sb_secret_`), ו-`package-lock.json`.
- `lib/supabase.js`: ‏`getSupabase()` מחזיר לקוח אחד, בלי session. משתנה חסר: ‏null, ושורה ב-`console.error` שאומרת רק set או missing, אף פעם לא את הערך.
- `api/joke.js`: ‏`saveJoke` אחרי שיש בדיחה. כל כשל בשמירה: ‏`console.error`, והבדיחה חוזרת בלי `id`.
- `api/laugh.js`: ‏405 ל-GET. ‏400 לגוף שבור או ל-id שאינו uuid, לפני כל פנייה ל-Supabase. ‏`rpc('add_laugh')`. ‏null: ‏404.
- `api/top.js`: ‏`laughs > 0`, מהגבוה לנמוך, ובשוויון החדשה קודם. עד חמש. ‏`Cache-Control: no-store`.
- `index.html`: כפתור "צחקתי · 0" בבועה. אחרי הצלחה "צחקת! · N", בצבע השמש, נעול. כרטיס "הכי מצחיקות" עם `<ol>`, ‏"צחוק אחד" או "N צחוקים", והודעה כשהרשימה ריקה. הכל ב-textContent. תשובה שמגיעה אחרי שכבר התחילה בדיחה חדשה לא משנה את הכפתור החדש.
- `sw.js`: ‏`joke-v3`.

### נבדק לפני ה-push
- הפונקציות עצמן, ב-Node, בלי Supabase ועם OpenAI מדומה: הבדיחה חוזרת בלי `id`. ‏laugh: ‏400 ל-`abc` ולגוף שבור, 405 ל-GET, ו-500 בעברית כשאין Supabase. ‏top: ‏405 ל-POST, ו-500 בעברית.
- הדף, ברוחב 375 מול api מדומה: הכפתור מופיע רק עם `id`. לחיצה שנייה לא שולחת בקשה. הבדיחה עולה לרשימה מיד. אין polling ואין גלילה לצד.

### פריסה
- ב-Vercel, בפרויקט `jokewithaclick91126`, כבר היו `SUPABASE_URL` (Config, בשלוש הסביבות) ו-`SUPABASE_SECRET_KEY` (Secret, רק ב-Production. ב-Preview עוד חסר).
- נדחף ל-main (‏`5387ba2`), ונפרס לבד: https://jokewithaclick91126.vercel.app

### נבדק בפרודקשן
- `/api/top`: חמש בדיחות הדוגמה, מ-5 עד 1.
- `/api/joke`: בדיחה אמיתית עם `id`, והשורה נשמרה בטבלה.
- `/api/laugh` עם `abc`: ‏400, ‏"הבדיחה לא מזוהה.". עם ה-id החדש: ‏`{"laughs":1}`.
- `/api/top` אחרי הצחוק: הבדיחה החדשה ברשימה, ועדיין חמש בלבד.
- קוד הדף: אין בו `supabase`.
- המפתח הציבורי (publishable) מול Supabase: הקריאה לטבלה וה-rpc ל-`add_laugh` נכשלים עם `42501 permission denied`. ‏Supabase מציע `GRANT SELECT ... TO anon`, ולא מקבלים את ההצעה.
- אושר.
