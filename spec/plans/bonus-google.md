# בונוס: כניסה עם Google, תוכנית

## המטרה
כפתור "המשך עם Google" בחלון הכניסה. אותו טוקן ואותן פונקציות. בשרת לא משתנה כלום, ובבסיס הנתונים לא משתנה כלום.

## מה כבר ידוע
- Supabase: הפרויקט `fuseiotgtrlugyiwfsyp`. ב-URL Configuration כבר יש Site URL ‏`https://jokewithaclick91126.vercel.app` ו-Redirect URL עם `/**` (מ-Milestone 5).
- `auth.js` כבר יוצר את הלקוח עם `flowType: 'pkce'` ו-`detectSessionInUrl: true`.
- בספרייה (2.119.0): כשחוזרים עם `?code=`, היא מחליפה אותו בטוקן לבד, ומנקה את `code` מהכתובת. כשחוזרים עם `?error=` (למשל ביטול), היא רק מחזירה שגיאה, והכתובת נשארת מלוכלכת. את זה מנקים אנחנו.
- `displayName` בשרת לא משתנה: Google ממלא את `user_metadata.full_name`.
- העבודה רק ב-Production, ולכן ב-Google נרשום רק את הכתובת של Vercel (לא localhost).

## סדר העבודה והעצירות

### שלב א: ביד (אתה), לפני הקוד
1. **Supabase:** Authentication, ואז Sign In / Providers, ואז Google. מעתיקים את **Callback URL (for OAuth)**. הוא נראה כך: `https://fuseiotgtrlugyiwfsyp.supabase.co/auth/v1/callback`. **עוד לא מדליקים.**
2. **Google Cloud Console** (console.cloud.google.com):
   1. פרויקט חדש, למשל `joke-in-a-click`.
   2. Google Auth Platform, ואז Get started: שם האפליקציה "בדיחה בלחיצה", מייל לתמיכה, Audience: **External**, מייל ליצירת קשר, ואישור.
   3. Clients, ואז Create client. סוג: **Web application**.
      - Authorized JavaScript origins: `https://jokewithaclick91126.vercel.app` (בלי / בסוף).
      - Authorized redirect URIs: ה-Callback URL מ-Supabase, בדיוק כמו שהוא.
   4. מעתיקים את **Client ID** ואת **Client Secret**. לא מדביקים אותם בצ'אט.
3. **חזרה ל-Supabase**, לספק Google: Enable, ‏Client IDs (ה-Client ID), ‏Client Secret, ו-Save. הסוד נשאר רק שם: לא בקוד, לא בריפו ולא ב-Vercel.

אפשר לכתוב את הקוד גם לפני שסיימת: כל עוד Google כבוי, הכפתור מציג "עוד לא מוגדרת", וזה בדיוק תנאי 4.

### שלב ב: הקוד
| קובץ | השינוי |
|---|---|
| `auth.js` | ‏`google()`, ובדיקת החזרה מ-Google (פירוט למטה) |
| `index.html` | כפתור "המשך עם Google" וקו מקווקו בחלון הכניסה. שמירת המצב לפני היציאה, ושחזור בחזרה |
| `sw.js` | ‏`joke-v5` ל-`joke-v6` |
| `api/*`, `lib/*`, `db/*` | בלי שינוי |

#### auth.js
- `google()`:
  1. `ready()`.
  2. בודקים ש-Google דולק: `GET <url>/auth/v1/settings` עם הכותרת `apikey` (המפתח הציבורי). זה נתיב ציבורי של /auth/v1. ‏`external.google` לא true: מחזירים `{ error: "הכניסה עם Google עוד לא מוגדרת." }`, בלי לצאת מהדף.
  3. `signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } })`. הספרייה מעבירה את הדף ל-Google.
