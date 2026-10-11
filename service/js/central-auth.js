/* TECNOFA Gestionale — bridge verso autenticazione D1.
   D1 è la fonte autorevole; localStorage resta solo una cache UI temporanea. */
(function(){
  'use strict';
  const USERS='tf_users', SESSION='tf_session';
  let centralReady=false;
  let resolveCentral;
  const centralPromise=new Promise(resolve=>{resolveCentral=resolve});
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const localLogin=window.tfLogin;
  const localLogout=window.tfLogout;
  const localUsers=window.tfUsers;
  const localSaveUser=window.tfSaveUser;
  const localChangePassword=window.tfChangePassword;

  /* Blocca la gara tra login locale e login D1 durante il bootstrap. */
  window.tfCentralAuthPromise=centralPromise;
  window.tfLogin=async function(){
    const useCentral=await centralPromise;
    if(useCentral && typeof window.tfCentralLogin==='function')return window.tfCentralLogin();
    if(typeof localLogin==='function')return localLogin();
  };

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
  window.tfCentralLogin=centralLogin;
  window.tfCentralAuthReady=()=>centralReady;

  async function boot(){
    const h=await health();
    if(!h){resolveCentral(false);return;}
    centralReady=true;
    /* D1 è disponibile: da questo momento il login locale non è consentito. */
    resolveCentral(true);
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

    window.tfChangePassword=async function(){
      const box=document.createElement('div');
      box.className='modal-backdrop';
      box.innerHTML=`<div class="modal" style="max-width:520px"><h2>Cambia password</h2><p>La nuova password sarà salvata nel database centrale TECNOFA.</p><div class="field"><label>Nuova password</label><input id="tf-central-pass" type="password" autocomplete="new-password" minlength="8"></div><div class="field" style="margin-top:10px"><label>Ripeti password</label><input id="tf-central-pass2" type="password" autocomplete="new-password" minlength="8"></div><div id="tf-central-pass-msg" class="tf-login-error"></div><div class="modal-actions"><button class="ghost-btn" onclick="this.closest('.modal-backdrop').remove()">Annulla</button><button class="primary" id="tf-central-pass-save">Salva password</button></div></div>`;
      document.body.appendChild(box);
      box.querySelector('#tf-central-pass-save').onclick=async()=>{
        const p=box.querySelector('#tf-central-pass').value,p2=box.querySelector('#tf-central-pass2').value,msg=box.querySelector('#tf-central-pass-msg');
        if(p.length<8||p!==p2){msg.textContent='Le password devono coincidere e contenere almeno 8 caratteri.';return;}
        try{
          const r=await fetch('./api/auth/password',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({password:p})});
          const j=await r.json().catch(()=>({}));
          if(!r.ok||!j.ok){msg.textContent='Impossibile aggiornare la password.';return;}
          const u=read(USERS,[]),me=u.find(x=>x.id===read(SESSION,null)?.userId);if(me)me.mustChangePassword=false;save(USERS,u);
          box.remove();toast('Password aggiornata nel database centrale');
        }catch(e){console.error(e);msg.textContent='Database non raggiungibile.';}
      };
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
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
