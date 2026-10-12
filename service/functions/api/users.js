function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function sid(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)tf_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
async function currentUser(request, env) {
  const id = sid(request);
  if (!id) return null;
  return env.TECNOFA_DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.id=?1 AND datetime(s.expires_at) > datetime('now') AND u.active=1 LIMIT 1`
  ).bind(id).first();
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function publicUser(row) {
  let permissions = {};
  try { permissions = JSON.parse(row.permissions_json || '{}'); } catch {}
  return { id: row.id, username: row.username, email: row.email, name: row.name,
    role: row.role, active: Number(row.active) === 1,
    mustChangePassword: Number(row.force_password_change) === 1, permissions };
}
function canManageUsers(me) {
  let permissions = {};
  try { permissions = JSON.parse(me?.permissions_json || '{}'); } catch {}
  return me?.role === 'AMMINISTRATORE' || permissions.users === 'manage';
}

export async function onRequestGet({ request, env }) {
  const me = await currentUser(request, env);
  if (!me) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  if (!canManageUsers(me)) return json({ ok: false, error: 'FORBIDDEN' }, 403);
  const rows = await env.TECNOFA_DB.prepare(`SELECT id,username,email,name,role,active,force_password_change,permissions_json FROM users ORDER BY name COLLATE NOCASE`).all();
  return json({ ok: true, users: (rows.results || []).map(publicUser) });
}

export async function onRequestPost({ request, env }) {
  const me = await currentUser(request, env);
  if (!me) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);
  if (!canManageUsers(me)) return json({ ok: false, error: 'FORBIDDEN' }, 403);

  const b = await request.json();
  const requestedId = String(b?.id || '').trim();
  if (b?.delete === true) {
    if (!requestedId) return json({ ok: false, error: 'USER_ID_REQUIRED' }, 400);
    if (requestedId === me.id) return json({ ok: false, error: 'CANNOT_DELETE_SELF' }, 400);
    const target = await env.TECNOFA_DB.prepare(`SELECT id,username,role FROM users WHERE id=?1`).bind(requestedId).first();
    if (!target) return json({ ok: false, error: 'USER_NOT_FOUND' }, 404);
    if (target.username === 'admin' || target.role === 'AMMINISTRATORE') return json({ ok: false, error: 'PROTECTED_ADMIN' }, 400);
    await env.TECNOFA_DB.prepare(`DELETE FROM users WHERE id=?1`).bind(requestedId).run();
    return json({ ok: true, deletedId: requestedId });
  }

  const id = requestedId || `USR-${Date.now().toString(36).toUpperCase()}`;
  const name = String(b?.name || '').trim();
  const username = String(b?.username || '').trim().toLowerCase();
  const email = String(b?.email || '').trim().toLowerCase();
  const role = String(b?.role || 'TECNICO');
  const active = b?.active === false ? 0 : 1;
  const permissions = b?.permissions && typeof b.permissions === 'object' ? b.permissions : {};
  if (!name || !username || !['AMMINISTRATORE','TECNICO','AMMINISTRAZIONE','LETTURA'].includes(role)) return json({ ok: false, error: 'INVALID_USER' }, 400);

  const existing = await env.TECNOFA_DB.prepare(`SELECT id,password_hash,force_password_change FROM users WHERE id=?1`).bind(id).first();
  const duplicate = await env.TECNOFA_DB.prepare(`SELECT id FROM users WHERE (lower(username)=?1 OR lower(email)=?2) AND id<>?3 LIMIT 1`).bind(username, email, id).first();
  if (duplicate) return json({ ok: false, error: 'USERNAME_OR_EMAIL_EXISTS' }, 409);

  let passwordHash = existing?.password_hash || '';
  let forceChange = existing?.force_password_change || 0;
  if (b?.password) {
    const p = String(b.password);
    if (p.length < 8) return json({ ok: false, error: 'PASSWORD_TOO_SHORT' }, 400);
    passwordHash = await sha256(p);
    forceChange = 0;
  }
  if (!passwordHash) return json({ ok: false, error: 'PASSWORD_REQUIRED' }, 400);

  await env.TECNOFA_DB.prepare(`
    INSERT INTO users(id,username,email,name,role,active,force_password_change,password_hash,permissions_json)
    VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username,email=excluded.email,name=excluded.name,role=excluded.role,
      active=excluded.active,force_password_change=excluded.force_password_change,password_hash=excluded.password_hash,
      permissions_json=excluded.permissions_json,updated_at=datetime('now')
  `).bind(id, username, email, name, role, active, forceChange, passwordHash, JSON.stringify(permissions)).run();

  const saved = await env.TECNOFA_DB.prepare(`SELECT id,username,email,name,role,active,force_password_change,permissions_json FROM users WHERE id=?1`).bind(id).first();
  return json({ ok: true, user: publicUser(saved) });
}
