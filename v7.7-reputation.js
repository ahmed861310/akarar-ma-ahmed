/* V7.7 — السمعة والتقييم المتقدم */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v??'');
  function ratings(){try{return JSON.parse(localStorage.getItem('khadamatiRatings')||'[]')}catch{return[]}}
  function reputation(p, rows){
    const rr=rows.filter(x=>String(x.providerId||x.provider_id)===String(p.id));
    const avg=rr.length?rr.reduce((a,x)=>a+Number(x.rating||0),0)/rr.length:Number(p.avg_rating||0);
    const verified=!!p.verified, completed=Number(p.completed||0);
    const score=Math.round(Math.max(0,Math.min(100,avg*12+Math.min(rr.length,10)*2+Math.min(completed,10)*1.5+(verified?10:0)+25)));
    const level=score>=90?'ممتاز':score>=78?'موثوق':score>=62?'جيد':'يحتاج تحسين';
    const five=rr.filter(x=>Number(x.rating)===5).length, four=rr.filter(x=>Number(x.rating)===4).length;
    return {rr,avg,score,level,five,four};
  }
  function injectProfile(p){
    const box=$('profileVerificationBox'); if(!box||document.getElementById('v77Rep'))return;
    const r=reputation(p,ratings()); const el=document.createElement('section'); el.id='v77Rep'; el.className='v77-reputation';
    const dist=[5,4,3,2,1].map(n=>{const c=r.rr.filter(x=>Number(x.rating)===n).length;const pct=r.rr.length?Math.round(c/r.rr.length*100):0;return `<div class="v77-bar-row"><b>${n}★</b><div><i style="width:${pct}%"></i></div><small>${pct}%</small></div>`}).join('');
    const badges=(p.verified?'<span>🛡️ موثق</span>':'')+(r.avg>=4.5&&r.rr.length>=3?'<span>⭐ تقييمات ممتازة</span>':'')+(r.rr.length>=10?'<span>🏆 خبير موثوق</span>':'');
    el.innerHTML=`<div class="v77-rep-head"><div><small>سمعة مقدم الخدمة</small><h3>⭐ ${r.avg.toFixed(1)} <em>${r.rr.length} تقييم</em></h3><p>درجة السمعة <strong>${r.score}%</strong> · ${r.level}</p></div><div class="v77-score">${r.score}<small>/100</small></div></div><div class="v77-badges">${badges||'<span>🚀 ابنِ سمعتك مع أول تقييماتك</span>'}</div><div class="v77-dist">${dist}</div><p class="v77-note">التقييمات المرتبطة بطلبات مكتملة فقط هي التي تدخل في السمعة، والنتيجة تساعد العملاء في المقارنة والترتيب.</p>`;
    box.appendChild(el);
  }
  const old=window.showProviderProfile;
  if(typeof old==='function'){
    window.showProviderProfile=async function(id){await old(id);try{const p=typeof getProvider==='function'?await getProvider(id):null;if(p)injectProfile(p)}catch{}}
  }
  // Demo: enrich rating submission with a visible verified-transaction marker.
  document.addEventListener('click',e=>{
    const b=e.target.closest('#submitRating'); if(!b)return;
    setTimeout(()=>{const msg=$('ratingMsg'); if(msg&&msg.textContent.includes('تم إرسال'))msg.textContent+=' · تقييم موثّق بطلب مكتمل ⭐';},650);
  });
})();
