function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
function sessionId(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(/(?:^|;\s*)tf_session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
async function currentUser(request, env) {
  const sid = sessionId(request);
  if (!sid) return null;
  return env.TECNOFA_DB.prepare(
    `SELECT u.id,u.role FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.id=?1 AND s.expires_at > datetime('now') AND u.active=1 LIMIT 1`
  ).bind(sid).first();
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: 'UNAUTHENTICATED' }, 401);

    const url = new URL(request.url);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '')
      ? url.searchParams.get('date')
      : new Date().toISOString().slice(0, 10);
    const year = date.slice(0, 4);

    const [technicians, clients, today, yearRows, upcoming, lowStock, stockValue, last30] = await Promise.all([
      env.TECNOFA_DB.prepare(`SELECT id,username,name,email FROM users WHERE role='TECNICO' AND active=1 ORDER BY name`).all(),
      env.TECNOFA_DB.prepare(`SELECT COUNT(*) AS count FROM clients`).first(),
      env.TECNOFA_DB.prepare(
        `SELECT i.id,i.code,i.activity_type,i.status,i.scheduled_date,i.scheduled_time,i.duration_minutes,
                i.hours,i.km,c.name AS client,u.id AS tech_id,u.name AS tech
         FROM interventions i JOIN clients c ON c.id=i.client_id
         LEFT JOIN users u ON u.id=i.assigned_user_id
         WHERE i.scheduled_date=?1 ORDER BY COALESCE(i.scheduled_time,'99:99'), i.created_at`
      ).bind(date).all(),
      env.TECNOFA_DB.prepare(`SELECT status,hours,km,scheduled_date FROM interventions WHERE scheduled_date LIKE ?1`).bind(`${year}%`).all(),
      env.TECNOFA_DB.prepare(
        `SELECT i.id,i.code,i.activity_type,i.status,i.scheduled_date,i.scheduled_time,
                c.name AS client,u.name AS tech
         FROM interventions i JOIN clients c ON c.id=i.client_id
         LEFT JOIN users u ON u.id=i.assigned_user_id
         WHERE i.scheduled_date > ?1 AND i.status NOT IN ('CHIUSO','ANNULLATO','ARCHIVIATO')
         ORDER BY i.scheduled_date, COALESCE(i.scheduled_time,'99:99') LIMIT 7`
      ).bind(date).all(),
      env.TECNOFA_DB.prepare(`SELECT id,name,stock,min_stock,cost FROM products WHERE min_stock>0 AND stock<=min_stock ORDER BY (stock-min_stock) ASC`).all(),
      env.TECNOFA_DB.prepare(`SELECT COALESCE(SUM(stock*cost),0) AS value FROM products`).first(),
      env.TECNOFA_DB.prepare(`SELECT COUNT(*) AS count FROM interventions WHERE scheduled_date>=date(?1,'-29 day') AND scheduled_date<=?1`).bind(date).first()
    ]);

    const rows = today.results || [];
    const yearData = yearRows.results || [];
    const techs = technicians.results || [];
    const closedStatuses = new Set(['CHIUSO','COMPLETATO']);
    const activeStatuses = new Set(['BOZZA','PROGRAMMATO','PROGRAMMATA','ASSEGNATO','CONFERMATO','IN VIAGGIO','IN CORSO','SOSPESO','DA COMPLETARE','IN ATTESA','DA PREVENTIVARE']);
    const pendingStatuses = new Set(['PROGRAMMATO','PROGRAMMATA','CONFERMATO','ASSEGNATO','DA COMPLETARE','IN ATTESA','DA PREVENTIVARE']);
    const normalize = s => String(s || '').trim().toUpperCase();
    const mapJob = j => ({
      id:j.id, code:j.code, type:j.activity_type || 'Intervento', status:j.status || 'BOZZA',
      date:j.scheduled_date, time:j.scheduled_time || '', client:j.client || 'Cliente',
      tech:j.tech || 'Non assegnato', techId:j.tech_id || '', hours:Number(j.hours || 0), km:Number(j.km || 0)
    });
    const todayJobs = rows.map(mapJob);
    const pending = todayJobs.filter(j => pendingStatuses.has(normalize(j.status))).length;
    const inProgress = todayJobs.filter(j => normalize(j.status) === 'IN CORSO').length;
    const doneToday = todayJobs.filter(j => closedStatuses.has(normalize(j.status))).length;
    const yearClosed = yearData.filter(j => closedStatuses.has(normalize(j.status))).length;
    const yearHours = yearData.reduce((s,j)=>s+Number(j.hours||0),0);
    const yearKm = yearData.reduce((s,j)=>s+Number(j.km||0),0);
    const avg = yearClosed ? yearData.filter(j=>closedStatuses.has(normalize(j.status))).reduce((s,j)=>s+Number(j.hours||0),0)/yearClosed : 0;
    const techWork = techs.map(t => {
      const mine = todayJobs.filter(j => j.techId === t.id);
      return { id:t.id, name:t.name, today:mine.length, open:mine.filter(j=>activeStatuses.has(normalize(j.status))).length };
    });

    return json({ ok:true, date, year, technicians:techWork, clients:Number(clients?.count||0),
      today:todayJobs, pending, inProgress, doneToday, yearCount:yearData.length, yearClosed,
      yearHours, yearKm, averageClosedHours:avg,
      upcoming:(upcoming.results||[]).map(mapJob), lowStock:lowStock.results||[],
      stockValue:Number(stockValue?.value||0), last30:Number(last30?.count||0)
    });
  } catch (error) {
    return json({ ok:false, error:'DASHBOARD_SERVER_ERROR', message:String(error?.message||error) },500);
  }
}
