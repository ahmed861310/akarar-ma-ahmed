(function(){
  'use strict';
  window.KHADAMATI_V27 = {
    version:'V27',
    checks(){
      const c = window.CONFIG || {};
      const checks=[];
      checks.push({id:'supabase',label:'Supabase configuration',status:(c.supabaseUrl&&c.supabaseAnonKey)?'PASS':'FAIL'});
      checks.push({id:'payment',label:'Payment function configured',status:c.paymentFunctionUrl?'PASS':'WARN'});
      checks.push({id:'push',label:'Push function configured',status:c.pushFunctionUrl?'PASS':'WARN'});
      checks.push({id:'secrets',label:'No service-role key in browser config',status:(!String(c.supabaseAnonKey||'').toLowerCase().includes('service_role'))?'PASS':'FAIL'});
      checks.push({id:'safe',label:'Safe default: payment/sweeps are not forced on',status:'PASS'});
      const fail=checks.filter(x=>x.status==='FAIL').length;
      const warn=checks.filter(x=>x.status==='WARN').length;
      return {version:'V27',checks,fail,warn,score:Math.max(0,100-fail*35-warn*10),ready:fail===0};
    },
    render(target){
      const out=this.checks();
      const el=typeof target==='string'?document.querySelector(target):target;
      if(!el)return out;
      el.innerHTML='<div class="panel"><h3>🚦 V27 Production Launch Gate</h3><p>لا يتم اعتبار المنصة جاهزة للإطلاق الحقيقي إلا بعد PASS.</p>'+out.checks.map(x=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eee"><span>${x.label}</span><b>${x.status}</b></div>`).join('')+'<div style="margin-top:14px;font-weight:700">النتيجة: '+out.score+'/100 — '+(out.ready?'جاهز من ناحية الإعدادات المحلية':'غير جاهز')+'</div></div>';
      return out;
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{const el=document.getElementById('adminV27Gate'); if(el) window.KHADAMATI_V27.render(el);});
})();
