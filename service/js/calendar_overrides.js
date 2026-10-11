/* TECNOFA Gestionale — calendario italiano: weekend e festività nazionali */
(function(){
  function easterSunday(year){
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(year,month-1,day);
  }
  window.tfItalianHoliday=function(date){
    const d=new Date(date),y=d.getFullYear(),key=tfDateKey(d),fixed={
      [`${y}-01-01`]:'Capodanno',
      [`${y}-01-06`]:'Epifania',
      [`${y}-04-25`]:'Festa della Liberazione',
      [`${y}-05-01`]:'Festa del Lavoro',
      [`${y}-06-02`]:'Festa della Repubblica',
      [`${y}-08-15`]:'Ferragosto',
      [`${y}-11-01`]:'Ognissanti',
      [`${y}-12-08`]:'Immacolata Concezione',
      [`${y}-12-25`]:'Natale',
      [`${y}-12-26`]:'Santo Stefano'
    };
    if(fixed[key])return fixed[key];
    const easter=easterSunday(y),pasqua=tfDateKey(easter);
    if(key===pasqua)return 'Pasqua';
    const easterMonday=new Date(easter);easterMonday.setDate(easterMonday.getDate()+1);
    if(key===tfDateKey(easterMonday))return 'Lunedì dell’Angelo';
    return '';
  };
  window.tfAgendaDayClass=function(d){
    const day=d.getDay(),holiday=tfItalianHoliday(d);
    return `${day===6?'saturday':''} ${day===0?'sunday':''} ${holiday?'holiday':''}`.trim();
  };
  function holidayBadge(d){const h=tfItalianHoliday(d);return h?`<span class="tf-holiday-label">${esc(h)}</span>`:''}
  function weekendClass(d){return tfAgendaDayClass(d)}
  window.tfAgendaDay=function(){
    const jobs=tfJobsForDate(tfAgenda.date),techs=tfTechs(),start=8,end=18,total=jobs.reduce((n,j)=>n+tfDuration(j),0),free=techs.reduce((n,t)=>n+tfFreeMinutes(tfAgenda.date,t),0),dayClass=weekendClass(tfAgenda.date);let rows='';
    for(let h=start;h<end;h++){
      const label=`${String(h).padStart(2,'0')}:00`;
      rows+=`<div class="tf-day-row ${dayClass}"><div class="tf-day-hour">${label}</div>${techs.map(t=>{const at=jobs.filter(j=>j.tech===t&&tfMinutes(j.time)===h*60);return `<div class="tf-day-cell" onclick="tfQuickModal(tfAgenda.date,'${label}','${esc(t)}')">${at.map(tfAgendaEvent).join('')||'<span class="tf-free">LIBERO</span>'}</div>`}).join('')}</div>`;
    }
    return `<div class="tf-day-board"><div class="tf-calendar-notice ${dayClass}">${holidayBadge(tfAgenda.date)}${tfAgenda.date.getDay()===6?'<span>Sabato</span>':''}${tfAgenda.date.getDay()===0?'<span>Domenica</span>':''}</div><div class="tf-day-summary"><strong>${jobs.length} interventi</strong><span>${Math.round(total/60*10)/10} h programmate</span><span>${Math.round(free/60*10)/10} h libere</span><span>${techs.length} ${techs.length===1?'tecnico':'tecnici'}</span></div><div class="tf-day-grid" style="--tech-count:${Math.max(1,techs.length)}"><div class="tf-day-head"><div class="tf-day-hour-head">ORA</div>${techs.map(t=>`<div class="tf-day-tech-head"><b>${esc(t)}</b><small>${Math.round((600-tfFreeMinutes(tfAgenda.date,t))/60*10)/10} h programmate</small></div>`).join('')}</div>${rows}<div class="tf-day-end"><div>18:00</div>${techs.map(()=>'<div></div>').join('')}</div></div></div>`;
  };
  window.tfAgendaWeek=function(){
    const start=tfStartOfWeek(tfAgenda.date),days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);days.push(d)}
    const techs=tfTechs();
    return `<div class="tf-week-board"><div class="tf-week-head"><div class="tf-tech-label">Tecnico</div>${days.map(d=>{const cls=weekendClass(d);return `<div class="tf-week-day ${cls} ${tfDateKey(d)===tfDateKey(new Date())?'today':''}"><b>${tfFormatDay(d)}</b>${holidayBadge(d)}<small>${tfJobsForDate(d).length} interventi</small></div>`}).join('')}</div>${techs.map(t=>`<div class="tf-week-row"><div class="tf-tech-label"><b>${esc(t)}</b></div>${days.map(d=>{const jobs=tfJobsForDate(d).filter(j=>j.tech===t),cls=weekendClass(d);return `<div class="tf-week-cell ${cls}" onclick="tfQuickModal(new Date('${tfDateKey(d)}T12:00:00'),'08:00','${esc(t)}')">${jobs.map(j=>tfAgendaEvent(j)).join('')||'<span class="tf-free">LIBERO</span>'}</div>`}).join('')}</div>`).join('')}</div>`;
  };
  window.tfAgendaMonth=function(){
    const first=new Date(tfAgenda.date.getFullYear(),tfAgenda.date.getMonth(),1),last=new Date(tfAgenda.date.getFullYear(),tfAgenda.date.getMonth()+1,0),offset=(first.getDay()||7)-1,total=Math.ceil((offset+last.getDate())/7)*7,cells=[];
    for(let i=0;i<total;i++){
      const d=new Date(first);d.setDate(i-offset+1);const inMonth=d.getMonth()===first.getMonth(),jobs=tfJobsForDate(d),cls=weekendClass(d);
      cells.push(`<button class="tf-month-cell ${inMonth?'':'muted'} ${cls} ${tfDateKey(d)===tfDateKey(new Date())?'today':''}" onclick="tfAgenda.date=new Date('${tfDateKey(d)}T12:00:00');tfSetAgendaView('day')"><b>${d.getDate()}</b>${holidayBadge(d)}${jobs.slice(0,3).map(j=>`<span class="tf-month-event">${esc(j.time)} ${esc(j.type)}</span>`).join('')}${jobs.length>3?`<small>+${jobs.length-3} altri</small>`:''}</button>`);
    }
    return `<div class="tf-month-board"><div class="tf-month-head">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map((x,i)=>`<b class="${i===5?'saturday':i===6?'sunday':''}">${x}</b>`).join('')}</div><div class="tf-month-grid">${cells.join('')}</div></div>`;
  };
})();
