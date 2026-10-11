/* TECNOFA Gestionale — Team unificato
   Fonte unica dei tecnici: tf_users. tf_technicians resta solo compatibilità legacy. */
(function(){
  'use strict';
  const USERS='tf_users';
  function readUsers(){
    try{const v=JSON.parse(localStorage.getItem(USERS)||'[]');return Array.isArray(v)?v:[]}
    catch{return []}
  }
  function activeTechnicians(){return readUsers().filter(u=>u&&u.active!==false&&u.role==='TECNICO')}
  function refresh(){
    const list=activeTechnicians();
    if(window.state) state.technicians=list.map(u=>u.name).filter(Boolean);
    localStorage.setItem('tf_technicians',JSON.stringify(list.map(u=>u.name).filter(Boolean)));
    return list;
  }
  window.tfGetTechnicianUsers=activeTechnicians;
  window.tfRefreshTechnicians=refresh;
  window.tfEditTechnician=function(id){
    const u=readUsers().find(x=>String(x.id)===String(id));
    if(!u){toast('Tecnico non trovato negli utenti');return}
    const current=window.tfCurrentUser?window.tfCurrentUser():null;
    if(!current || (current.role!=='AMMINISTRATORE' && current.permissions?.users!=='manage')){
      toast('Solo un amministratore può modificare l’account del tecnico');
      return;
    }
    if(typeof window.tfUserModal==='function')window.tfUserModal(u.id);
    else toast('Modulo Utenti non ancora disponibile. Aggiorna la pagina.');
  };
  /* Compatibilità con il pulsante già presente nella scheda Tecnici. */
  window.tfEditUserFromTech=function(id){window.tfEditTechnician(id)};
  window.tfNewTechnician=function(){
    const current=window.tfCurrentUser?window.tfCurrentUser():null;
    if(!current || (current.role!=='AMMINISTRATORE' && current.permissions?.users!=='manage')){
      toast('Solo un amministratore può creare un tecnico');return;
    }
    if(typeof window.tfUserModal==='function'){
      window.tfUserModal();
      setTimeout(()=>{const r=document.getElementById('u-role');if(r)r.value='TECNICO'},0);
    }
  };
  /* Agenda legge sempre dalla stessa fonte, senza usare un elenco tecnico rimasto in memoria. */
  window.tfTechs=function(){
    const names=refresh().map(u=>u.name).filter(Boolean);
    return [...new Set(names.length?names:['Fabio'])];
  };
  /* Dopo il salvataggio di un utente aggiorna immediatamente anche l'Agenda. */
  const originalSaveUser=window.tfSaveUser;
  if(typeof originalSaveUser==='function'){
    window.tfSaveUser=async function(id){
      const result=await originalSaveUser(id);
      refresh();
      return result;
    };
  }
  refresh();
  window.addEventListener('storage',e=>{if(e.key===USERS||e.key==='tf_technicians')refresh()});
})();
