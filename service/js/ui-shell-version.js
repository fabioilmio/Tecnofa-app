/* TECNOFA Gestionale — version label */
(function(){
  const VERSION='V52';
  function patchSettings(){
    if(typeof window.settings==='function'&&!window.settings.__tfVersionPatched){
      const old=window.settings;
      const next=function(){return String(old()).replace(/TECNOFA Gestionale · cache PWA v\d+ · autenticazione D1/g,'TECNOFA Gestionale · V52 · cache PWA v53 · autenticazione D1').replace(/cache PWA v\d+/g,'cache PWA v53');};
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