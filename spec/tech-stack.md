# TECH STACK: בדיחה בלחיצה

## 1. התאמה לסטאק הקורס
| דרישה מה-PRD | MoSCoW | סטאק הקורס |
|---|---|---|
| מסך ראשי בעברית, מותאם לטלפון | Must | מכסה: אתר סטטי, HTML, CSS ו-JavaScript |
| בדיחה מ-GPT-5 דרך השרת | Must | מכסה חלקית: פונקציה ב-Vercel מכוסה. המודל שונה מברירת המחדל, ראו סעיף 2 |
| בדיחה כללית כשאין נושא | Must | מכסה: לוגיקה בפונקציה |
| טעינה ושגיאה, פרטים ב-Logs | Must | מכסה: JSON תמיד, console.error |
| PWA | Must | מכסה: קבצים סטטיים בריפו, manifest ו-service worker. אין צורך בספרייה |
| החלפת מודל דרך OPENAI_MODEL | Must | מכסה: משתנה סביבה מסוג Config |
| אייקון maskable | Should | מכסה: קובץ תמונה בריפו |
| שמירת נתונים | אין | לא נדרש. בלי Supabase, בלי גיליון ובלי JSON |

## 2. השוואות
הצורך היחיד שהסטאק לא קובע הוא המודל. ההחלטה כבר בבריף: GPT-5.

| אפשרות | התאמה | שילוב | עלות | הערה |
|---|---|---|---|---|
| GPT-5 של OpenAI | נקבע בבריף | fetch אל Responses API, בלי ספרייה | בתשלום, קרדיט מראש | מסומן כמודל קודם. הגרסה מתוכננת להיכבות ב-11.12.2026 |
| Gemini Flash | ברירת המחדל של הקורס | fetch אל Gemini API | שכבה חינמית | חלופה אם רוצים בלי תשלום |
| gpt-6-luna של OpenAI | הדור הנוכחי והזול | אותו קוד, רק שם מודל אחר | בתשלום | המעבר אחרי GPT-5, דרך OPENAI_MODEL |

## 3. ההמלצה
סטאק הקורס כמו שהוא, ועליו תוספת אחת: OpenAI במקום Gemini Flash, כי התרגיל מלמד מפתח בתשלום ומגבלת הוצאה.

| שכבה | הבחירה | הנימוק |
|---|---|---|
| צד הלקוח | HTML, CSS ו-JavaScript בשורש הריפו | בלי build, מה שכתוב הוא מה שרץ |
| אחסון ופריסה | Vercel, פרויקט אחד, Hobby | האתר והפונקציה באותה כתובת, ולכן בלי CORS |
| צד השרת | Vercel Function אחת: api/joke.js | המקום היחיד שבו המפתח קיים |
| AI | OpenAI Responses API, מודל gpt-5 | נקבע בבריף. שם המודל ב-OPENAI_MODEL, כדי לעבור בלי לגעת בקוד |
| PWA | manifest.webmanifest ו-sw.js | התקנה בטלפון, בלי ספרייה |
| גופנים | Google Fonts: Fredoka ו-Playpen Sans Hebrew | שני גופנים, קישור אחד בראש הדף, בלי קבצים בריפו |
| הרצה | Vercel, ובאופן רשות גם vercel dev במחשב | מקומית: מפתח dev ב-.env.local, לפי ארבעת הכללים ב-course-stack.md |
| גרסאות | Git ו-GitHub, ענף main | כל push נפרס לבד |
| נתונים, אוטומציות, מייל | אין | המוצר לא שומר דבר |

השינוי היחיד מברירת המחדל הוא OpenAI במקום Gemini Flash. OpenAI מופיע בסטאק כחלופה בתשלום, ולכן זו לא חריגה מהסטאק.

## מקורות
- [OpenAI: Text generation, Responses API](https://developers.openai.com/api/docs/guides/text)
- [OpenAI: GPT-5 model](https://developers.openai.com/api/docs/models/gpt-5)
- [OpenAI: Deprecations](https://developers.openai.com/api/docs/deprecations)
- [OpenAI: Spend limits](https://developers.openai.com/api/docs/guides/spend-limits)
- [Vercel: Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel: Config and Secret environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Vercel: Development environment variables ו-.env.local](https://vercel.com/docs/environment-variables)
- [Claude Code: חסימת קריאה של .env](https://code.claude.com/docs/en/settings)
- [Vercel: Hobby plan](https://vercel.com/docs/plans/hobby)
- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [web.dev: Install criteria](https://web.dev/articles/install-criteria)
