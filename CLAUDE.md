# CLAUDE.md: בדיחה בלחיצה (joke-app)

## הפרויקט
- אפליקציית בדיחות בעברית: כותבים נושא ומקבלים בדיחה מ-GPT-5, דרך פונקציה ב-Vercel. אפשר להתקין אותה כ-PWA. מ-Milestone 5 אפשר להירשם, ומ-Milestone 6 לדרג בדיחות בקהילה.
- מסמכי האיפיון נמצאים ב-`spec/`: PRD, MVP, product-10-definitions, MILESTONES, ARCHITECTURE, tech-stack, DESIGN, וגם course-stack (חוקי הקורס) ותמונות הייחוס.
- תיקיית `assets/` נשארת בשורש, כי האפליקציה משתמשת בה. משתמשים בקבצים כמו שהם.
- במקרה של סתירה, המסמכים ב-`spec/` קובעים. לא חורגים מ-course-stack.md בלי לשאול קודם.

## שפה
- האפליקציה בעברית, מימין לשמאל (`lang="he"`, `dir="rtl"`).
- מדברים איתי בעברית.

## הנחיה שוטפת
- בכל שלב, ובמיוחד בהקמה: להנחות אותי צעד אחר צעד מהו השלב הבא. בצורה עניינית, קצרה וברורה.
- לפני ששואלים שאלות: קודם קוראים את הקבצים, ורק אז מחדדים איתי את הנקודות הפתוחות.

## מפתחות: חוק ברזל
- אף פעם לא לבקש ממני מפתח, ולא לכתוב או לקרוא מפתח באף קובץ.
- מפתח ה-production נשמר אצלי ב-Vercel, מסוג Secret, בסביבות Production ו-Preview.
- את מפתח ה-dev אני מדביק בעצמי ב-`.env.local`.
- `.claude/settings.json` חוסם קריאה של `.env` ושל `.env.*`. אסור לעקוף את החסימה, גם לא דרך shell (cat, type, Get-Content וכדומה).
- `.env.example` מכיל רק את השורות `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`, בלי ערכים ובלי הערות.
- `.gitignore` מתעלם מ-`.env`, מ-`.env.*`, מ-`.vercel` ומ-`node_modules`, עם החריגה `!.env.example`.
- הקוד קורא את המפתח רק מ-`process.env.OPENAI_API_KEY`, ורק בתוך `api/joke.js`.
- את `SUPABASE_SECRET_KEY` אני שם בעצמי ב-Vercel, מסוג Secret, בסביבות Production ו-Preview. `SUPABASE_URL` נשמר ב-Vercel מסוג Config.
- הקוד קורא את `process.env.SUPABASE_SECRET_KEY` רק בתוך `lib/supabase.js`. את `process.env.SUPABASE_URL` קוראים `lib/supabase.js`, ומ-Milestone 5 גם `api/config.js`.
- `SUPABASE_PUBLISHABLE_KEY` (מ-Milestone 5) נשמר ב-Vercel מסוג Config, בכל הסביבות. הוא לא סוד: מותר להביא את הערך דרך המחבר של Supabase (get_publishable_keys), אבל הוא לא נכנס לשום קובץ ולא ל-`.env.example`. רק `api/config.js` קורא אותו, ואף פעם לא מחזירה מפתח סודי.
- ה-Client Secret של Google (בונוס) נשמר רק בדשבורד של Supabase: לא בקוד, לא בריפו ולא ב-Vercel.

## נתונים: Supabase (מ-Milestone 4)
- השמירה ב-Supabase, בטבלאות `public.jokes` ו-(מ-Milestone 6) `public.votes`. הפירוט ב-`spec/ARCHITECTURE.md`.
- רק הפונקציות בתיקיית `api` מדברות עם הטבלאות, דרך הלקוח היחיד עם המפתח הסודי ב-`lib/supabase.js`. הדף מדבר לנתונים רק עם `/api`, ולא קורא ולא כותב אף טבלה.
- כל טבלה נעולה: RLS דולק בלי policy, ‏grant רק ל-service_role, ‏revoke all מ-anon ומ-authenticated. כל פונקציה בבסיס הנתונים: revoke execute מ-public, anon ו-authenticated, ו-grant ל-service_role. לא מקבלים הצעה של Supabase להוסיף policy או grant ל-anon או ל-authenticated.
- עד Milestone 5: מונה הצחוקים מתעדכן רק דרך `public.add_laugh`, ב-rpc. מ-Milestone 6: ההצבעות רק דרך `public.cast_vote`, והרשימות רק דרך `public.joke_feed`, ב-rpc. laughs ו-add_laugh נשארים בבסיס הנתונים, בלי שימוש.

