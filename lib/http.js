// עזרים קטנים לפונקציות בתיקיית api.
// כל התשובות עם Cache-Control: no-store, כי הן תלויות במי ששואל.

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function error(message, status, code) {
  return json(code ? { error: message, code } : { error: message }, status);
}

// צריך להתחבר (שוב): 401 עם code: "auth_required"
export function authRequired() {
  return error('צריך להתחבר שוב.', 401, 'auth_required');
}

export function methodNotAllowed(method) {
  return error(`אפשר לשלוח רק ${method}.`, 405);
}

// קורא גוף JSON עד maxBytes. גוף ריק, ארוך מדי או שבור: null.
export async function readJson(request, maxBytes = 2048) {
  try {
    const text = await request.text();
    if (!text || new TextEncoder().encode(text).length > maxBytes) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}
