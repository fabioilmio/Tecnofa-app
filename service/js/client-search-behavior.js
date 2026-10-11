/* TECNOFA Gestionale — Ricerca clienti v2
   Nei nuovi interventi il cliente non deve essere preselezionato. */
(function(){
  function fix(root=document){
    root.querySelectorAll('.tf-inline-client-search').forEach(box=>{
      if(box.dataset.tfEmptyFix==='1')return;
      box.dataset.tfEmptyFix='1';
      const input=box.querySelector('input'),list=box.querySelector('.tf-inline-results');
      const select=box.parentElement?.querySelector('select#i-client,select#tf-q-client');
      if(!input||!list)return;
      if(select && !select.querySelector('option[value=""]')){
        const opt=document.createElement('option');
        opt.value='';
        opt.textContent='Seleziona un cliente…';
        select.insertBefore(opt,select.firstChild);
      }
      if(select)select.value='';
      input.value='';
      const clean=()=>{
        if(!input.value.trim()){
          if(select)select.value='';
          list.innerHTML='<div class="tf-inline-empty tf-search-wait">Inizia a digitare per cercare un cliente.</div>';
        }
      };
      input.addEventListener('input',clean);
      input.addEventListener('focus',clean);
      const clear=box.querySelector('.tf-inline-clear');
      if(clear && clear.dataset.tfEmptyClear!=='1'){
        clear.dataset.tfEmptyClear='1';
        clear.addEventListener('click',()=>setTimeout(()=>{if(select)select.value='';input.value='';clean()},0),true);
      }
      clean();
    });
  }
  const boot=()=>fix(document);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&fix(n)))).observe(document.body,{childList:true,subtree:true});
})();
