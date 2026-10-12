/* TECNOFA Gestionale — version label + D1 user bridge */
(function(){
  const VERSION='V52';
  function patchSettings(){
    if(typeof window.settings==='function'&&!window.settings.__tfVersionPatched){
      const old=window.settings;
      const next=function(){return String(old()).replace(/cache PWA v\d+/g,'cache PWA v56');};
      next.__tfVersionPatched=true;
      window.settings=next;
    }
  }
  function loadD1UserBridge(){
    if(document.getElementById('tf-admin-d1-fix'))return;
    const s=document.createElement('script');s.id='tf-admin-d1-fix';s.src='js/admin-d1-fix.js?v=20261012-56';s.async=false;document.head.appendChild(s);
  }
  function boot(){
    const s=document.querySelector('.tf-sidebar-version');
    if(s)s.innerHTML='<strong>'+VERSION+'</strong>';
    patchSettings();loadD1UserBridge();
    setTimeout(patchSettings,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();