# Milestone 3: התקנה בטלפון, תוכנית ומה נבנה

## המטרה
מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא.

## מה בונים
| קובץ | השינוי |
|---|---|
| `manifest.webmanifest` | ‏`name: "בדיחה בלחיצה"`, ‏`short_name`, ‏`start_url`, ‏`display: standalone`, ‏`lang: he`, ‏`dir: rtl`, ‏`theme_color` ו-`background_color` ‏`#FFE15A`, ושלושה אייקונים מ-assets |
| `sw.js` | network-first לפי סעיף 7 ב-ARCHITECTURE. ‏/api, בקשה שאינה GET ובקשה לכתובת אחרת: לא נוגעים |
| `index.html` | קישור ל-manifest, ‏`theme-color`, אייקון, ורישום של sw.js |

## מה נבנה בפועל
- `manifest.webmanifest`: השדות מהתוכנית, ועוד `id`, ‏`scope` ו-`description`. ‏`short_name: "בדיחה"`, כדי שיתאים מתחת לאייקון. האייקונים: ‏icon-192 ו-icon-512 עם `purpose: any`, ו-icon-512-maskable עם `purpose: maskable`.
- `sw.js`:
  - install: שומר במטמון את `/`, את ה-manifest, את כל קבצי ה-SVG מ-assets ואת שני האייקונים (192, 512). ‏`skipWaiting`.
  - activate: מוחק מטמון של גרסה ישנה, ו-`clients.claim`.
  - fetch: רק GET מאותה כתובת, לא /api. קודם רשת, ושומר עותק של תשובה תקינה. אין רשת: מהמטמון, ולניווט נופל ל-`/`.
  - הגופנים מ-Google Fonts לא נשמרים, כי הם מכתובת אחרת.
- `index.html`: ‏`<meta name="theme-color">`, ‏`<link rel="manifest">`, ‏`<link rel="icon">` ל-icon.svg, ‏`apple-touch-icon` ל-icon-192 (בשביל iPhone), ורישום של `/sw.js` אחרי `load`.

## נבדק לפני ה-push
בדפדפן Chromium, מול שרת מקומי עם /api/joke מדומה:
- ה-manifest נטען, `display: standalone`, ושלושת האייקונים נטענים.
- ה-service worker נרשם. שתי לחיצות מחזירות שתי בדיחות שונות.
- ב-Cache Storage יש 14 כתובות, ואף אחת מהן לא /api.
- בלי רשת: הדף והלוגו נטענים מהמטמון, ולחיצה מציגה "אין חיבור לשרת כרגע. נסו שוב."

## פריסה בפועל
- נדחף ל-main, ונפרס לבד ב-Vercel: https://joke-app-ebon-nu.vercel.app
- נבדק בכתובת החיה: ‏`manifest.webmanifest` ו-`sw.js` מחזירים 200, והדף מקושר ל-manifest.
- אושר.
