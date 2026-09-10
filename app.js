const $ = (id) => document.getElementById(id);

const state = {
  get users() {
    try { return JSON.parse(localStorage.getItem("khadamati_users") || "[]"); }
    catch { return []; }
  },
  set users(value) { localStorage.setItem("khadamati_users", JSON.stringify(value)); }
};

function showPage(page) {
  ["loginPage","signupPage","homePage"].forEach(id => $(id).classList.add("hidden"));
  $(page).classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

function message(text) {
  const box = $("message");
  box.textContent = text;
  box.classList.add("show");
  clearTimeout(message.timer);
  message.timer = setTimeout(() => box.classList.remove("show"), 3000);
}

function cleanPhone(phone) {
  return phone.replace(/\D/g,"");
}

function validPhone(phone) {
  return /^01[0125]\d{8}$/.test(cleanPhone(phone));
}

function login(phone, password) {
  const user = state.users.find(u => u.phone === phone && u.password === password);
  if (!user) {
    message("رقم الهاتف أو كلمة السر غير صحيحة.");
    return;
  }
  localStorage.setItem("khadamati_current", JSON.stringify(user));
  renderHome(user);
}

function renderHome(user) {
  $("userName").textContent = user.name || "مستخدم خدماتي";
  showPage("homePage");
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const phone = cleanPhone($("loginPhone").value);
  const password = $("loginPassword").value;
  if (!validPhone(phone)) return message("اكتب رقم هاتف مصري صحيح مثل 01012345678.");
  if (password.length < 6) return message("كلمة السر يجب أن تكون 6 أحرف أو أكثر.");
  login(phone, password);
});

$("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("signupName").value.trim();
  const phone = cleanPhone($("signupPhone").value);
  const password = $("signupPassword").value;
  const confirm = $("signupConfirm").value;

  if (name.length < 2) return message("اكتب الاسم بشكل صحيح.");
  if (!validPhone(phone)) return message("اكتب رقم هاتف مصري صحيح.");
  if (password.length < 6) return message("كلمة السر يجب أن تكون 6 أحرف أو أكثر.");
  if (password !== confirm) return message("تأكيد كلمة السر غير مطابق.");

  const users = state.users;
  if (users.some(u => u.phone === phone)) return message("هذا الرقم مسجل بالفعل.");

  const user = {name, phone, password};
  users.push(user);
  state.users = users;
  localStorage.setItem("khadamati_current", JSON.stringify(user));
  renderHome(user);
  $("signupForm").reset();
});

$("showSignup").onclick = () => showPage("signupPage");
$("showLogin").onclick = () => showPage("loginPage");

$("logoutBtn").onclick = () => {
  localStorage.removeItem("khadamati_current");
  $("loginForm").reset();
  showPage("loginPage");
  message("تم تسجيل الخروج.");
};

$("forgotBtn").onclick = () => message("استرجاع كلمة السر سيُضاف في إصدار قادم.");
$("googleBtn").onclick = () => message("تسجيل الدخول بجوجل يحتاج ربط Google OAuth، وسيتم إضافته لاحقًا.");

document.querySelectorAll(".eye").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

$("langBtn").onclick = () => message("الواجهة الإنجليزية الكاملة ستكون في تحديث قادم.");

document.querySelectorAll(".service").forEach(btn => {
  btn.addEventListener("click", () => message("هذه الخاصية مجهزة للإصدار القادم."));
});

const current = localStorage.getItem("khadamati_current");
if (current) {
  try { renderHome(JSON.parse(current)); }
  catch { showPage("loginPage"); }
} else {
  showPage("loginPage");
}
