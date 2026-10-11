/* TECNOFA Gestionale — Dashboard operativa */
(function(){
  const safe=s=>typeof esc==='function'?esc(s):String(s??'');
  const todayKey=()=>new Date().toISOString().slice(0,10);
  const getArray=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}};
  const hoursOf=j=>Number(j?.hours)||0;
  function uniqueJobs(list){
    const seen=new Set();
    return list.filter(j=>{
      const key=String(j?.id??'').trim()||[j?.date,j?.time,j?.clientId,j?.client,j?.type,j?.tech,j?.status].join('|');
      if(seen.has(key))return false; seen.add(key); return true;
    });
  }
  function dashboard(){
    const clients=Array.isArray(state.clients)?state.clients:[];
    const jobs=uniqueJobs(Array.isArray(state.interventions)?state.interventions:[]);
    const today=todayKey();
    const now=new Date();
    const year=now.getFullYear();
    const monthStart=new Date(now); monthStart.setDate(now.getDate()-30);
    const yearJobs=jobs.filter(j=>String(j.date||'').startsWith(String(year)));
    const last30=jobs.filter(j=>{const d=new Date((j.date||'')+'T23:59:59');return !Number.isNaN(d.getTime())&&d>=monthStart;});
    const todayJobs=jobs.filter(j=>j.date===today).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const pending=jobs.filter(j=>['Programmata','Confermato','Da completare','In attesa'].includes(j.status));
    const closedYear=yearJobs.filter(j=>j.status==='Chiuso');
    const yearHours=yearJobs.reduce((s,j)=>s+hoursOf(j),0);
    const last30Hours=last30.reduce((s,j)=>s+hoursOf(j),0);
    const avgHours=closedYear.length?closedYear.reduce((s,j)=>s+hoursOf(j),0)/closedYear.length:0;
    const yearKm=yearJobs.reduce((s,j)=>s+(Number(j?.km)||0),0);
    const stock=getArray('tf_products');
    const lowStock=stock.filter(p=>Number(p.stock??p.quantity??p.giacenza??0)<=Number(p.minStock??p.minimum??p.scortaMinima??0)&&Number(p.minStock??p.minimum??p.scortaMinima??0)>0);
    const techs=(typeof tfSyncTechnicians==='function'?tfSyncTechnicians():state.technicians||[]);
    const nextJobs=jobs.filter(j=>j.date>=today&&!['Chiuso','Annullato','Archiviato'].includes(j.status)).sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''))).slice(0,6);
    const n=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(v);
    return `<div class="tf-dashboard">
      <div class="page-head tf-dashboard-head"><div><div class="eyebrow">Centro operativo</div><h1>Dashboard</h1><p>Una vista unica per sapere cosa succede oggi e cosa richiede attenzione.</p></div><div class="tf-dashboard-actions"><button class="ghost-btn" onclick="tfNavigate('agenda')">Agenda</button><button class="primary" onclick="openInterventionModal()">+ Programma intervento</button></div></div>
      <section class="tf-kpi-grid">
        <button class="tf-kpi" onclick="tfNavigate('agenda')"><span>Interventi oggi</span><strong>${todayJobs.length}</strong><small>${todayJobs.filter(j=>j.status==='In corso').length} in corso</small></button>
        <button class="tf-kpi" onclick="tfNavigate('interventions')"><span>Da gestire</span><strong>${pending.length}</strong><small>programmati / da completare</small></button>
        <button class="tf-kpi" onclick="tfNavigate('clients')"><span>Clienti</span><strong>${clients.length}</strong><small>anagrafiche attive</small></button>
        <button class="tf-kpi" onclick="tfNavigate('technicians')"><span>Tecnici</span><strong>${techs.length}</strong><small>utenti operativi</small></button>
      </section>
      <section class="panel tf-stats-panel">
        <div class="panel-head tf-stats-head"><div><h2>Statistiche operative</h2><span class="muted">Dati di attività, senza informazioni economiche</span></div></div>
        <div class="tf-stats-grid">
          <div class="tf-stat"><span>Interventi anno ${year}</span><strong>${yearJobs.length}</strong><small>${closedYear.length} chiusi</small></div>
          <div class="tf-stat"><span>Ultimi 30 giorni</span><strong>${last30.length}</strong><small>${n(last30Hours)} ore registrate</small></div>
          <div class="tf-stat"><span>Ore lavoro anno</span><strong>${n(yearHours)} h</strong><small>media ${n(avgHours)} h per chiuso</small></div>
          <div class="tf-stat"><span>Km consuntivati anno</span><strong>${n(yearKm)} km</strong><small>da interventi registrati</small></div>
        </div>
      </section>
      <div class="tf-dashboard-main">
        <section class="panel tf-dashboard-agenda"><div class="panel-head"><div><h2>Oggi</h2><span class="muted">${now.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'})}</span></div><button class="panel-link" onclick="tfNavigate('agenda')">Apri agenda →</button></div>${todayJobs.length?`<div class="tf-today-list">${todayJobs.map(j=>`<button class="tf-today-row" onclick="openIntervention('${safe(j.id)}')"><span class="tf-time">${safe(j.time||'—')}</span><span class="tf-job"><strong>${safe(j.type||'Intervento')}</strong><small>${safe(j.client||'Cliente')} · ${safe(j.tech||'Tecnico')}</small></span><span class="badge">${safe(j.status||'Programmato')}</span></button>`).join('')}</div>`:'<div class="empty tf-empty-state">Nessun intervento programmato per oggi.</div>'}</section>
        <section class="panel"><div class="panel-head"><h2>Azioni rapide</h2></div><div class="tf-quick-grid"><button onclick="openClientModal()"><strong>+ Nuovo cliente</strong><small>Anagrafica e sede</small></button><button onclick="openInterventionModal()"><strong>+ Nuovo intervento</strong><small>Programma lavoro</small></button><button onclick="tfNavigate('warehouse')"><strong>Magazzino</strong><small>Giacenze e movimenti</small></button><button onclick="tfNavigate('reports')"><strong>Rapportini</strong><small>Documenti interventi</small></button></div></section>
      </div>
      <div class="tf-dashboard-bottom">
        <section class="panel"><div class="panel-head"><h2>Prossimi interventi</h2><button class="panel-link" onclick="tfNavigate('interventions')">Vedi tutti →</button></div>${nextJobs.length?`<div class="tf-next-list">${nextJobs.map(j=>`<button class="tf-next-row" onclick="openIntervention('${safe(j.id)}')"><span><strong>${safe(j.date||'')}</strong> <small>${safe(j.time||'')}</small></span><span>${safe(j.client||'Cliente')}</span><span>${safe(j.tech||'—')}</span><span class="badge">${safe(j.status||'')}</span></button>`).join('')}</div>`:'<div class="empty">Nessun intervento futuro.</div>'}</section>
        <section class="panel"><div class="panel-head"><h2>Attenzione</h2><span class="badge">${lowStock.length}</span></div>${lowStock.length?`<div class="tf-alert-list">${lowStock.slice(0,5).map(p=>`<button onclick="tfNavigate('warehouse')"><strong>${safe(p.name||p.description||p.code||'Articolo')}</strong><small>Giacenza ${Number(p.stock??p.quantity??p.giacenza??0)} · minimo ${Number(p.minStock??p.minimum??p.scortaMinima??0)}</small></button>`).join('')}</div>`:'<div class="tf-ok-box">✓ Nessuna scorta sotto il minimo registrato.</div>'}</section>
      </div>
    </div>`;
  }
  window.tfDashboardPage=dashboard;
})();
