/* Wohlzeit Service Worker: holt online die neueste Version (höchstens 3 s warten), sonst sofort die zuletzt geladene. */
const C='wz-v52';
const ASSETS=['index.html','manifest.webmanifest','datenschutz.html','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||r.headers.has('range'))return;
  if(new URL(r.url).origin!==self.location.origin)return; /* Radio und externe Links nicht anfassen */
  const key=r.mode==='navigate'&&/\/(index\.html)?$/.test(new URL(r.url).pathname)?'index.html':r;
  const net=fetch(r,{cache:'no-cache'}).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(key,cp)).catch(()=>{});}return res;});
  const cached=caches.match(key,{ignoreSearch:true});
  e.respondWith(new Promise(resolve=>{let done=false;const fin=x=>{if(!done&&x){done=true;resolve(x);}};
    net.then(fin).catch(()=>cached.then(m=>fin(m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
    setTimeout(()=>cached.then(m=>{if(m)fin(m);}),3000);
  }).then(x=>x||Response.error()));
  e.waitUntil(net.catch(()=>{}));
});
