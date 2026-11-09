# Milestone 2: בדיחה מ-GPT-5, תוכנית ומה נבנה

## המטרה
הבדיחה מגיעה מ-GPT-5 דרך הפונקציה, והמפתח נשאר בשרת.

## ההחלטות הפתוחות, הוכרעו
| השאלה | ההחלטה |
|---|---|
| המודל מסרב לנושא | מציגים את מה שהמודל החזיר, כמו שהוא. גם חלק מסוג `refusal` בתשובה נחשב טקסט להצגה |
| מגבלת ההוצאה כהגנה | מספיקה: קרדיט מראש, Auto recharge כבוי, מגבלה חודשית. בקוד: נושא עד 100 תווים ו-`max_output_tokens` |
| אותה בדיחה חוזרת | בסדר. בלי שמירה ובלי היסטוריה, לפי ה-PRD |
| GPT-5 נכבה ב-11.12.2026 | בלי שינוי בקוד. מחליפים מודל דרך `OPENAI_MODEL` ב-Vercel, ואז Redeploy |

## מה נבדק בתיעוד העדכני
- OpenAI, ‏Create response: ‏POST אל `https://api.openai.com/v1/responses`, עם `model`, ‏`instructions`, ‏`input`, ‏`reasoning.effort`, ‏`max_output_tokens`, ‏`store`.
- `max_output_tokens` כולל גם את טוקני ה-reasoning. לכן הוא 2000, ולא 200: אחרת המודל עלול לגמור את התקציב על חשיבה ולא להחזיר טקסט.
- GPT-5 תומך ב-`reasoning.effort` עם minimal, ‏low, ‏medium ו-high. נשאר `low`, לפי ARCHITECTURE.
- `output_text` הוא שדה נוחות שה-SDK מוסיף. ב-REST גולמי הוא לא מובטח, ולכן יש גם שליפה מ-`output`: פריטים מסוג `message`, חלקים מסוג `output_text` (או `refusal`).
- `status: "incomplete"` עם `incomplete_details.reason`: הבדיחה נקטעה. מחזירים שגיאה.
- שגיאות: 401 מפתח שגוי. 429 עם `error.code`: ‏`insufficient_quota` / `credit_balance_exhausted` נגמר הקרדיט, ‏`*_spend_limit_exceeded` מגבלת הוצאה, אחרת יותר מדי בקשות. 404 או `model_not_found`: שם מודל שגוי.
- `store: false`, כי המוצר לא שומר כלום.
- Vercel: ‏`export default { fetch(request) }` נתמך ב-Node.js, עם `"type": "module"`. ‏fetch גלובלי זמין.

## מה בונים
| קובץ | השינוי |
|---|---|
| `api/joke.js` | קריאה ל-Responses API עם fetch, הפרומפט המרכזי, שליפת הטקסט, מיפוי שגיאות להודעות בעברית, ו-console.error עם הסטטוס והקוד |
| `index.html` | ארבעת המצבים כבר קיימים מ-Milestone 1. לבדוק שאין צורך בשינוי |
| `CLAUDE.md` | ההחלטות הפתוחות עוברות ל"הוכרעו" |

## החוזה (לא משתנה)
- POST ‏`{ "topic": "..." }` מחזיר 200 עם `{ "joke": "..." }`.
- שגיאה: `{ "error": "הודעה קצרה בעברית" }`, עם 405, ‏500 או 502.

## מה נבנה בפועל
- `api/joke.js`: קריאה ל-Responses API לפי סעיף 4 ב-ARCHITECTURE, עם `store: false` ו-timeout של 30 שניות.
- מפתח חסר: 500. כל שגיאה של OpenAI, רשת או timeout: ‏502. תמיד `{ "error": "..." }` בעברית, והפרטים (סטטוס, קוד, הודעה) ב-console.error.
- `index.html`: בלי שינוי. ארבעת המצבים, "עוד בדיחה!", "לנסות שוב", ‏maxlength 100 ותשובה שאינה JSON כבר מטופלים מ-Milestone 1.
- `CLAUDE.md`: ההחלטות הפתוחות סומנו כהוכרעו.

## נבדק לפני ה-push
בדיקה מקומית עם fetch מדומה במקום OpenAI, בלי מפתח אמיתי:
- נושא, נושא ריק, גוף שבור ונושא של 150 תווים (נחתך ל-100).
- `output_text`, פריט `message`, וסירוב (`refusal`) שמוצג כמו שהוא.
- `incomplete`, תשובה בלי טקסט, 401, ‏`insufficient_quota`, ‏`project_spend_limit_exceeded`, ‏`rate_limit_exceeded`, ‏`model_not_found`, ‏404, ‏500 עם HTML, רשת ו-timeout.
- `OPENAI_MODEL` נקרא מהסביבה, מפתח חסר מחזיר 500, ו-GET מחזיר 405.
- באג שנמצא ותוקן: `rate_limit_exceeded` זוהה בטעות כמגבלת הוצאה.
- אין `sk-` בקוד.
