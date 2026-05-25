# אופטיקה — קביעת תורים

מערכת בעברית לקביעת תור לבדיקת ראייה, עם שני מסלולי הזמנה וממשק ניהול לפי תפקיד.

## דרישות

- Node.js 18+
- npm

## התקנה והרצה (מצב דמו)

```bash
cd optica
npm install
```

צרו `.env.local` (או העתיקו מ-`.env.example`):

```env
VITE_DEMO_MODE=true
```

```bash
npm run dev
```

פתחו את הכתובת ש-Vite מציג (בדרך כלל `http://localhost:5173`).

### משתמשים לדמו (ממשק ניהול)

| תפקיד | שם משתמש | סיסמה | הרשאות |
|--------|-----------|--------|---------|
| מנהל | `admin` | `admin123` | כל התורים, כל הזמינות, לקוחות |
| צוות — יוסי | `yossi` | `staff123` | תורים וזמינות של ד"ר יוסי כהן |
| צוות — מיכל | `michal` | `staff123` | תורים וזמינות של ד"ר מיכל לוי |
| צוות — דנה | `dana` | `staff123` | תורים וזמינות של ד"ר דנה אברהם |

כניסה: `/login` → `/admin`

## משתני סביבה

| משתנה | דמו מקומי | Supabase + Vercel |
|--------|-----------|-------------------|
| `VITE_DEMO_MODE` | `true` (ברירת מחדל) | `false` |
| `VITE_SUPABASE_URL` | — | כתובת הפרויקט (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | — | מפתח anon (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **לא** בפרונט | רק ב-Supabase CLI / SQL — לעולם לא ב-Vite |

## Supabase — הגדרת פרויקט

1. צרו פרויקט ב-[supabase.com](https://supabase.com) → **SQL Editor**.
2. הריצו את `supabase/schema.sql` (טבלאות, RLS, אופטומטריסטים).
3. **Authentication** → **Providers** → הפעילו **Email** (סיסמה).
4. צרו משתמשים (**Authentication → Users → Add user**):

   | שם משתמש (בממשק) | אימייל ב-Supabase | סיסמה |
   |------------------|-------------------|--------|
   | `admin` | `admin@optica.app` | `admin123` |
   | `yossi` | `yossi@optica.app` | `staff123` |
   | `michal` | `michal@optica.app` | `staff123` |
   | `dana` | `dana@optica.app` | `staff123` |

   הממשק שולח התחברות כ-`{username}@optica.app` (דומיין: `optica.app`).

5. הריצו `supabase/seed.sql` (זמינות לדוגמה + קישור `profiles` ל-`auth.users`).

6. מקומית, ב-`.env.local`:

   ```env
   VITE_DEMO_MODE=false
   VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

7. `npm run dev` — הזמנות ציבוריות וניהול דרך Supabase Auth + RLS.

### RLS (תמצית)

- **ציבור (anon):** קריאת אופטומטריסטים, זמינות ותורים; יצירת תור חדש.
- **מנהל:** עדכון/מחיקה של כל התורים והזמינות.
- **צוות:** עדכון/מחיקה רק לתורים וזמינות של האופטומטריסט שלהם (`profiles.optometrist_id`).

## Vercel — פריסה

1. דחפו את `optica` ל-GitHub (או חברו repo ב-Vercel).
2. **Import Project** → Framework: **Vite** (או זיהוי אוטומטי).
3. **Root Directory:** `optica` (אם ה-repo הוא תיקיית האב).
4. Build: `npm run build` · Output: `dist` (מוגדר גם ב-`vercel.json`).
5. **Environment Variables** (Production + Preview):

   ```
   VITE_DEMO_MODE=false
   VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

6. Deploy. ניתוב SPA ל-React Router מטופל ב-`vercel.json`.

### CLI (אופציונלי)

```bash
npm i -g vercel
cd optica
vercel
vercel env add VITE_DEMO_MODE
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## זרימות הזמנה (ציבור)

1. **לפי אופטומטריסט** — בחירת אופטומטריסט → תאריך ושעה → פרטים → אישור (ללא תשלום).
2. **לפי תאריך ושעה** — תאריך ושעה → בחירת אופטומטריסט פנוי → פרטים → אישור.

## נקודות כניסה בקוד

| נתיב | קובץ |
|------|------|
| אפליקציה | `src/main.jsx` → `src/App.jsx` |
| הזמנה | `src/pages/Book.jsx` |
| ניהול | `src/pages/Admin.jsx` |
| התחברות | `src/pages/Login.jsx` |
| בחירת backend | `src/api/base44Client.js` |
| דמו | `src/api/demoClient.js` |
| Supabase | `src/api/dataClient.js`, `src/api/supabase.js` |

## אחסון

- **דמו:** `localStorage` (`optica-demo-store-v1`) + `sessionStorage` לסשן.
- **Supabase:** `@supabase/supabase-js` + Auth + PostgREST עם RLS.

## איפוס נתוני דמו

בדפדפן: מחקו את המפתח `optica-demo-store-v1` ב-localStorage ורעננו את הדף.

## בדיקות

```bash
npm run typecheck
npm run build
```
