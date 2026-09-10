const $=id=>document.getElementById(id);
const toast=$("toast");

function showToast(msg){
  toast.textContent=msg; toast.classList.add("show");
  clearTimeout(window.tt); window.tt=setTimeout(()=>toast.classList.remove("show"),2600);
}
function validPhone(v){return /^01\d{9}$/.test(v)}
function users(){try{return JSON.parse(localStorage.getItem("khadamati_users")||"[]")}catch{return[]}}
function saveUsers(v){localStorage.setItem("khadamati_users",JSON.stringify(v))}
function show(view){
  ["loginView","signupView","forgotView","accountView"].forEach(id=>{
    const el=$(id);
    el.classList.add("hidden");
    el.hidden=true;
  });
  const active=$(view);
  active.classList.remove("hidden");
  active.hidden=false;
  window.scrollTo({top:0,behavior:"smooth"});
}
function currentUser(){
  const phone=localStorage.getItem("khadamati_session");
  return users().find(u=>u.phone===phone)||null;
}
function refreshSession(){
  const u=currentUser();
  if(u){
    $("welcomeText").textContent=`مرحباً ${u.name}، سعيدون بعودتك.`;
    $("accountPhone").textContent=`رقم الهاتف: ${u.phone}`;
    show("accountView");
  }else show("loginView");
}

document.querySelectorAll(".eye-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const input=$(btn.dataset.target);
    input.type=input.type==="password"?"text":"password";
  });
});

["loginPhone","signupPhone","forgotPhone"].forEach(id=>{
  $(id).addEventListener("input",()=>$(id).value=$(id).value.replace(/\D/g,"").slice(0,11));
});

$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const phone=$("loginPhone").value.trim(), pass=$("loginPassword").value;
  if(!validPhone(phone)) return showToast("اكتب رقم هاتف مصري صحيح من 11 رقم.");
  const u=users().find(x=>x.phone===phone);
  if(!u) return showToast("لا يوجد حساب بهذا الرقم. أنشئ حساب أولاً.");
  if(u.password!==pass) return showToast("رقم الهاتف أو كلمة السر غير صحيحة.");
  localStorage.setItem("khadamati_session",phone); refreshSession();
});

$("signupForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("signupName").value.trim(), phone=$("signupPhone").value.trim();
  const pass=$("signupPassword").value, confirm=$("signupConfirm").value;
  if(name.length<2) return showToast("اكتب الاسم بشكل صحيح.");
  if(!validPhone(phone)) return showToast("اكتب رقم هاتف مصري صحيح من 11 رقم.");
  if(pass.length<4) return showToast("كلمة السر يجب أن تكون 4 أحرف أو أكثر.");
  if(pass!==confirm) return showToast("تأكيد كلمة السر غير مطابق.");
  const list=users();
  if(list.some(x=>x.phone===phone)) return showToast("هذا الرقم مسجل بالفعل.");
  list.push({name,phone,password:pass});
  saveUsers(list); localStorage.setItem("khadamati_session",phone);
  showToast("تم إنشاء الحساب بنجاح.");
  setTimeout(refreshSession,700);
});

$("forgotForm").addEventListener("submit",e=>{
  e.preventDefault();
  const phone=$("forgotPhone").value.trim();
  if(!validPhone(phone)) return showToast("اكتب رقم هاتف مصري صحيح من 11 رقم.");
  if(!users().some(x=>x.phone===phone)) return showToast("هذا الرقم غير مسجل.");
  showToast("الحساب موجود. استعادة كلمة السر تحتاج خدمة إرسال رمز حقيقية.");
});

$("showSignup").onclick=()=>show("signupView");
$("showLogin").onclick=()=>show("loginView");
$("forgotBtn").onclick=()=>show("forgotView");
$("backLogin").onclick=()=>show("loginView");
$("logoutBtn").onclick=()=>{localStorage.removeItem("khadamati_session");show("loginView");showToast("تم تسجيل الخروج.");};
$("googleBtn").onclick=()=>showToast("ربط Google OAuth يحتاج إعداد خدمة مصادقة حقيقية.");
$("languageBtn").onclick=()=>showToast("النسخة الإنجليزية سيتم تفعيلها في تحديث لاحق.");

refreshSession();
