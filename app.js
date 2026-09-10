const $=id=>document.getElementById(id);
const state=JSON.parse(localStorage.getItem("khadamatiUser")||"null");

function showHome(){
  $("loginPage").classList.add("hidden");
  $("homePage").classList.remove("hidden");
  $("logoutTop").classList.remove("hidden");
  const name=state?.name||"مستخدم خدماتي";
  $("welcomeName").textContent=name;
  $("requestsCount").textContent=state?.requests||0;
}
function showLogin(){
  $("homePage").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("logoutTop").classList.add("hidden");
}
function login(name="أحمد"){
  const phone=$("phone").value.trim();
  const password=$("password").value.trim();
  if(name==="أحمد" && (!phone || !password)){
    $("loginMsg").textContent="اكتب رقم الهاتف وكلمة السر، أو اختر تجربة سريعة.";
    return;
  }
  if(phone && !/^01[0-9]{9}$/.test(phone)){
    $("loginMsg").textContent="اكتب رقم هاتف مصري صحيح من 11 رقم.";
    return;
  }
  const user={name,phone:phone||"01000000000",requests:0};
  localStorage.setItem("khadamatiUser",JSON.stringify(user));
  location.reload();
}
$("loginBtn").onclick=()=>login();
$("demoBtn").onclick=()=>login("أحمد");
$("logoutTop").onclick=()=>{
  localStorage.removeItem("khadamatiUser");
  location.reload();
};
document.querySelectorAll(".service").forEach(btn=>{
  btn.onclick=()=>{
    const title=btn.dataset.title;
    $("toast").textContent=`قسم «${title}» جاهز للربط في المرحلة القادمة`;
    $("toast").classList.add("show");
    setTimeout(()=>$("toast").classList.remove("show"),2200);
  };
});
if(state) showHome(); else showLogin();
