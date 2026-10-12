(function(){
'use strict';
const original=window.tfQuickModal;
if(typeof original!=='function'||window.tfQuickModalPlantLinked)return;
window.tfQuickModalPlantLinked=true;
const escP=s=>typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
const api=async()=>{try{const r=await fetch('/api/plants',{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(r.ok&&d.ok){state.plants=d.plants||[];localStorage.setItem('tf_plants',JSON.stringify(state.plants));return state.plants}}catch{}return Array.isArray(state.plants)?state.plants:[]};
function plants(clientId){return (state.plants||[]).filter(p=>String(p.clientId)===String(clientId));}
function label(p){return [p.id,p.type,p.brand,p.model,p.serialNumber].filter(Boolean).join(' · ')}
window.tfQuickModal=function(date=new Date(),time='08:00',tech=''){
 original(date,time,tech);
 const modal=document.querySelector('.tf-quick-modal:last-of-type')||document.querySelector('.tf-quick-modal');
 if(!modal)return;
 const grid=modal.querySelector('.tf-quick-grid'),client=modal.querySelector('#tf-q-client');
 if(!grid||!client||modal.querySelector('#tf-q-plant'))return;
 const field=document.createElement('div');field.className='field full';field.innerHTML='<label>Impianto</label><select id="tf-q-plant" disabled><option value="">Seleziona prima il cliente</option></select>';
 const type=modal.querySelector('#tf-q-type');type?.closest('.field')?.before(field);
 const select=field.querySelector('select');
 const refresh=()=>{const list=plants(client.value);select.innerHTML='<option value="">Nessun impianto specifico</option>'+list.map(p=>`<option value="${escP(p.id)}">${escP(label(p))}</option>`).join('');select.disabled=!client.value};
 client.addEventListener('change',refresh);
 api().then(refresh);
 const save=modal.querySelector('#tf-q-save');
 if(save){const old=save.onclick;save.onclick=async function(){await old?.call(this);const selected=select.value;const job=Array.isArray(state.interventions)?state.interventions[state.interventions.length-1]:null;if(selected&&job){job.plantId=selected;const p=(state.plants||[]).find(x=>String(x.id)===String(selected));if(p){job.plantType=p.type||'';job.plantBrand=p.brand||'';job.plantModel=p.model||''}if(typeof tfSyncD1==='function')await tfSyncD1();if(typeof tfReloadD1==='function')await tfReloadD1()}}}
};
})();
