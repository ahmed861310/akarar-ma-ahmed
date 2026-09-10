(function(){
  let deferredPrompt=null;
  const banner=document.getElementById('installBanner');
  const showBanner=()=>{if(banner&&!localStorage.getItem('khadamati_install_dismissed'))banner.classList.remove('hidden')};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;showBanner()});
  document.getElementById('installAppBtn')?.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch{}deferredPrompt=null;banner?.classList.add('hidden')});
  document.getElementById('dismissInstallBtn')?.addEventListener('click',()=>{localStorage.setItem('khadamati_install_dismissed','1');banner?.classList.add('hidden')});
  window.addEventListener('appinstalled',()=>{banner?.classList.add('hidden');localStorage.removeItem('khadamati_install_dismissed')});
  if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
  function offlineBadge(){let el=document.getElementById('offlineBadge');if(!navigator.onLine){if(!el){el=document.createElement('div');el.id='offlineBadge';el.className='offline-badge';el.textContent='📡 وضع بدون اتصال';document.body.appendChild(el)}}else el?.remove()}
  window.addEventListener('online',offlineBadge);window.addEventListener('offline',offlineBadge);offlineBadge();
  window.enableKhadamatiPush=async function(){if(!('Notification' in window))throw new Error('المتصفح لا يدعم الإشعارات');const p=await Notification.requestPermission();if(p!=='granted')return {granted:false};const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub){sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:window.KHADAMATI_CONFIG?.vapidPublicKey||undefined})}return {granted:true,subscription:sub};};
})();
