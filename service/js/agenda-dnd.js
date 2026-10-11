/* TECNOFA Gestionale — Agenda drag & drop v3 */
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const min=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
  const timeFromCell=(cell,e)=>{
    const base=String(cell.dataset.time||'08:00'),start=min(base),r=cell.getBoundingClientRect();
    const offset=e&&r.height?Math.max(0,Math.min(r.height,e.clientY-r.top)):0;
    const minutes=start+(offset>=r.height/2?30:0);
    return `${pad(Math.floor(minutes/60))}:${pad(minutes%60)}`;
  };
  function saveAndRender(j,newDate,newTime,newTech){
    const scroll=(()=>{const b=document.querySelector('.tf-day-board,.tf-calendar-scroll');return b?{x:b.scrollLeft,y:b.scrollTop}:null})();
    const view=tfAgenda.view,currentDate=new Date(tfAgenda.date);
    j.date=newDate;j.time=newTime;j.tech=newTech;save();
    tfAgenda.view=view;tfAgenda.date=currentDate;render();
    requestAnimationFrame(()=>{
      tfAgenda.view=view;tfAgenda.date=currentDate;
      const b=document.querySelector('.tf-day-board,.tf-calendar-scroll');
      if(b&&scroll){b.scrollLeft=scroll.x;b.scrollTop=scroll.y}
    });
    toast(`Intervento spostato a ${new Date(`${newDate}T12:00:00`).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'})} alle ${newTime}${newTech?` · ${newTech}`:''}`);
  }
  function wire(root=document){
    root.querySelectorAll('.tf-time-cell').forEach(cell=>{
      if(cell.dataset.dndBound==='1')return;
      cell.dataset.dndBound='1';
      cell.addEventListener('dragover',e=>{
        if(!e.dataTransfer.types.includes('text/tecnofa-intervention')&&!e.dataTransfer.types.includes('text/plain'))return;
        e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';cell.classList.add('tf-drop-target');
      },true);
      cell.addEventListener('dragleave',e=>{if(!cell.contains(e.relatedTarget))cell.classList.remove('tf-drop-target')},true);
      cell.addEventListener('drop',e=>{
        e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();cell.classList.remove('tf-drop-target');
        const id=e.dataTransfer.getData('text/tecnofa-intervention')||e.dataTransfer.getData('text/plain')||cell.dataset.dragId;
        if(!id)return;
        const j=state.interventions.find(x=>String(x.id)===String(id));if(!j)return;
        const newDate=cell.dataset.date,newTime=timeFromCell(cell,e),newTech=cell.dataset.tech||j.tech;
        saveAndRender(j,newDate,newTime,newTech);
      },true);
    });
    root.querySelectorAll('.tf-ag-event[draggable="true"]').forEach(ev=>{
      if(ev.dataset.dndBound==='1')return;
      ev.dataset.dndBound='1';
      const id=ev.dataset.jobId||ev.dataset.dndId;
      ev.dataset.dndId=id||'';
      ev.addEventListener('dragstart',e=>{
        e.stopPropagation();
        e.dataTransfer.clearData();
        e.dataTransfer.effectAllowed='move';
        e.dataTransfer.setData('text/tecnofa-intervention',String(id||''));
        e.dataTransfer.setData('text/plain',String(id||''));
        ev.classList.add('tf-dragging');
      },true);
      ev.addEventListener('dragend',()=>{ev.classList.remove('tf-dragging');document.querySelectorAll('.tf-drop-target').forEach(x=>x.classList.remove('tf-drop-target'))},true);
    });
  }
  const originalRender=window.render;
  if(typeof originalRender==='function')window.render=function(){originalRender();requestAnimationFrame(()=>wire(document))};
  document.addEventListener('DOMContentLoaded',()=>wire(document));
  setTimeout(()=>wire(document),0);
})();
