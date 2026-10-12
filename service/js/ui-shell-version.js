/* TECNOFA Gestionale — version label */
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
  function boot(){
    const s=document.querySelector('.tf-sidebar-version');
    if(s)s.innerHTML='<strong>'+VERSION+'</strong>';
    patchSettings();
    setTimeout(patchSettings,0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();