function json(data, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
function sid(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)tf_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function onRequestPost({ request, env }) {
  const session = sid(request);
  if (!session) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  const me = await env.TECNOFA_DB.prepare(
    `SELECT u.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?1 AND s.expires_at>datetime('now') AND u.active=1 LIMIT 1`
  ).bind(session).first();
  if (!me) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  const body = await request.json();
  const password = String(body?.password || '');
  if (password.length < 8) return json({ ok: false, error: 'PASSWORD_TOO_SHORT' }, 400);
  const hash = await sha256(password);
  await env.TECNOFA_DB.prepare(`UPDATE users SET password_hash=?1,force_password_change=0,updated_at=datetime('now') WHERE id=?2`).bind(hash, me.id).run();
  return json({ ok: true });
}
