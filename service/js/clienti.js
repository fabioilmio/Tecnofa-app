/* TECNOFA Gestionale — scheda cliente: modifica, elimina e Google Maps */
(function(){
  function mapsQuery(c){
    return [c.address,c.city,c.cap,c.province].filter(Boolean).join(', ');
  }
  function mapsUrl(c){
    return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapsQuery(c));
  }
  function directionsUrl(c){
    return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(mapsQuery(c));
  }
  function nextClientId(){
    return state.clients.reduce((m,c)=>Math.max(m,Number(c.id)||0),0)+1;
  }
  function clientForm(c){
    return `<div class="modal-backdrop tf-client-modal"><div class="modal modal-large">
      <div class="detail-head"><div><div class="eyebrow">${c?'Modifica cliente':'Nuovo cliente'}</div><h2>${c?'Modifica anagrafica':'Nuovo cliente'}</h2><p>Dati utilizzati anche per le indicazioni stradali.</p></div><button class="icon-btn tf-client-close" aria-label="Chiudi">×</button></div>
      <div class="form-grid">
        <div class="field full"><label>Nome / Ragione sociale</label><input id="cf-name" value="${esc(c?.name||'')}" required></div>
        <div class="field"><label>Telefono</label><input id="cf-phone" value="${esc(c?.phone||'')}" type="tel"></div>
        <div class="field"><label>Città</label><input id="cf-city" value="${esc(c?.city||'')}" required></div>
        <div class="field"><label>Indirizzo</label><input id="cf-address" value="${esc(c?.address||'')}" placeholder="Via, numero civico"></div>
        <div class="field"><label>CAP</label><input id="cf-cap" value="${esc(c?.cap||'')}" inputmode="numeric"></div>
        <div class="field"><label>Provincia</label><input id="cf-province" value="${esc(c?.province||'')}" maxlength="2" placeholder="TV"></div>
        <div class="field full"><label>Impianto principale</label><input id="cf-plant" value="${esc(c?.plant||'')}" placeholder="Es. Pompa di calore Daikin"></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px"><button class="ghost-btn tf-client-close">Annulla</button><button class="primary" id="cf-save">Salva cliente</button></div>
    </div></div>`;
  }
  window.tfEditClient=function(id){
    const c=state.clients.find(x=>String(x.id)===String(id));
    if(!c)return;
    const wrap=document.createElement('div');
    wrap.innerHTML=clientForm(c);
    document.body.appendChild(wrap.firstElementChild);
    const modal=document.body.lastElementChild;
    modal.querySelectorAll('.tf-client-close').forEach(b=>b.onclick=()=>modal.remove());
    modal.querySelector('#cf-save').onclick=()=>{
      const name=modal.querySelector('#cf-name').value.trim();
      const city=modal.querySelector('#cf-city').value.trim();
      if(!name||!city){toast('Nome e città sono obbligatori');return;}
      c.name=name;
      c.phone=modal.querySelector('#cf-phone').value.trim();
      c.city=city;
      c.address=modal.querySelector('#cf-address').value.trim();
      c.cap=modal.querySelector('#cf-cap').value.trim();
      c.province=modal.querySelector('#cf-province').value.trim().toUpperCase();
      c.plant=modal.querySelector('#cf-plant').value.trim();
      state.interventions.forEach(j=>{if(String(j.clientId)===String(c.id))j.client=c.name});
      save();
      modal.remove();
      toast('Cliente modificato');
      render();
    };
  };
  window.tfDeleteClient=function(id){
    const c=state.clients.find(x=>String(x.id)===String(id));
    if(!c)return;
    const jobs=state.interventions.filter(x=>String(x.clientId)===String(c.id));
    if(jobs.length){
      toast('Cliente con interventi: meglio conservarlo nello storico');
      return;
    }
    if(!confirm(`Eliminare il cliente "${c.name}"?\n\nL'operazione non può essere annullata.`))return;
    state.clients=state.clients.filter(x=>String(x.id)!==String(id));
    save();
    toast('Cliente eliminato');
    render();
  };
  window.openClient=function(id){
    const c=state.clients.find(x=>String(x.id)===String(id));
    if(!c)return;
    const jobs=state.interventions.filter(x=>String(x.clientId)===String(c.id));
    const wrap=document.createElement('div');
    wrap.className='modal-backdrop';
    const address=mapsQuery(c);
    wrap.innerHTML=`<div class="modal modal-large">
      <div class="detail-head"><div><div class="eyebrow">Scheda cliente</div><h2>${esc(c.name)}</h2><p>${esc(address||'Indirizzo non inserito')}</p></div><button class="icon-btn modal-close" aria-label="Chiudi">×</button></div>
      <div class="detail-grid">
        <div class="detail-card"><span>Telefono</span><strong>${esc(c.phone||'—')}</strong></div>
        <div class="detail-card"><span>Impianto principale</span><strong>${esc(c.plant||'—')}</strong></div>
        <div class="detail-card"><span>Indirizzo</span><strong>${esc(c.address||'—')}</strong></div>
        <div class="detail-card"><span>Località</span><strong>${esc([c.cap,c.city,c.province].filter(Boolean).join(' ')||'—')}</strong></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin:18px 0">
        <button class="primary" onclick="tfEditClient('${c.id}')">✏ Modifica</button>
        <a class="ghost-btn" href="${mapsUrl(c)}" target="_blank" rel="noopener">🗺 Apri mappa</a>
        <a class="ghost-btn" href="${directionsUrl(c)}" target="_blank" rel="noopener">🚗 Indicazioni stradali</a>
        <button class="ghost-btn" onclick="tfDeleteClient('${c.id}')">Elimina</button>
      </div>
      <h3 class="section-title">Storico interventi</h3>
      <div class="job-list">${jobs.map(jobRow).join('')||'<div class="empty">Nessun intervento.</div>'}</div>
    </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.modal-close').onclick=()=>wrap.remove();
  };
  window.openClientModal=function(id){
    const existing=id!=null?state.clients.find(x=>String(x.id)===String(id)):null;
    const wrap=document.createElement('div');
    wrap.innerHTML=clientForm(existing);
    document.body.appendChild(wrap.firstElementChild);
    const modal=document.body.lastElementChild;
    modal.querySelectorAll('.tf-client-close').forEach(b=>b.onclick=()=>modal.remove());
    modal.querySelector('#cf-save').onclick=()=>{
      const name=modal.querySelector('#cf-name').value.trim();
      const city=modal.querySelector('#cf-city').value.trim();
      if(!name||!city){toast('Nome e città sono obbligatori');return;}
      const c=existing||{id:nextClientId()};
      c.name=name;c.phone=modal.querySelector('#cf-phone').value.trim();c.city=city;c.address=modal.querySelector('#cf-address').value.trim();c.cap=modal.querySelector('#cf-cap').value.trim();c.province=modal.querySelector('#cf-province').value.trim().toUpperCase();c.plant=modal.querySelector('#cf-plant').value.trim();
      if(!existing)state.clients.push(c);
      state.interventions.forEach(j=>{if(String(j.clientId)===String(c.id))j.client=c.name});
      save();modal.remove();toast(existing?'Cliente modificato':'Cliente aggiunto');render();
    };
  };
})();
