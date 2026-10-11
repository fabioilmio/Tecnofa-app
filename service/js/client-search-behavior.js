/* TECNOFA Gestionale — Ricerca clienti: nessun suggerimento finché non si digita */
(function(){
  function fix(root=document){
    root.querySelectorAll('.tf-inline-client-search').forEach(box=>{
      if(box.dataset.tfEmptyFix==='1')return;
      box.dataset.tfEmptyFix='1';
      const input=box.querySelector('input'),list=box.querySelector('.tf-inline-results');
      if(!input||!list)return;
      const clean=()=>{if(!input.value.trim())list.innerHTML='<div class="tf-inline-empty tf-search-wait">Inizia a digitare per cercare un cliente.</div>';};
      input.addEventListener('input',clean);
      input.addEventListener('focus',clean);
      clean();
    });
  }
  const boot=()=>fix(document);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&fix(n)))).observe(document.body,{childList:true,subtree:true});
})();
