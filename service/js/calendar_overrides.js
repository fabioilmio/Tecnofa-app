/* TECNOFA Gestionale — calendario italiano: weekend e festività nazionali */
(function(){
  function easterSunday(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;return new Date(year,month-1,day)}
  window.tfItalianHoliday=function(date){const d=new Date(date),y=d.getFullYear(),key=tfDateKey(d),fixed={
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
  if(fixed[key])return fixed[key];const easter=easterSunday(y);if(key===tfDateKey(easter))return 'Pasqua';const easterMonday=new Date(easter);easterMonday.setDate(easterMonday.getDate()+1);if(key===tfDateKey(easterMonday))return 'Lunedì dell’Angelo';return ''};
  window.tfAgendaDayClass=function(d){const day=new Date(d).getDay(),holiday=tfItalianHoliday(d);return `${day===6?'saturday':''} ${day===0?'sunday':''} ${holiday?'holiday':''}`.trim()};
})();
