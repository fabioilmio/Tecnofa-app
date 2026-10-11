/* TECNOFA Gestionale — API health / D1 binding check */
export async function onRequestGet({ env }) {
  try {
    const row = await env.TECNOFA_DB.prepare("SELECT value FROM app_meta WHERE key = 'schema_version' LIMIT 1").first();
    const tables = await env.TECNOFA_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return Response.json({
      ok: true,
      database: 'tecnofa-gestionale-db',
      binding: 'TECNOFA_DB',
      schemaReady: !!row,
      schemaVersion: row?.value || null,
      tables: tables.results?.map(x => x.name) || []
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({
      ok: false,
      error: 'D1_NOT_READY',
      message: String(error?.message || error)
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
