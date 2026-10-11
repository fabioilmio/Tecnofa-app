/* TECNOFA Gestionale — data protection compatibility layer */
(function(){
  'use strict';
  const DB='tecnofa-durability-v1',MEDIA='media';
  let dbp;
  const db=()=>dbp||(dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('kv'))r.result.createObjectStore('kv',{keyPath:'key'});if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media',{keyPath:'id'});if(!r.result.objectStoreNames.contains('meta'))r.result.createObjectStore('meta',{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)}));
  const put=v=>db().then(d=>new Promise((res,rej)=>{const r=d.transaction(MEDIA,'readwrite').objectStore(MEDIA).put(v);r.onsuccess=()=>res(v);r.onerror=()=>rej(r.error)}));
  const all=()=>db().then(d=>new Promise((res,rej)=>{const r=d.transaction(MEDIA).objectStore(MEDIA).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)}));
  const uid=()=>crypto.randomUUID?crypto.randomUUID():`m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const interventions=()=>{try{const v=JSON.parse(localStorage.getItem('tf_interventions')||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
  const saveInterventions=v=>localStorage.setItem('tf_interventions',JSON.stringify(v));
  async function compress(file){
    const bitmap=await createImageBitmap(file),max=1600,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,w,h);bitmap.close?.();
    const blob=await new Promise((res,rej)=>canvas.toBlob(x=>x?res(x):rej(new Error('compression failed')),'image/jpeg',.78));
    const tc=document.createElement('canvas'),ts=Math.min(1,480/Math.max(w,h));tc.width=Math.max(1,Math.round(w*ts));tc.height=Math.max(1,Math.round(h*ts));tc.getContext('2d',{alpha:false}).drawImage(canvas,0,0,tc.width,tc.height);
    return {blob,thumb:tc.toDataURL('image/jpeg',.58),width:w,height:h,size:blob.size,name:(file.name||'foto').replace(/\.[^.]+$/i,'')+'.jpg'};
  }
  async function onPhotos(input){
    const id=input?.closest('.intervention-layout')?.querySelector('[onclick*="saveIntervention"]')?.getAttribute('onclick')?.match(/saveIntervention\('([^']+)'/)?.[1];if(!id)return;
    const list=interventions(),j=list.find(x=>String(x.id)===String(id));if(!j)return;j.photos=Array.isArray(j.photos)?j.photos:[];
    for(const file of [...input.files]){if(!file.type.startsWith('image/'))continue;try{const c=await compress(file),mediaId=uid();await put({id:mediaId,blob:c.blob,kind:'intervention-photo',interventionId:id,clientId:j.clientId,name:c.name,mime:'image/jpeg',width:c.width,height:c.height,size:c.size,thumb:c.thumb,createdAt:new Date().toISOString()});j.photos.push({id:mediaId,src:c.thumb,name:c.name,size:c.size});}catch(e){console.warn(e);toast('Impossibile comprimere una foto')}}
    saveInterventions(list);input.value='';if(typeof render==='function')render();toast(`${j.photos.length} foto associate all'intervento`);
  }
  function bind(){document.querySelectorAll('#d-photos').forEach(x=>{if(x.dataset.tfPhotoFix==='1')return;x.dataset.tfPhotoFix='1';x.addEventListener('change',()=>onPhotos(x))})}
  function repairPhotoImages(){
    const list=interventions(),selected=window.state?.selected;
    let j=list.find(x=>String(x.id)===String(selected));
    if(!j){const btn=document.querySelector('[onclick*="saveIntervention"]');const id=btn?.getAttribute('onclick')?.match(/saveIntervention\('([^']+)'/)?.[1];j=list.find(x=>String(x.id)===String(id))}
    if(!j)return;document.querySelectorAll('#photo-grid img').forEach((img,i)=>{const p=j.photos?.[i];if(p&&typeof p==='object'&&p.src)img.src=p.src})
  }
  function patchRender(){const fn=window.render;if(typeof fn!=='function'||fn.__tfPhotoFix)return;const w=function(...a){const r=fn.apply(this,a);setTimeout(()=>{bind();repairPhotoImages()},0);return r};w.__tfPhotoFix=true;window.render=w}
  function patchBackup(){
    if(typeof window.tfExportBackupSafe==='function'&&!window.tfExportBackupSafe.__tfCompat){window.tfExportBackup=window.tfExportBackupSafe;window.tfExportBackup.__tfCompat=true}
    if(typeof window.tfImportBackupSafe==='function'&&!window.tfImportBackupSafe.__tfCompat){window.tfImportBackup=window.tfImportBackupSafe;window.tfImportBackup.__tfCompat=true}
  }
  function init(){bind();repairPhotoImages();patchRender();patchBackup();const mo=new MutationObserver(()=>{bind();repairPhotoImages();patchRender();patchBackup()});mo.observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
