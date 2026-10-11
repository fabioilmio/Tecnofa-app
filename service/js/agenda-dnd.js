/* TECNOFA Gestionale — Agenda drag & drop v2: posizione stabile */
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const min=t=>{const [h,m]=String(t||'00:00').split(':').map(Number);return h*60+m};
  const timeFromCell=(cell,e)=>{
    const base=String(cell.dataset.time||'08:00'),start=min(base),r=cell.getBoundingClientRect();
    const offset=e&&r.height?Math.max(0,Math.min(r.height,e.clientY-r.top)):0;
    const minutes=start+(offset>r.height/2?30:0);
    return `${pad(Math.floor(minutes/60))}:${pad(minutes%60)}`;
  };
  function wire(root=document){
    root.querySelectorAll('.tf-time-cell').forEach(cell=>{
      if(cell.dataset.dndBound==='1')return;
      cell.dataset.dndBound='1';
      cell.addEventListener('dragover',e=>{
        if(!e.dataTransfer.types.includes('text/tecnofa-intervention'))return;
        e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';cell.classList.add('tf-drop-target');
      });
      cell.addEventListener('dragleave',e=>{if(!cell.contains(e.relatedTarget))cell.classList.remove('tf-drop-target')});
      cell.addEventListener('drop',e=>{
        e.preventDefault();e.stopPropagation();cell.classList.remove('tf-drop-target');
        const id=e.dataTransfer.getData('text/tecnofa-intervention');if(!id)return;
        const j=state.interventions.find(x=>String(x.id)===String(id));if(!j)return;
        const newDate=cell.dataset.date,newTime=timeFromCell(cell,e),newTech=cell.dataset.tech||j.tech;
        /* Salviamo e ridisegniamo, ma NON cambiamo tfAgenda.date: la vista deve rimanere ferma. */
        j.date=newDate;j.time=newTime;j.tech=newTech;save();
        const board=document.querySelector('.tf-day-board,.tf-calendar-scroll');
        const scrollTop=board?.scrollTop||0,scrollLeft=board?.scrollLeft||0;
        const view=tfAgenda.view,currentDate=new Date(tfAgenda.date);
        render();
        requestAnimationFrame(()=>{
          tfAgenda.view=view;tfAgenda.date=currentDate;
          const b=document.querySelector('.tf-day-board,.tf-calendar-scroll');
          if(b){b.scrollTop=scrollTop;b.scrollLeft=scrollLeft}
          wire(document);
        });
        toast(`Intervento spostato a ${new Date(`${newDate}T12:00:00`).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'})} alle ${newTime}${newTech?` · ${newTech}`:''}`);
      });
    });
    root.querySelectorAll('.tf-ag-event[draggable="true"]').forEach(ev=>{
      if(ev.dataset.dndBound==='1')return;
      ev.dataset.dndBound='1';
      ev.addEventListener('dragstart',e=>{
        e.stopPropagation();ev.classList.add('tf-dragging');
        e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/tecnofa-intervention',ev.dataset.dndId);
      });
      ev.addEventListener('dragend',()=>ev.classList.remove('tf-dragging'));
      ev.addEventListener('click',e=>{if(ev.classList.contains('tf-dragging')){e.preventDefault();e.stopPropagation()}});
    });
  }
  const originalRender=window.render;
  if(typeof originalRender==='function'){
    window.render=function(){originalRender();requestAnimationFrame(()=>wire(document))};
  }
  document.addEventListener('DOMContentLoaded',()=>wire(document));
  setTimeout(()=>wire(document),0);
})();