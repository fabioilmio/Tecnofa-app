const CACHE='tecnofa-gestionale-v8';
const ASSETS=['./','./index.html','./css/style.css','./css/agenda.css','./css/warehouse.css','./css/archivi.css','./js/app.js','./js/agenda.js','./js/navigation.js','./js/warehouse.js','./js/archivi.js','./js/clienti.js','./manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tecnofa-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match('./index.html'))));});
