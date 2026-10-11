export async function onRequestPost({ request, env }) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)tf_session=([^;]+)/);
  const sid = m ? decodeURIComponent(m[1]) : '';
  if (sid) await env.TECNOFA_DB.prepare('DELETE FROM sessions WHERE id=?1').bind(sid).run();
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'tf_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
    }
  });
}
