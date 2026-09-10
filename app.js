const form = document.getElementById("loginForm");
const phone = document.getElementById("phone");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const languageBtn = document.getElementById("languageBtn");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

phone.addEventListener("input", () => {
  phone.value = phone.value.replace(/\D/g, "").slice(0, 11);
});

togglePassword.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  togglePassword.setAttribute(
    "aria-label",
    isPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"
  );
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = phone.value.trim();
  if (!/^01\d{9}$/.test(value)) {
    showToast("من فضلك اكتب رقم هاتف مصري صحيح من 11 رقم.");
    phone.focus();
    return;
  }

  if (password.value.length < 4) {
    showToast("من فضلك اكتب كلمة السر.");
    password.focus();
    return;
  }

  showToast("تم إرسال بيانات تسجيل الدخول.");
});

document.getElementById("forgotLink").addEventListener("click", (e) => {
  e.preventDefault();
  showToast("سيتم تجهيز استعادة كلمة السر في الخطوة القادمة.");
});

document.getElementById("signupLink").addEventListener("click", (e) => {
  e.preventDefault();
  showToast("صفحة إنشاء الحساب ستكون متاحة قريباً.");
});

document.getElementById("helpLink").addEventListener("click", (e) => {
  e.preventDefault();
  showToast("مركز المساعدة سيكون متاحاً قريباً.");
});

document.getElementById("googleBtn").addEventListener("click", () => {
  showToast("تسجيل الدخول بجوجل يحتاج ربط Google OAuth أولاً.");
});

languageBtn.addEventListener("click", () => {
  showToast("النسخة الإنجليزية ستتم إضافتها في تحديث لاحق.");
});
