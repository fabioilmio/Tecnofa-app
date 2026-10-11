/* TECNOFA Gestionale — navigazione principale senza doppioni */
(function(){
  // client_ui.js viene caricato una sola volta da index.html.
  // Non aggiungere dinamicamente una seconda copia: la vecchia v24 sovrascriveva openClient della v25.
  titles.technicians='Tecnici';
  titles.archivi='Archivi';
  titles.administration='Amministrazione';
  titles.users='Utenti e permessi';
  titles.permissions='Ruoli e permessi';
  titles.activity='Registro attività';
  function users(){try{const v=JSON.parse(localStorage.getItem('tf_users')||'[]');return Array.isArray(v)?v:[]}catch{return []}}
  function syncTechnicians(){
    let u=users();
    const old=(()=>{try{const v=JSON.parse(localStorage.getItem('tf_technicians')||'[]');return Array.isArray(v)?v:[]}catch{return []}})();
    if(!u.length&&old.length){old.forEach((name,i)=>u.push({id:'USR-TECH-'+Date.now().toString(36)+i,name,email:'',username:'',role:'TECNICO',active:true,permissions:{}}));localStorage.setItem('tf_users',JSON.stringify(u));}
    const tech=u.filter(x=>x.active!==false&&x.role==='TECNICO');
    state.technicians=tech.map(x=>x.name);
    localStorage.setItem('tf_technicians',JSON.stringify(state.technicians));
    return state.technicians;
  }
  window.tfSyncTechnicians=syncTechnicians;
  state.technicians=syncTechnicians();
  function technicianPage(){
    const tech=syncTechnicians();
    return `<div class="page-head"><div><div class="eyebrow">Squadra tecnica</div><h1>Tecnici</h1><p>I tecnici sono utenti TECNOFA con ruolo operativo. Per evitare doppioni, la gestione degli account resta in Amministrazione.</p></div><button class="primary" onclick="tfNewTechnician()">+ Nuovo tecnico</button></div><section class="panel"><div class="panel-head"><h2>Tecnici disponibili</h2><span class="badge">${tech.length}</span></div><div class="job-list">${tech.map(name=>{const u=users().find(x=>x.name===name);return `<div class="job-card"><div class="avatar">${esc(name).charAt(0).toUpperCase()}</div><div><strong>${esc(name)}</strong><small>${esc(u?.email||'Account tecnico')} · Ruolo TECNICO</small></div><div style="margin-left:auto;display:flex;gap:8px"><button class="panel-link" onclick="tfEditUserFromTech('${u?.id||''}')">Modifica account</button><button class="panel-link" onclick="tfNavigate('agenda')">Agenda</button></div></div>`}).join('')||'<div class="empty">Nessun tecnico attivo. Crea un utente con ruolo TECNICO da Amministrazione.</div>'}</div></section>`;
  }
  window.tfNewTechnician=function(){if(typeof tfUserModal==='function')tfUserModal();setTimeout(()=>{const r=document.getElementById('u-role');if(r)r.value='TECNICO'},30)};
  window.tfEditUserFromTech=function(id){if(typeof tfUserModal==='function')tfUserModal(id)};
  const baseRender=window.render;
  window.tfNavigate=function(v){
    state.view=v;state.selected=null;title.textContent=titles[v]||'Dashboard';
    document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v||((v==='permissions'||v==='activity'||v==='users')&&b.dataset.view==='administration')));
    if(v==='technicians')view.innerHTML=technicianPage();
    else if(v==='archivi'&&typeof window.archiviPage==='function')window.archiviPage();
    else if(v==='administration'&&typeof window.tfAdminPage==='function')view.innerHTML=window.tfAdminPage();
    else if(v==='users'&&typeof window.tfUsersPage==='function')view.innerHTML=window.tfUsersPage();
    else if(v==='permissions'&&typeof window.tfPermissionsPage==='function')view.innerHTML=window.tfPermissionsPage();
    else if(v==='activity'&&typeof window.tfActivityPage==='function')view.innerHTML=window.tfActivityPage();
    else if(v==='dashboard'&&typeof window.tfDashboardPage==='function')view.innerHTML=window.tfDashboardPage();
    else baseRender();
    document.querySelector('.sidebar')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
  };
  document.querySelectorAll('.nav-item[data-view]').forEach(btn=>btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();tfNavigate(this.dataset.view)},true));
  window.render=()=>{
    if(state.view==='technicians')view.innerHTML=technicianPage();
    else if(state.view==='archivi'&&typeof window.archiviPage==='function')window.archiviPage();
    else if(state.view==='administration'&&typeof window.tfAdminPage==='function')view.innerHTML=tfAdminPage();
    else if(state.view==='users'&&typeof window.tfUsersPage==='function')view.innerHTML=tfUsersPage();
    else if(state.view==='permissions'&&typeof window.tfPermissionsPage==='function')view.innerHTML=tfPermissionsPage();
    else if(state.view==='activity'&&typeof window.tfActivityPage==='function')view.innerHTML=tfActivityPage();
    else if(state.view==='dashboard'&&typeof window.tfDashboardPage==='function')view.innerHTML=window.tfDashboardPage();
    else baseRender();
  };
})();
