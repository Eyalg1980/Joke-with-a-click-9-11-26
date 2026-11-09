# ARCHITECTURE: בדיחה בלחיצה

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- מתחת לכל בדיחת AI שיש לה id: כפתור "צחקתי" עם מונה. לחיצה: POST ל-/api/laugh, ואז הכפתור ננעל ומציג את המספר החדש.
- רשימת "הכי מצחיקות": נטענת מ-/api/top בפתיחת הדף, ושוב אחרי כל צחוק מוצלח. בלי polling.
- הטקסט שחוזר מוצג עם textContent, לא innerHTML.
- הדף פונה רק ל-/api. אין בו כתובת של Supabase, אין מפתח, ואין את החבילה של Supabase.
- רושם את sw.js כ-service worker.

### לוגיקה
- שלוש Vercel Functions, כל אחת עם `export default { async fetch(request) { ... } }`:
  - api/joke.js: מקבלת רק POST עם JSON: `{ "topic": "..." }`. חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא". פונה ל-OpenAI, מחלצת את הטקסט, שומרת את הבדיחה בטבלה, ומחזירה את הבדיחה ואת ה-id שלה. אם השמירה נכשלת: הבדיחה חוזרת בלי id, והשגיאה ב-console.error.
  - api/laugh.js: מקבלת רק POST עם `{ "id": "..." }`. בודקת שה-id הוא uuid, וקוראת ל-`add_laugh` דרך rpc.
  - api/top.js: מחזירה את חמש הבדיחות עם הכי הרבה צחוקים, רק עם laughs גדול מ-0, מהגבוה לנמוך.
- לקוח Supabase אחד, ב-lib/supabase.js, מחוץ לתיקיית api כדי שלא יקבל כתובת. רק הפונקציות בתיקיית api מייבאות אותו.
- כל הפונקציות מחזירות תמיד JSON. שגיאה: `{ "error": "..." }` בעברית, והפרטים ב-console.error.

### נתונים
- Supabase, טבלה אחת: `public.jokes`. רק הפונקציות בתיקיית api מדברות איתה, עם המפתח הסודי.
- נשמרות רק בדיחות AI. הודעת שגיאה לא נשמרת.

## 2. מבנה הנתונים
הטבלה `public.jokes`, נוצרת ב-migration בשם `create_jokes`. ה-SQL שמור גם ב-db/create_jokes.sql.

| העמודה | הסוג | הגדרה |
|---|---|---|
| id | uuid | מפתח ראשי, ברירת מחדל `gen_random_uuid()` |
| created_at | timestamptz | ברירת מחדל `now()` |
| topic | text | הנושא אחרי החיתוך. ריק: null |
| text | text | חובה. הבדיחה |
| laughs | integer | חובה, ברירת מחדל 0 |

הנעילה:
- RLS דולק, בלי אף policy.
- `grant select, insert, update on public.jokes to service_role`. בלי delete.
- `revoke all on public.jokes from anon, authenticated`.

ספירת הצחוקים:
- `public.add_laugh(joke_id uuid) returns integer`: עדכון אחד, `laughs = laughs + 1 where id = joke_id`, ומחזיר את הערך החדש. אין שורה כזו: מחזיר null, והפונקציה ב-Vercel מחזירה 404.
- security invoker, ‏`set search_path = ''`, ושמות מלאים כמו `public.jokes`.
- `revoke execute` מ-public, ‏anon ו-authenticated, ו-`grant execute` ל-service_role.

החוזה בין הדף לפונקציות:

| הכתובת | הדף שולח | הפונקציה מחזירה, הצלחה | שגיאה |
|---|---|---|---|
| POST /api/joke | `{ "topic": "חתולים" }`, או `{ "topic": "" }` | `{ "joke": "...", "id": "uuid" }`, ‏200. השמירה נכשלה: בלי `id` | `{ "error": "..." }`, ‏405, 500 או 502 |
| POST /api/laugh | `{ "id": "uuid" }` | `{ "laughs": 3 }`, ‏200 | `{ "error": "..." }`, ‏400 (לא uuid), 404 (אין בדיחה), 405 או 500 |
| GET /api/top | | `{ "jokes": [ { "id", "text", "laughs" } ] }`, ‏200. עד חמש | `{ "error": "..." }`, ‏405 או 500 |

## 3. התחברות והרשאות
אין כניסה, רמה 0. כל גולש יכול לבקש בדיחה ולצחוק. ההגנה על העלות היא אורך נושא מוגבל, ומגבלת הוצאה בחשבון OpenAI.
- הנעילה בבסיס הנתונים, לא בדף: לתפקידים anon ו-authenticated אין גישה לטבלה ולפונקציה. רק service_role, דרך הפונקציות.
- הנעילה של "צחקתי" אחרי לחיצה היא בדף בלבד. לא סופרים משתמשים ולא מונעים לחיצה חוזרת בשרת.
- Supabase עשוי להציע policy או grant ל-anon. לא מקבלים את ההצעה.

