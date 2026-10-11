/* TECNOFA Gestionale — bridge verso autenticazione D1.
   Mantiene il modello UI esistente durante la migrazione: D1 è la fonte autorevole,
   localStorage viene usato solo come cache compatibile temporanea. */
(function(){
  'use strict';
  const USERS='tf_users', SESSION='tf_session';
  let centralReady=false;
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const localLogin=window.tfLogin;
  const localLogout=window.tfLogout;
  const localUsers=window.tfUsers;
  const localSaveUser=window.tfSaveUser;

  function mirrorUser(u){
    const users=Array.isArray(read(USERS,[]))?read(USERS,[]):[];
    const i=users.findIndex(x=>String(x.id)===String(u.id));
    const x={...u,passwordHash:users[i]?.passwordHash||'',mustChangePassword:!!u.mustChangePassword};
    if(i>=0)users[i]={...users[i],...x}; else users.push(x);
    save(USERS,users);
    save(SESSION,{userId:u.id,at:new Date().toISOString(),source:'d1'});
  }
  function mirrorUsers(users){
    const current=read(USERS,[]);
    const passwords=new Map(current.map(x=>[String(x.id),x.passwordHash||'']));
    save(USERS,users.map(u=>({...u,passwordHash:passwords.get(String(u.id))||'',mustChangePassword:!!u.mustChangePassword})));
  }
  async function health(){
    try{const r=await fetch('./api/health',{cache:'no-store'});if(!r.ok)return null;const j=await r.json();return j?.schemaReady?j:null}catch{return null}
  }
  async function syncUsers(){
    const r=await fetch('./api/users',{credentials:'same-origin',cache:'no-store'});
    if(!r.ok)throw new Error('users '+r.status);
    const j=await r.json();
    if(j.ok&&Array.isArray(j.users))mirrorUsers(j.users);
    return j.users||[];
  }
  async function centralLogin(){
    const ident=(document.getElementById('tf-login-ident')?.value||'').trim();
    const pass=document.getElementById('tf-login-pass')?.value||'';
    const msg=document.getElementById('tf-login-error');
    try{
      const r=await fetch('./api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({identifier:ident,password:pass})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||!j.ok){if(msg)msg.textContent='Credenziali non valide.';return;}
      mirrorUser(j.user);
      location.reload();
    }catch(e){console.error(e);if(msg)msg.textContent='Servizio di accesso temporaneamente non disponibile.';}
  }
  window.tfCentralAuthReady=()=>centralReady;

  async function boot(){
    const h=await health();
    if(!h)return;
    centralReady=true;
    try{
      const r=await fetch('./api/auth/me',{credentials:'same-origin',cache:'no-store'});
      if(r.ok){const j=await r.json();if(j.ok)mirrorUser(j.user);}
      else localStorage.removeItem(SESSION);
      await syncUsers();
      if(typeof window.tfRefreshTechnicians==='function')window.tfRefreshTechnicians();
    }catch(e){console.warn('TECNOFA central auth:',e)}

    window.tfLogin=centralLogin;
    window.tfLogout=async function(){
      try{await fetch('./api/auth/logout',{method:'POST',credentials:'same-origin'})}catch{}
      localStorage.removeItem(SESSION);
      location.href=location.pathname;
    };

    if(typeof localSaveUser==='function'){
      window.tfSaveUser=async function(id){
        const name=document.getElementById('u-name')?.value.trim()||'';
        const email=document.getElementById('u-email')?.value.trim()||'';
        const username=document.getElementById('u-username')?.value.trim().toLowerCase()||'';
        const password=document.getElementById('u-password')?.value||'';
        const role=document.getElementById('u-role')?.value||'TECNICO';
        const active=document.getElementById('u-active')?.value==='1';
        const permissions={};
        document.querySelectorAll('[id^="perm-"]').forEach(el=>{permissions[el.id.slice(5)]=el.value});
        try{
          const r=await fetch('./api/users',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({id,name,email,username,password,role,active,permissions})});
          const j=await r.json().catch(()=>({}));
          if(!r.ok||!j.ok){toast(j.error==='USERNAME_OR_EMAIL_EXISTS'?'Username o email già utilizzati':'Impossibile salvare l’utente nel database');return;}
          if(j.user)mirrorUser(j.user);
          await syncUsers();
          document.querySelector('.modal-backdrop')?.remove();
          toast('Utente salvato nel database centrale');
          if(typeof tfNavigate==='function')tfNavigate('users');
          if(typeof window.tfRefreshTechnicians==='function')window.tfRefreshTechnicians();
        }catch(e){console.error(e);toast('Database non raggiungibile. Utente non modificato.');}
      };
    }
    if(typeof localUsers==='function')window.tfUsers=()=>read(USERS,[]);
    if(typeof window.tfCurrentUser==='function'){
      const localCurrent=window.tfCurrentUser;
      window.tfCurrentUser=()=>localCurrent();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
