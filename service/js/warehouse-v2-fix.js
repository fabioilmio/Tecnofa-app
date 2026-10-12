/* TECNOFA Gestionale — Magazzino v2 navigation fix */
(function(){
  function closeMobileSidebar(){
    if(!window.matchMedia?.('(max-width:760px)').matches)return;
    const sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    sidebar.classList.remove('open');
    sidebar.classList.add('tf-collapsed');
  }
  function boot(){
    const old=window.tfNavigate;
    if(typeof old==='function'&&!old.__tfWhFix){
      const n=function(v){
        if(v==='warehouse'){
          closeMobileSidebar();
          state.view='warehouse';
          state.selected=null;
          window.render();
          closeMobileSidebar();
          window.scrollTo({top:0,behavior:'smooth'});
          return;
        }
        const result=old(v);
        closeMobileSidebar();
        return result;
      };
      n.__tfWhFix=true;
      window.tfNavigate=n;
    }
    if(state?.view==='warehouse'&&typeof window.render==='function'){
      window.render();
      closeMobileSidebar();
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