## 4. שכבת ה-AI
- הקריאה: POST אל `https://api.openai.com/v1/responses`, מתוך הפונקציה בלבד, עם הכותרת `Authorization: Bearer <OPENAI_API_KEY>`.
- הגוף: `model` מ-OPENAI_MODEL או `gpt-5`, ‏`instructions` עם הפרומפט המרכזי, `input` עם הנושא, ‏`reasoning: { effort: "low" }` ו-`max_output_tokens`.
- הפרומפט המרכזי: "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה."
- ה-input: "נושא הבדיחה: [הנושא]". בלי נושא: "אין נושא. ספר בדיחה כללית על החיים."
- התשובה: לוקחים את `output_text` אם קיים. אחרת, את הטקסט מהפריטים מסוג `message` במערך `output`, בחלקים מסוג `output_text`. אין טקסט: שגיאה.
- שגיאה מ-OpenAI: הסטטוס והקוד נרשמים ב-console.error, והדף מקבל הודעה קצרה בעברית לפי הקוד: 401, נגמר הקרדיט, מגבלת הוצאה, 429, 404.
- לפני כתיבת הקוד בודקים בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה.

## 5. אינטגרציות, APIs ואוטומציות
- OpenAI Responses API, מ-api/joke.js בלבד.
- Supabase, דרך `@supabase/supabase-js`, מהפונקציות בתיקיית api בלבד. הדפדפן לא פונה ל-Supabase.
- אין אוטומציות ואין שירותים נוספים.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק הפונקציה קוראת אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל. בלי המשתנה: gpt-5 |
| SUPABASE_URL | Vercel, Environment Variables, ב-Production, ב-Preview וב-Development | Config | כתובת הפרויקט ב-Supabase. רק lib/supabase.js קורא אותה |
| SUPABASE_SECRET_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק lib/supabase.js קורא אותו |
| SUPABASE_SECRET_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | הסטודנט מדביק אותו ביד |

- המפתחות לא מופיעים בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- מפתח ה-production של OpenAI נשמר ב-Vercel כבר ב-Milestone 1. את שני המשתנים של Supabase אני שם ב-Vercel ב-Milestone 4, לפני הדחיפה. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם שתי שורות בלבד: `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`. גם .env.local מכיל רק את שתי השורות האלה, עם מפתחות ה-dev. ערכים שאינם סוד, שם המודל וכתובת Supabase, לא נכנסים לקובץ.
- הדפדפן לא מקבל אף מפתח ואף כתובת של Supabase. הוא פונה רק ל-/api.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`. הוא נוצר לפני הקומיט הראשון.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html              המסך, עם ה-CSS וה-JavaScript
manifest.webmanifest    name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                   service worker, network-first, בלי /api
package.json            "type": "module", ו-dependencies רק עם @supabase/supabase-js
.gitignore              .env, .env.*, !.env.example, .vercel, node_modules
.env.example            שתי שורות בלבד: OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים ובלי הערות
.claude/settings.json   חוסם ל-Claude את הקריאה של .env ושל .env.*
assets/logo.svg
assets/mascot-idle.svg, mascot-think.svg, mascot-joke.svg, mascot-error.svg
assets/bg-dots.svg, bg-doodles.svg
assets/icon.svg, icon-maskable.svg
assets/icon-192.png, icon-512.png, icon-512-maskable.png
api/joke.js             בדיחה מ-OpenAI, ושמירה בטבלה. המקום היחיד שקורא את OPENAI_API_KEY
api/laugh.js            צחוק: rpc ל-add_laugh
api/top.js              "הכי מצחיקות": חמש הבדיחות המובילות
lib/supabase.js         לקוח Supabase אחד. המקום היחיד שקורא את SUPABASE_URL ואת SUPABASE_SECRET_KEY
db/create_jokes.sql     ה-SQL של ה-migration create_jokes
spec/                   מסמכי האיפיון, ו-spec/plans
```

ה-service worker:
- באירוע install שומר במטמון את /, את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api, בקשה שאינה GET, או בקשה לכתובת אחרת: לא נוגע בה. לכן גם /api/top לא נשמר במטמון.
- בכל שינוי בדף או בקבצים שנשמרים במטמון מעלים את הגרסה בשם המטמון (`joke-v1`, ‏`joke-v2` וכן הלאה), כדי שהמטמון הישן יימחק.

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript בתוך index.html, כי יש מסך אחד.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
- Milestone 4: טבלה אחת מספיקה, בתוך המגבלה של שלוש טבלאות בסטאק. אין טבלת צחוקים נפרדת: המונה הוא עמודה, והספירה נעשית ב-add_laugh, כדי ששתי לחיצות באותו רגע לא ידרסו זו את זו.
- "הכי מצחיקות" מתעדכנת רק אחרי צחוק של המשתמש עצמו. בלי polling ובלי עדכון בזמן אמת, שאינו בסטאק.
