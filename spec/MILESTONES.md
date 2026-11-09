# MILESTONES: בדיחה בלחיצה
כלל: בסוף כל Milestone ה-AI עוצר, וממתין לבדיקה ולאישור מפורש שלי לפני שהוא ממשיך.

שלושה Milestones, כשעתיים בסך הכל. את המפתחות של OpenAI אף פעם לא נותנים ל-Claude: מפתח ה-production עובר ישר מ-OpenAI ל-Vercel, ומפתח ה-dev מודבק ביד ב-.env.local.

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
