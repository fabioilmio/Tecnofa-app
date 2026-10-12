/* TECNOFA Gestionale — local-first version label and sync bootstrap */
(function(){
  const VERSION='V53-LOCAL';
  function loadSync(){
    if(document.querySelector('script[data-tf-sync-engine]'))return;
    const s=document.createElement('script');s.src='js/sync-engine.js?v=20261012-local1';s.dataset.tfSyncEngine='1';document.body.appendChild(s);
  }
  function patchSettings(){
    if(typeof window.settings==='function'&&!window.settings.__tfVersionPatched){
      const old=window.settings;
      const next=function(){return String(old()).replace(/cache PWA v\d+/g,'cache PWA v58').replace(/autenticazione D1/g,'modalità locale · offline-first');};
      next.__tfVersionPatched=true;window.settings=next;
    }
  }
  function boot(){const s=document.querySelector('.tf-sidebar-version');if(s)s.innerHTML='<strong>'+VERSION+'</strong>';patchSettings();loadSync();setTimeout(patchSettings,0);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();