/* TECNOFA Gestionale — Dashboard operativa v39 */
(function(){
  'use strict';
  const safe=s=>typeof esc==='function'?esc(s):String(s??'');
  const todayKey=()=>new Date().toISOString().slice(0,10);
  const getArray=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
  const jobs=()=>{const list=Array.isArray(state.interventions)?state.interventions:[],seen=new Set();return list.filter(j=>{const k=String(j?.id??'').trim()||[j?.date,j?.time,j?.clientId,j?.client,j?.type,j?.tech,j?.status].join('|');if(seen.has(k))return false;seen.add(k);return true})};
  const hours=j=>Number(j?.hours||j?.actualHours||0)||0;
  const km=j=>Number(j?.km||j?.actualKm||0)||0;
  const status=j=>String(j?.status||'Programmato');
  const active=s=>!['Chiuso','Annullato','Archiviato'].includes(s);
  const statusClass=s=>s==='In corso'?'is-live':s==='Chiuso'?'is-done':s==='In attesa'?'is-wait':'is-plan';
  const initials=v=>String(v||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';
  function dashboard(){
    const now=new Date(),today=todayKey(),year=now.getFullYear(),all=jobs(),clients=Array.isArray(state.clients)?state.clients:[];
    const todayJobs=all.filter(j=>j.date===today).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const yearJobs=all.filter(j=>String(j.date||'').startsWith(String(year))),closed=yearJobs.filter(j=>status(j)==='Chiuso');
    const pending=all.filter(j=>['Programmata','Confermato','Da completare','In attesa'].includes(status(j)));
    const inProgress=all.filter(j=>status(j)==='In corso');
    const upcoming=all.filter(j=>j.date>=today&&active(status(j))).sort((a,b)=>((a.date||'')+(a.time||'')).localeCompare((b.date||'')+(b.time||''))).slice(0,7);
    const stock=getArray('tf_products');
    const lowStock=stock.filter(p=>{const q=Number(p.stock??p.quantity??p.giacenza??0),m=Number(p.minStock??p.minimum??p.scortaMinima??0);return m>0&&q<=m}).sort((a,b)=>(Number(a.stock??0)-Number(b.stock??0))-(Number(a.minStock??0)-Number(b.minStock??0)));
    const techs=typeof tfSyncTechnicians==='function'?tfSyncTechnicians():state.technicians||[];
    const techWork=techs.map(t=>{const name=t.name||t.fullName||t.username||t.email||'Tecnico';const mine=all.filter(j=>String(j.techId||j.technicianId||'')===String(t.id||'')||(String(j.tech||'').trim()===String(name).trim()));return{name,mine,today:mine.filter(j=>j.date===today),open:mine.filter(j=>active(status(j)))}}).filter(t=>t.mine.length||t.name);
    const scheduledToday=todayJobs.filter(j=>active(status(j)));
    const doneToday=todayJobs.filter(j=>['Chiuso','Completato'].includes(status(j))).length;
    const yearHours=yearJobs.reduce((s,j)=>s+hours(j),0),yearKm=yearJobs.reduce((s,j)=>s+km(j),0);
    const avg=closed.length?closed.reduce((s,j)=>s+hours(j),0)/closed.length:0;
    const nf=v=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(v);
    const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v);
    const stockValue=stock.reduce((s,p)=>s+(Number(p.stock??p.quantity??0)*Number(p.cost??p.costPrice??0)),0);
    const nextLabel=upcoming.length?`${upcoming.length} prossimi da seguire`:'Nessun intervento futuro';
    return `<div class="tf-dashboard tf-dashboard-pro">
      <div class="page-head tf-dashboard-head"><div><div class="eyebrow">Centro operativo tecnico</div><h1>Dashboard</h1><p>Controllo rapido di agenda, squadra, interventi, materiali e attività da completare.</p></div><div class="tf-dashboard-actions"><button class="ghost-btn" onclick="tfNavigate('agenda')">Agenda completa</button><button class="primary" onclick="openInterventionModal()">+ Programma intervento</button></div></div>
      <section class="tf-command-strip"><div><span class="tf-command-dot"></span><strong>Operatività oggi</strong><small>${now.toLocaleDateString('it-IT',{weekday:'long',day:'2-digit',month:'long'})}</small></div><div class="tf-command-metric"><span>Da gestire</span><strong>${pending.length}</strong></div><div class="tf-command-metric"><span>In corso</span><strong>${inProgress.length}</strong></div><div class="tf-command-metric"><span>Chiusi oggi</span><strong>${doneToday}</strong></div><div class="tf-command-metric"><span>Scorte critiche</span><strong>${lowStock.length}</strong></div></section>
      <section class="tf-kpi-grid tf-kpi-grid-pro">
        <button class="tf-kpi tf-kpi-green" onclick="tfNavigate('agenda')"><span>Interventi oggi</span><strong>${todayJobs.length}</strong><small>${scheduledToday.length} ancora operativi · ${doneToday} completati</small><i>◷</i></button>
        <button class="tf-kpi" onclick="tfNavigate('interventions')"><span>Interventi anno</span><strong>${yearJobs.length}</strong><small>${closed.length} chiusi · ${nf(yearHours)} h registrate</small><i>✓</i></button>
        <button class="tf-kpi" onclick="tfNavigate('clients')"><span>Clienti</span><strong>${clients.length}</strong><small>anagrafiche disponibili</small><i>♙</i></button>
        <button class="tf-kpi" onclick="tfNavigate('technicians')"><span>Tecnici</span><strong>${techs.length}</strong><small>${techWork.filter(t=>t.today.length).length} con attività oggi</small><i>♟</i></button>
      </section>
      <div class="tf-dashboard-grid-top">
        <section class="panel tf-ops-panel"><div class="panel-head"><div><h2>Interventi di oggi</h2><span class="muted">Sequenza operativa e stato lavori</span></div><button class="panel-link" onclick="tfNavigate('agenda')">Apri agenda →</button></div>
          ${todayJobs.length?`<div class="tf-ops-list">${todayJobs.map((j,i)=>`<button class="tf-ops-row" onclick="openIntervention('${safe(j.id)}')"><span class="tf-ops-time">${safe(j.time||'—')}</span><span class="tf-ops-line"><span class="tf-ops-type"><b>${safe(j.type||'Intervento')}</b><small>${safe(j.client||'Cliente')}</small></span><span class="tf-ops-tech"><i>${safe(initials(j.tech||'Tecnico'))}</i><span>${safe(j.tech||'Tecnico')}</span></span></span><span class="tf-state ${statusClass(status(j))}">${safe(status(j))}</span></button>`).join('')}</div>`:'<div class="tf-empty-state"><strong>Giornata libera</strong><span>Nessun intervento programmato per oggi.</span><button class="ghost-btn" onclick="openInterventionModal()">Programma il primo intervento</button></div>'}
        </section>
        <section class="panel tf-focus-panel"><div class="panel-head"><div><h2>Da attenzionare</h2><span class="muted">Elementi che richiedono un'azione</span></div><span class="tf-alert-count">${pending.length+lowStock.length}</span></div>
          <div class="tf-focus-list">
            <button onclick="tfNavigate('interventions')"><span class="tf-focus-icon orange">!</span><span><b>${pending.length} interventi</b><small>programmati o da completare</small></span><em>→</em></button>
            <button onclick="tfNavigate('warehouse')"><span class="tf-focus-icon red">▦</span><span><b>${lowStock.length} articoli</b><small>sotto la scorta minima</small></span><em>→</em></button>
            <button onclick="tfNavigate('agenda')"><span class="tf-focus-icon blue">◷</span><span><b>${nextLabel}</b><small>controlla carichi e assegnazioni</small></span><em>→</em></button>
          </div>
          ${lowStock.length?`<div class="tf-stock-mini"><strong>Priorità magazzino</strong>${lowStock.slice(0,3).map(p=>`<div><span>${safe(p.name||p.description||p.code||'Articolo')}</span><b>${Number(p.stock??p.quantity??0)} / ${Number(p.minStock??p.minimum??p.scortaMinima??0)}</b></div>`).join('')}</div>`:''}
        </section>
      </div>
      <div class="tf-dashboard-grid-bottom">
        <section class="panel"><div class="panel-head"><div><h2>Carico tecnici</h2><span class="muted">Distribuzione delle attività assegnate</span></div><button class="panel-link" onclick="tfNavigate('technicians')">Gestisci tecnici →</button></div>
          ${techWork.length?`<div class="tf-tech-list">${techWork.slice(0,6).map(t=>{const pct=Math.min(100,Math.round((t.today.length/Math.max(1,Math.max(...techWork.map(x=>x.today.length))))*100));return`<button class="tf-tech-row" onclick="tfNavigate('agenda')"><span class="tf-tech-avatar">${safe(initials(t.name))}</span><span class="tf-tech-name"><b>${safe(t.name)}</b><small>${t.today.length} oggi · ${t.open.length} aperti</small></span><span class="tf-tech-bar"><i style="width:${pct}%"></i></span><strong>${t.today.length}</strong></button>`}).join('')}</div>`:'<div class="empty">Nessun tecnico configurato.</div>'}
        </section>
        <section class="panel"><div class="panel-head"><div><h2>Prossimi interventi</h2><span class="muted">Programmazione imminente</span></div><button class="panel-link" onclick="tfNavigate('interventions')">Vedi tutti →</button></div>
          ${upcoming.length?`<div class="tf-next-pro">${upcoming.map(j=>`<button onclick="openIntervention('${safe(j.id)}')"><span><b>${safe(j.date||'')}</b><small>${safe(j.time||'—')}</small></span><span><strong>${safe(j.type||'Intervento')}</strong><small>${safe(j.client||'Cliente')}</small></span><em>${safe(j.tech||'—')}</em></button>`).join('')}</div>`:'<div class="empty">Nessun intervento futuro.</div>'}
        </section>
      </div>
      <section class="panel tf-performance"><div class="panel-head"><div><h2>Indicatori tecnici</h2><span class="muted">Consuntivi registrati nel ${year}</span></div></div><div class="tf-performance-grid"><div><span>Ore lavoro</span><strong>${nf(yearHours)} h</strong><small>media ${nf(avg)} h per intervento chiuso</small></div><div><span>Km consuntivati</span><strong>${nf(yearKm)} km</strong><small>trasferte registrate</small></div><div><span>Valore stock</span><strong>${money(stockValue)}</strong><small>valore indicativo a costo</small></div><div><span>Ultimi 30 giorni</span><strong>${all.filter(j=>{const d=new Date((j.date||'')+'T23:59:59');return !Number.isNaN(d.getTime())&&(now-d)<=30*86400000&&d<=now}).length}</strong><small>interventi registrati</small></div></div></section>
    </div>`;
  }
  window.tfDashboardPage=dashboard;
})();