/* TECNOFA Gestionale — protezione dati pilot v1
 * - localStorage = write-through rapido
 * - IndexedDB = copia di sicurezza locale + allegati foto
 * - backup JSON + Android Web Share
 * - Google Drive: upload automatico mentre l'app è aperta, dopo configurazione OAuth Client ID
 * - ruoli: guardia UI + protezione delle funzioni amministrative/distruttive
 */
(function(){
  'use strict';

  const DB='tecnofa-durability-v1';
  const STORE='kv';
  const MEDIA='media';
  const META='meta';
  const DRIVE_CLIENT='tf_drive_client_id';
  const DRIVE_ENABLED='tf_drive_auto';
  const DRIVE_LAST='tf_drive_last_sync';
  const DRIVE_INTERVAL=15*60*1000;
  const LS_SKIP=new Set(['tf_session','tf_password_resets']);
  let dbPromise;
  let driveToken=null;
  let driveTokenExpires=0;
  let driveTimer=null;
  let booting=true;

  const openDb=()=>dbPromise||(dbPromise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});
      if(!db.objectStoreNames.contains(MEDIA))db.createObjectStore(MEDIA,{keyPath:'id'});
      if(!db.objectStoreNames.contains(META))db.createObjectStore(META,{keyPath:'key'});
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  }));

  const tx=(store,mode='readonly')=>openDb().then(db=>db.transaction(store,mode).objectStore(store));
  const idbGet=(store,key)=>tx(store).then(s=>new Promise((res,rej)=>{const r=s.get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const idbPut=(store,value)=>tx(store,'readwrite').then(s=>new Promise((res,rej)=>{const r=s.put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)}));
  const idbDelete=(store,key)=>tx(store,'readwrite').then(s=>new Promise((res,rej)=>{const r=s.delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)}));
  const idbAll=store=>tx(store).then(s=>new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)}));

  function lsKeys(){const a=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('tf_')&&!LS_SKIP.has(k))a.push(k)}return a}
  async function mirror(key,value){try{await idbPut(STORE,{key,value,updatedAt:Date.now()})}catch(e){console.warn('TECNOFA durability mirror',e)}}
  async function mirrorAll(){for(const key of lsKeys())await mirror(key,localStorage.getItem(key));try{await navigator.storage?.persist?.()}catch{}}

  function patchLocalStorage(){
    if(localStorage.__tfDurabilityPatched)return;
    const set=localStorage.setItem.bind(localStorage),remove=localStorage.removeItem.bind(localStorage);
    localStorage.setItem=function(key,value){set(key,value);if(String(key).startsWith('tf_')&&!LS_SKIP.has(key))mirror(String(key),String(value))};
    localStorage.removeItem=function(key){remove(key);if(String(key).startsWith('tf_')&&!LS_SKIP.has(key))idbDelete(STORE,String(key)).catch(()=>{})};
    Object.defineProperty(localStorage,'__tfDurabilityPatched',{value:true,enumerable:false});
  }

  async function restoreIfNeeded(){
    const all=await idbAll(STORE);
    if(!all.length)return false;
    let restored=false;
    for(const item of all){
      if(LS_SKIP.has(item.key))continue;
      const current=localStorage.getItem(item.key);
      let bad=false;
      if(current===null)bad=true;
      else if(item.key!=='tf_drive_client_id'&&item.key!=='tf_drive_auto'&&item.key!=='tf_drive_last_sync'){
        try{JSON.parse(current)}catch{bad=true}
      }
      if(bad){localStorage.setItem(item.key,item.value);restored=true}
    }
    return restored;
  }

  const b64FromDataUrl=data=>String(data).split(',')[1]||'';
  const blobToData=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)});
  const dataUrlToBlob=data=>{const [h,b]=String(data).split(',');const m=(h.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';const bin=atob(b||'');const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new Blob([arr],{type:m})};
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():`m-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function compressImage(file){
    const bitmap=await createImageBitmap(file);
    const max=1600,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,w,h);bitmap.close?.();
    const blob=await new Promise((res,rej)=>canvas.toBlob(x=>x?res(x):rej(new Error('compression failed')),'image/jpeg',.78));
    const thumbCanvas=document.createElement('canvas');const ts=Math.min(1,480/Math.max(w,h));thumbCanvas.width=Math.max(1,Math.round(w*ts));thumbCanvas.height=Math.max(1,Math.round(h*ts));thumbCanvas.getContext('2d',{alpha:false}).drawImage(canvas,0,0,thumbCanvas.width,thumbCanvas.height);
    const thumb=thumbCanvas.toDataURL('image/jpeg',.58);
    return {blob,thumb,width:w,height:h,size:blob.size,name:(file.name||'foto').replace(/\.[^.]+$/i,'')+'.jpg'};
  }

  async function storeMedia(blob,meta){const id=uuid();await idbPut(MEDIA,{id,blob,...meta,createdAt:new Date().toISOString()});return id}

  async function attachInterventionPhotos(input){
    const id=input?.closest('.intervention-layout')?.querySelector('[onclick*="saveIntervention"]')?.getAttribute('onclick')?.match(/saveIntervention\('([^']+)'/)?.[1];
    if(!id)return;
    const s=window.state||null,j=s?.interventions?.find(x=>String(x.id)===String(id));
    if(!j)return;
    j.photos=Array.isArray(j.photos)?j.photos:[];
    for(const file of [...input.files]){
      if(!file.type.startsWith('image/'))continue;
      try{
        const c=await compressImage(file);
        const mediaId=await storeMedia(c.blob,{kind:'intervention-photo',interventionId:id,clientId:j.clientId,name:c.name,mime:'image/jpeg',width:c.width,height:c.height,thumb:c.thumb});
        j.photos.push({id:mediaId,src:c.thumb,name:c.name,size:c.size});
      }catch(e){console.warn(e);toast('Impossibile comprimere una foto')}
    }
    if(typeof save==='function')save();
    input.value='';
    if(typeof render==='function')render();
    toast(`${j.photos.length} foto associate all'intervento`);
  }

  function bindPhotoInputs(root=document){
    root.querySelectorAll('#d-photos').forEach(input=>{
      if(input.dataset.tfProtected==='1')return;
      input.dataset.tfProtected='1';input.addEventListener('change',()=>attachInterventionPhotos(input));
    });
  }

  function roleRank(v){return ({none:0,view:1,edit:2,manage:3}[v]??0)}
  function currentUser(){try{return typeof tfCurrentUser==='function'?tfCurrentUser():window.tfLoggedUser||null}catch{return null}}
  function can(key,level='view'){
    const u=currentUser();if(!u)return false;if(u.role==='AMMINISTRATORE')return true;
    return roleRank(u.permissions?.[key])>=roleRank(level);
  }
  window.tfCan=can;
  window.tfRequire=function(key,level='edit',action='eseguire questa operazione'){
    if(can(key,level))return true;
    toast(`Permesso insufficiente per ${action}.`);return false;
  };

  function guardFunctions(){
    const guards=[
      ['tfSaveAdminConfig','administration','edit','modificare la configurazione aziendale'],
      ['tfUserModal','users','manage','gestire gli utenti'],
      ['tfAdminResetPassword','users','manage','reimpostare una password'],
      ['tfToggleUser','users','manage','attivare/disattivare utenti'],
      ['tfPermissionsPage','users','manage','gestire ruoli e permessi'],
      ['tfActivityPage','users','view','consultare il registro attività']
    ];
    for(const [name,key,level,label] of guards){
      const fn=window[name];if(typeof fn!=='function'||fn.__tfGuarded)continue;
      const w=function(...args){if(!can(key,level)){toast(`Permesso insufficiente per ${label}.`);return}return fn.apply(this,args)};w.__tfGuarded=true;window[name]=w;
    }
    if(typeof window.tfDeleteClient==='function'&&!window.tfDeleteClient.__tfGuarded){
      const fn=window.tfDeleteClient;const w=function(...args){if(!can('clients','manage')){toast('Solo un utente autorizzato può eliminare clienti.');return}return fn.apply(this,args)};w.__tfGuarded=true;window.tfDeleteClient=w;
    }
  }

  function hideUnsafeUi(){
    const u=currentUser();if(!u||u.role==='AMMINISTRATORE')return;
    document.querySelectorAll('.danger').forEach(el=>{if(el.dataset.tfAllowNonAdmin!=='1')el.style.display='none'});
    if(!can('administration','view'))document.querySelector('[data-view="administration"]')?.style.setProperty('display','none');
  }

  function backupPayload(){
    const data={};for(const key of lsKeys())data[key]=localStorage.getItem(key);return {app:'TECNOFA Gestionale',format:2,exportedAt:new Date().toISOString(),data,media:[]};
  }
  async function fullBackup(){
    const payload=backupPayload();
    const media=await idbAll(MEDIA);
    for(const m of media){
      try{payload.media.push({id:m.id,kind:m.kind,interventionId:m.interventionId,clientId:m.clientId,name:m.name,mime:m.mime,width:m.width,height:m.height,createdAt:m.createdAt,data:await blobToData(m.blob)})}catch(e){console.warn('backup media',e)}}
    return payload;
  }
  async function backupBlob(){return new Blob([JSON.stringify(await fullBackup(),null,2)],{type:'application/json'})}
  const fileName=()=>`tecnofa-gestionale-backup-${new Date().toISOString().slice(0,10)}.json`;

  window.tfExportBackupSafe=async function(share=true){
    try{
      const blob=await backupBlob(),file=new File([blob],fileName(),{type:'application/json'});
      if(share&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:'Backup TECNOFA Gestionale',text:'Backup dati TECNOFA Gestionale',files:[file]});toast('Backup condiviso');return}
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup esportato');
    }catch(e){if(e?.name!=='AbortError'){console.error(e);toast('Errore durante il backup')}}
  };

  window.tfImportBackupSafe=function(input){
    const file=input?.files?.[0];if(!file)return;
    const r=new FileReader();r.onload=async()=>{try{
      const b=JSON.parse(r.result);if(b?.app!=='TECNOFA Gestionale'||!b?.data)throw new Error('invalid');
      if(!confirm('Importando il backup i dati locali attuali verranno sostituiti. Continuare?'))return;
      for(const key of lsKeys())localStorage.removeItem(key);
      for(const [key,value] of Object.entries(b.data))if(key.startsWith('tf_')&&!LS_SKIP.has(key))localStorage.setItem(key,String(value));
      const old=await idbAll(MEDIA);for(const x of old)await idbDelete(MEDIA,x.id);
      for(const m of (b.media||[])){try{await idbPut(MEDIA,{...m,blob:dataUrlToBlob(m.data)})}catch(e){console.warn(e)}}
      toast('Backup importato. Ricaricamento…');setTimeout(()=>location.reload(),500);
    }catch(e){console.error(e);toast('Backup non valido o danneggiato')}finally{input.value=''}};r.readAsText(file);
  };

  async function loadGis(){if(window.google?.accounts?.oauth2)return;await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  async function driveTokenRequest(){
    const clientId=localStorage.getItem(DRIVE_CLIENT);if(!clientId){toast('Inserisci prima il Google OAuth Client ID.');return null}
    await loadGis();
    return new Promise(resolve=>{const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'https://www.googleapis.com/auth/drive.file',callback:r=>{if(r?.access_token){driveToken=r.access_token;driveTokenExpires=Date.now()+((r.expires_in||3600)-60)*1000;resolve(driveToken)}else resolve(null)}});client.requestAccessToken({prompt:driveToken?'':'consent'})});
  }
  async function driveUpload(force=false){
    if(localStorage.getItem(DRIVE_ENABLED)!=='1')return;
    if(!localStorage.getItem(DRIVE_CLIENT))return;
    if(!force&&Date.now()-Number(localStorage.getItem(DRIVE_LAST)||0)<DRIVE_INTERVAL)return;
    try{
      const token=driveToken&&Date.now()<driveTokenExpires?driveToken:await driveTokenRequest();if(!token)return;
      const blob=await backupBlob();const meta={name:fileName(),mimeType:'application/json',description:'Backup automatico TECNOFA Gestionale'};
      const body=JSON.stringify(await blob.text());
      const form=new FormData();form.append('metadata',new Blob([JSON.stringify(meta)],{type:'application/json'}));form.append('file',blob);
      const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});
      if(!r.ok)throw new Error(await r.text());
      localStorage.setItem(DRIVE_LAST,String(Date.now()));toast('Backup sincronizzato su Google Drive');
    }catch(e){console.warn('Google Drive sync',e);toast('Backup locale OK; sincronizzazione Drive non riuscita')}
  }
  window.tfDriveSync=()=>driveUpload(true);

  function settingsPanel(){
    const host=document.querySelector('.tf-backup-card');if(!host||host.querySelector('.tf-protection-panel'))return;
    const clientId=localStorage.getItem(DRIVE_CLIENT)||'',enabled=localStorage.getItem(DRIVE_ENABLED)==='1',last=Number(localStorage.getItem(DRIVE_LAST)||0);
    const p=document.createElement('section');p.className='tf-settings-card tf-protection-panel';p.innerHTML=`<h2>Protezione dati e Google Drive</h2><p>Ogni modifica resta subito sul dispositivo. Una copia tecnica viene mantenuta in IndexedDB e il backup può essere condiviso dal menu nativo Android.</p><div class="field"><label>Google OAuth Client ID <small>(Web application)</small></label><input id="tf-drive-client" value="${esc(clientId)}" placeholder="1234567890-xxxx.apps.googleusercontent.com"></div><label style="display:flex;gap:10px;align-items:center;margin:12px 0"><input id="tf-drive-auto" type="checkbox" ${enabled?'checked':''}> Sincronizza automaticamente ogni 15 minuti quando l'app è aperta</label><div class="tf-settings-actions"><button class="primary" id="tf-drive-save">Salva configurazione</button><button class="ghost-btn" id="tf-drive-now">Sincronizza ora</button></div><small class="tf-backup-note">Ultima sincronizzazione: ${last?new Date(last).toLocaleString('it-IT'):'mai'}. Per la sincronizzazione automatica in background con app completamente chiusa servirà il backend cloud.</small>`;
    host.parentElement.appendChild(p);
    p.querySelector('#tf-drive-save').onclick=()=>{localStorage.setItem(DRIVE_CLIENT,p.querySelector('#tf-drive-client').value.trim());localStorage.setItem(DRIVE_ENABLED,p.querySelector('#tf-drive-auto').checked?'1':'0');toast('Configurazione Drive salvata');if(p.querySelector('#tf-drive-auto').checked)driveUpload(true)};
    p.querySelector('#tf-drive-now').onclick=()=>driveUpload(true);
  }

  function wrapSettings(){
    if(typeof window.settings!=='function'||window.settings.__tfWrapped)return;
    const fn=window.settings;const w=function(...args){const html=fn.apply(this,args);setTimeout(settingsPanel,0);return html};w.__tfWrapped=true;window.settings=w;
  }

  function patchPhotoRenderer(){
    // Compatibilità: i nuovi oggetti foto usano .src, mentre le foto storiche possono essere stringhe data-url.
    const original=window.render;
    if(typeof original!=='function'||original.__tfPhotoPatch)return;
    const w=function(...args){const r=original.apply(this,args);setTimeout(()=>bindPhotoInputs(document),0);return r};w.__tfPhotoPatch=true;window.render=w;
  }

  async function init(){
    if(!('indexedDB' in window))return;
    try{
      const restored=await restoreIfNeeded();
      patchLocalStorage();
      await mirrorAll();
      if(restored&&!sessionStorage.getItem('tf_restored_once')){sessionStorage.setItem('tf_restored_once','1');location.reload();return}
      try{await navigator.storage?.persist?.()}catch{}
      bindPhotoInputs(document);guardFunctions();hideUnsafeUi();wrapSettings();patchPhotoRenderer();
      const mo=new MutationObserver(()=>{bindPhotoInputs(document);guardFunctions();hideUnsafeUi();wrapSettings()});mo.observe(document.body,{childList:true,subtree:true});
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){mirrorAll();driveUpload(false)}});
      window.addEventListener('pagehide',()=>{mirrorAll();driveUpload(false)});
      if(localStorage.getItem(DRIVE_ENABLED)==='1')driveTimer=setInterval(()=>driveUpload(false),DRIVE_INTERVAL);
      setInterval(()=>{mirrorAll();},5*60*1000);
      booting=false;
    }catch(e){console.warn('TECNOFA data protection init',e)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
