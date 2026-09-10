/* خدماتي V7.5 — تنفيذ حقيقي: حفظ الحالة ورفع التسليمات إلى Supabase Storage */
(function(){
  const KEY='khadamatiExecutionV75';
  const bucket='execution-deliveries';
  const localRead=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const localWrite=x=>localStorage.setItem(KEY,JSON.stringify(x));
  const esc=x=>typeof escapeHtml==='function'?escapeHtml(x):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const get=id=>document.getElementById(id);
  const backend=()=>typeof BACKEND_READY!=='undefined'&&BACKEND_READY&&typeof sb!=='undefined'&&sb;
  const authUser=async()=>{if(!backend())return null;const {data}=await sb.auth.getUser();return data?.user||null};
  const isNumId=r=>r&&/^\d+$/.test(String(r.id));
  const localState=r=>{const a=localRead(),id=String(r.id);if(!a[id])a[id]={phase:r.status==='تم التنفيذ'?'approved':'requirements',progress:r.status==='تم التنفيذ'?100:15,revision:0,deliveries:[],events:[{t:new Date().toISOString(),label:'تم إنشاء مساحة التنفيذ',by:'النظام'}]};localWrite(a);return a[id]};
  async function getState(r){
    if(!backend()||!isNumId(r))return localState(r);
    const {data,error}=await sb.from('execution_states').select('*').eq('request_id',Number(r.id)).maybeSingle();
    if(error||!data){const s={request_id:Number(r.id),phase:r.status==='تم التنفيذ'?'approved':'requirements',progress:r.status==='تم التنفيذ'?100:15,revision_count:0,last_revision:'',approved_at:null};await sb.from('execution_states').upsert(s,{onConflict:'request_id'});return s}
    return data;
  }
  async function getDeliveries(r,s){
    if(!backend()||!isNumId(r))return s.deliveries||[];
    const {data}=await sb.from('execution_deliveries').select('*').eq('request_id',Number(r.id)).order('version',{ascending:false});return data||[];
  }
  async function getEvents(r,s){
    if(!backend()||!isNumId(r))return s.events||[];
    const {data}=await sb.from('execution_events').select('*').eq('request_id',Number(r.id)).order('created_at',{ascending:false});return data||[];
  }
  async function saveState(r,s,label,by){
    if(!backend()||!isNumId(r)){const a=localRead();a[String(r.id)]=s;localWrite(a);return;}
    const u=await authUser();
    await sb.from('execution_states').upsert({request_id:Number(r.id),phase:s.phase,progress:Number(s.progress||0),revision_count:Number(s.revision_count||s.revision||0),last_revision:s.last_revision||s.lastRevision||'',approved_at:s.approved_at||s.approvedAt||null,updated_at:new Date().toISOString()},{onConflict:'request_id'});
    if(label)await sb.from('execution_events').insert({request_id:Number(r.id),user_id:u?.id||null,label,actor_label:by||'النظام'});
  }
  async function addDelivery(r,file,note){
    if(!backend()||!isNumId(r)){
      const s=localState(r);s.deliveries=s.deliveries||[];s.deliveries.unshift({name:file.name,note:note||'',size:file.size,type:file.type,at:new Date().toISOString(),version:s.deliveries.length+1});s.phase='delivered';s.progress=90;localWrite({...localRead(),[String(r.id)]:s});return true;
    }
    const u=await authUser();if(!u)return false;
    const safe=file.name.replace(/[^\w.\-\u0600-\u06FF ]/g,'_').slice(-100);const path=`${r.id}/${Date.now()}-${safe}`;
    const up=await sb.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;
    const {data:cnt}=await sb.from('execution_deliveries').select('version').eq('request_id',Number(r.id)).order('version',{ascending:false}).limit(1).maybeSingle();
    const version=Number(cnt?.version||0)+1;
    const ins=await sb.from('execution_deliveries').insert({request_id:Number(r.id),uploader_id:u.id,file_path:path,file_name:file.name,mime_type:file.type||'application/octet-stream',file_size:file.size,note:note||'',version}).select().single();
    if(ins.error){await sb.storage.from(bucket).remove([path]);throw ins.error;}
    const s=await getState(r);s.phase='delivered';s.progress=90;await saveState(r,s,'تم رفع تسليم جديد: '+file.name,'مقدم الخدمة');return true;
  }
  function phaseLabel(p){return ({requirements:'تأكيد المتطلبات',in_progress:'جاري التنفيذ',delivered:'تم التسليم',revision:'تعديلات مطلوبة',approved:'تم اعتماد التسليم'})[p]||p}
  function phaseIndex(p){return ['requirements','in_progress','delivered','revision','approved'].indexOf(p)}
  function overall(s){if(s.phase==='approved')return 100;if(s.phase==='delivered')return 90;if(s.phase==='revision')return 70;return Math.max(15,Number(s.progress||15))}
  function providerRole(r){try{const u=typeof user==='function'?user():null;if(u?.role==='provider')return true;const ps=typeof demoProviders==='function'?demoProviders():[];return ps.some(p=>String(p.id)===String(r.providerId)&&(String(p.user_id||p.userId||'')===String(u?.id||'')||String(p.contact||'')===String(u?.phone||'')))}catch{return false}}
  async function render(r){
    const box=get('executionSummary');if(!box||!r)return;const s=await getState(r), deliveries=await getDeliveries(r,s), events=await getEvents(r,s), provider=providerRole(r), pct=overall(s);
    const steps=[['requirements','تأكيد المتطلبات','اتفق الطرفان على المطلوب'],['in_progress','التنفيذ','مقدم الخدمة يعمل على الطلب'],['delivered','التسليم','تم إرسال النتيجة للعميل'],['approved','الاعتماد','العميل وافق على التسليم']];
    const actions=provider?`${s.phase==='requirements'?'<button class="primary v75-action" data-act="start">🚀 بدء التنفيذ</button>':''}${(s.phase==='in_progress'||s.phase==='revision')?'<button class="primary v75-action" data-act="deliver">📤 رفع التسليم</button>':''}<button class="secondary v75-action" data-act="chat">💬 محادثة العميل</button>`:`${s.phase==='delivered'?'<button class="primary v75-action" data-act="approve">✅ اعتماد التسليم</button><button class="secondary v75-action" data-act="revision">✏️ طلب تعديل</button>':''}<button class="secondary v75-action" data-act="chat">💬 محادثة مقدم الخدمة</button>`;
    const dhtml=deliveries.map(d=>`<div class="v75-delivery"><div><b>📎 ${esc(d.file_name||d.name)}</b><small>نسخة ${esc(d.version||1)} · ${esc(d.note||'تسليم')} · ${new Date(d.created_at||d.at).toLocaleString('ar-EG')}</small></div><button class="secondary v75-download" data-path="${esc(d.file_path||'')}" data-name="${esc(d.file_name||d.name||'التسليم')}">فتح</button></div>`).join('');
    const ehtml=events.map(e=>`<div class="v75-event"><span></span><div><b>${esc(e.label)}</b><small>${esc(e.actor_label||e.by||'النظام')} · ${new Date(e.created_at||e.t).toLocaleString('ar-EG')}</small></div></div>`).join('');
    box.innerHTML=`<div class="v75-hero"><div><span class="eyebrow dark-eyebrow">⚡ تنفيذ متصل</span><h2>${esc(r.service||'الخدمة')} <span class="v75-id">#${esc(r.id)}</span></h2><p>${esc(r.note||'كل التسليمات والحالات محفوظة ويمكن متابعتها بأمان.')}</p></div><div class="v75-role">${provider?'مقدم الخدمة':'العميل'}</div></div><div class="v75-progress"><div class="v75-progress-top"><b>التقدم الكلي</b><strong>${pct}%</strong></div><div class="v75-track"><i style="width:${pct}%"></i></div><div class="v75-phase">الحالة الحالية: <b>${phaseLabel(s.phase)}</b></div></div><div class="v75-steps">${steps.map((x,i)=>{const done=phaseIndex(s.phase)>=phaseIndex(x[0])||(s.phase==='revision'&&i<2);const active=s.phase===x[0]||(s.phase==='revision'&&x[0]==='in_progress');return `<div class="v75-step ${done?'done':''} ${active?'active':''}"><span>${done?'✓':i+1}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`}).join('')}</div><div class="v75-actions">${actions}</div>${s.last_revision||s.lastRevision?`<div class="v75-revision">✏️ <b>آخر تعديل مطلوب:</b> ${esc(s.last_revision||s.lastRevision)}</div>`:''}<div class="v75-grid"><div class="panel"><div class="section-head"><h3>📦 التسليمات الفعلية</h3><span class="muted">${deliveries.length} نسخة</span></div><div>${dhtml||'<div class="v75-empty">لم يتم رفع تسليم بعد.</div>'}</div></div><div class="panel"><div class="section-head"><h3>🕘 سجل التنفيذ</h3></div><div>${ehtml||'<div class="v75-empty">سيظهر السجل هنا.</div>'}</div></div></div>`;
    box.querySelectorAll('.v75-action').forEach(b=>b.onclick=()=>act(r,b.dataset.act));box.querySelectorAll('.v75-download').forEach(b=>b.onclick=()=>download(r,b.dataset.path,b.dataset.name));
  }
  async function act(r,act){
    const provider=providerRole(r);let s=await getState(r);
    if(act==='chat'){if(typeof openChat==='function')openChat(r);return;}
    if(act==='start'&&provider){s.phase='in_progress';s.progress=45;await saveState(r,s,'بدأ مقدم الخدمة تنفيذ الطلب','مقدم الخدمة');toast('بدأ التنفيذ 🚀');return render(r)}
    if(act==='deliver'&&provider){const input=document.createElement('input');input.type='file';input.accept='image/*,video/*,.pdf,.doc,.docx,.zip';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;if(f.size>100*1024*1024){toast('الملف أكبر من 100MB');return}const note=prompt('ملاحظة التسليم:','هذه النسخة جاهزة للمراجعة.');try{await addDelivery(r,f,note);toast(backend()&&isNumId(r)?'تم رفع الملف وحفظه بأمان 📤':'تم تسجيل التسليم في الوضع التجريبي 📤');render(r)}catch(e){console.error(e);toast('تعذر رفع الملف: '+(e.message||'خطأ غير معروف'))}};input.click();return}
    if(act==='revision'&&!provider){const note=prompt('اكتب المطلوب تعديله:');if(note===null)return;s.phase='revision';s.progress=70;s.revision_count=Number(s.revision_count||s.revision||0)+1;s.last_revision=note;s.lastRevision=note;await saveState(r,s,'طلب العميل تعديلاً: '+note,'العميل');toast('تم إرسال طلب التعديل ✏️');return render(r)}
    if(act==='approve'&&!provider){if(!confirm('تأكيد أن التسليم مناسب وإنهاء الطلب؟'))return;s.phase='approved';s.progress=100;s.approved_at=new Date().toISOString();s.approvedAt=s.approved_at;await saveState(r,s,'اعتمد العميل التسليم وأنهى التنفيذ','العميل');if(!backend()){try{const u=demoUser();const rr=(u?.requestList||[]).find(x=>String(x.id)===String(r.id));if(rr){rr.status='تم التنفيذ';rr.paymentStatus='released'}saveDemoUser(u)}catch{}}toast('تم اعتماد التسليم وإنهاء الطلب ✅');return render(r)}
  }
  async function download(r,path,name){if(!backend()||!path){toast('التسليم التجريبي لا يحتوي على رابط ملف فعلي');return}try{const {data,error}=await sb.storage.from(bucket).createSignedUrl(path,300);if(error)throw error;const a=document.createElement('a');a.href=data.signedUrl;a.target='_blank';a.rel='noopener';a.click()}catch(e){toast('تعذر فتح الملف');console.error(e)}}
  window.openExecutionV75=async function(r){window.activeExecutionRequest=r;show('executionPage');await render(r);window.scrollTo({top:0,behavior:'smooth'})};
  window.renderExecutionV75=render;window.openExecution=window.openExecutionV75;window.renderExecution=render;
  const st=document.createElement('style');st.textContent=`.v75-hero{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:22px;border-radius:22px;background:linear-gradient(135deg,#f4fbff,#fff);border:1px solid #e3edf6;margin-bottom:14px}.v75-hero h2{margin:7px 0}.v75-id{font-size:13px;color:#738096}.v75-role{padding:10px 14px;border-radius:999px;background:#eef6ff;font-weight:800;white-space:nowrap}.v75-progress{padding:18px;border:1px solid #e6edf5;border-radius:18px;background:#fff}.v75-progress-top{display:flex;justify-content:space-between}.v75-progress-top strong{font-size:25px}.v75-track{height:12px;background:#edf1f6;border-radius:99px;overflow:hidden;margin:10px 0}.v75-track i{display:block;height:100%;background:#0757c9;border-radius:99px;transition:width .3s}.v75-phase{color:#667085;font-size:13px}.v75-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.v75-step{display:flex;gap:9px;align-items:flex-start;padding:13px;border:1px solid #e7ebf0;border-radius:15px;background:#fff}.v75-step>span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#eef1f5;font-weight:800;flex:none}.v75-step.done>span{background:#e8f7ee}.v75-step.active{border-color:#9cc4ff;box-shadow:0 4px 18px rgba(0,87,201,.08)}.v75-step small{display:block;color:#777;margin-top:3px;font-size:11px}.v75-actions{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}.v75-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}.v75-delivery{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px;border:1px solid #edf0f4;border-radius:13px;margin:8px 0;background:#fafbfd}.v75-delivery small{display:block;color:#777;margin-top:4px}.v75-empty{padding:25px;text-align:center;color:#777}.v75-event{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #edf0f4}.v75-event>span{width:9px;height:9px;border-radius:50%;background:#0757c9;margin-top:6px;flex:none}.v75-event small{display:block;color:#777;margin-top:3px}.v75-revision{padding:13px;border-radius:14px;background:#fff7e6;border:1px solid #ffe1a6;margin:10px 0}@media(max-width:760px){.v75-hero{align-items:flex-start;flex-direction:column}.v75-steps{grid-template-columns:1fr 1fr}.v75-grid{grid-template-columns:1fr}.v75-delivery{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(st);
})();
