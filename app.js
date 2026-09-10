const $=id=>document.getElementById(id);
function getUser(){try{const u=JSON.parse(localStorage.getItem('khadamatiUser')||'null');if(u){if(!Array.isArray(u.requestList))u.requestList=u.lastRequest?[u.lastRequest]:[];u.requests=u.requestList.length;localStorage.setItem('khadamatiUser',JSON.stringify(u));}return u}catch{return null}}
function saveUser(u){u.requestList=Array.isArray(u.requestList)?u.requestList:[];u.requests=u.requestList.length;localStorage.setItem('khadamatiUser',JSON.stringify(u))}
function show(page){['loginPage','signupPage','homePage','requestsPage','adminPage'].forEach(id=>$(id)?.classList.add('hidden'));$(page)?.classList.remove('hidden');$('logoutTop')?.classList.toggle('hidden',!['homePage','requestsPage','adminPage'].includes(page));}
function showHome(){const u=getUser();if(!u)return show('loginPage');show('homePage');$('welcomeName').textContent=u.name||'بك';$('requestsCount').textContent=u.requestList.length;renderRequestsPreview();}
function showRequests(){const u=getUser();if(!u)return show('loginPage');show('requestsPage');renderRequests();}
function validPhone(p){return /^01[0-9]{9}$/.test(p)}
function setMsg(id,t,ok=false){const e=$(id);if(!e)return;e.textContent=t;e.classList.toggle('success-msg',ok)}
function getUsers(){
  try{
    let users=JSON.parse(localStorage.getItem('khadamatiUsers')||'[]');
    if(!Array.isArray(users)) users=[];
    const current=getUser();
    if(current && !users.some(x=>x.phone===current.phone)){users.push(current);localStorage.setItem('khadamatiUsers',JSON.stringify(users));}
    return users;
  }catch{return []}
}
function saveUsers(users){localStorage.setItem('khadamatiUsers',JSON.stringify(users))}
function syncCurrentUser(updated){saveUser(updated);const users=getUsers();const i=users.findIndex(x=>x.phone===updated.phone);if(i>=0)users[i]=updated;else users.push(updated);saveUsers(users)}
function allRequests(){return getUsers().flatMap(u=>(u.requestList||[]).map(r=>({...r,userName:u.name||'بدون اسم',userPhone:u.phone||''})))}
function statusClass(status){return status==='تم التنفيذ'?'done':status==='جاري التنفيذ'?'working':'pending'}
function updateRequestStatus(userPhone,requestId,status){const users=getUsers();const u=users.find(x=>x.phone===userPhone);if(!u)return;const r=(u.requestList||[]).find(x=>x.id===requestId);if(!r)return;r.status=status;saveUsers(users);if(getUser()?.phone===userPhone)saveUser(u);renderAdmin();showToastStatus(status)}
function showToastStatus(status){toast('تم تحديث الحالة إلى: '+status)}
function renderAdmin(){
  const users=getUsers(), requests=allRequests();
  $('adminTotalRequests').textContent=requests.length;$('adminPending').textContent=requests.filter(r=>(r.status||'قيد المراجعة')==='قيد المراجعة').length;$('adminUsers').textContent=users.length;$('adminDone').textContent=requests.filter(r=>r.status==='تم التنفيذ').length;
  const q=($('adminSearch')?.value||'').trim().toLowerCase();
  const filtered=requests.filter(r=>[r.id,r.service,r.userName,r.userPhone,r.status,r.note].some(v=>String(v||'').toLowerCase().includes(q)));
  const box=$('adminRequestsList');
  if(!filtered.length){box.innerHTML='<div class="empty-state"><div>📭</div><h3>لا توجد طلبات</h3><p>ستظهر الطلبات هنا عند إرسال المستخدمين لها.</p></div>'}else{box.innerHTML=filtered.map(r=>`<article class="admin-request"><div class="admin-request-main"><div class="request-top"><span class="request-id">${escapeHtml(r.id)}</span><span class="status ${statusClass(r.status)}">${escapeHtml(r.status||'قيد المراجعة')}</span></div><h3>${serviceInfo[r.service]?.[0]||'📋'} ${escapeHtml(r.service)}</h3><p>${escapeHtml(r.note)}</p><div class="admin-meta"><span>👤 ${escapeHtml(r.userName)}</span><span>📱 ${escapeHtml(r.userPhone)}</span><span>🕒 ${formatDate(r.createdAt)}</span></div></div><div class="status-actions"><label>تغيير الحالة</label><select data-phone="${escapeHtml(r.userPhone)}" data-id="${escapeHtml(r.id)}" class="status-select"><option ${r.status==='قيد المراجعة'?'selected':''}>قيد المراجعة</option><option ${r.status==='جاري التنفيذ'?'selected':''}>جاري التنفيذ</option><option ${r.status==='تم التنفيذ'?'selected':''}>تم التنفيذ</option><option ${r.status==='ملغي'?'selected':''}>ملغي</option></select></div></article>`).join('');box.querySelectorAll('.status-select').forEach(sel=>sel.onchange=()=>updateRequestStatus(sel.dataset.phone,sel.dataset.id,sel.value))}
  const ub=$('adminUsersList');
  ub.innerHTML=users.length?users.map(u=>`<article class="admin-user"><div class="user-avatar">👤</div><div><b>${escapeHtml(u.name||'بدون اسم')}</b><small>${escapeHtml(u.phone||'')}</small></div><strong>${(u.requestList||[]).length} طلب</strong></article>`).join(''):'<div class="empty-state"><div>👥</div><h3>لا يوجد مستخدمون</h3></div>';
}
function showAdmin(){show('adminPage');renderAdmin()}
$('adminDemoBtn').onclick=()=>{localStorage.setItem('khadamatiAdmin','1');showAdmin()};
$('adminBackBtn').onclick=showHome;
$('adminSearch').oninput=renderAdmin;
document.querySelectorAll('.admin-tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');const users=t.dataset.tab==='users';$('adminRequestsPanel').classList.toggle('hidden',users);$('adminUsersPanel').classList.toggle('hidden',!users);renderAdmin()});

