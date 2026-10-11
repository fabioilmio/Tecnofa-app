/* TECNOFA Gestionale — client search fix
   New intervention/client picker must start empty, never on the first customer. */
(function(){
  'use strict';
  function resetPicker(root){
    if(!root || !root.querySelectorAll) return;
    root.querySelectorAll('select#i-client, select#tf-q-client').forEach(function(select){
      const box=select.parentElement?.querySelector('.tf-inline-client-search');
      if(!box) return;
      select.value='';
      const input=box.querySelector('input[type="search"]');
      const list=box.querySelector('.tf-inline-results');
      if(input){ input.value=''; input.removeAttribute('value'); }
      if(list) list.innerHTML='<div class="tf-inline-empty">Inizia a digitare per cercare un cliente.</div>';
      const clear=box.querySelector('.tf-inline-clear');
      if(clear && clear.dataset.tfFix!=='1'){
        clear.dataset.tfFix='1';
        clear.addEventListener('click',function(){
          setTimeout(function(){
            select.value='';
            if(input) input.value='';
            if(list) list.innerHTML='<div class="tf-inline-empty">Inizia a digitare per cercare un cliente.</div>';
          },0);
        },true);
      }
    });
  }
  function watch(){
    resetPicker(document);
    const observer=new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes.forEach(function(n){ if(n.nodeType===1) resetPicker(n); });
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch); else watch();
})();
