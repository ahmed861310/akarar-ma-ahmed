const $=s=>document.querySelector(s);
const pages={login:$("#loginPage"),register:$("#registerPage"),home:$("#homePage")};
function show(name){Object.values(pages).forEach(p=>p.classList.remove("active"));pages[name].classList.add("active");window.scrollTo(0,0)}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)}
$("#showRegister").onclick=()=>show("register");
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>show("login"));
$("#loginForm").onsubmit=e=>{e.preventDefault();const phone=$("#loginPhone").value.trim(),pass=$("#loginPassword").value;if(phone.length<8||!pass)return toast("من فضلك أدخل البيانات بشكل صحيح");localStorage.setItem("sahlV1User",JSON.stringify({name:"مستخدم خدماتي",phone}));$("#userName").textContent="مستخدم خدماتي";show("home");toast("تم تسجيل الدخول بنجاح")};
$("#registerForm").onsubmit=e=>{e.preventDefault();const name=$("#regName").value.trim(),phone=$("#regPhone").value.trim(),p=$("#regPassword").value,p2=$("#regPassword2").value;if(name.length<2)return toast("اكتب الاسم بالكامل");if(phone.length<8)return toast("اكتب رقم هاتف صحيح");if(p.length<6)return toast("كلمة السر 6 أحرف على الأقل");if(p!==p2)return toast("كلمتا السر غير متطابقتين");localStorage.setItem("sahlV1User",JSON.stringify({name,phone}));$("#userName").textContent=name;show("home");toast("تم إنشاء الحساب بنجاح")};
document.querySelectorAll(".eye").forEach(btn=>btn.onclick=()=>{const i=$("#"+btn.dataset.target);i.type=i.type==="password"?"text":"password"});
$("#forgotBtn").onclick=()=>toast("نسخة V1: استرجاع كلمة السر سيتم ربطه بالـSMS في المرحلة القادمة");
$("#googleBtn").onclick=()=>toast("تسجيل Google سيتم ربطه في المرحلة القادمة");
$("#helpBtn").onclick=()=>toast("الدعم متاح في النسخة القادمة");
document.querySelectorAll(".service").forEach(s=>s.onclick=()=>toast("تم اختيار: "+s.dataset.service));
$("#allServices").onclick=()=>toast("سيتم عرض كل الخدمات عند إضافة الخدمات الفعلية");
$("#ordersBtn").onclick=$("#myOrders").onclick=()=>toast("لا توجد طلبات حتى الآن");
$("#profileBtn").onclick=$("#profileNav").onclick=()=>toast("صفحة الحساب ستُضاف في المرحلة القادمة");
$("#search").oninput=e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll(".service").forEach(s=>s.style.display=(!q||s.textContent.toLowerCase().includes(q))?"flex":"none")};
const saved=JSON.parse(localStorage.getItem("sahlV1User")||"null");if(saved){$("#userName").textContent=saved.name||"مستخدم خدماتي";show("home")}
$("#langBtn").onclick=()=>toast("واجهة الإنجليزية سيتم إضافتها في V2");
