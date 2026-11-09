# Milestone 1: Walking Skeleton, תוכנית ומה נבנה

## המטרה
הדף והפונקציה באוויר ב-Vercel, באותה כתובת, ומדברים זה עם זה. המפתח שמור ב-Vercel, עוד בלי AI.

## מה נבנה בפועל
| קובץ | מה יש בו |
|---|---|
| `index.html` | המסך הראשי לפי DESIGN.md: לוגו, הסבר, תווית, תיבה (maxlength 100), כפתור, בועה עם הדמות ושורת תחתית. CSS ו-JS בתוך הקובץ. הרקע מ-bg-dots ו-bg-doodles |
| `api/joke.js` | `export default { async fetch(request) }`. רק POST, אחרת 405 עם JSON. מחזירה `{ "joke": "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא/חסר" }`. הנושא נחתך ל-100 תווים. גוף שבור: "בלי נושא". console.log לכל בקשה, בשביל שורה ב-Logs |
| `package.json` | `"type": "module"`, בלי dependencies |

- הכפתור שולח POST ל-`/api/joke` בכתובת יחסית, ומציג את `joke` עם textContent.
- הבועה מחליפה מצב לפי `data-state`: idle, think, joke, error, עם ארבעת הציורים של הדמות והתנועות, ועם prefers-reduced-motion. השלד של ארבעת המצבים כבר כאן. ההודעות המלאות לכל שגיאה ייכנסו ב-Milestone 2.
- אין כותרות CORS, ואין טיפול ב-OPTIONS.
- הפונקציה לא מחזירה את המפתח, רק "נמצא" או "חסר".

## בדיקת קבצי ההקמה
- `.gitignore`: קיים, עם `.env`, `.env.*`, `!.env.example`, `.vercel`, `node_modules`.
- `.env.example`: קיים, 16 בתים, בדיוק הגודל של השורה `OPENAI_API_KEY=`. לא נקרא, בגלל החסימה.
- `.claude/settings.json`: קיים, חוסם `Read(./.env)` ו-`Read(./.env.*)`.

## נבדק לפני ה-push
- שרת מקומי שמדמה את Vercel: POST עם נושא, POST עם גוף שבור, ו-GET שמחזיר 405.
- צילום מסך ברוחב 390: מצב התחלה ומצב בדיחה, כמו ב-mockups.
- בקשת רשת אחת בלבד: `POST /api/joke`.

## ביד, אחריך (Vercel ו-OpenAI)
1. Vercel: New Project, ‏Import לריפו, ‏Framework Preset: Other, ‏Deploy.
2. OpenAI, ב-API keys: מפתח production בשם `joke-in-a-click`.
3. Vercel, ב-Environment Variables: `OPENAI_API_KEY`, סוג Secret, בסביבות Production ו-Preview. ואז Redeploy.
4. רשות, הרצה מקומית: מפתח `joke-in-a-click-dev` ב-`.env.local`, ואז `vercel dev`.

## פריסה בפועל
- הפרויקט `joke-app` נוצר ב-Vercel מה-CLI, מחובר לריפו, עם Framework Preset: Other. כל push ל-main נפרס לבד.
- הכתובת החיה: https://joke-app-ebon-nu.vercel.app
- `OPENAI_API_KEY` שמור ב-Vercel כ-Secret, ב-Production וב-Preview. נוסף ביד, לא דרך Claude.
- נבדק בכתובת החיה: POST עם "חתולים" מחזיר "המפתח: נמצא", ‏GET מחזיר 405, וב-Logs יש שורה `joke request` לכל בקשה.
