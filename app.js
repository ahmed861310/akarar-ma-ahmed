const $=id=>document.getElementById(id);
function getUser(){try{return JSON.parse(localStorage.getItem('khadamatiUser')||'null')}catch{return null}}
function show(page){['loginPage','signupPage','homePage'].forEach(id=>$(id)?.classList.add('hidden'));$(page)?.classList.remove('hidden');$('logoutTop')?.classList.toggle('hidden',page!=='homePage')}
function showHome(){const u=getUser();if(!u)return show('loginPage');show('homePage');$('welcomeName').textContent=u.name||'بك';$('requestsCount').textContent=u.requests||0}
function validPhone(p){return /^01[0-9]{9}$/.test(p)}
function setMsg(id,t,ok=false){const e=$(id);if(!e)return;e.textContent=t;e.classList.toggle('success-msg',ok)}
$('loginBtn').onclick=()=>{const p=$('phone').value.trim(),pass=$('password').value,u=getUser();if(!validPhone(p))return setMsg('loginMsg','اكتب رقم هاتف مصري صحيح من 11 رقم.');if(!u)return setMsg('loginMsg','لا يوجد حساب محفوظ. أنشئ حساباً أولاً.');if(u.phone!==p||u.password!==pass)return setMsg('loginMsg','رقم الهاتف أو كلمة السر غير صحيحة.');setMsg('loginMsg','');showHome()};
$('demoBtn').onclick=()=>{localStorage.setItem('khadamatiUser',JSON.stringify({name:'أحمد',phone:'01000000000',password:'123456',requests:2}));showHome()};
$('logoutTop').onclick=()=>{localStorage.removeItem('khadamatiUser');show('loginPage')};
$('signupBtn').onclick=()=>{setMsg('loginMsg','');show('signupPage');$('signupName').focus()};$('backLoginBtn').onclick=()=>{setMsg('signupMsg','');show('loginPage')};
$('createAccountBtn').onclick=()=>{const n=$('signupName').value.trim(),p=$('signupPhone').value.trim(),a=$('signupPassword').value,b=$('signupPassword2').value;if(n.length<2)return setMsg('signupMsg','اكتب اسمك بالكامل.');if(!validPhone(p))return setMsg('signupMsg','اكتب رقم هاتف مصري صحيح من 11 رقم.');if(a.length<6)return setMsg('signupMsg','كلمة السر يجب أن تكون 6 أحرف أو أرقام على الأقل.');if(a!==b)return setMsg('signupMsg','كلمتا السر غير متطابقتين.');localStorage.setItem('khadamatiUser',JSON.stringify({name:n,phone:p,password:a,requests:0}));setMsg('signupMsg','تم إنشاء الحساب بنجاح ✅',true);setTimeout(showHome,450)};
$('forgotBtn').onclick=()=>setMsg('loginMsg','استعادة كلمة السر ستحتاج لاحقاً إلى ربط الحساب برسالة SMS.');
$('togglePass').onclick=()=>{const f=$('password'),s=f.type==='text';f.type=s?'password':'text';$('togglePass').textContent=s?'◉':'◎'};
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
document.querySelectorAll('.service').forEach(b=>b.onclick=()=>toast(`قسم «${b.dataset.title}» جاهز للربط بالبيانات الحقيقية.`));
$('serviceSearch').oninput=e=>{const q=e.target.value.trim();document.querySelectorAll('.service').forEach(b=>b.classList.toggle('hidden',q&&!b.innerText.includes(q)))};
$('allServicesBtn').onclick=()=>{$('serviceSearch').value='';document.querySelectorAll('.service').forEach(b=>b.classList.remove('hidden'));toast('تم عرض جميع الخدمات')};
$('clearNotices').onclick=()=>{ $('notificationsCount').textContent='0';$('notifDot').style.display='none';toast('تم وضع الإشعارات كمقروءة ✓')};$('notifyBtn').onclick=()=>toast('لديك 2 إشعار جديد');
if(getUser())showHome();else show('loginPage');
