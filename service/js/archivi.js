/* TECNOFA Gestionale — Archivi tecnici */
(function(){
  const KEYS={brands:'tf_brands',types:'tf_appliance_types',models:'tf_appliance_models',ops:'tf_operations',prices:'tf_price_list'};
  const seed={
    brands:['Ariston','Baxi','Beretta','Daikin','Mitsubishi Electric','Vaillant','Viessmann','Samsung','LG','Panasonic','Generico'],
    types:['Caldaia','Climatizzatore','Pompa di calore','Fotovoltaico','Impianto elettrico','Domotica','Scaldacqua','Ventilazione','Altro'],
    models:[],
    ops:['Manutenzione ordinaria','Diagnosi guasto','Controllo perdite','Pulizia filtri','Controllo pressioni','Controllo temperature','Controllo elettrico','Avviamento','Collaudo','Riparazione','Sostituzione componente','Controllo annuale'],
    prices:[]
  };
  const read=(k)=>{try{const v=JSON.parse(localStorage.getItem(KEYS[k]));return Array.isArray(v)?v:seed[k].slice()}catch(e){return seed[k].slice()}};
  Object.keys(KEYS).forEach(k=>{if(!localStorage.getItem(KEYS[k]))localStorage.setItem(KEYS[k],JSON.stringify(seed[k]))});
  state.archivi={brands:read('brands'),types:read('types'),models:read('models'),ops:read('ops'),prices:read('prices')};
  titles.archivi='Archivi';

  function save(k){localStorage.setItem(KEYS[k],JSON.stringify(state.archivi[k]))}
  function add(k,label){const value=prompt(label+':');if(!value||!value.trim())return;const v=value.trim();if(state.archivi[k].some(x=>String(x).toLowerCase()===v.toLowerCase())){toast('Voce già presente');return}state.archivi[k].push(v);save(k);toast('Voce aggiunta');archiviPage()}
  function remove(k,i){if(!confirm('Rimuovere questa voce?'))return;state.archivi[k].splice(i,1);save(k);archiviPage()}
  function list(k){return state.archivi[k].map((x,i)=>`<div class="archive-row"><span>${esc(typeof x==='object'?x.name:x)}</span><button class="panel-link" onclick="tfArchiveRemove('${k}',${i})">Rimuovi</button></div>`).join('')||'<div class="empty">Nessuna voce presente.</div>'}

  function archiviPage(){
    view.innerHTML=`<div class="page-head"><div><div class="eyebrow">Configurazione gestionale</div><h1>Archivi</h1><p>Qui definisci le informazioni riutilizzabili in Clienti, Impianti, Interventi e Magazzino.</p></div></div>
    <div class="archive-grid">
      <section class="panel archive-panel"><div class="panel-head"><div><h2>Marchi</h2><small>Marche dei produttori</small></div><button class="panel-link" onclick="tfArchiveAdd('brands','Nuovo marchio')">+ Aggiungi</button></div><div class="archive-list">${list('brands')}</div></section>
      <section class="panel archive-panel"><div class="panel-head"><div><h2>Tipi apparecchio</h2><small>Categoria tecnica dell'impianto</small></div><button class="panel-link" onclick="tfArchiveAdd('types','Nuovo tipo apparecchio')">+ Aggiungi</button></div><div class="archive-list">${list('types')}</div></section>
      <section class="panel archive-panel"><div class="panel-head"><div><h2>Operazioni</h2><small>Operazioni selezionabili negli interventi</small></div><button class="panel-link" onclick="tfArchiveAdd('ops','Nuova operazione')">+ Aggiungi</button></div><div class="archive-list">${list('ops')}</div></section>
      <section class="panel archive-panel"><div class="panel-head"><div><h2>Listino prezzi</h2><small>Prepariamo qui il listino tecnico</small></div><span class="badge">In sviluppo</span></div><div class="empty">Prossimo passo: codice, descrizione, categoria, unità, prezzo di vendita e costo.</div></section>
      <section class="panel archive-panel archive-wide"><div class="panel-head"><div><h2>Modelli e compatibilità</h2><small>Collegheremo marca → tipo → modello → apparecchio del cliente.</small></div><span class="badge">In sviluppo</span></div><div class="empty">Questa sarà la base dell'anagrafica tecnica degli apparecchi.</div></section>
    </div>`;
  }
  window.tfArchiveAdd=add;
  window.tfArchiveRemove=remove;
  window.archiviPage=archiviPage;
})();
