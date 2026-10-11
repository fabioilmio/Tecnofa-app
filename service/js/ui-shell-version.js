/* TECNOFA Gestionale — version label */
(function(){
  function boot(){
    const s=document.querySelector('.tf-sidebar-version');
    if(s)s.innerHTML='<strong>v2026.41</strong>';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else setTimeout(boot,0);
})();
