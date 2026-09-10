/* خدماتي V7.4 — دورة تنفيذ الطلب الكاملة */
(function(){
  const KEY='khadamatiExecutionV74';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const write=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const esc=x=>typeof escapeHtml==='function'?escapeHtml(x):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const get=(id)=>document.getElementById(id);
  const money2=n=>typeof money==='function'?money(n):`${Number(n||0).toLocaleString('ar-EG')} جنيه`;
  function isProvider(r){
    const u=typeof user==='function'?user():null; if(!u||!r)return false;
    if(u.role==='provider')return true;
    const ps=typeof demoProviders==='function'?demoProviders():[];
    return ps.some(p=>String(p.id)===String(r.providerId) && (String(p.user_id||p.userId||'')===String(u.id||'') || String(p.contact||'')===String(u.phone||'')));
  }
  function stateFor(r){
    const all=read(), id=String(r.id);
    if(!all[id]) all[id]={phase:r.status==='تم التنفيذ'?'approved':'requirements',progress:r.status==='تم التنفيذ'?100:15,revision:0,deliveries:[],events:[{t:new Date().toISOString(),label:'تم إنشاء مساحة التنفيذ',by:'النظام'}]};
    write(all); return all[id];
  }
  function saveState(r,s){const all=read();all[String(r.id)]=s;write(all)}
  function phaseLabel(p){return ({requirements:'تأكيد المتطلبات',in_progress:'جاري التنفيذ',delivered:'تم التسليم',revision:'تعديلات مطلوبة',approved:'تم اعتماد التسليم'})[p]||p}
  function phaseIndex(p){return ['requirements','in_progress','delivered','revision','approved'].indexOf(p)}
  function overall(s){if(s.phase==='approved')return 100;if(s.phase==='delivered')return 90;if(s.phase==='revision')return 70;return Math.max(15,Number(s.progress||15))}
  function roleLabel(r){return isProvider(r)?'مقدم الخدمة':'العميل'}
  function event(s,label,by){s.events=s.events||[];s.events.unshift({t:new Date().toISOString(),label,by});}
  function panelHTML(r,s){
    const provider=isProvider(r), pct=overall(s);
    const steps=[['requirements','تأكيد المتطلبات','اتفق الطرفان على المطلوب'],['in_progress','التنفيذ','مقدم الخدمة يعمل على الطلب'],['delivered','التسليم','تم إرسال النتيجة للعميل'],['approved','الاعتماد','العميل وافق على التسليم']];
    const actions=provider ? `
      ${s.phase==='requirements'?'<button class="primary v74-action" data-act="start">🚀 بدء التنفيذ</button>':''}
      ${(s.phase==='in_progress'||s.phase==='revision')?'<button class="primary v74-action" data-act="deliver">📤 تسليم العمل</button>':''}
      <button class="secondary v74-action" data-act="chat">💬 محادثة العميل</button>` : `
      ${s.phase==='delivered'?'<button class="primary v74-action" data-act="approve">✅ اعتماد التسليم</button><button class="secondary v74-action" data-act="revision">✏️ طلب تعديل</button>':''}
      <button class="secondary v74-action" data-act="chat">💬 محادثة مقدم الخدمة</button>`;
    const delivery=(s.deliveries||[]).map((d,i)=>`<div class="v74-delivery"><div><b>📎 ${esc(d.name)}</b><small>${esc(d.note||'تسليم') } · ${new Date(d.at).toLocaleString('ar-EG')}</small></div>${d.size?`<span>${Math.ceil(d.size/1024)} KB</span>`:''}</div>`).join('');
    return `<div class="v74-hero"><div><span class="eyebrow dark-eyebrow">🚀 مساحة التنفيذ</span><h2>${esc(r.service||'الخدمة')} <span class="v74-id">#${esc(r.id)}</span></h2><p>${esc(r.note||'تابع كل خطوة حتى التسليم والاعتماد.')}</p></div><div class="v74-role">${roleLabel(r)}</div></div>
    <div class="v74-progress"><div class="v74-progress-top"><b>التقدم الكلي</b><strong>${pct}%</strong></div><div class="v74-track"><i style="width:${pct}%"></i></div><div class="v74-phase">الحالة الحالية: <b>${phaseLabel(s.phase)}</b></div></div>
    <div class="v74-steps">${steps.map((x,i)=>{const done=phaseIndex(s.phase)>=phaseIndex(x[0]) || (s.phase==='revision'&&i<2);const active=s.phase===x[0]||(s.phase==='revision'&&x[0]==='in_progress');return `<div class="v74-step ${done?'done':''} ${active?'active':''}"><span>${done?'✓':i+1}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`}).join('')}</div>
    <div class="v74-actions">${actions}</div>
    <div class="v74-grid"><div class="panel"><div class="section-head"><h3>📦 التسليمات</h3><span class="muted">${(s.deliveries||[]).length} نسخة</span></div><div class="v74-deliveries">${delivery||'<div class="v74-empty">لم يتم رفع تسليم بعد.</div>'}</div></div><div class="panel"><div class="section-head"><h3>🕘 سجل التنفيذ</h3></div><div class="v74-events">${(s.events||[]).map(e=>`<div class="v74-event"><span></span><div><b>${esc(e.label)}</b><small>${esc(e.by)} · ${new Date(e.t).toLocaleString('ar-EG')}</small></div></div>`).join('')}</div></div></div>`;
  }
  async function render(r){
    if(!r)return; const box=get('executionSummary'); if(!box)return; const s=stateFor(r); box.innerHTML=panelHTML(r,s);
    box.querySelectorAll('.v74-action').forEach(b=>b.onclick=()=>act(r,b.dataset.act));
  }
  async function act(r,act){
    const s=stateFor(r); const provider=isProvider(r);
    if(act==='chat'){if(typeof openChat==='function')openChat(r);return;}
    if(act==='start' && provider){s.phase='in_progress';s.progress=45;event(s,'بدأ مقدم الخدمة تنفيذ الطلب','مقدم الخدمة');saveState(r,s);toast('بدأ التنفيذ 🚀');render(r);return;}
    if(act==='deliver' && provider){
      const input=document.createElement('input');input.type='file';input.accept='image/*,video/*,.pdf,.doc,.docx,.zip';input.onchange=()=>{const f=input.files?.[0];if(!f)return;const note=prompt('ملاحظة التسليم:','هذه النسخة جاهزة للمراجعة.');s.deliveries=s.deliveries||[];s.deliveries.unshift({name:f.name,note:note||'',size:f.size,type:f.type,at:new Date().toISOString()});s.phase='delivered';s.progress=90;event(s,'تم رفع تسليم جديد: '+f.name,'مقدم الخدمة');saveState(r,s);toast('تم تسجيل التسليم وإرساله للعميل 📤');render(r)};input.click();return;
    }
    if(act==='revision' && !provider){const note=prompt('اكتب المطلوب تعديله:');if(note===null)return;s.phase='revision';s.revision=Number(s.revision||0)+1;s.lastRevision=note;s.progress=70;event(s,'طلب العميل تعديلاً: '+note,'العميل');saveState(r,s);toast('تم إرسال طلب التعديل ✏️');render(r);return;}
    if(act==='approve' && !provider){if(!confirm('تأكيد أن التسليم مناسب وإنهاء الطلب؟'))return;s.phase='approved';s.progress=100;s.approvedAt=new Date().toISOString();event(s,'اعتمد العميل التسليم وأنهى التنفيذ','العميل');saveState(r,s);
      if(!BACKEND_READY){try{const u=demoUser();const rr=(u?.requestList||[]).find(x=>String(x.id)===String(r.id));if(rr){rr.status='تم التنفيذ';rr.paymentStatus='released';}saveDemoUser(u)}catch{}}
      toast('تم اعتماد التسليم وإنهاء الطلب ✅');render(r);return;}
  }
  window.openExecutionV74=function(r){window.activeExecutionRequest=r;show('executionPage');render(r);window.scrollTo({top:0,behavior:'smooth'})};
  window.renderExecutionV74=render;
  // Override the previous demo execution view while keeping old entry points working.
  window.openExecution=window.openExecutionV74;
  window.renderExecution=window.renderExecutionV74;
  const style=document.createElement('style');style.textContent=`
  .v74-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:22px;border-radius:22px;background:linear-gradient(135deg,#f5fbff,#fff);border:1px solid #e6edf5;margin-bottom:14px}.v74-hero h2{margin:7px 0}.v74-id{font-size:13px;color:#738096}.v74-role{padding:10px 14px;border-radius:999px;background:#eef6ff;font-weight:700;white-space:nowrap}.v74-progress{padding:18px;border:1px solid #e6edf5;border-radius:18px;background:#fff}.v74-progress-top{display:flex;justify-content:space-between}.v74-progress-top strong{font-size:25px}.v74-track{height:12px;background:#edf1f6;border-radius:99px;overflow:hidden;margin:10px 0}.v74-track i{display:block;height:100%;background:#0757c9;border-radius:99px;transition:width .3s}.v74-phase{color:#667085;font-size:13px}.v74-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.v74-step{display:flex;gap:9px;align-items:flex-start;padding:13px;border:1px solid #e7ebf0;border-radius:15px;background:#fff}.v74-step>span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#eef1f5;font-weight:800}.v74-step.done>span{background:#e8f7ee}.v74-step.active{border-color:#9cc4ff;box-shadow:0 4px 18px rgba(0,87,201,.08)}.v74-step small{display:block;color:#777;margin-top:3px;font-size:11px}.v74-actions{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}.v74-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}.v74-delivery{display:flex;justify-content:space-between;gap:10px;padding:12px;border:1px solid #edf0f4;border-radius:13px;margin:8px 0;background:#fafbfd}.v74-delivery small{display:block;color:#777;margin-top:4px}.v74-empty{padding:25px;text-align:center;color:#777}.v74-event{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #edf0f4}.v74-event>span{width:9px;height:9px;border-radius:50%;background:#0757c9;margin-top:6px;flex:none}.v74-event small{display:block;color:#777;margin-top:3px}@media(max-width:760px){.v74-hero{align-items:flex-start;flex-direction:column}.v74-steps{grid-template-columns:1fr 1fr}.v74-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(style);
  document.addEventListener('click',e=>{const b=e.target.closest('.pd-exec');if(b&&window.activeExecutionRequest)return;});
})();
