// בדיחה מ-GPT-5 דרך Responses API, ושמירה שלה ב-Supabase.
// המפתח של OpenAI נקרא רק כאן, מ-process.env, ולעולם לא חוזר לדפדפן.
// משתמש מחובר מזוהה רק מהטוקן, לפני הפנייה ל-OpenAI.
import { getSupabase, hasToken, getUserFromRequest, displayName } from '../lib/supabase.js';
import { json, error, authRequired, methodNotAllowed, readJson } from '../lib/http.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';

const INSTRUCTIONS =
  'אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה.';

const ERRORS = {
  config: 'השרת עוד לא מוגדר. נסו שוב מאוחר יותר.',
  auth: 'יש בעיה במפתח של השרת. נסו שוב מאוחר יותר.',
  credit: 'נגמר הקרדיט לבדיחות. נסו שוב מאוחר יותר.',
  spendLimit: 'הגענו למגבלת ההוצאה החודשית. נסו שוב בחודש הבא.',
  rateLimit: 'יותר מדי בקשות כרגע. חכו רגע ונסו שוב.',
  model: 'המודל שהוגדר לא נמצא. נסו שוב מאוחר יותר.',
  timeout: 'הבדיחה מתעכבת יותר מדי. נסו שוב.',
  network: 'אין חיבור ל-AI כרגע. נסו שוב עוד רגע.',
  empty: 'לא הצלחתי לכתוב בדיחה הפעם. נסו שוב.',
  general: 'ה-AI לא זמין כרגע. נסו שוב עוד רגע.',
};

function errorResponse(key, status) {
  return error(ERRORS[key], status);
}

// מתרגם שגיאה של OpenAI להודעה בעברית, לפי הסטטוס וה-error.code
function openaiErrorKey(status, code) {
  if (status === 401) return 'auth';
  if (code === 'insufficient_quota' || code === 'credit_balance_exhausted') return 'credit';
  if (typeof code === 'string' && /_(spend|usage)_limit_exceeded$/.test(code)) return 'spendLimit';
  if (status === 429) return 'rateLimit';
  if (status === 404 || code === 'model_not_found') return 'model';
  return 'general';
}

// output_text אם קיים, אחרת הטקסט מהפריטים מסוג message.
// גם סירוב (refusal) נחשב טקסט: מציגים את מה שהמודל החזיר.
function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const parts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === 'output_text' && typeof part.text === 'string') parts.push(part.text);
      if (part?.type === 'refusal' && typeof part.refusal === 'string') parts.push(part.refusal);
    }
  }
  return parts.join('').trim();
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return methodNotAllowed('POST');

    // גוף שבור או נושא שאינו טקסט נחשבים "אין נושא". שדות אחרים בגוף לא נחשבים.
    const body = await readJson(request);
    const topic = typeof body?.topic === 'string' ? body.topic.trim().slice(0, 100) : '';

    // יש טוקן: מזהים את המשתמש לפני OpenAI.
    // טוקן לא מוכר: 401. Supabase לא זמין: הבדיחה מגיעה, בלי שמירה.
    const supabase = getSupabase();
    let user = null;
    let canSave = Boolean(supabase);
    if (hasToken(request)) {
      try {
        user = await getUserFromRequest(request, supabase);
        if (!user) return authRequired();
      } catch (err) {
        console.error(`identify user failed: ${err?.message}`);
        canSave = false;
      }
    }
    const author = user ? { user_id: user.id, author_name: displayName(user) } : null;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return errorResponse('config', 500);
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5';
    console.log(`joke request: topic="${topic}", model=${model}, user=${user ? 'yes' : 'guest'}`);

    let res;
    try {
      res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: INSTRUCTIONS,
          input: topic ? `נושא הבדיחה: ${topic}` : 'אין נושא. ספר בדיחה כללית על החיים.',
          reasoning: { effort: 'low' },
          max_output_tokens: 2000,
          store: false,
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      console.error(`OpenAI fetch failed: ${err?.name}: ${err?.message}`);
      return errorResponse(err?.name === 'TimeoutError' ? 'timeout' : 'network', 502);
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const code = data?.error?.code ?? data?.error?.type;
      console.error(
        `OpenAI error: status=${res.status}, code=${code}, message=${data?.error?.message}`,
      );
      return errorResponse(openaiErrorKey(res.status, code), 502);
    }

    if (data?.status === 'incomplete') {
      console.error(`OpenAI incomplete: reason=${data.incomplete_details?.reason}`);
      return errorResponse('empty', 502);
    }

    const joke = extractText(data);
    if (!joke) {
      console.error(`OpenAI returned no text: status=${data?.status}`);
      return errorResponse('empty', 502);
    }

    const id = canSave ? await saveJoke(supabase, topic, joke, author) : null;
    // השם חוזר רק כשהבדיחה נשמרה עם השם
    const authorName = id && author ? author.author_name : null;
    return json(id ? { joke, id, author_name: authorName } : { joke, author_name: null });
  },
};

// שומר את הבדיחה בטבלה ומחזיר את ה-id. כשל: null, והבדיחה עדיין מגיעה למשתמש.
// user_id ו-author_name רק מהמשתמש שחזר מ-getUser.
async function saveJoke(supabase, topic, text, author) {
  try {
    const row = { topic: topic || null, text };
    if (author) Object.assign(row, author);
    const { data, error: dbError } = await supabase
      .from('jokes')
      .insert(row)
      .select('id')
      .single();
    if (dbError) {
      console.error(`save joke failed: code=${dbError.code}, message=${dbError.message}`);
      return null;
    }
    return data.id;
  } catch (err) {
    console.error(`save joke failed: ${err?.name}: ${err?.message}`);
    return null;
  }
}