- `returnError()`: נקרא אחרי `ready()`. בודק אם הכתובת חזרה מ-Google עם בעיה:
  - יש `error` או `error_description` (ב-? או ב-#): ‏`access_denied` הוא "הכניסה עם Google בוטלה.", וכל השאר "הכניסה עם Google לא הצליחה. נסו שוב.".
  - נשאר `?code=` ואין session (הקוד לא הוחלף): "הכניסה עם Google לא הצליחה. נסו שוב.".
  - בשני המקרים מנקים את הכתובת עם `history.replaceState`, בלי טעינה מחדש.
- את הפרמטרים קוראים **לפני** יצירת הלקוח, כי הספרייה מנקה את `code` כשההחלפה מצליחה.

#### index.html
- **בחלון הכניסה:** מעל שתי הלשוניות, כפתור לבן "המשך עם Google", בגובה 54, עם מסגרת 3 וצל קשה 5. בלי הלוגו של Google. מתחתיו קו מקווקו עם "או עם מייל וסיסמה". בזמן הבדיקה הכפתור נעול. שגיאה מוצגת בשורת השגיאה של החלון.
- **לפני היציאה,** ב-sessionStorage, במפתח אחד (`joke-google-return`):
  - הלשונית (`#joke`, ‏`#community` או `#liked`).
  - הבדיחה שעל המסך, אם יש: הטקסט, ה-id, השם, והמספרים.
  - ההצבעה שחיכתה לכניסה (`pendingVote`), אם יש.
- **בחזרה:** קוראים את המפתח ומוחקים אותו מיד (פעם אחת בלבד).
  - מחזירים את הלשונית.
  - מחזירים את הבדיחה לבועה, עם רכיב ההצבעה.
  - יש session וחיכתה הצבעה: שולחים אותה מיד, ואז הרשימה הפתוחה נטענת.
  - חזרה עם בעיה: חלון הכניסה נפתח עם ההודעה, וההצבעה שחיכתה חוזרת להמתין (אם נכנסים עכשיו עם מייל, היא תישלח).
- הכל עם textContent, כמו עד עכשיו.

### שלב ג: בדיקה שלי, לפני ה-push
- הדף ברוחב 375, מול השרת המדומה (מוסיפים לו `/auth/v1/settings` ו-`/auth/v1/authorize` מדומים):
  - Google כבוי: "עוד לא מוגדרת", בלי לצאת מהדף.
  - אורח לוחץ "אהבתי", ואז Google. חוזרים עם `?code=`: אותה לשונית, אותה בדיחה, וההצבעה נשלחה.
  - חוזרים עם `?error=access_denied`: חלון הכניסה עם "בוטלה", והכתובת נקייה.
  - אין גלילה לצד, ואין אף בקשה ל-`/rest/v1`.
- אחרי הפריסה: ב-Ctrl+U אין Client ID ואין Client Secret, ובקוד אין `GOCSPX`.

### שלב ד: דחיפה
commit ו-push ל-main. אין משתנים חדשים ב-Vercel.

### שלב ה: הבדיקה שלך, לפי חמשת תנאי ההשלמה
1. אורח לוחץ "אהבתי", בוחר Google, וחוזר מחובר: אותה בדיחה על המסך, וההצבעה כבר נספרה.
2. ב-Users: משתמש חדש, עם Provider של Google. כניסה שנייה עם Google: אותו משתמש, ולא חדש.
3. ביטול במסך של Google: חוזרים, וחלון הכניסה אומר שהכניסה בוטלה. הכתובת בלי `?error=`.
4. Google כבוי ב-Supabase: לחיצה מציגה "עוד לא מוגדרת", ולא מסך שגיאה של Supabase.
5. ה-Client Secret לא מופיע בשום קובץ ובשום משתנה ב-Vercel.

## החלטות (ברירות מחדל, לאישורך)
1. **בלי localhost ב-Google.** בודקים רק בפרודקשן, כמו בכל המיילסטונים. אם תרצה להריץ מקומית, מוסיפים את `http://localhost:3000` ל-origins.
2. **מצב Testing ב-Google.** אפליקציה חדשה ב-Google Auth Platform מתחילה ב-Testing, ורק משתמשי בדיקה שהוספת יכולים להיכנס. לבדיקה זה מספיק: מוסיפים את המייל שלך ב-Audience, ואז Test users. לפרסום לכולם צריך ללחוץ Publish app. בלי הרשאות רגישות, אין צורך באימות של Google.
3. **השם במסך ההסכמה של Google.** יופיע "להמשיך אל fuseiotgtrlugyiwfsyp.supabase.co", כי Google חוזר דרך Supabase. דומיין משלך הוא שינוי בתשלום ב-Supabase, ולא נדרש.
4. **משתמש שנרשם קודם במייל, ואחר כך נכנס עם Google באותו מייל:** Supabase מחבר את שתי הכניסות לאותו משתמש (כי Confirm email כבוי, והמייל נחשב מאושר). ייתכן שהשם יתעדכן לשם מ-Google. נבדוק את זה בפועל, ונרשום כאן.

## מה נבנה בפועל
- התוכנית וההחלטות אושרו.

### שלב ב: הקוד
- `auth.js`:
  - `landing`: הפרמטרים של החזרה (`code`, ‏`error`, ‏`error_description`, ‏`error_code`, מ-? ומ-#) נקראים כשהקובץ נטען, לפני שהספרייה נוגעת בכתובת.
  - `google()`: ‏`/auth/v1/settings` עם `apikey`. ‏`external.google` לא true: "הכניסה עם Google עוד לא מוגדרת.". אחרת `signInWithOAuth` עם `redirectTo` לכתובת האתר עם `/`.
  - `returnError()`: פעם אחת. ‏`access_denied`: "הכניסה עם Google בוטלה.". שגיאה אחרת, או `code` בלי session: "הכניסה עם Google לא הצליחה. נסו שוב.". מנקה מהכתובת את `code`, ‏`error`, ‏`error_description`, ‏`error_code` ו-`sb_flow_id`, ו-# של שגיאה.
- `index.html`:
  - כפתור לבן "המשך עם Google" (54, מסגרת 3, צל 5) מעל הלשוניות, וקו מקווקו "או עם מייל וסיסמה".
  - `saveForReturn()` לפני היציאה: הלשונית, הבדיחה שעל המסך (טקסט, id, שם, מספרים) וההצבעה שחיכתה, ב-sessionStorage תחת `joke-google-return`. Google כבוי: נמחק מיד.
  - בטעינה: `restoreSaved()` (קורא ומוחק מיד) מחזיר לשונית, בדיחה והצבעה שחיכתה, לפני `route()`.
  - `afterReturn()` רץ בתוך `authReady`, ולכן ההצבעה יוצאת לפני שהרשימה נטענת. חזרה עם בעיה: חלון הכניסה עם ההודעה, וההצבעה ממשיכה לחכות.
  - `pageshow` מהמטמון של הדפדפן (חזרה ממסך Google בכפתור החזרה): הכפתור נפתח שוב.
- `sw.js`: ‏`joke-v6`.
- השרת ובסיס הנתונים לא השתנו.

### נבדק לפני ה-push
הדף ברוחב 375, מול שרת מקומי שמדמה את `/api`, ‏`/auth/v1/settings`, ‏`/auth/v1/authorize` והחלפת הקוד (pkce):
- Google כבוי: "עוד לא מוגדרת", בלי לצאת מהדף, ובלי שמירה שנשארת.
- אורח מבקש בדיחה, לוחץ "אהבתי", ואז Google: חוזר מחובר, אותה בדיחה, "אהבתי 1" מסומן, הכתובת נקייה, וה-sessionStorage נמחק.
- ביטול מ"קהילה": חלון הכניסה עם "בוטלה" וההסבר על הדירוג, הכתובת בלי `?error=`, ובלשונית "קהילה".
- משם Google שוב: ה"לא אהבתי" שחיכה נשלח לפני טעינת הרשימה.
- קוד שלא הוחלף (נבדק בטעות, בגלל באג בשרת המדומה): "לא הצליחה", והכתובת נקייה.
- אין גלילה לצד, ואין אף בקשה ל-`/rest/v1`. בריפו אין Client ID ואין Client Secret.

### שלב א: השלבים הידניים
- Supabase: ה-Callback URL הועתק (`https://fuseiotgtrlugyiwfsyp.supabase.co/auth/v1/callback`).
- Google Cloud: פרויקט `joke-in-a-click`. ‏Google Auth Platform: שם "בדיחה בלחיצה", ‏External, מצב Testing, ומשתמש בדיקה אחד. ‏Client מסוג Web application, עם origin של Vercel וה-Callback של Supabase.
- Supabase: ספק Google דולק, עם ה-Client ID והסוד. הסוד רק שם.
- נבדק מבחוץ: `/auth/v1/settings` מחזיר `external.google: true`.

### שלב ד: דחיפה
- נדחף ל-main (`ad35f05`), ונפרס לבד: https://jokewithaclick91126.vercel.app

### נבדק בפרודקשן
- `sw.js`: ‏`joke-v6`. בדף: הכפתור "המשך עם Google" והקו "או עם מייל וסיסמה". ב-`auth.js`: ‏`signInWithOAuth`.
- בדף וב-`auth.js` אין `GOCSPX`, אין Client ID, ואין `sb_publishable_` או `sb_secret_`.
- `/auth/v1/authorize?provider=google` של Supabase: ‏302 ל-`accounts.google.com`, עם ה-Callback הנכון.
- `/api/feed` ו-`/api/vote` עובדים כמו קודם.
