/* TECNOFA Gestionale — Impianti v1
   Archivio impianti collegato ai clienti, completamente modificabile e filtrabile. */
(function(){
  'use strict';
  const KEY='tf_plants';
  const TYPES=['Caldaia','Climatizzatore','Pompa di calore','Fotovoltaico','Impianto elettrico','Domotica','Scaldacqua','Ventilazione','Impianto idraulico','Altro'];
  const STATUS=['Attivo','Fuori servizio','Dismesso'];
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback}catch{return fallback}};
  const clients=()=>read('tf_clients',[]);
  const escP=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  function load(){
    const existing=read(KEY,null);
    if(existing) return existing;
    const migrated=clients().filter(c=>String(c.plant||'').trim()).map((c,i)=>({
      id:'IMP-'+String(i+1).padStart(5,'0'),clientId:c.id,clientName:c.name||'',
      type:c.plant||'Altro',brand:'',model:'',serialNumber:'',installationDate:'',warrantyUntil:'',
      status:'Attivo',power:'',refrigerant:'',location:'',components:'',notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    }));
    localStorage.setItem(KEY,JSON.stringify(migrated));
    return migrated;
  }
  const save=list=>localStorage.setItem(KEY,JSON.stringify(list));
  function syncNames(list){
    const cs=clients();
    let changed=false;
    list.forEach(p=>{const c=cs.find(x=>String(x.id)===String(p.clientId));if(c&&p.clientName!==c.name){p.clientName=c.name;changed=true}});
    if(changed)save(list);
    return list;
  }
  function nextCode(list){return 'IMP-'+String(list.reduce((m,x)=>Math.max(m,parseInt(String(x.id||'').replace(/\D/g,''))||0),0)+1).padStart(5,'0')}
  function selectOptions(items,current,placeholder){return '<option value="">'+escP(placeholder||'Tutti')+'</option>'+items.map(x=>`<option value="${escP(x)}" ${String(x)===String(current||'')?'selected':''}>${escP(x)}</option>`).join('')}
  function unique(list,key){return [...new Set(list.map(x=>String(x[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'))}
  function page(){
    const list=syncNames(load()),cs=clients();
    return `<div class="page-head"><div><div class="eyebrow">Anagrafica tecnica</div><h1>Impianti</h1><p>Archivio tecnico degli impianti dei clienti. Ogni scheda è modificabile e collegata all'anagrafica cliente.</p></div><button class="primary" onclick="tfPlantEdit(null)">+ Nuovo impianto</button></div>
      <section class="panel tf-plants-filters"><div class="panel-head"><div><h2>Ricerca e filtri</h2><p class="muted">Filtra per cliente, tipologia, marca o stato.</p></div><span id="tf-plant-count" class="badge"></span></div>
        <div class="form-grid tf-plants-filter-grid">
          <div class="field full"><label>Cerca</label><input id="tf-p-search" type="search" placeholder="Codice, cliente, modello, matricola, indirizzo…" oninput="tfPlantFilter()"></div>
          <div class="field"><label>Cliente</label><select id="tf-p-client" onchange="tfPlantFilter()">${selectOptions(cs.map(c=>c.name).sort((a,b)=>a.localeCompare(b,'it')),'','Tutti i clienti')}</select></div>
          <div class="field"><label>Tipo impianto</label><select id="tf-p-type" onchange="tfPlantFilter()">${selectOptions(TYPES,'','Tutti i tipi')}</select></div>
          <div class="field"><label>Marca</label><select id="tf-p-brand" onchange="tfPlantFilter()">${selectOptions(unique(list,'brand'),'','Tutte le marche')}</select></div>
          <div class="field"><label>Stato</label><select id="tf-p-status" onchange="tfPlantFilter()">${selectOptions(STATUS,'','Tutti gli stati')}</select></div>
          <div class="field" style="align-self:end"><button class="ghost-btn wide" onclick="tfPlantResetFilters()">Azzera filtri</button></div>
        </div>
      </section>
      <section class="panel section-gap"><div id="tf-plants-table" class="table-wrap">${table(list)}</div></section>`;
  }
  function table(list){
    const count=document.getElementById('tf-plant-count');if(count)count.textContent=`${list.length} ${list.length===1?'impianto':'impianti'}`;
    if(!list.length)return '<div class="empty">Nessun impianto trovato con i filtri selezionati.</div>';
    return `<table class="table tf-plants-table"><thead><tr><th>Codice</th><th>Cliente</th><th>Tipo</th><th>Marca / Modello</th><th>Matricola</th><th>Stato</th><th></th></tr></thead><tbody>${list.map(p=>`<tr><td><strong>${escP(p.id)}</strong></td><td>${escP(p.clientName||'—')}</td><td>${escP(p.type||'—')}</td><td>${escP([p.brand,p.model].filter(Boolean).join(' · ')||'—')}</td><td>${escP(p.serialNumber||'—')}</td><td><span class="badge ${p.status==='Attivo'?'tf-status-ok':p.status==='Dismesso'?'gray':'warning'}">${escP(p.status||'—')}</span></td><td><button class="panel-link" onclick="tfPlantOpen('${escP(p.id)}')">Apri</button> <button class="panel-link" onclick="tfPlantEdit('${escP(p.id)}')">Modifica</button></td></tr>`).join('')}</tbody></table>`;
  }
  function filtered(){
    const list=syncNames(load()),q=(document.getElementById('tf-p-search')?.value||'').trim().toLowerCase(),client=(document.getElementById('tf-p-client')?.value||''),type=(document.getElementById('tf-p-type')?.value||''),brand=(document.getElementById('tf-p-brand')?.value||''),status=(document.getElementById('tf-p-status')?.value||'');
    return list.filter(p=>{
      const hay=[p.id,p.clientName,p.type,p.brand,p.model,p.serialNumber,p.location,p.power,p.refrigerant,p.components,p.notes].join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(!client||p.clientName===client)&&(!type||p.type===type)&&(!brand||p.brand===brand)&&(!status||p.status===status);
    });
  }
  window.tfPlantFilter=()=>{const host=document.getElementById('tf-plants-table');if(host)host.innerHTML=table(filtered())};
  window.tfPlantResetFilters=()=>{['tf-p-search','tf-p-client','tf-p-type','tf-p-brand','tf-p-status'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='' });tfPlantFilter()};
  function form(p){
    const cs=clients(),isEdit=!!p,code=p?.id||nextCode(load());
    return `<div class="modal-backdrop tf-plant-modal"><div class="modal modal-large"><div class="tf-client-form-head"><div class="detail-head"><div><div class="eyebrow">${isEdit?'Modifica impianto':'Nuovo impianto'}</div><h2>${isEdit?'Scheda tecnica':'Nuovo impianto'}</h2><p>Codice impianto <strong>${escP(code)}</strong></p></div></div><button class="tf-modal-close tf-plant-close" aria-label="Chiudi">×</button></div>
      <div class="form-grid">
        <div class="field"><label>Codice impianto</label><input id="p-code" value="${escP(code)}" readonly></div>
        <div class="field"><label>Cliente *</label><select id="p-client"><option value="">Seleziona cliente</option>${cs.map(c=>`<option value="${escP(c.id)}" ${String(c.id)===String(p?.clientId||'')?'selected':''}>${escP(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Tipo impianto *</label><select id="p-type">${TYPES.map(t=>`<option value="${escP(t)}" ${t===String(p?.type||'')?'selected':''}>${escP(t)}</option>`).join('')}</select></div>
        <div class="field"><label>Stato</label><select id="p-status">${STATUS.map(s=>`<option ${s===String(p?.status||'Attivo')?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Marca</label><input id="p-brand" value="${escP(p?.brand||'')}" placeholder="Es. Daikin, Ariston, Huawei…"></div>
        <div class="field"><label>Modello</label><input id="p-model" value="${escP(p?.model||'')}" placeholder="Modello / serie"></div>
        <div class="field"><label>Matricola</label><input id="p-serial" value="${escP(p?.serialNumber||'')}" placeholder="Numero di serie"></div>
        <div class="field"><label>Potenza / taglia</label><input id="p-power" value="${escP(p?.power||'')}" placeholder="Es. 8 kW / 6 kWp / 12000 BTU"></div>
        <div class="field"><label>Refrigerante</label><input id="p-ref" value="${escP(p?.refrigerant||'')}" placeholder="Es. R32, R290, R410A"></div>
        <div class="field"><label>Data installazione</label><input id="p-install" type="date" value="${escP(p?.installationDate||'')}"></div>
        <div class="field"><label>Garanzia fino al</label><input id="p-warranty" type="date" value="${escP(p?.warrantyUntil||'')}"></div>
        <div class="field"><label>Ubicazione</label><input id="p-location" value="${escP(p?.location||'')}" placeholder="Locale tecnico, tetto, esterno…"></div>
        <div class="field full"><label>Componenti / configurazione</label><textarea id="p-components" rows="4" placeholder="Unità interne, esterne, accumulo, inverter, termostati, quadri, componenti principali…">${escP(p?.components||'')}</textarea></div>
        <div class="field full"><label>Note tecniche</label><textarea id="p-notes" rows="4" placeholder="Informazioni tecniche, accesso, manutenzioni, anomalie note…">${escP(p?.notes||'')}</textarea></div>
      </div><div class="modal-actions"><button class="ghost-btn tf-plant-close">Annulla</button><button class="primary" id="p-save">Salva impianto</button></div></div></div>`;
  }
  function edit(id){
    const list=load(),p=id?list.find(x=>String(x.id)===String(id)):null,host=document.createElement('div');host.innerHTML=form(p);const modal=host.firstElementChild;document.body.appendChild(modal);modal.querySelectorAll('.tf-plant-close').forEach(b=>b.onclick=()=>modal.remove());
    modal.querySelector('#p-save').onclick=()=>{
      const clientId=modal.querySelector('#p-client').value,type=modal.querySelector('#p-type').value;if(!clientId||!type){toast('Cliente e tipo impianto sono obbligatori');return}
      const c=clients().find(x=>String(x.id)===String(clientId));const item=p||{id:modal.querySelector('#p-code').value,createdAt:new Date().toISOString()};Object.assign(item,{clientId:Number(clientId),clientName:c?.name||'',type,status:modal.querySelector('#p-status').value,brand:modal.querySelector('#p-brand').value.trim(),model:modal.querySelector('#p-model').value.trim(),serialNumber:modal.querySelector('#p-serial').value.trim(),power:modal.querySelector('#p-power').value.trim(),refrigerant:modal.querySelector('#p-ref').value.trim(),installationDate:modal.querySelector('#p-install').value,warrantyUntil:modal.querySelector('#p-warranty').value,location:modal.querySelector('#p-location').value.trim(),components:modal.querySelector('#p-components').value.trim(),notes:modal.querySelector('#p-notes').value.trim(),updatedAt:new Date().toISOString()});if(!p)list.push(item);save(list);modal.remove();toast(p?'Impianto modificato':'Impianto aggiunto');if(typeof render==='function')render();
    };
  }
  function open(id){const p=load().find(x=>String(x.id)===String(id));if(!p)return;const cs=clients(),c=cs.find(x=>String(x.id)===String(p.clientId));const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal modal-large tf-plant-detail"><div class="detail-head"><div><div class="eyebrow">Scheda impianto · ${escP(p.id)}</div><h2>${escP(p.type||'Impianto')}</h2><p>${escP(c?.name||p.clientName||'Cliente non collegato')} · ${escP([p.brand,p.model].filter(Boolean).join(' · ')||'Modello non indicato')}</p></div><button class="tf-modal-close modal-close" aria-label="Chiudi">×</button></div><div class="tf-plant-actions"><button class="tf-icon-action" onclick="tfPlantEdit('${escP(p.id)}')">✎<span>Modifica</span></button><button class="tf-icon-action danger" onclick="tfPlantDelete('${escP(p.id)}')">⌫<span>Elimina</span></button></div><div class="detail-grid"><div class="detail-card"><span>Codice</span><strong>${escP(p.id)}</strong></div><div class="detail-card"><span>Cliente</span><strong>${escP(c?.name||p.clientName||'—')}</strong></div><div class="detail-card"><span>Tipo</span><strong>${escP(p.type||'—')}</strong></div><div class="detail-card"><span>Stato</span><strong>${escP(p.status||'—')}</strong></div><div class="detail-card"><span>Marca</span><strong>${escP(p.brand||'—')}</strong></div><div class="detail-card"><span>Modello</span><strong>${escP(p.model||'—')}</strong></div><div class="detail-card"><span>Matricola</span><strong>${escP(p.serialNumber||'—')}</strong></div><div class="detail-card"><span>Potenza / taglia</span><strong>${escP(p.power||'—')}</strong></div><div class="detail-card"><span>Refrigerante</span><strong>${escP(p.refrigerant||'—')}</strong></div><div class="detail-card"><span>Installazione</span><strong>${escP(p.installationDate||'—')}</strong></div><div class="detail-card"><span>Garanzia</span><strong>${escP(p.warrantyUntil||'—')}</strong></div><div class="detail-card"><span>Ubicazione</span><strong>${escP(p.location||'—')}</strong></div></div><section class="tf-client-note"><div class="panel-head"><h3>Componenti / configurazione</h3><button class="panel-link" onclick="tfPlantEdit('${escP(p.id)}')">Modifica</button></div><div class="tf-note-content">${escP(p.components||'Nessuna configurazione inserita.')}</div></section><section class="tf-client-note section-gap"><div class="panel-head"><h3>Note tecniche</h3><button class="panel-link" onclick="tfPlantEdit('${escP(p.id)}')">Modifica</button></div><div class="tf-note-content">${escP(p.notes||'Nessuna nota inserita.')}</div></section></div>`;document.body.appendChild(wrap);wrap.querySelector('.modal-close').onclick=()=>wrap.remove();}
  window.tfPlantsPage=()=>{document.getElementById('view').innerHTML=page()};
  window.tfPlantEdit=edit;window.tfPlantOpen=open;
  window.tfPlantDelete=id=>{const list=load(),p=list.find(x=>String(x.id)===String(id));if(!p)return;if(!confirm(`Eliminare l'impianto ${p.id}?\n\nLa scheda verrà rimossa dall'archivio tecnico.`))return;save(list.filter(x=>String(x.id)!==String(id)));toast('Impianto eliminato');if(typeof render==='function')render()};
})();
