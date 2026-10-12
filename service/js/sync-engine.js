/* TECNOFA — Offline-first sync engine
   Local data remains authoritative during development. The remote adapter is intentionally
   disabled until the D1/API contract is rebuilt. This module provides the UX/state contract
   now: connectivity, pending local changes, last successful sync and sync history. */
(function(){
  'use strict';
  const META='tf_sync_meta';
  const DB='tecnofa-offline', STORE='outbox';
  const INTERNAL=new Set(['tf_sync_meta','tf_session','tf_password_resets']);
  const read=()=>{try{return JSON.parse(localStorage.getItem(META))||{}}catch{return {}}};
  const write=v=>localStorage.setItem(META,JSON.stringify(v));
  let state={online:navigator.onLine,pending:0,lastSync:null,lastAttempt:null,lastError:null,mode:'LOCAL'};
  let dbPromise=null;
  function meta(){return {...state,...read()};}
  function setMeta(patch){state={...state,...patch};write(state);render();}
  function openDB(){if(dbPromise)return dbPromise;if(!('indexedDB'in window))return Promise.resolve(null);dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE)){const s=r.result.createObjectStore(STORE,{keyPath:'id'});s.createIndex('status','status')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbPromise;}
  async function countPending(){const db=await openDB();if(!db)return 0;return new Promise(resolve=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).index('status').count('pending');req.onsuccess=()=>resolve(req.result||0);req.onerror=()=>resolve(0)})}
  async function queue(key,value,operation='upsert'){
    if(INTERNAL.has(key)||!key.startsWith('tf_'))return;
    const db=await openDB();if(!db)return;
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:key,entity:key,operation,payload:value,updatedAt:new Date().toISOString(),status:'pending'});await new Promise(r=>{tx.oncomplete=r;tx.onerror=r});state.pending=await countPending();write(state);render();scheduleBackgroundSync();
  }
  function installStorageObserver(){
    const originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(key,value){const result=originalSet.call(this,key,value);if(this===localStorage&&key&&key.startsWith('tf_')&&!INTERNAL.has(key)){queue(key,value,'upsert').catch(()=>{})}return result};
    Storage.prototype.removeItem=function(key){const result=originalRemove.call(this,key);if(this===localStorage&&key&&key.startsWith('tf_')&&!INTERNAL.has(key)){queue(key,null,'delete').catch(()=>{})}return result};
  }
  function scheduleBackgroundSync(){navigator.serviceWorker?.ready?.then(reg=>{if(reg.sync?.register)reg.sync.register('tecnofa-sync').catch(()=>{})}).catch(()=>{})}
  function render(){
    const host=document.querySelector('.top-actions');if(!host)return;
    let el=document.getElementById('tf-sync-status');
    if(!el){el=document.createElement('button');el.id='tf-sync-status';el.type='button';el.className='ghost-btn tf-sync-status';el.title='Stato sincronizzazione';el.onclick=()=>window.tfOpenSyncStatus?.();host.insertBefore(el,host.firstChild)}
    const m=meta(),icon=m.online?'●':'○',label=m.online?'Online':'Offline',pending=m.pending||0,when=m.lastSync?new Date(m.lastSync).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}):'mai';
    el.textContent=`${icon} ${label}${pending?` · ${pending} in coda`:''}`;el.dataset.state=m.online?'online':'offline';el.dataset.pending=String(pending);el.setAttribute('aria-label',`Sincronizzazione: ${label}. Ultima sincronizzazione: ${when}`);
  }
  window.tfOpenSyncStatus=function(){
    const m=meta(),when=m.lastSync?new Date(m.lastSync).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'}):'Mai';
    const attempt=m.lastAttempt?new Date(m.lastAttempt).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'}):'Mai';
    document.querySelector('#tf-sync-modal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div id="tf-sync-modal" class="modal-backdrop" onclick="if(event.target===this)this.remove()"><div class="modal"><div class="eyebrow">Dati</div><h2>Sincronizzazione</h2><div class="detail-card"><span>Stato connessione</span><strong>${m.online?'Online':'Offline'}</strong></div><div class="detail-card" style="margin-top:8px"><span>Modalità</span><strong>Locale · offline-first</strong></div><div class="detail-card" style="margin-top:8px"><span>Modifiche in coda</span><strong>${m.pending||0}</strong></div><div class="detail-card" style="margin-top:8px"><span>Ultimo tentativo</span><strong>${attempt}</strong></div><div class="detail-card" style="margin-top:8px"><span>Ultima sincronizzazione completata</span><strong>${when}</strong></div>${m.lastError?`<div class="tf-login-error" style="margin-top:10px">${String(m.lastError).replace(/[<>]/g,'')}</div>`:''}<div class="modal-actions"><button class="ghost-btn" onclick="this.closest('.modal-backdrop').remove()">Chiudi</button><button class="primary" onclick="window.tfSyncNow?.()">Sincronizza ora</button></div></div></div>`);
  };
  window.tfSyncNow=async function(){
    setMeta({lastAttempt:new Date().toISOString(),lastError:null});
    /* Remote transport deliberately disabled until the new D1 contract is rebuilt. */
    if(!navigator.onLine){setMeta({lastError:'Nessuna connessione disponibile.'});return false}
    setMeta({lastError:'Sincronizzazione remota in preparazione: i dati locali restano al sicuro.'});return false;
  };
  function online(){state.online=true;state.lastError=null;write(state);render();setTimeout(()=>window.tfSyncNow?.(),800)}
  function offline(){state.online=false;write(state);render()}
  async function boot(){state={...state,...read(),online:navigator.onLine,pending:await countPending()};write(state);installStorageObserver();render();window.addEventListener('online',online);window.addEventListener('offline',offline);setTimeout(render,300);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();