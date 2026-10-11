/* TECNOFA Gestionale — Dashboard operativa */
(function(){
  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v)||0);
  const safe=s=>typeof esc==='function'?esc(s):String(s??'');
  const todayKey=()=>new Date().toISOString().slice(0,10);
  function getArray(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
  function dashboard(){
    const clients=Array.isArray(state.clients)?state.clients:[];
    const jobs=Array.isArray(state.interventions)?state.interventions:[];
    const today=todayKey();
    const todayJobs=jobs.filter(j=>j.date===today).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const openJobs=jobs.filter(j=>!['Chiuso','Annullato','Archiviato'].includes(j.status));
    const inProgress=jobs.filter(j=>j.status==='In corso');
    const pending=jobs.filter(j=>['Programmata','Confermato','Da completare','In attesa'].includes(j.status));
    const stock=getArray('tf_products');
    const lowStock=stock.filter(p=>Number(p.stock??p.quantity??p.giacenza??0)<=Number(p.minStock??p.minimum??p.scortaMinima??0)&&Number(p.minStock??p.minimum??p.scortaMinima??0)>0);
    const techs=(typeof tfSyncTechnicians==='function'?tfSyncTechnicians():state.technicians||[]);
    const nextJobs=jobs.filter(j=>j.date>=today&&!['Chiuso','Annullato','Archiviato'].includes(j.status)).sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''))).slice(0,6);
    return `<div class="tf-dashboard">
      <div class="page-head tf-dashboard-head"><div><div class="eyebrow">Centro operativo</div><h1>Dashboard</h1><p>Una vista unica per sapere cosa succede oggi e cosa richiede attenzione.</p></div><div class="tf-dashboard-actions"><button class="ghost-btn" onclick="tfNavigate('agenda')">Agenda</button><button class="primary" onclick="openInterventionModal()">+ Programma intervento</button></div></div>
      <section class="tf-kpi-grid">
        <button class="tf-kpi" onclick="tfNavigate('agenda')"><span>Interventi oggi</span><strong>${todayJobs.length}</strong><small>${todayJobs.filter(j=>j.status==='In corso').length} in corso</small></button>
        <button class="tf-kpi" onclick="tfNavigate('interventions')"><span>Da gestire</span><strong>${pending.length}</strong><small>programmati / da completare</small></button>
        <button class="tf-kpi" onclick="tfNavigate('clients')"><span>Clienti</span><strong>${clients.length}</strong><small>anagrafiche attive</small></button>
        <button class="tf-kpi" onclick="tfNavigate('technicians')"><span>Tecnici</span><strong>${techs.length}</strong><small>utenti operativi</small></button>
      </section>
      <div class="tf-dashboard-main">
        <section class="panel tf-dashboard-agenda"><div class="panel-head"><div><h2>Oggi</h2><span class="muted">${new Date().toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'})}</span></div><button class="panel-link" onclick="tfNavigate('agenda')">Apri agenda →</button></div>${todayJobs.length?`<div class="tf-today-list">${todayJobs.map(j=>`<button class="tf-today-row" onclick="openIntervention('${safe(j.id)}')"><span class="tf-time">${safe(j.time||'—')}</span><span class="tf-job"><strong>${safe(j.type||'Intervento')}</strong><small>${safe(j.client||'Cliente')} · ${safe(j.tech||'Tecnico')}</small></span><span class="badge">${safe(j.status||'Programmato')}</span></button>`).join('')}</div>`:'<div class="empty tf-empty-state">Nessun intervento programmato per oggi.</div>'}</section>
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
