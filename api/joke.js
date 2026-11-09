// Milestone 2: בדיחה מ-GPT-5 דרך Responses API.
// המפתח נקרא רק כאן, מ-process.env, ולעולם לא חוזר לדפדפן.

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
  return Response.json({ error: ERRORS[key] }, { status });
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
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר לשלוח רק POST.' }, { status: 405 });
    }

    // גוף שבור או נושא שאינו טקסט נחשבים "אין נושא"
    let topic = '';
    try {
      const body = await request.json();
      if (typeof body?.topic === 'string') topic = body.topic.trim().slice(0, 100);
    } catch {}

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return errorResponse('config', 500);
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5';
    console.log(`joke request: topic="${topic}", model=${model}`);

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

    return Response.json({ joke });
  },
};
