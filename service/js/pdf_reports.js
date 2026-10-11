/* TECNOFA Gestionale — anteprima documento e stampa PDF rapida */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const euro=n=>Number(n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
  function openPreview(title,rows){
    const html=`<html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;color:#17352d;padding:34px;max-width:900px;margin:auto}h1{margin:0 0 4px}p{color:#68756f}.brand{font-weight:800;letter-spacing:1px;margin-bottom:28px}.row{display:grid;grid-template-columns:220px 1fr;border-bottom:1px solid #dfe6e1;padding:11px 0}.actions{position:fixed;right:20px;top:20px;display:flex;gap:8px}.actions button{padding:10px 14px;border:1px solid #cdd8d1;border-radius:8px;background:#fff;cursor:pointer}@media print{.actions{display:none}body{padding:0}}</style></head><body><div class="actions"><button onclick="window.print()">Stampa / Salva PDF</button><button onclick="window.close()">Chiudi</button></div><div class="brand">TECNOFA GESTIONALE</div><h1>${esc(title)}</h1><p>Documento visualizzato in anteprima · ${new Date().toLocaleDateString('it-IT')}</p>${rows.map(r=>`<div class="row"><b>${esc(r[0])}</b><span>${esc(r[1])}</span></div>`).join('')}<p style="margin-top:35px">Documento generato da TECNOFA Gestionale.</p></body></html>`;
    const w=window.open('','_blank');if(!w){toast('Consenti i popup per visualizzare il PDF');return}w.document.write(html);w.document.close();w.focus();
  }
  function addEyes(){
    if(!window.state?.adminModule)return;
    document.querySelectorAll('.data-table tbody tr').forEach(tr=>{
      const actions=tr.querySelector('.actions');if(!actions||actions.querySelector('.pdf-eye'))return;
      const edit=actions.querySelector('button[onclick*="tfAdminEdit"]');if(!edit)return;
      const m=edit.getAttribute('onclick')?.match(/tfAdminEdit\('([^']+)','([^']+)'\)/);if(!m)return;
      const k=m[1],id=m[2];const data=(()=>{try{return JSON.parse(localStorage.getItem('tf_admin_'+k)||'[]')}catch{return []}})().find(x=>x.id===id);if(!data)return;
      const b=document.createElement('button');b.className='panel-link pdf-eye';b.title='Visualizza documento';b.setAttribute('aria-label','Visualizza documento');b.textContent='◉';
      b.onclick=()=>openPreview((document.querySelector('h1')?.textContent||'Documento')+' · '+(data.numero||data.documento||id),Object.entries(data).filter(([key])=>key!=='id').map(([key,val])=>[key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase()),(key==='totale'||key==='importo')?euro(val):val]));
      actions.insertBefore(b,actions.firstChild);
    });
  }
  const mo=new MutationObserver(()=>setTimeout(addEyes,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mo.observe(document.getElementById('view'),{childList:true,subtree:true}));else mo.observe(document.getElementById('view'),{childList:true,subtree:true});
  window.tfQuickPdfPreview=openPreview;
})();