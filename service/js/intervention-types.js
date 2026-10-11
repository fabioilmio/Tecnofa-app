/* TECNOFA Gestionale — Tipi attività, checklist e listino v1 */
(function(){
  const KEY='tf_activity_types';
  const defaults=[
    {id:'manutenzione_ordinaria',label:'Manutenzione ordinaria',price:120,unit:'intervento'},
    {id:'manutenzione_straordinaria',label:'Manutenzione straordinaria',price:0,unit:'intervento'},
    {id:'intervento',label:'Intervento / riparazione',price:0,unit:'intervento'},
    {id:'sopralluogo',label:'Sopralluogo',price:50,unit:'intervento'},
    {id:'diagnosi',label:'Diagnosi / ricerca guasto',price:70,unit:'intervento'},
    {id:'collaudo',label:'Collaudo / verifica',price:60,unit:'intervento'},
    {id:'avviamento',label:'Avviamento / messa in servizio',price:80,unit:'intervento'},
    {id:'controllo',label:'Controllo / verifica tecnica',price:50,unit:'intervento'}
  ];
  const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(v)&&v.length?v:defaults}catch{return defaults}};
  const types=load();
  window.tfActivityTypes=()=>types;
  window.tfActivityDefaults=defaults;
  const money=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  window.tfActivityMoney=money;
  const selectedIds=()=>Array.from(document.querySelectorAll('.tf-activity-check:checked')).map(x=>x.value);
  function activityBlock(j){
    const selected=new Set(Array.isArray(j?.activities)?j.activities:[]);
    return `<div class="panel section-gap tf-activity-panel"><div class="panel-head"><div><h2>Attività svolte</h2><span class="muted">Seleziona una o più attività effettivamente eseguite.</span></div><span class="badge">${types.filter(t=>selected.has(t.id)).length} selezionate</span></div><div class="tf-activity-grid">${types.map(t=>`<label class="tf-activity-option"><input class="tf-activity-check" type="checkbox" value="${t.id}" ${selected.has(t.id)?'checked':''}><span><strong>${t.label}</strong><small>${money(t.price)} / ${t.unit}</small></span></label>`).join('')}</div><div class="tf-activity-notes"><label>Note per il tecnico</label><textarea id="d-tech-notes" rows="3" placeholder="Descrivi il problema, cosa deve verificare il tecnico o il motivo dell'uscita…">${esc(j?.technicianNotes||'')}</textarea></div><div class="tf-activity-price"><span>Prezzo attività selezionate</span><strong id="tf-activity-total">${money(types.filter(t=>selected.has(t.id)).reduce((s,t)=>s+Number(t.price||0),0))}</strong></div></div>`;
  }
  const oldDetail=window.interventionDetail;
  const oldSave=window.saveIntervention;
  const oldOpen=window.openInterventionModal;
  function bindActivityTotal(wrap){
    const total=wrap.querySelector('#tf-activity-total');
    if(!total)return;
    const recalc=()=>{total.textContent=money(types.filter(t=>wrap.querySelector(`.tf-activity-check[value="${t.id}"]`)?.checked).reduce((s,t)=>s+Number(t.price||0),0))};
    wrap.querySelectorAll('.tf-activity-check').forEach(x=>x.addEventListener('change',recalc));recalc();
  }
  window.openInterventionModal=function(){
    const clients=Array.isArray(state.clients)?state.clients:[];
    const techs=typeof tfTechs==='function'?tfTechs():['Fabio','Tecnico 01','Tecnico 02'];
    const wrap=document.createElement('div');wrap.className='modal-backdrop';
    wrap.innerHTML=`<div class="modal tf-intervention-modal"><div class="detail-head"><div><div class="eyebrow">Programmazione</div><h2>Nuovo intervento</h2><p>Cliente, attività, problema e tecnico.</p></div><button type="button" class="icon-btn modal-close" aria-label="Chiudi">×</button></div><div class="form-grid"><div class="field"><label>Data</label><input id="i-date" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Orario</label><input id="i-time" type="time" value="09:00"></div><div class="field full"><label>Cliente</label><div id="tf-intervention-client-slot"></div><select id="i-client" hidden>${clients.map(c=>`<option value="${c.id}">${esc(c.name)} — ${esc(c.plant||'')}</option>`).join('')}</select></div><div class="field full"><label>Tipo di attività</label><div class="tf-activity-grid tf-activity-grid-modal">${types.map(t=>`<label class="tf-activity-option"><input class="tf-new-activity" type="checkbox" value="${t.id}"><span><strong>${t.label}</strong><small>${money(t.price)}</small></span></label>`).join('')}</div></div><div class="field full"><label>Note per il tecnico</label><textarea id="i-tech-notes" rows="3" placeholder="Problema segnalato / motivo dell'uscita / cosa verificare…"></textarea></div><div class="field"><label>Tecnico</label><select id="i-tech">${techs.map(t=>`<option>${esc(t)}</option>`).join('')}</select></div><div class="field"><label>Stato</label><select id="i-status"><option>Programmata</option><option>Confermato</option><option>In corso</option></select></div><div class="field"><label>Durata</label><select id="i-duration"><option value="30">30 min</option><option value="60" selected>1 ora</option><option value="90">1 ora 30</option><option value="120">2 ore</option><option value="180">3 ore</option><option value="240">4 ore</option></select></div><div class="field"><label>Prezzo previsto</label><input id="i-price" type="number" min="0" step="0.01" value="0"><small class="tf-price-hint">Calcolato dal listino delle attività selezionate.</small></div></div><div class="modal-actions"><button class="ghost-btn tf-i-close">Annulla</button><button class="primary" id="save-intervention">Salva intervento</button></div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove();wrap.querySelector('.modal-close').onclick=close;wrap.querySelector('.tf-i-close').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
    const clientSlot=wrap.querySelector('#tf-intervention-client-slot');
    if(typeof window.tfBuildInlineClientSearch==='function')window.tfBuildInlineClientSearch(clientSlot,wrap.querySelector('#i-client'));
    const price=wrap.querySelector('#i-price');
    const recalc=()=>{price.value=types.filter(t=>wrap.querySelector(`.tf-new-activity[value="${t.id}"]`)?.checked).reduce((s,t)=>s+Number(t.price||0),0).toFixed(2)};
    wrap.querySelectorAll('.tf-new-activity').forEach(x=>x.addEventListener('change',recalc));recalc();
    if(!clients.length)toast('Nessun cliente disponibile');
    wrap.querySelector('#save-intervention').onclick=()=>{
      const selected=types.filter(t=>wrap.querySelector(`.tf-new-activity[value="${t.id}"]`)?.checked);
      const cid=Number(wrap.querySelector('#i-client').value),c=state.clients.find(x=>x.id===cid);
      if(!c){toast('Seleziona un cliente');return}
      if(!selected.length){toast('Seleziona almeno un tipo di attività');return}
      const first=selected[0];
      state.interventions.push({id:`${new Date().getFullYear()}-${String(state.interventions.length+1).padStart(3,'0')}`,date:wrap.querySelector('#i-date').value,time:wrap.querySelector('#i-time').value,clientId:cid,client:c.name,type:first.label,activities:selected.map(t=>t.id),technicianNotes:wrap.querySelector('#i-tech-notes').value.trim(),tech:wrap.querySelector('#i-tech').value,status:wrap.querySelector('#i-status').value,duration:Number(wrap.querySelector('#i-duration').value),price:Number(price.value||0),diagnosis:'',work:'',hours:0,km:0,materials:[],measurements:'',notes:'',photos:[],signature:''});
      save();close();render();toast('Intervento programmato');
    };
  };
  window.interventionDetail=function(j){
    const base=oldDetail(j);
    const activity=activityBlock(j);
    const price=Number(j.price||types.filter(t=>(j.activities||[]).includes(t.id)).reduce((s,t)=>s+Number(t.price||0),0));
    let html=base.replace('</section><aside>',activity+'</section><aside>');
    const marker='<div class="panel section-gap"><div class="panel-head"><h2>Materiali</h2>';
    const pricePanel=`<div class="panel section-gap tf-price-panel"><div class="panel-head"><h2>Consuntivo attività</h2><span class="badge">Listino</span></div><div class="tf-price-row"><span>Prezzo previsto</span><strong>${money(price)}</strong></div><div class="field"><label>Prezzo finale</label><input id="d-price" type="number" min="0" step="0.01" value="${price.toFixed(2)}"></div></div>`;
    const idx=html.indexOf(marker);if(idx>=0)html=html.slice(0,idx)+pricePanel+html.slice(idx);
    return html;
  };
  window.saveIntervention=function(id,close){
    const j=state.interventions.find(x=>String(x.id)===String(id));
    if(j){j.activities=selectedIds();j.technicianNotes=document.getElementById('d-tech-notes')?.value.trim()||'';j.price=Number(document.getElementById('d-price')?.value||j.price||0);if(j.activities.length){const first=types.find(t=>t.id===j.activities[0]);if(first)j.type=first.label;}}
    return oldSave(id,close);
  };
  window.tfActivityTypes=()=>types;
})();
