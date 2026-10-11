/* TECNOFA Gestionale — Magazzino v2 navigation fix */
(function(){
  function boot(){
    const old=window.tfNavigate;
    if(typeof old==='function'&&!old.__tfWhFix){
      const n=function(v){if(v==='warehouse'){state.view='warehouse';state.selected=null;window.render();window.scrollTo({top:0,behavior:'smooth'});return}return old(v)};
      n.__tfWhFix=true;window.tfNavigate=n;
    }
    if(state?.view==='warehouse'&&typeof window.render==='function')window.render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
