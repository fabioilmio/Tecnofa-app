/* TECNOFA Gestionale — local-first version label and sync bootstrap */
(function(){
  const VERSION='V53-LOCAL';
  function loadSync(){
    if(document.querySelector('script[data-tf-sync-engine]'))return;
    const s=document.createElement('script');s.src='js/sync-engine.js?v=20261012-local1';s.dataset.tfSyncEngine='1';document.body.appendChild(s);
  }
  function patchSettings(){
    if(typeof window.settings==='function'&&!window.settings.__tfVersionPatched){
      const old=window.settings;
      const next=function(){return String(old()).replace(/cache PWA v\d+/g,'cache PWA v58').replace(/autenticazione D1/g,'modalità locale · offline-first');};
      next.__tfVersionPatched=true;window.settings=next;
    }
  }
  function sidebarUX(){
    const sidebar=document.querySelector('.sidebar'),nav=document.querySelector('#main-nav');
    if(!sidebar||!nav||sidebar.dataset.tfSidebarReady)return;
    sidebar.dataset.tfSidebarReady='1';
    const items={};nav.querySelectorAll('.nav-item[data-view]').forEach(b=>items[b.dataset.view]=b);
    const groups=[
      ['Principale',['dashboard','agenda','interventions']],
      ['Anagrafiche',['clients','plants','technicians']],
      ['Operativo',['warehouse','reports']],
      ['Azienda',['administration','archivi']]
    ];
    nav.innerHTML='';
    groups.forEach(([name,views],i)=>{
      const group=document.createElement('div');group.className='tf-nav-group';
      const head=document.createElement('button');head.type='button';head.className='tf-nav-group-head';head.innerHTML='<span>'+name+'</span><b>⌄</b>';head.setAttribute('aria-expanded',i===0?'true':'false');
      const body=document.createElement('div');body.className='tf-nav-group-body';body.hidden=i!==0;
      views.forEach(v=>{if(items[v])body.appendChild(items[v])});
      group.append(head,body);nav.appendChild(group);
      head.addEventListener('click',()=>{if(sidebar.classList.contains('tf-collapsed'))sidebar.classList.remove('tf-collapsed');const next=body.hidden;body.hidden=!next;head.setAttribute('aria-expanded',String(next));});
    });
    const settings=items.settings,foot=sidebar.querySelector('.sidebar-foot');
    if(settings){settings.classList.add('tf-settings-item');settings.innerHTML='<span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-label">Impostazioni</span>';foot?.appendChild(settings)}
    const user=foot?.querySelector('.user-mini');
    if(user){user.classList.add('tf-user-mini');user.setAttribute('aria-label','Profilo');}
    const toggle=document.createElement('button');toggle.type='button';toggle.className='tf-sidebar-toggle';toggle.title='Comprimi menu';toggle.setAttribute('aria-label','Comprimi menu');toggle.innerHTML='‹';
    toggle.addEventListener('click',()=>{const c=sidebar.classList.toggle('tf-collapsed');toggle.innerHTML=c?'›':'‹';toggle.title=c?'Espandi menu':'Comprimi menu';toggle.setAttribute('aria-label',toggle.title);});
    sidebar.appendChild(toggle);
    nav.querySelectorAll('.nav-item[data-view]').forEach(btn=>btn.addEventListener('click',()=>{if(sidebar.classList.contains('tf-collapsed'))sidebar.classList.remove('tf-collapsed');}));
    const style=document.createElement('style');style.id='tf-sidebar-style';style.textContent=`
      .sidebar{width:248px;padding:18px 12px;transition:width .18s ease,padding .18s ease;overflow-x:hidden}
      .sidebar .brand{padding-right:42px}
      .tf-nav-group{display:grid;gap:3px;margin-top:7px}
      .tf-nav-group-head{border:0;background:transparent;width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:9px;color:#7a8881;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
      .tf-nav-group-head:hover{background:#f6f9f7}.tf-nav-group-head b{font-size:12px;font-weight:700;transition:transform .18s}.tf-nav-group-head[aria-expanded="true"] b{transform:rotate(180deg)}
      .tf-nav-group-body{display:grid;gap:3px}.tf-nav-group-body[hidden]{display:none}
      .tf-nav-group .nav-item{min-height:42px;transition:background .15s,color .15s,transform .15s}.tf-nav-group .nav-item:hover{transform:translateX(1px)}
      .tf-settings-item{margin-top:2px;border-top:1px solid var(--line);border-radius:0;padding-top:13px}
      .tf-user-mini>div:not(.avatar){display:none}.tf-user-mini{justify-content:flex-start}
      .tf-sidebar-toggle{position:absolute;right:10px;top:19px;width:30px;height:30px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--green-dark);font-size:20px;line-height:1;display:grid;place-items:center;z-index:5}
      .sidebar.tf-collapsed{width:76px;padding-left:10px;padding-right:10px}.sidebar.tf-collapsed .brand{justify-content:center;padding:5px 0 20px}.sidebar.tf-collapsed .brand>div:last-child,.sidebar.tf-collapsed .nav-label,.sidebar.tf-collapsed .tf-nav-group-head,.sidebar.tf-collapsed .tf-user-mini>div:not(.avatar){display:none}.sidebar.tf-collapsed .tf-nav-group-body{display:grid!important}.sidebar.tf-collapsed .nav-item{justify-content:center;padding-left:8px;padding-right:8px}.sidebar.tf-collapsed .nav-icon{width:22px;font-size:17px}.sidebar.tf-collapsed .tf-sidebar-toggle{right:23px}.sidebar.tf-collapsed~.main{margin-left:76px;width:calc(100% - 76px)}
      @media(max-width:760px){.sidebar{width:270px}.sidebar.tf-collapsed{width:76px;transform:none}.sidebar.tf-collapsed~.main{margin-left:0;width:100%}.tf-sidebar-toggle{display:none}}
    `;document.head.appendChild(style);
  }
  function boot(){const s=document.querySelector('.tf-sidebar-version');if(s)s.innerHTML='<strong>'+VERSION+'</strong>';patchSettings();loadSync();sidebarUX();setTimeout(patchSettings,0);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();