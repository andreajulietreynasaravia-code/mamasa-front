// Script para la página de perfil del administrador (admin.html)

// Función para cargar perfil del administrador
function cargarPerfilAdmin(admin) {
  const nombreEl = document.getElementById('nombreAdminProfile');
  const correoEl = document.getElementById('correoAdminProfile');
  const avatarEl = document.getElementById('avatarInitialsAdmin');
  const sidebarNameEl = document.getElementById('sidebarAdminName');
  
  if (nombreEl && admin) {
    nombreEl.textContent = admin.nombre || 'Administrador';
  }
  
  if (correoEl && admin) {
    correoEl.textContent = admin.correo || '';
  }
  
  if (avatarEl && admin && admin.nombre) {
    const nombres = admin.nombre.split(' ');
    let iniciales = '';
    if (nombres.length >= 2) {
      iniciales = nombres[0].charAt(0).toUpperCase() + nombres[nombres.length - 1].charAt(0).toUpperCase();
    } else {
      iniciales = nombres[0].substring(0, 2).toUpperCase();
    }
    avatarEl.textContent = iniciales;
  }
  
  if (sidebarNameEl && admin) {
    sidebarNameEl.textContent = admin.nombre || 'Administrador';
  }
}

// Función para configurar botón de logout
function configurarLogout() {
  const logoutBtn = document.getElementById('logoutBtnProfileAdmin');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.auth && window.auth.logout) {
        await window.auth.logout('/pages/admin/admin.html');
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/pages/admin/admin.html';
      }
    });
  }
}

// Cargar al iniciar - solo para página de perfil del administrador
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que adminAuth.js cargue el admin
  const checkAdmin = () => {
    if (window.auth && window.auth.getCurrentUser) {
      const admin = window.auth.getCurrentUser();
      if (admin) {
        cargarPerfilAdmin(admin);
        configurarLogout();
      }
    } else {
      setTimeout(checkAdmin, 100);
    }
  };
  checkAdmin();
});

// Exportar función para que adminAuth.js la pueda llamar
window.cargarDatosAdmin = function(admin) {
  cargarPerfilAdmin(admin);
  configurarLogout();
};