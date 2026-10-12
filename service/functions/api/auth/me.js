function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function sessionId(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)tf_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export async function onRequestGet({ request, env }) {
  const sid = sessionId(request);
  if (!sid) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  const row = await env.TECNOFA_DB.prepare(
    `SELECT u.id,u.username,u.email,u.name,u.role,u.active,u.force_password_change,u.permissions_json
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.id=?1 AND datetime(s.expires_at) > datetime('now') AND u.active=1 LIMIT 1`
  ).bind(sid).first();
  if (!row) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  let permissions = {};
  try { permissions = JSON.parse(row.permissions_json || '{}'); } catch {}
  await env.TECNOFA_DB.prepare(`UPDATE sessions SET last_seen_at=datetime('now') WHERE id=?1`).bind(sid).run();
  return json({ ok: true, user: {
    id: row.id, username: row.username, email: row.email, name: row.name,
    role: row.role, active: true, mustChangePassword: Number(row.force_password_change) === 1, permissions
  }});
}
