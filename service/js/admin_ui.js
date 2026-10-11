/* TECNOFA Gestionale — UI amministrazione, navigazione e dashboard */
(function(){
  const euro=n=>Number(n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
  const total=k=>read(k,[]).reduce((s,r)=>s+Number(r.totale||r.importo||0),0);
  const groups=[
    {title:'Documenti commerciali',items:[['preventivi','Preventivi','Offerte e preventivi'],['ordini','Ordini','Ordini cliente e fornitore'],['ddt','DDT','Documenti di trasporto'],['fatture','Fatture','Emissione e controllo fatture']]},
    {title:'Movimenti economici',items:[['vendite','Vendite','Vendite registrate'],['acquisti','Acquisti','Acquisti e documenti fornitori'],['incassi','Incassi','Incassi dai clienti'],['pagamenti','Pagamenti','Pagamenti ai fornitori'],['spese','Spese','Costi e spese aziendali'],['scadenze','Scadenze','Da incassare e da pagare']]},
    {title:'Anagrafiche aziendali',items:[['fornitori','Fornitori','Anagrafica fornitori']]}
  ];
  window.tfAdminPage=function(){
    const fatt=total('tf_admin_fatture'),inc=total('tf_admin_incassi'),acq=total('tf_admin_acquisti'),pag=total('tf_admin_pagamenti');
    const users=read('tf_users',[]);
    const cards=groups.map(g=>`<section class="panel"><div class="panel-head"><h2>${g.title}</h2></div><div class="quick-grid">${g.items.map(([k,t,d])=>`<button class="quick" onclick="tfAdminModule('${k}')"><b>${t}</b><small>${d}</small></button>`).join('')}</div></section>`).join('');
    return `<div class="page-head"><div><div class="eyebrow">Gestione aziendale</div><h1>Amministrazione</h1><p>Documenti, acquisti, vendite, incassi, pagamenti, fornitori e controllo economico.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ghost-btn" onclick="adminNavigate('users')">Utenti</button><button class="ghost-btn" onclick="adminNavigate('permissions')">Ruoli e permessi</button><button class="ghost-btn" onclick="adminNavigate('activity')">Registro attività</button><button class="primary" onclick="tfAdminReports()">Report economici</button></div></div><div class="cards admin-kpis"><div class="stat-card"><div class="label">Fatturato</div><div class="value">${euro(fatt)}</div><div class="hint">fatture registrate</div></div><div class="stat-card"><div class="label">Da incassare</div><div class="value">${euro(Math.max(0,fatt-inc))}</div><div class="hint">fatturato meno incassi</div></div><div class="stat-card"><div class="label">Da pagare</div><div class="value">${euro(Math.max(0,acq-pag))}</div><div class="hint">acquisti meno pagamenti</div></div><div class="stat-card"><div class="label">Utenti attivi</div><div class="value">${users.filter(x=>x.active).length}</div><div class="hint">account abilitati</div></div></div><div class="tf-admin-subnav"><button onclick="tfAdminModule('fatture')">Fatture</button><button onclick="tfAdminModule('preventivi')">Preventivi</button><button onclick="tfAdminModule('acquisti')">Acquisti</button><button onclick="tfAdminModule('incassi')">Incassi</button><button onclick="tfAdminModule('scadenze')">Scadenze</button></div><div class="grid-2">${cards}<section class="panel"><div class="panel-head"><h2>Controllo e report</h2></div><div class="link-map"><div><b>Cliente</b><span>→ Preventivo → Ordine → DDT → Fattura → Incasso</span></div><div><b>Fornitore</b><span>→ Ordine → DDT → Acquisto → Pagamento</span></div><div><b>Intervento</b><span>→ Materiali → Rapportino → Fatturazione</span></div></div><button class="primary wide" onclick="tfAdminReports()">Apri centro report</button></section></div>`;
  };
  function reorganizeSidebar(){
    const nav=document.getElementById('main-nav');if(!nav)return;
    const get=id=>nav.querySelector(`[data-view="${id}"]`);
    const labels=[['Principale',['dashboard','agenda','interventions']],['Anagrafiche',['clients','plants','technicians']],['Operatività',['warehouse','reports']],['Azienda',['administration','archivi']]];
    const nodes=[];
    labels.forEach(([label,ids])=>{const h=document.createElement('div');h.className='nav-section';h.textContent=label;nodes.push(h);ids.forEach(id=>{const b=get(id);if(b)nodes.push(b);});});
    nav.querySelectorAll('.nav-item[data-view="users"]').forEach(x=>x.remove());nav.innerHTML='';nodes.forEach(n=>nav.appendChild(n));
  }
  function connectDashboard(){
    if(typeof window.tfDashboardPage!=='function')return;
    const baseRender=window.render;
    window.render=function(){if(state.view==='dashboard'){view.innerHTML=window.tfDashboardPage();title.textContent='Dashboard';return}return baseRender.apply(this,arguments)};
    if(typeof window.tfNavigate==='function'){
      const baseNavigate=window.tfNavigate;
      window.tfNavigate=function(v){baseNavigate(v);if(v==='dashboard'&&typeof window.tfDashboardPage==='function'){view.innerHTML=window.tfDashboardPage();title.textContent='Dashboard';}};
    }
    if(state.view==='dashboard')window.render();
  }
  function loadDashboard(){
    if(window.tfDashboardPage){connectDashboard();return;}
    const s=document.createElement('script');s.src='js/dashboard.js?v=20261011-23';s.onload=connectDashboard;document.body.appendChild(s);
  }
  setTimeout(()=>{reorganizeSidebar();loadDashboard();},0);
})();