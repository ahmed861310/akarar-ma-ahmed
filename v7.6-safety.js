/* Khadamati V7.6 — Dispute protection, evidence and admin resolution */
(function(){
  const esc=s=>typeof escapeHtml==='function'?escapeHtml(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const backend=()=>typeof BACKEND_READY!=='undefined'&&BACKEND_READY&&typeof sb!=='undefined';
  const current=()=>typeof user==='function'?user():null;
  async function evidenceFor(id){
    if(!backend()) return JSON.parse(localStorage.getItem('khadamatiDisputeEvidence')||'[]').filter(x=>String(x.dispute_id)===String(id));
    const {data,error}=await sb.from('dispute_evidence').select('*').eq('dispute_id',Number(id)).order('created_at',{ascending:false});
    if(error) throw error; return data||[];
  }
  async function uploadEvidence(disputeId,file,note){
    const u=current(); if(!u) return;
    if(file.size>50*1024*1024) throw new Error('الحد الأقصى 50MB');
    if(!backend()){
      const a=JSON.parse(localStorage.getItem('khadamatiDisputeEvidence')||'[]');a.unshift({id:'E-'+Date.now(),dispute_id:disputeId,file_name:file.name,note,created_at:new Date().toISOString()});localStorage.setItem('khadamatiDisputeEvidence',JSON.stringify(a));return;
    }
    const safe=file.name.replace(/[^\w.\-\u0600-\u06FF ]/g,'_').slice(-100);
    const path=`${Number(disputeId)}/${u.id}-${Date.now()}-${safe}`;
    const up=await sb.storage.from('dispute-evidence').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;
    const ins=await sb.from('dispute_evidence').insert({dispute_id:Number(disputeId),uploader_id:u.id,file_path:path,file_name:file.name,mime_type:file.type||null,file_size:file.size,note:note||''}).select().single();
    if(ins.error){await sb.storage.from('dispute-evidence').remove([path]);throw ins.error;}
  }
  async function openEvidence(id){
    try{const a=await evidenceFor(id);if(!a.length)return toast('لا توجد أدلة مرفقة بعد');
      const lines=a.map(x=>`<div class="v76-evidence"><b>📎 ${esc(x.file_name)}</b><small>${esc(x.note||'دليل مرفق')} · ${new Date(x.created_at).toLocaleString('ar-EG')}</small><button class="secondary v76-open-file" data-path="${esc(x.file_path||'')}" data-demo="${!x.file_path}">فتح</button></div>`).join('');
      const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-box"><button class="modal-close v76-close">×</button><span class="modal-icon">📎</span><h2>أدلة النزاع #${esc(id)}</h2><div>${lines}</div></div>`;document.body.appendChild(m);m.querySelector('.v76-close').onclick=()=>m.remove();m.addEventListener('click',e=>{if(e.target===m)m.remove()});
      m.querySelectorAll('.v76-open-file').forEach(b=>b.onclick=async()=>{if(b.dataset.demo)return toast('الملف التجريبي مسجل باسمه فقط');try{const {data,error}=await sb.storage.from('dispute-evidence').createSignedUrl(b.dataset.path,300);if(error)throw error;window.open(data.signedUrl,'_blank','noopener')}catch{toast('تعذر فتح الدليل')}});
    }catch(e){console.error(e);toast('تعذر تحميل الأدلة')}
  }
  async function addEvidence(id){
    const input=document.createElement('input');input.type='file';input.accept='image/*,video/*,.pdf,.doc,.docx,.zip';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;const note=prompt('وصف مختصر للدليل (اختياري):','دليل متعلق بالنزاع');try{await uploadEvidence(id,f,note||'');toast('تم إرفاق الدليل 📎');if(typeof renderMySafety==='function')renderMySafety()}catch(e){toast('تعذر رفع الدليل: '+(e.message||'خطأ'))}};input.click();
  }
  async function resolveDispute(id,action){
    if(!backend()){const a=JSON.parse(localStorage.getItem('khadamatiSafety')||'[]').map(x=>String(x.id)===String(id)?{...x,status:action==='dismiss'?'dismissed':action==='investigate'?'investigating':'resolved',decision:action,reviewed_at:new Date().toISOString()}:x);localStorage.setItem('khadamatiSafety',JSON.stringify(a));toast('تم تسجيل القرار في الوضع التجريبي ✓');if(typeof renderAdminSafety==='function')renderAdminSafety();return;}
    try{const {data,error}=await sb.rpc('admin_resolve_dispute',{p_dispute_id:Number(id),p_action:action});if(error)throw error;toast(data?.message||'تم تنفيذ القرار ✓');if(typeof renderAdminSafety==='function')renderAdminSafety()}catch(e){console.error(e);toast('تعذر تنفيذ القرار: '+(e.message||'غير مصرح'))}
  }
  function decorateMy(){
    const box=document.getElementById('mySafetyList');if(!box)return;
    box.querySelectorAll('.safety-row').forEach(row=>{const b=row.querySelector('b');if(!b||!b.textContent.includes('نزاع')||row.querySelector('.v76-evidence-actions'))return;const id=(row.querySelector('small')?.textContent.match(/رقم\s+([^·]+)/)||[])[1]?.trim();if(!id)return;const d=document.createElement('div');d.className='v76-evidence-actions';d.innerHTML=`<button class="secondary" data-v76-evidence="${esc(id)}">📎 الأدلة</button><button class="secondary" data-v76-add="${esc(id)}">إرفاق دليل</button>`;row.appendChild(d)})
  }
  const oldMy=window.renderMySafety; if(typeof oldMy==='function'){window.renderMySafety=async function(){await oldMy();decorateMy()};}
  const oldAdmin=window.renderAdminSafety; if(typeof oldAdmin==='function'){window.renderAdminSafety=async function(){await oldAdmin();const box=document.getElementById('adminSafetyList');if(!box)return;box.querySelectorAll('.safety-row').forEach(row=>{if(!row.textContent.includes('نزاع')||row.querySelector('.v76-admin-actions'))return;const id=(row.querySelector('b')?.textContent.match(/#([^\s]+)/)||[])[1];if(!id)return;const a=document.createElement('div');a.className='v76-admin-actions';a.innerHTML=`<button class="secondary" data-v76-evidence="${esc(id)}">📎 الأدلة</button><button class="secondary" data-v76-resolve="investigate">🔎 تحقيق</button><button class="secondary" data-v76-resolve="release">💰 تحرير المبلغ</button><button class="secondary danger" data-v76-resolve="refund">↩️ رد المبلغ</button><button class="secondary" data-v76-resolve="dismiss">إغلاق</button>`;a.dataset.id=id;row.appendChild(a)})};}
  document.addEventListener('click',e=>{const ev=e.target.closest('[data-v76-evidence]');if(ev)return openEvidence(ev.dataset.v76Evidence);const ad=e.target.closest('[data-v76-add]');if(ad)return addEvidence(ad.dataset.v76Add);const rb=e.target.closest('[data-v76-resolve]');if(rb){const row=rb.closest('.safety-row'),id=row?.querySelector('.v76-admin-actions')?.dataset.id;if(!id)return;if(!confirm('تأكيد تنفيذ القرار على النزاع #'+id+'؟'))return;resolveDispute(id,rb.dataset.v76Resolve)}});
  const st=document.createElement('style');st.textContent=`.v76-evidence-actions,.v76-admin-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v76-admin-actions .danger{border-color:#f0b7b7}.v76-evidence{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid #edf0f4;border-radius:12px;margin:7px 0}.v76-evidence small{display:block;color:#777;margin-top:3px}.v76-evidence button{flex:none}@media(max-width:650px){.v76-evidence{align-items:flex-start;flex-direction:column}}`;document.head.appendChild(st);
  window.khadamatiV76={uploadEvidence,resolveDispute,openEvidence};
})();
