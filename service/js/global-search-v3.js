/* TECNOFA Gestionale — ricerca globale v3 */
(function(){
  'use strict';
  const norm=v=>String(v??'').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const escSafe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const arr=(key,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:fallback}catch{return fallback}};
  const clients=()=>Array.isArray(window.state?.clients)?state.clients:arr('tf_clients');
  const products=()=>arr('tf_products');
  const interventions=()=>Array.isArray(window.state?.interventions)?state.interventions:arr('tf_interventions');
  const users=()=>arr('tf_users');
  const text=o=>Object.values(o||{}).filter(v=>v!==null&&v!==undefined).join(' ');
  function search(q){
    const n=norm(q).trim(); if(!n)return {clients:[],products:[],interventions:[],users:[]};
    const match=o=>norm(text(o)).includes(n);
    return {
      clients:clients().filter(match).slice(0,8),
      products:products().filter(match).slice(0,8),
      interventions:interventions().filter(match).slice(0,8),
      users:users().filter(match).slice(0,6)
    };
  }
  function resultGroup(title,icon,list,type){
    if(!list.length)return '';
    return `<section class="tf-gs-group"><div class="tf-gs-group-title"><span>${icon}</span>${title}<small>${list.length}</small></div><div class="tf-gs-list">${list.map((x,i)=>{
      const id=escSafe(x.id||x.clientNumber||x.code||x.username||i);
      let main='',sub='';
      if(type==='client'){main=x.name||'Cliente';sub=[x.clientNumber,x.city,x.address].filter(Boolean).join(' · ')}
      if(type==='product'){main=x.name||x.description||'Articolo';sub=[x.code,x.originalCode,x.brand,x.barcode].filter(Boolean).join(' · ')}
      if(type==='intervention'){main=x.type||x.title||'Intervento';sub=[x.client,x.date,x.time,x.tech,x.status].filter(Boolean).join(' · ')}
      if(type==='user'){main=x.name||x.username||'Utente';sub=[x.role,x.email].filter(Boolean).join(' · ')}
      return `<button type="button" class="tf-gs-result" data-type="${type}" data-id="${id}"><span class="tf-gs-result-icon">${icon}</span><span class="tf-gs-result-text"><strong>${escSafe(main)}</strong><small>${escSafe(sub||'')}</small></span><span class="tf-gs-arrow">›</span></button>`;
    }).join('')}</div></section>`;
  }
  function open(){
    document.querySelector('.tf-global-search-overlay')?.remove();
    const wrap=document.createElement('div');wrap.className='modal-backdrop tf-global-search-overlay';
    wrap.innerHTML=`<div class="modal tf-global-search-modal-v3" role="dialog" aria-modal="true" aria-labelledby="tf-gs-title"><div class="tf-gs-head"><div><div class="eyebrow">Ricerca globale</div><h2 id="tf-gs-title">Cerca nel gestionale</h2><p>Clienti, interventi, articoli di magazzino e utenti in un'unica ricerca.</p></div><button type="button" class="icon-btn modal-close">×</button></div><div class="tf-gs-input"><span>⌕</span><input id="tf-gs-query" type="search" autocomplete="off" placeholder="Nome, codice, barcode, articolo, cliente, intervento…"><kbd>Esc</kbd></div><div id="tf-gs-results" class="tf-gs-results"><div class="tf-gs-hint">Inizia a digitare per cercare. Nessun dato viene mostrato prima della ricerca.</div></div></div>`;
    document.body.appendChild(wrap);
    const input=wrap.querySelector('#tf-gs-query'),results=wrap.querySelector('#tf-gs-results');
    const close=()=>{wrap.remove();document.removeEventListener('keydown',key)};
    const key=e=>{if(e.key==='Escape')close()};
    const render=()=>{const q=input.value.trim(),r=search(q);if(!q){results.innerHTML='<div class="tf-gs-hint">Inizia a digitare per cercare. Puoi cercare clienti, articoli, barcode, interventi e utenti.</div>';return}const html=resultGroup('Clienti','◉',r.clients,'client')+resultGroup('Magazzino','▦',r.products,'product')+resultGroup('Interventi','✓',r.interventions,'intervention')+resultGroup('Utenti / tecnici','♟',r.users,'user');results.innerHTML=html||'<div class="tf-gs-empty">Nessun risultato trovato.</div>';results.querySelectorAll('.tf-gs-result').forEach(b=>b.addEventListener('click',()=>select(b.dataset.type,b.dataset.id)))};
    const select=(type,id)=>{close();if(type==='client'&&typeof openClient==='function')return openClient(id);if(type==='product'&&typeof tfWarehouseCard==='function'){tfNavigate('warehouse');setTimeout(()=>tfWarehouseCard(id),80);return}if(type==='intervention'&&typeof openIntervention==='function')return openIntervention(id);if(type==='user')return tfNavigate('technicians')};
    input.addEventListener('input',render);wrap.querySelector('.modal-close').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close()});document.addEventListener('keydown',key);input.focus();
  }
  function inject(){const top=document.querySelector('.top-actions');if(!top)return;top.querySelectorAll('.tf-global-search,.tf-global-search-btn').forEach(x=>x.remove());const b=document.createElement('button');b.type='button';b.className='ghost-btn tf-global-search';b.id='tf-global-search-v3';b.innerHTML='⌕ <span>Cerca</span>';b.title='Ricerca globale (Ctrl/Cmd+K)';b.addEventListener('click',open);top.insertBefore(b,top.firstChild)}
  window.tfOpenGlobalSearch=open;inject();
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}});
  const style=document.createElement('style');style.textContent=`
    .tf-global-search-modal-v3{width:min(760px,calc(100vw - 28px));max-height:min(82vh,760px);overflow:hidden;display:flex;flex-direction:column}
    .tf-gs-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.tf-gs-head h2{margin:4px 0}.tf-gs-head p{margin:0;color:var(--muted);font-size:12px}
    .tf-gs-input{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:18px 0 12px;background:#fbfcfb}.tf-gs-input span{font-size:19px;color:var(--green-dark)}.tf-gs-input input{border:0;outline:0;background:transparent;flex:1;font:inherit;font-size:14px;min-width:0}.tf-gs-input kbd{font-size:10px;color:var(--muted);border:1px solid var(--line);border-radius:5px;padding:2px 5px;background:#fff}
    .tf-gs-results{overflow:auto;padding-right:2px}.tf-gs-hint,.tf-gs-empty{padding:26px 12px;text-align:center;color:var(--muted);font-size:13px}.tf-gs-group{margin:0 0 14px}.tf-gs-group-title{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.08em;color:var(--green-dark);padding:5px 4px}.tf-gs-group-title small{margin-left:auto;font-size:10px;color:var(--muted)}.tf-gs-list{display:grid;gap:5px}.tf-gs-result{width:100%;display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:#fff;border-radius:10px;padding:10px;text-align:left;color:var(--ink)}.tf-gs-result:hover{border-color:#b9cfbe;background:var(--green-soft)}.tf-gs-result-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#eef6f0;color:var(--green-dark);font-weight:800}.tf-gs-result-text{min-width:0;flex:1}.tf-gs-result-text strong,.tf-gs-result-text small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tf-gs-result-text small{margin-top:3px;color:var(--muted);font-size:11px}.tf-gs-arrow{font-size:20px;color:var(--muted)}
    @media(max-width:600px){.tf-global-search-modal-v3{width:calc(100vw - 18px);max-height:88vh}.tf-gs-head p{font-size:11px}}
  `;document.head.appendChild(style);
})();