$('loginBtn').onclick=()=>{const p=$('phone').value.trim(),pass=$('password').value,u=getUser();if(!validPhone(p))return setMsg('loginMsg','اكتب رقم هاتف مصري صحيح من 11 رقم.');if(!u)return setMsg('loginMsg','لا يوجد حساب محفوظ. أنشئ حساباً أولاً.');if(u.phone!==p||u.password!==pass)return setMsg('loginMsg','رقم الهاتف أو كلمة السر غير صحيحة.');setMsg('loginMsg','');showHome()};
$('demoBtn').onclick=()=>{localStorage.setItem('khadamatiUser',JSON.stringify({name:'أحمد',phone:'01000000000',password:'123456',requestList:[{id:'KHD-1001',service:'الطلبات',note:'طلب تجريبي محفوظ',createdAt:new Date().toISOString(),status:'قيد المراجعة'}],requests:1}));syncCurrentUser(getUser());showHome()};
$('logoutTop').onclick=()=>{localStorage.removeItem('khadamatiUser');show('loginPage')};
$('signupBtn').onclick=()=>{setMsg('loginMsg','');show('signupPage');$('signupName').focus()};$('backLoginBtn').onclick=()=>{setMsg('signupMsg','');show('loginPage')};
$('createAccountBtn').onclick=()=>{const n=$('signupName').value.trim(),p=$('signupPhone').value.trim(),a=$('signupPassword').value,b=$('signupPassword2').value;if(n.length<2)return setMsg('signupMsg','اكتب اسمك بالكامل.');if(!validPhone(p))return setMsg('signupMsg','اكتب رقم هاتف مصري صحيح من 11 رقم.');if(a.length<6)return setMsg('signupMsg','كلمة السر يجب أن تكون 6 أحرف أو أرقام على الأقل.');if(a!==b)return setMsg('signupMsg','كلمتا السر غير متطابقتين.');syncCurrentUser({name:n,phone:p,password:a,requestList:[]});setMsg('signupMsg','تم إنشاء الحساب بنجاح ✅',true);setTimeout(showHome,450)};
$('forgotBtn').onclick=()=>setMsg('loginMsg','استعادة كلمة السر ستحتاج لاحقاً إلى ربط الحساب برسالة SMS.');
$('togglePass').onclick=()=>{const f=$('password'),s=f.type==='text';f.type=s?'password':'text';$('togglePass').textContent=s?'◉':'◎'};
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
const serviceInfo={'الاستعلامات':['🔎','الاستعلامات','استعلم عن حالة طلب أو معاملة وسجّل التفاصيل التي تريد متابعتها.'],'المدفوعات':['💳','المدفوعات','سجّل طلب مساعدة بخصوص فاتورة أو دفعة إلكترونية.'],'الطلبات':['📋','الطلبات','أنشئ طلب خدمة جديد وأرسل تفاصيله من داخل حسابك.'],'الخدمات الحكومية':['🏛️','الخدمات الحكومية','واجهة موحدة لاستقبال طلبات الخدمات الحكومية المتاحة لاحقاً عبر API.'],'الشكاوى':['📝','الشكاوى','قدّم شكوى مع وصف المشكلة ليتم تسجيلها ومتابعتها.'],'المساعدة':['💬','المساعدة والدعم','أرسل استفسارك أو المشكلة التي تواجهها وسجّلها كطلب دعم.']};
let selectedService='';
function openService(title){if(title==='الطلبات'){showRequests();return}const d=serviceInfo[title]||['📋',title,'الخدمة متاحة للتجربة.'];selectedService=title;$('modalIcon').textContent=d[0];$('modalTitle').textContent=d[1];$('modalDesc').textContent=d[2];$('requestNote').value='';setMsg('requestMsg','');$('serviceModal').classList.remove('hidden');$('serviceModal').setAttribute('aria-hidden','false');$('requestNote').focus()}
function closeService(){$('serviceModal').classList.add('hidden');$('serviceModal').setAttribute('aria-hidden','true')}
document.querySelectorAll('.service').forEach(b=>b.onclick=()=>openService(b.dataset.title));
$('closeModal').onclick=closeService;$('serviceModal').addEventListener('click',e=>{if(e.target.id==='serviceModal')closeService()});
$('submitRequest').onclick=()=>{const u=getUser(),note=$('requestNote').value.trim();if(!note)return setMsg('requestMsg','اكتب تفاصيل الطلب أولاً.');const req={id:'KHD-'+Date.now().toString().slice(-6),service:selectedService,note,createdAt:new Date().toISOString(),status:'قيد المراجعة'};u.requestList.unshift(req);syncCurrentUser(u);$('requestsCount').textContent=u.requestList.length;setMsg('requestMsg','تم تسجيل الطلب بنجاح ✅',true);toast('تم إرسال طلبك بنجاح');setTimeout(closeService,700)};
function formatDate(v){try{return new Intl.DateTimeFormat('ar-EG',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return v}}
function renderRequests(){const u=getUser(),box=$('requestsList');if(!box)return;const list=u?.requestList||[];$('requestsPageCount').textContent=list.length;if(!list.length){box.innerHTML='<div class="empty-state"><div>📋</div><h3>لا توجد طلبات حتى الآن</h3><p>ابدأ من الخدمات الرئيسية وأنشئ أول طلب لك.</p><button class="primary" id="emptyHomeBtn">استكشاف الخدمات</button></div>';$('emptyHomeBtn').onclick=showHome;return}box.innerHTML=list.map(r=>`<article class="request-card"><div class="request-top"><span class="request-id">${r.id}</span><span class="status">${r.status||'قيد المراجعة'}</span></div><div class="request-service">${serviceInfo[r.service]?.[0]||'📋'} <b>${escapeHtml(r.service)}</b></div><p>${escapeHtml(r.note)}</p><small>${formatDate(r.createdAt)}</small></article>`).join('')}
function renderRequestsPreview(){const u=getUser(),box=$('requestsPreview');if(!box)return;const list=u?.requestList||[];if(!list.length){box.innerHTML='<p class="muted">لا توجد طلبات بعد. ابدأ باختيار خدمة من الأعلى.</p>';return}box.innerHTML=list.slice(0,3).map(r=>`<div class="mini-request"><span>${serviceInfo[r.service]?.[0]||'📋'}</span><div><b>${escapeHtml(r.service)}</b><small>${escapeHtml(r.status||'قيد المراجعة')} · ${formatDate(r.createdAt)}</small></div></div>`).join('')}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
$('serviceSearch').oninput=e=>{const q=e.target.value.trim();document.querySelectorAll('.service').forEach(b=>b.classList.toggle('hidden',q&&!b.innerText.includes(q)))};
$('allServicesBtn').onclick=()=>{$('serviceSearch').value='';document.querySelectorAll('.service').forEach(b=>b.classList.remove('hidden'));toast('تم عرض جميع الخدمات')};
$('clearNotices').onclick=()=>{$('notificationsCount').textContent='0';$('notifDot').style.display='none';toast('تم وضع الإشعارات كمقروءة ✓')};$('notifyBtn').onclick=()=>toast('لديك 2 إشعار جديد');
$('viewRequestsBtn').onclick=showRequests;$('backHomeBtn').onclick=showHome;
if(getUser())showHome();else show('loginPage');
