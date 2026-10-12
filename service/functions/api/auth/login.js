const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...extra } });

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const ident = String(body?.identifier || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!ident || !password) return json({ ok: false, error: 'INVALID_CREDENTIALS' }, 400);

    const user = await env.TECNOFA_DB.prepare(
      `SELECT id, username, email, name, role, active, force_password_change, password_hash, permissions_json
       FROM users WHERE lower(username)=?1 OR lower(email)=?1 LIMIT 1`
    ).bind(ident).first();

    if (!user || Number(user.active) !== 1) return json({ ok: false, error: 'INVALID_CREDENTIALS' }, 401);
    const hash = await sha256(password);
    if (hash !== user.password_hash) return json({ ok: false, error: 'INVALID_CREDENTIALS' }, 401);

    const sessionId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.TECNOFA_DB.batch([
      env.TECNOFA_DB.prepare(`DELETE FROM sessions WHERE user_id=?1 OR datetime(expires_at) < datetime('now')`).bind(user.id),
      env.TECNOFA_DB.prepare(`INSERT INTO sessions(id,user_id,expires_at,last_seen_at) VALUES(?1,?2,?3,datetime('now'))`).bind(sessionId, user.id, expires),
      env.TECNOFA_DB.prepare(`UPDATE users SET last_login_at=datetime('now'), updated_at=datetime('now') WHERE id=?1`).bind(user.id)
    ]);

    let permissions = {};
    try { permissions = JSON.parse(user.permissions_json || '{}'); } catch {}
    return json({ ok: true, user: {
      id: user.id, username: user.username, email: user.email, name: user.name,
      role: user.role, active: true, mustChangePassword: Number(user.force_password_change) === 1, permissions
    }}, 200, { 'Set-Cookie': cookie('tf_session', sessionId, 30 * 24 * 60 * 60) });
  } catch (error) {
    return json({ ok: false, error: 'AUTH_SERVER_ERROR', message: String(error?.message || error) }, 500);
  }
}
