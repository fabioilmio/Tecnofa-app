/* TECNOFA Gestionale — shell UI stable v6 */
(function(){
  'use strict';
  const KEY='tf_sidebar_collapsed', VERSION='V53-LOCAL';
  const icons={
    dashboard:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z"/></svg>',
    agenda:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm7 7v4m0 0 3-2"/></svg>',
    interventions:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    clients:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20a5 5 0 0 1 8 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-1a3 3 0 0 0 0-6"/></svg>',
    plants:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V9l7-5 7 5v11M9 20v-5h6v5M8 10h1m6 0h1"/></svg>',
    technicians:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20a5 5 0 0 1 10 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>',
    warehouse:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5v11H3V9Zm0 0h18M8 13h8m-8 3h8"/></svg>',
    reports:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 16v-3m4 3V8m4 8v-6"/></svg>',
    administration:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M17 7c0-2-2-3-5-3S7 5 7 7s1.5 3 5 4 5 4 5 4-2 3-5 3-5-1-5-3"/></svg>',
    archivi:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v4H4zM6 10h12v10H6zM9 14h6"/></svg>',
    settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3m0 12v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M3 12h3m12 0h3M4.9 19.1 7 17m10-10 2.1-2.1"/></svg>'
  };
  function style(){
    if(document.getElementById('tf-shell-v6-style'))return;
    const s=document.createElement('style');s.id='tf-shell-v6-style';s.textContent=`
.sidebar{transition:width .18s ease,transform .18s ease;}
.nav{gap:3px!important;}
.nav-group{display:block;margin:2px 0;}
.nav-section.nav-section-toggle{width:100%;border:0;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:space-between;text-align:left;padding:10px 12px 6px;margin:6px 0 2px;color:#7a8881;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;line-height:1.2;}
.nav-section.nav-section-toggle::after{display:none!important;}
.nav-section-toggle>span:first-child{pointer-events:none;}
.nav-section-chevron{font-size:15px!important;line-height:1;color:#9aa69f!important;width:auto!important;transition:transform .15s ease;}
.nav-group-items{display:grid;gap:3px;max-height:300px;overflow:hidden;opacity:1;transition:max-height .18s ease,opacity .15s ease;}
.nav-group-items.is-collapsed{max-height:0;opacity:0;pointer-events:none;}
.nav-group .nav-item{padding:9px 12px!important;border-radius:9px;}
.nav-group .nav-item .nav-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:block;}
.sidebar.tf-collapsed{width:76px!important;min-width:76px!important;max-width:76px!important;padding:14px 8px!important;overflow-x:hidden!important;}
.sidebar.tf-collapsed .brand{height:46px;justify-content:center!important;padding:4px!important;margin-bottom:18px;overflow:hidden;}
.sidebar.tf-collapsed .brand>div:last-child,.sidebar.tf-collapsed .nav-section,.sidebar.tf-collapsed .user-mini>div:last-child{display:none!important;}
.sidebar.tf-collapsed .brand-mark{margin:0!important;flex:0 0 auto;}
.sidebar.tf-collapsed .nav{width:60px!important;overflow:hidden;}
.sidebar.tf-collapsed .nav-group{margin:0;}
.sidebar.tf-collapsed .nav-group-items{max-height:none!important;opacity:1!important;pointer-events:auto!important;}
.sidebar.tf-collapsed .nav-item{width:60px!important;height:46px!important;min-height:46px!important;margin:3px 0!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important;font-size:0!important;overflow:hidden!important;}
.sidebar.tf-collapsed .nav-item .nav-label{display:none!important;width:0!important;overflow:hidden!important;}
.sidebar.tf-collapsed .nav-item .nav-icon{width:40px!important;height:40px!important;margin:0!important;display:grid!important;place-items:center!important;font-size:0!important;color:#61736b!important;border-radius:11px!important;flex:0 0 40px!important;}
.sidebar.tf-collapsed .nav-item .nav-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;display:block;}
.sidebar.tf-collapsed .nav-item:hover .nav-icon{background:#edf6ef;color:#3d983d;}
.sidebar.tf-collapsed .nav-item.active .nav-icon{background:#dff1e3;color:#3f9d3d;box-shadow:inset 3px 0 0 #4cae43;}
.sidebar.tf-collapsed .sidebar-foot{width:60px!important;overflow:hidden;}
.sidebar.tf-collapsed .user-mini{width:60px!important;justify-content:center!important;padding:10px 0!important;margin-bottom:4px;}
.sidebar.tf-collapsed .user-mini .avatar{margin:0!important;}
.tf-sidebar-version{font-size:9px;color:#8a958f;letter-spacing:.02em;padding:7px 10px 0;text-align:left;white-space:nowrap;}
.tf-sidebar-version strong{font-weight:750;color:#65736c;}
.sidebar.tf-collapsed .tf-sidebar-version{width:60px;text-align:center;padding:7px 0 0;font-size:8px;}
.sidebar.tf-collapsed .tf-sidebar-version strong{font-size:8px;}
.main.tf-main-collapsed{margin-left:76px!important;width:calc(100% - 76px)!important;}
.tf-menu-toggle{display:grid!important;place-items:center;width:40px;height:40px;padding:0;margin-right:10px;font-size:20px;line-height:1;border-radius:11px;transition:background .15s ease,transform .15s ease;}
.tf-menu-toggle:hover{background:var(--green-soft);}.tf-menu-toggle:active{transform:scale(.96);}
@media(max-width:760px){
  .sidebar{width:270px!important;max-width:270px!important;min-width:270px!important;}
  .sidebar.tf-collapsed{width:270px!important;min-width:270px!important;max-width:270px!important;padding:20px 14px!important;transform:translateX(-100%);}
  .sidebar.tf-collapsed .brand{height:auto;justify-content:flex-start!important;padding:5px 10px 25px;margin-bottom:0;}
  .sidebar.tf-collapsed .brand>div:last-child,.sidebar.tf-collapsed .nav-section,.sidebar.tf-collapsed .user-mini>div:last-child{display:block!important;}
  .sidebar.tf-collapsed .nav-item{width:auto!important;height:auto!important;min-height:auto!important;margin:0!important;padding:11px 12px!important;display:flex!important;justify-content:flex-start!important;font-size:inherit!important;}
  .sidebar.tf-collapsed .nav-item .nav-label{display:inline!important;width:auto!important;}
  .sidebar.tf-collapsed .nav-item .nav-icon{width:18px!important;height:auto!important;font-size:inherit!important;display:block!important;background:none!important;box-shadow:none!important;flex:0 0 18px!important;}
  .sidebar.tf-collapsed .nav-group-items{max-height:none!important;opacity:1!important;pointer-events:auto!important;}
  .sidebar.tf-collapsed .sidebar-foot{width:auto!important;}
  .sidebar.tf-collapsed .user-mini{width:auto!important;justify-content:flex-start!important;padding:8px 10px 12px!important;}
  .sidebar.tf-collapsed .tf-sidebar-version{width:auto;text-align:left;padding:8px 10px 0;font-size:9px;}
  .sidebar.tf-collapsed .tf-sidebar-version strong{font-size:9px;}
  .main.tf-main-collapsed{margin-left:0!important;width:100%!important;}
}
`;
    document.head.appendChild(s);
  }
  function normalizeIcons(){
    document.querySelectorAll('.sidebar .nav-item[data-view]').forEach(b=>{
      let icon=b.querySelector('.nav-icon');
      if(!icon){icon=b.querySelector('span');if(icon)icon.classList.add('nav-icon');}
      if(icon){const next=icons[b.dataset.view]||'';if(icon.innerHTML!==next)icon.innerHTML=next;}
    });
  }
  function removeSidebarLogout(){document.querySelectorAll('.sidebar .tf-logout').forEach(x=>x.remove());}
  function apply(){
    const sidebar=document.querySelector('.sidebar'),main=document.querySelector('.main'),btn=document.getElementById('mobile-menu');
    if(!sidebar||!main||!btn)return;
    normalizeIcons();removeSidebarLogout();
    btn.classList.add('tf-menu-toggle');btn.title='Apri / chiudi barra laterale';btn.setAttribute('aria-label','Apri / chiudi barra laterale');btn.textContent='☰';
    const collapsed=localStorage.getItem(KEY)==='1',mobile=matchMedia('(max-width:760px)').matches;
    if(!mobile){sidebar.classList.toggle('tf-collapsed',collapsed);sidebar.classList.remove('open');main.classList.toggle('tf-main-collapsed',collapsed);}
    else{sidebar.classList.toggle('tf-collapsed',!sidebar.classList.contains('open'));main.classList.remove('tf-main-collapsed');}
    const old=btn.__tfMenuHandler;if(old)btn.removeEventListener('click',old);
    const handler=e=>{e.preventDefault();e.stopImmediatePropagation();const isMobile=matchMedia('(max-width:760px)').matches;
      if(isMobile){const open=sidebar.classList.contains('open');sidebar.classList.toggle('open',!open);sidebar.classList.toggle('tf-collapsed',open);}
      else{const next=!sidebar.classList.contains('tf-collapsed');sidebar.classList.toggle('tf-collapsed',next);main.classList.toggle('tf-main-collapsed',next);localStorage.setItem(KEY,next?'1':'0');}
    };
    btn.__tfMenuHandler=handler;btn.addEventListener('click',handler,true);
    sidebar.querySelectorAll('.nav-item[data-view]').forEach(b=>{if(b.dataset.tfCloseBound==='1')return;b.dataset.tfCloseBound='1';b.addEventListener('click',()=>{if(matchMedia('(max-width:760px)').matches){sidebar.classList.remove('open');sidebar.classList.add('tf-collapsed');}});});
    let ver=sidebar.querySelector('.tf-sidebar-version');if(!ver){ver=document.createElement('div');ver.className='tf-sidebar-version';sidebar.querySelector('.sidebar-foot')?.appendChild(ver)||sidebar.appendChild(ver);}ver.innerHTML=`<strong>${VERSION}</strong>`;
  }
  function boot(){style();apply();window.addEventListener('resize',apply);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();