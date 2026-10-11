/* TECNOFA Gestionale — navigazione pilot stabile */
(function(){
  const TECH_KEY='tf_technicians';
  const fallback=['Fabio','Tecnico 01','Tecnico 02'];
  state.technicians=(()=>{try{const v=JSON.parse(localStorage.getItem(TECH_KEY));return Array.isArray(v)&&v.length?v:fallback.slice()}catch(e){return fallback.slice()}})();
  localStorage.setItem(TECH_KEY,JSON.stringify(state.technicians));
  titles.technicians='Tecnici';
  titles.archivi='Archivi';

  function technicianPage(){
    return `<div class="page-head"><div><div class="eyebrow">Squadra tecnica</div><h1>Tecnici</h1><p>Gestisci i tecnici disponibili per la programmazione in Agenda.</p></div><button class="primary" onclick="tfAddTechnician()">+ Nuovo tecnico</button></div><section class="panel"><div class="panel-head"><h2>Tecnici disponibili</h2><span class="badge">${state.technicians.length}</span></div><div class="job-list">${state.technicians.map((t,i)=>`<div class="job-card"><div class="avatar">${esc(t).charAt(0).toUpperCase()}</div><div><strong>${esc(t)}</strong><small>Tecnico operativo · disponibile in Agenda</small></div><button class="panel-link" onclick="tfRemoveTechnician(${i})">Rimuovi</button></div>`).join('')}</div></section>`;
  }

  window.tfAddTechnician=function(){
    const name=prompt('Nome del tecnico:');
    if(!name||!name.trim())return;
    const n=name.trim();
    if(state.technicians.includes(n)){toast('Tecnico già presente');return;}
    state.technicians.push(n);
    localStorage.setItem(TECH_KEY,JSON.stringify(state.technicians));
    toast('Tecnico aggiunto');
    tfNavigate('technicians');
  };

  window.tfRemoveTechnician=function(i){
    if(state.technicians.length<=1){toast('Deve rimanere almeno un tecnico');return;}
    const name=state.technicians[i];
    if(!confirm(`Rimuovere ${name} dall’elenco dei tecnici?`))return;
    state.technicians.splice(i,1);
    localStorage.setItem(TECH_KEY,JSON.stringify(state.technicians));
    toast('Tecnico rimosso');
    tfNavigate('technicians');
  };

  const baseRender=window.render;

  window.tfNavigate=function(v){
    state.view=v;
    state.selected=null;
    title.textContent=titles[v]||'Dashboard';
    document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
    if(v==='technicians') view.innerHTML=technicianPage();
    else if(v==='archivi' && typeof window.archiviPage==='function') window.archiviPage();
    else baseRender();
    document.querySelector('.sidebar')?.classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  };

  document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      tfNavigate(this.dataset.view);
    },true);
  });

  window.render=()=>{
    if(state.view==='technicians') view.innerHTML=technicianPage();
    else if(state.view==='archivi' && typeof window.archiviPage==='function') window.archiviPage();
    else baseRender();
  };
})();
