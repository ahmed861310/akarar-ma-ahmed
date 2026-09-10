const $ = id => document.getElementById(id);

function getUser(){
  try { return JSON.parse(localStorage.getItem("khadamatiUser") || "null"); }
  catch { return null; }
}

function show(page){
  ["loginPage","signupPage","homePage"].forEach(id => $(id)?.classList.add("hidden"));
  $(page)?.classList.remove("hidden");
  const loggedIn = page === "homePage";
  $("logoutTop")?.classList.toggle("hidden", !loggedIn);
}

function showHome(){
  const user=getUser();
  if(!user){ show("loginPage"); return; }
  show("homePage");
  $("welcomeName").textContent=user.name || "مستخدم خدماتي";
  $("requestsCount").textContent=user.requests || 0;
}

function validPhone(phone){ return /^01[0-9]{9}$/.test(phone); }
function setMsg(id,text,ok=false){
  const el=$(id); if(!el) return;
  el.textContent=text; el.classList.toggle("success-msg",ok);
}

$("loginBtn").onclick=()=>{
  const phone=$("phone").value.trim();
  const password=$("password").value;
  if(!validPhone(phone)){ setMsg("loginMsg","اكتب رقم هاتف مصري صحيح من 11 رقم."); return; }
  const user=getUser();
  if(!user){ setMsg("loginMsg","لا يوجد حساب محفوظ. اضغط «أنشئ حساب» أولاً."); return; }
  if(user.phone!==phone || user.password!==password){ setMsg("loginMsg","رقم الهاتف أو كلمة السر غير صحيحة."); return; }
  setMsg("loginMsg",""); showHome();
};

$("demoBtn").onclick=()=>{
  const demo={name:"أحمد",phone:"01000000000",password:"123456",requests:2};
  localStorage.setItem("khadamatiUser",JSON.stringify(demo));
  showHome();
};

$("logoutTop").onclick=()=>{ localStorage.removeItem("khadamatiUser"); show("loginPage"); };

$("signupBtn").onclick=()=>{ setMsg("loginMsg",""); show("signupPage"); $("signupName").focus(); };
$("backLoginBtn").onclick=()=>{ setMsg("signupMsg",""); show("loginPage"); };

$("createAccountBtn").onclick=()=>{
  const name=$("signupName").value.trim();
  const phone=$("signupPhone").value.trim();
  const pass=$("signupPassword").value;
  const pass2=$("signupPassword2").value;
  if(name.length<2){ setMsg("signupMsg","اكتب اسمك بالكامل."); return; }
  if(!validPhone(phone)){ setMsg("signupMsg","اكتب رقم هاتف مصري صحيح من 11 رقم."); return; }
  if(pass.length<6){ setMsg("signupMsg","كلمة السر يجب أن تكون 6 أحرف أو أرقام على الأقل."); return; }
  if(pass!==pass2){ setMsg("signupMsg","كلمتا السر غير متطابقتين."); return; }
  const user={name,phone,password:pass,requests:0};
  localStorage.setItem("khadamatiUser",JSON.stringify(user));
  setMsg("signupMsg","تم إنشاء الحساب بنجاح ✅",true);
  setTimeout(showHome,450);
};

$("forgotBtn").onclick=()=>setMsg("loginMsg","لاستعادة كلمة السر لاحقاً سنربط الحساب برسالة SMS.");

const togglePass=$("togglePass");
if(togglePass) togglePass.onclick=()=>{
  const field=$("password"); const shown=field.type==="text";
  field.type=shown?"password":"text"; togglePass.textContent=shown?"◉":"◎";
};

document.querySelectorAll(".service").forEach(btn=>btn.onclick=()=>{
  const title=btn.dataset.title;
  $("toast").textContent=`قسم «${title}» جاهز للربط بالبيانات الحقيقية.`;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),2200);
});

if(getUser()) showHome(); else show("loginPage");
