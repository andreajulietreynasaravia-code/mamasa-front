// Script para la página de perfil del trabajador (trabajador.html)

// Función para cargar perfil del trabajador
function cargarPerfilTrabajador(trabajador) {
  const nombreEl = document.getElementById('nombreTrabajadorProfile');
  const correoEl = document.getElementById('correoTrabajadorProfile');
  const telefonoEl = document.getElementById('telefonoTrabajadorProfile');
  const avatarEl = document.getElementById('avatarInitialsTrabajador');
  const sidebarNameEl = document.getElementById('sidebarTrabajadorName');
  
  if (nombreEl && trabajador) {
    nombreEl.textContent = trabajador.nombre || 'Trabajador';
  }
  
  if (correoEl && trabajador) {
    correoEl.textContent = trabajador.correo || trabajador.email || '';
  }
  
  if (telefonoEl && trabajador) {
    telefonoEl.textContent = trabajador.telefono || trabajador.phone || '-';
  }
  
  if (avatarEl && trabajador && trabajador.nombre) {
    const nombres = trabajador.nombre.split(' ');
    let iniciales = '';
    if (nombres.length >= 2) {
      iniciales = nombres[0].charAt(0).toUpperCase() + nombres[nombres.length - 1].charAt(0).toUpperCase();
    } else {
      iniciales = nombres[0].substring(0, 2).toUpperCase();
    }
    avatarEl.textContent = iniciales;
  }
  
  if (sidebarNameEl && trabajador) {
    sidebarNameEl.textContent = trabajador.nombre || 'Trabajador';
  }
}

// Función para configurar botón de logout
function configurarLogout() {
  const logoutBtn = document.getElementById('logoutBtnProfileTrabajador');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.auth && window.auth.logout) {
        await window.auth.logout('/pages/trabajador/trabajador.html');
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/pages/trabajador/trabajador.html';
      }
    });
  }
}

// Exportar función para que otros scripts la puedan llamar (debe estar disponible globalmente)
window.cargarDatosTrabajador = function(trabajador) {
  console.log('📋 cargarDatosTrabajador llamado con:', trabajador);
  cargarPerfilTrabajador(trabajador);
  configurarLogout();
};

// Cargar al iniciar - solo para página de perfil del trabajador
// Esto es un fallback en caso de que trabajadorAuth.js no llame a cargarDatosTrabajador
document.addEventListener('DOMContentLoaded', function() {
  // Esperar un poco para que trabajadorAuth.js tenga oportunidad de llamar primero
  setTimeout(() => {
    // Solo cargar si trabajadorAuth.js no lo hizo ya
    if (window.auth && window.auth.getCurrentUser) {
      const user = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      
      if (user && (user.rol === 'trabajador' || role === 'trabajador')) {
        // Verificar si los datos ya están cargados
        const nombreEl = document.getElementById('nombreTrabajadorProfile');
        if (nombreEl && !nombreEl.textContent) {
          console.log('📋 Cargando datos del trabajador desde DOMContentLoaded (fallback)');
          cargarPerfilTrabajador(user);
          configurarLogout();
        }
      }
    }
  }, 1000);
});
