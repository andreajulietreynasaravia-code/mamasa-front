document.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.getElementById("loginLink");
  const userDropdown = document.getElementById("userDropdown");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const correoUsuario = document.getElementById("correoUsuario");
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");
  if (!token) {
    // no hay token → mostrar login
    if (loginLink) { loginLink.innerHTML = `<i class="fa-solid fa-user"></i> Login`; loginLink.href = "/pages/cliente/login.html"; }
    if (userDropdown) userDropdown.style.display = "none";
    return;
  }

  try {
    const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
      ? window.config.API_CONFIG.usuarios 
      : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
        ? `${process.env.USUARIOS_SERVICE_URL}/api` 
        : "http://localhost:3000/api";
    const res = await fetch(`${USUARIOS_SERVICE_URL}/verify-token`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    if (data.logueado) {
      if (loginLink) { loginLink.style.display = "none"; }
      if (userDropdown) userDropdown.style.display = "block";
      if (nombreUsuario) nombreUsuario.textContent = data.usuario.nombre;
      if (correoUsuario) correoUsuario.textContent = data.usuario.correo;
    } else {
      // token inválido
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      if (loginLink) { loginLink.innerHTML = `<i class="fa-solid fa-user"></i> Login`; loginLink.href = "/pages/cliente/login.html"; }
      if (userDropdown) userDropdown.style.display = "none";
    }
  } catch (err) {
    console.error("Error verifying token:", err);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/pages/cliente/login.html";
    });
  }
});
