const $ = (id) => document.getElementById(id);

const views = {
  login: $("loginView"),
  register: $("registerView"),
  home: $("homeView")
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function showMessage(id, text, ok=false) {
  const el = $(id);
  el.textContent = text;
  el.style.color = ok ? "#16803c" : "#c62828";
}

function toast(text) {
  const el = $("toast");
  el.textContent = text;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
}

function normalizePhone(value) {
  return value.replace(/\D/g,"").replace(/^20/,"");
}

function validPhone(phone) {
  return /^01[0125]\d{8}$/.test(phone);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,"0")).join("");
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem("khadamaty_users") || "{}"); }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem("khadamaty_users", JSON.stringify(users));
}

function openHome(user) {
  $("userName").textContent = user.name;
  localStorage.setItem("khadamaty_session", JSON.stringify(user));
  showView("home");
}

function currentSession() {
  try { return JSON.parse(localStorage.getItem("khadamaty_session") || "null"); }
  catch { return null; }
}

document.querySelectorAll(".eye").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "◉" : "◉";
  });
});

$("showRegister").addEventListener("click", () => {
  $("registerForm").reset();
  showMessage("registerMsg","");
  showView("register");
});

$("showLogin").addEventListener("click", () => {
  $("loginForm").reset();
  showMessage("loginMsg","");
  showView("login");
});

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("registerName").value.trim();
  const phone = normalizePhone($("registerPhone").value);
  const password = $("registerPassword").value;
  const confirm = $("registerConfirm").value;

  if(name.length < 2) return showMessage("registerMsg","اكتب الاسم بالكامل.");
  if(!validPhone(phone)) return showMessage("registerMsg","اكتب رقم هاتف مصري صحيح مثل 01012345678.");
  if(password.length < 6) return showMessage("registerMsg","كلمة السر يجب أن تكون 6 أحرف أو أكثر.");
  if(password !== confirm) return showMessage("registerMsg","تأكيد كلمة السر غير مطابق.");

  const users = getUsers();
  if(users[phone]) return showMessage("registerMsg","هذا الرقم مسجل بالفعل. جرّب تسجيل الدخول.");

  const passwordHash = await hashPassword(password);
  const user = {name, phone};
  users[phone] = {...user, passwordHash};
  saveUsers(users);
  openHome(user);
  toast("تم إنشاء الحساب بنجاح 🎉");
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = normalizePhone($("loginPhone").value);
  const password = $("loginPassword").value;

  if(!validPhone(phone)) return showMessage("loginMsg","اكتب رقم هاتف مصري صحيح.");
  if(!password) return showMessage("loginMsg","اكتب كلمة السر.");

  const users = getUsers();
  const user = users[phone];
  if(!user) return showMessage("loginMsg","الحساب غير موجود. أنشئ حساباً أولاً.");

  const passwordHash = await hashPassword(password);
  if(passwordHash !== user.passwordHash) return showMessage("loginMsg","رقم الهاتف أو كلمة السر غير صحيحة.");

  openHome({name:user.name, phone:user.phone});
  toast("تم تسجيل الدخول بنجاح 👋");
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("khadamaty_session");
  $("loginForm").reset();
  showView("login");
  toast("تم تسجيل الخروج");
});

$("forgotBtn").addEventListener("click", () => {
  toast("استعادة كلمة السر سنضيفها في V1.3");
});

$("googleBtn").addEventListener("click", () => {
  toast("تسجيل الدخول بجوجل سنربطه لاحقاً");
});

$("helpBtn").addEventListener("click", () => {
  toast("صفحة المساعدة سنضيفها في إصدار قادم");
});

$("langBtn").addEventListener("click", () => {
  toast("اللغة الإنجليزية سنجهزها بعد تثبيت النسخة العربية");
});

const session = currentSession();
if(session) openHome(session);
else showView("login");
