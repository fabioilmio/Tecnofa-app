/* TECNOFA — collegamenti amministrativi alle anagrafiche */
(function(){
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(e){return f}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const oldEdit=window.tfAdminEdit;
  function options(id,label){const el=document.getElementById(id);if(!el||el.tagName!=='INPUT')return;const old=el.value;const select=document.createElement('select');select.id=id;const opts=label==='cliente'?read('tf_clients',[]):read('tf_admin_fornitori',[]);select.innerHTML='<option value="">Seleziona</option>'+opts.map(x=>{const v=label==='cliente'?x.name:x.ragione;return `<option value="${esc(v)}">${esc(v)}</option>`}).join('');select.value=old;el.replaceWith(select)}
  window.tfAdminEdit=function(k,rowId){oldEdit(k,rowId);setTimeout(()=>{options('adm-cliente','cliente');options('adm-fornitore','fornitore');const c=document.getElementById('adm-controparte');if(c&&c.tagName==='INPUT'){const old=c.value;const all=[...read('tf_clients',[]).map(x=>x.name),...read('tf_admin_fornitori',[]).map(x=>x.ragione)];const s=document.createElement('select');s.id='adm-controparte';s.innerHTML='<option value="">Seleziona</option>'+all.filter(Boolean).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');s.value=old;c.replaceWith(s)}},0)};
})();