## כניסה: Supabase Auth (מ-Milestone 5)
- רמת הרשאות 3 לפי course-stack.md: משתמשים אמיתיים עם הרשמה עצמית, ב-Supabase Auth. מייל וסיסמה, ובונוס Google. בלי כלי כניסה אחר.
- בדפדפן, הספרייה `@supabase/supabase-js` (מ-jsDelivr, בגרסה קבועה) משמשת רק לכניסה, ב-`auth.js`: הרשמה, כניסה, התנתקות ושמירת הטוקן. כתובת הפרויקט והמפתח הציבורי מגיעים מ-`/api/config`, בזמן ריצה. בקשות ל-supabase.co רק ל-/auth/v1, אף פעם לא ל-/rest/v1.
- הדף שולח את טוקן הגישה בכותרת `Authorization: Bearer <token>`, ולא בגוף ולא בכתובת.
- הפונקציות מזהות משתמש רק עם `supabase.auth.getUser(token)`, דרך `getUserFromRequest` ב-`lib/supabase.js`. מזהה משתמש או שם שמגיעים מהדף לא נחשבים. user_id ו-author_name נלקחים רק מהמשתמש שחזר מ-getUser.
- צריך להתחבר: 401 עם `code: "auth_required"`. כל התשובות עם `Cache-Control: no-store`.
- כל טקסט מהשרת או מהמשתמש מוצג עם textContent, אף פעם לא innerHTML. בלי polling.
- כל SQL נשמר גם כקובץ בתיקיית `db/`, ומוצג לי לפני ההרצה.
- בכל שינוי בדף מעלים את גרסת המטמון ב-`sw.js`.

## Git ופריסה
- ריפו ציבורי: https://github.com/Eyalg1980/Joke-with-a-click-9-11-26, ענף `main` בלבד.
- משתמש Git: Eyalg1980, ‏eyalg333@gmail.com.
- הלינק החי נמצא ב-Vercel, לא ב-GitHub Pages. ב-Milestone 1 מנחים אותי לייבא את הריפו ל-Vercel ולשמור בו את המפתח. מאז, כל push ל-main מתעדכן לבד.
- בסוף כל שלב מספקים לי את הלינק החי.

## מודל
- כל השלבים, ההקמה וכל המיילסטונים, נעשים ב-Opus.

## עבודה במיילסטונים
- בונים לפי `spec/MILESTONES.md`, מיילסטון אחרי מיילסטון.
- כל מיילסטון נעשה בשיחה נפרדת בתיקייה הזו. השיחה נקראת milestone-1, milestone-2 וכן הלאה.
- לכל מיילסטון ארבעה שלבים:
  1. **תכנון:** קוראים את המסמכים הרלוונטיים ב-spec, וכותבים תוכנית ב-`spec/plans/milestone-N.md`.
  2. **בנייה:** כותבים את הקוד לפי התוכנית, ומעדכנים את קובץ התוכנית במה שנבנה בפועל.
  3. **הרצה:** אני בודק בכתובת של Vercel, או במחשב עם `vercel dev` (http://localhost:3000), לפי מה שאבחר.
  4. **דחיפה:** commit ו-push ל-main, ואז הלינק החי.
- בסוף כל מיילסטון עוצרים, ומחכים לבדיקה ולאישור מפורש שלי לפני שממשיכים.

## החלטות (הוכרעו ב-Milestone 2)
- GPT-5 נכבה ב-11.12.2026. שם המודל נקרא מ-`OPENAI_MODEL`, וברירת המחדל היא `gpt-5`. מחליפים מודל דרך Vercel, בלי לגעת בקוד.
- המודל מסרב לנושא: מציגים את מה שהמודל החזיר, כמו שהוא.
- מגבלת ההוצאה ב-OpenAI מספיקה כהגנה, יחד עם נושא עד 100 תווים ו-`max_output_tokens`.
- מותר שאותה בדיחה תחזור. (השמירה נוספה ב-Milestone 4, והמשתמשים ב-Milestones 5 ו-6.)
