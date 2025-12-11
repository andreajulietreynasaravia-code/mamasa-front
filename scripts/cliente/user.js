// Script para mostrar el perfil del usuario
// Si no hay sesión, redirige a login.html

// ================================
// ACTUALIZAR MENÚ SUPERIOR SEGÚN SESIÓN
// ================================
function actualizarNavUsuario() {
  const user = obtenerUsuarioLogueado();
  const loginLink = document.getElementById("loginLink");
  const userDropdown = document.getElementById("userDropdown");
  const userTextNav = document.getElementById("userTextNav");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const correoUsuario = document.getElementById("correoUsuario");

  if (user) {
    // Mostrar nombre y opciones
    const primerNombre = user.nombre.split(" ")[0];
    if (userTextNav) userTextNav.textContent = primerNombre;
    if (nombreUsuario) nombreUsuario.textContent = user.nombre || "N/A";
    if (correoUsuario) correoUsuario.textContent = user.correo || "N/A";
    
    // Función helper para obtener el valor a mostrar
    const obtenerValorAMostrar = (valor) => {
      if (valor === null || valor === undefined) return "N/A";
      const str = String(valor).trim();
      if (str === '' || str === 'null' || str === 'undefined') return "N/A";
      return str;
    };
    
    // Mostrar teléfono y dirección
    const telefonoUsuario = document.getElementById("telefonoUsuario");
    const direccionUsuario = document.getElementById("direccionUsuario");
    if (telefonoUsuario) telefonoUsuario.textContent = obtenerValorAMostrar(user.telefono);
    if (direccionUsuario) direccionUsuario.textContent = obtenerValorAMostrar(user.direccion);
    
    // Mostrar iniciales en el avatar
    const avatarInitials = document.getElementById("avatarInitials");
    if (avatarInitials && user.nombre) {
      const nombres = user.nombre.split(" ");
      let iniciales = "";
      if (nombres.length >= 2) {
        iniciales = nombres[0].charAt(0).toUpperCase() + nombres[nombres.length - 1].charAt(0).toUpperCase();
      } else {
        iniciales = nombres[0].substring(0, 2).toUpperCase();
      }
      avatarInitials.textContent = iniciales;
    }
    
    // El enlace redirige a user.html
    if (loginLink) {
      loginLink.href = "/pages/cliente/user.html";
      loginLink.onclick = null;
    }
    
    // Ocultar dropdown siempre
    if (userDropdown) userDropdown.style.display = "none";
  } else {
    // Solo mostrar "Login"
    if (userTextNav) userTextNav.textContent = "Login";
    if (loginLink) {
      loginLink.href = "/pages/cliente/login.html";
      loginLink.onclick = null;
    }
    if (userDropdown) userDropdown.style.display = "none";
  }
}

// ================================
// OBTENER USUARIO LOGEADO
// ================================
function obtenerUsuarioLogueado() {
  try {
    // Método 1: Usar window.auth si está disponible
    if (window.auth && typeof window.auth.getCurrentUser === 'function') {
      const usuario = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      
      if (usuario && (role === 'cliente' || usuario.rol === 'usuario')) {
        console.log('✅ Usuario encontrado via window.auth:', usuario);
        console.log('📋 Datos del usuario:', {
          nombre: usuario.nombre,
          correo: usuario.correo || usuario.email,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          todasLasClaves: Object.keys(usuario)
        });
        return usuario;
      }
    }
    
    // Método 2: Verificar localStorage directamente
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    
    if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
      try {
        const usuario = JSON.parse(userStr);
        if (usuario && (usuario.rol === "usuario" || roleStr === "cliente")) {
          console.log('✅ Usuario encontrado via localStorage:', usuario);
          console.log('📋 Datos del usuario:', {
            nombre: usuario.nombre,
            correo: usuario.correo || usuario.email,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
            todasLasClaves: Object.keys(usuario)
          });
          return usuario;
        }
      } catch (e) {
        console.error("❌ Error parseando user de localStorage:", e);
      }
    }
    
    // Método 3: Verificar localStorage antiguo
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        if (usuario && usuario.rol === "usuario") {
          console.log('✅ Usuario encontrado via localStorage (antiguo):', usuario);
          console.log('📋 Datos del usuario:', {
            nombre: usuario.nombre,
            correo: usuario.correo || usuario.email,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
            todasLasClaves: Object.keys(usuario)
          });
          return usuario;
        }
      } catch (e) {
        console.error("❌ Error parseando usuario de localStorage:", e);
      }
    }
    
    console.warn('⚠️ No se encontró usuario');
    return null;
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return null;
  }
}

// ================================
// VERIFICAR SESIÓN Y MOSTRAR PERFIL
// ================================
function verificarSesionEnLogin() {
  console.log('🔍 verificarSesionEnLogin() - Iniciando verificación...');
  
  // Intentar obtener usuario con múltiples métodos
  let usuario = null;
  
  // Método 1: window.auth (si está disponible)
  if (window.auth && typeof window.auth.getCurrentUser === 'function') {
    try {
      const user = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      if (user && (role === 'cliente' || user.rol === 'usuario')) {
        usuario = user;
        console.log('✅ Usuario encontrado via window.auth');
      }
    } catch (e) {
      console.warn('⚠️ Error al obtener usuario de window.auth:', e);
    }
  }
  
  // Método 2: obtenerUsuarioLogueado (usa localStorage directamente)
  if (!usuario) {
    usuario = obtenerUsuarioLogueado();
  }
  
  console.log('🔍 verificarSesionEnLogin() - Usuario obtenido:', usuario ? 'Sí' : 'No');
  if (usuario) {
    console.log('📋 Datos del usuario:', {
      nombre: usuario.nombre,
      correo: usuario.correo || usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      todasLasClaves: Object.keys(usuario)
    });
  }
  
  const profileSection = document.getElementById("profileSection");
  const topHeaderNav = document.getElementById("topHeaderNav");
  const navHeaderNav = document.getElementById("navHeaderNav");

  if (usuario) {
    console.log('✅ Hay sesión activa - Mostrando perfil del usuario');
    // Si hay sesión, mostrar cabezal, navegación y perfil
    if (topHeaderNav) {
      topHeaderNav.style.display = "flex";
      console.log('✅ Header superior mostrado');
    }
    if (navHeaderNav) {
      navHeaderNav.style.display = "block";
      console.log('✅ Navegación mostrada');
    }
    if (profileSection) {
      profileSection.style.display = "flex";
      console.log('✅ Sección de perfil mostrada');
      // Llamar a mostrarPerfilUsuario inmediatamente
      mostrarPerfilUsuario(usuario);
    } else {
      console.error('❌ No se encontró el elemento profileSection');
    }
    // Actualizar navegación también
    actualizarNavUsuario();
  } else {
    console.log('⚠️ No hay sesión activa - Redirigiendo a login.html');
    // Si no hay sesión, redirigir a login.html
    window.location.href = "/pages/cliente/login.html";
  }
}

// ================================
// MOSTRAR PERFIL DEL USUARIO
// ================================
function mostrarPerfilUsuario(usuario) {
  console.log("👤 Usuario recibido para mostrar perfil:", usuario);
  console.log("📋 Datos del usuario:", {
    nombre: usuario.nombre,
    correo: usuario.correo || usuario.email,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    todasLasClaves: Object.keys(usuario)
  });
  
  // Función helper para obtener el valor a mostrar
  const obtenerValorAMostrar = (valor) => {
    if (valor === null || valor === undefined) {
      return "N/A";
    }
    const str = String(valor).trim();
    if (str === '' || str === 'null' || str === 'undefined') {
      return "N/A";
    }
    return str;
  };
  
  // Mostrar información en el perfil
  const nombreUsuarioProfile = document.getElementById("nombreUsuarioProfile");
  const correoUsuarioProfile = document.getElementById("correoUsuarioProfile");
  const telefonoUsuarioProfile = document.getElementById("telefonoUsuarioProfile");
  const direccionUsuarioProfile = document.getElementById("direccionUsuarioProfile");
  const avatarInitialsProfile = document.getElementById("avatarInitialsProfile");
  
  console.log("🔍 Elementos del DOM encontrados:", {
    nombreUsuarioProfile: !!nombreUsuarioProfile,
    correoUsuarioProfile: !!correoUsuarioProfile,
    telefonoUsuarioProfile: !!telefonoUsuarioProfile,
    direccionUsuarioProfile: !!direccionUsuarioProfile,
    avatarInitialsProfile: !!avatarInitialsProfile
  });
  
  if (nombreUsuarioProfile) {
    nombreUsuarioProfile.textContent = obtenerValorAMostrar(usuario.nombre);
    console.log("✅ Nombre actualizado:", obtenerValorAMostrar(usuario.nombre));
  }
  if (correoUsuarioProfile) {
    correoUsuarioProfile.textContent = obtenerValorAMostrar(usuario.correo || usuario.email);
    console.log("✅ Correo actualizado:", obtenerValorAMostrar(usuario.correo || usuario.email));
  }
  if (telefonoUsuarioProfile) {
    const telefono = obtenerValorAMostrar(usuario.telefono);
    telefonoUsuarioProfile.textContent = telefono;
    console.log("✅ Teléfono actualizado:", telefono, "Valor original:", usuario.telefono);
  } else {
    console.error("❌ No se encontró el elemento telefonoUsuarioProfile");
  }
  if (direccionUsuarioProfile) {
    const direccion = obtenerValorAMostrar(usuario.direccion);
    direccionUsuarioProfile.textContent = direccion;
    console.log("✅ Dirección actualizada:", direccion, "Valor original:", usuario.direccion);
  } else {
    console.error("❌ No se encontró el elemento direccionUsuarioProfile");
  }
  
  // Mostrar iniciales en el avatar
  if (avatarInitialsProfile && usuario.nombre) {
    const nombres = usuario.nombre.split(" ");
    let iniciales = "";
    if (nombres.length >= 2) {
      iniciales = nombres[0].charAt(0).toUpperCase() + nombres[nombres.length - 1].charAt(0).toUpperCase();
    } else {
      iniciales = nombres[0].substring(0, 2).toUpperCase();
    }
    avatarInitialsProfile.textContent = iniciales;
  }
  
  // Configurar botón de cerrar sesión
  const logoutBtnProfile = document.getElementById("logoutBtnProfile");
  if (logoutBtnProfile) {
    // Remover event listeners anteriores
    const newLogoutBtn = logoutBtnProfile.cloneNode(true);
    logoutBtnProfile.parentNode.replaceChild(newLogoutBtn, logoutBtnProfile);
    
    // Agregar nuevo event listener
    const updatedLogoutBtn = document.getElementById("logoutBtnProfile");
    if (updatedLogoutBtn) {
      updatedLogoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log('🚪 Cerrando sesión desde perfil...');
        
        // Vaciar carrito del usuario
        const API_CARRITO = "http://localhost:4000/api/menu/carrito";
        if (usuario && usuario.id) {
          try {
            const usuarioId = String(usuario.id || usuario._id).trim();
            const resGet = await fetch(`${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`);
            if (resGet.ok) {
              const data = await resGet.json();
              const items = data.items || (Array.isArray(data) ? data : []);
              
              for (const item of items) {
                try {
                  await fetch(`${API_CARRITO}/${item._id || item.id}`, {
                    method: "DELETE"
                  });
                } catch (err) {
                  console.warn(`⚠️ Error al eliminar item:`, err);
                }
              }
            }
          } catch (err) {
            console.error("Error al vaciar carrito:", err);
          }
        }

        // Limpiar localStorage
        if (window.auth && typeof window.auth.logout === 'function') {
          window.auth.logout();
        } else {
          localStorage.removeItem("usuario");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
        }
        
        // Redirigir a login.html
        window.location.href = "/pages/cliente/login.html";
      });
    }
  }
}

// ================================
// CERRAR SESIÓN
// ================================
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    // Remover event listeners anteriores
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    
    // Agregar nuevo event listener
    const updatedLogoutBtn = document.getElementById("logoutBtn");
    if (updatedLogoutBtn) {
      updatedLogoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const usuario = obtenerUsuarioLogueado();
        const API_CARRITO = "http://localhost:4000/api/menu/carrito";
        
        if (usuario && usuario.id) {
          // Vaciar carrito del usuario
          try {
            const usuarioId = String(usuario.id || usuario._id).trim();
            const resGet = await fetch(`${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`);
            if (resGet.ok) {
              const data = await resGet.json();
              const items = data.items || (Array.isArray(data) ? data : []);
              
              for (const item of items) {
                try {
                  await fetch(`${API_CARRITO}/${item._id || item.id}`, {
                    method: "DELETE"
                  });
                } catch (err) {
                  console.warn(`⚠️ Error al eliminar item:`, err);
                }
              }
            }
          } catch (err) {
            console.error("Error al vaciar carrito:", err);
          }
        }

        // Limpiar localStorage
        if (window.auth && typeof window.auth.logout === 'function') {
          window.auth.logout();
        } else {
          localStorage.removeItem("usuario");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
        }
        
        // Redirigir a login.html
        window.location.href = "/pages/cliente/login.html";
      });
    }
  }
}

// ================================
// AL CARGAR
// ================================
// Función de inicialización unificada
function inicializarUserPage() {
  console.log('📋 user.js - Inicializando página de usuario...');
  
  // Función para intentar inicializar cuando los scripts estén listos
  const intentarInicializar = () => {
    // Verificar que el elemento del DOM exista
    const profileSection = document.getElementById("profileSection");
    
    if (profileSection) {
      console.log('✅ Elementos del DOM encontrados, verificando sesión...');
      
      // Ejecutar verificación inmediatamente
      verificarSesionEnLogin();
      actualizarNavUsuario();
      setupLogoutButton();
      
      // Verificar sesión cuando la ventana gana foco
      window.addEventListener('focus', () => {
        console.log('📋 user.js - Window focus - Verificando sesión...');
        verificarSesionEnLogin();
        actualizarNavUsuario();
      });
      
      // Verificar sesión periódicamente para detectar cambios
      setInterval(() => {
        verificarSesionEnLogin();
      }, 2000);
    } else {
      console.log('⏳ Esperando a que el DOM esté listo...');
      setTimeout(intentarInicializar, 50);
    }
  };
  
  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📋 user.js - DOMContentLoaded - Iniciando verificación de sesión...');
      setTimeout(intentarInicializar, 200);
    });
  } else {
    console.log('📋 user.js - DOM ya está listo - Iniciando verificación de sesión...');
    setTimeout(intentarInicializar, 200);
  }
}

// Inicializar - ejecutar después de que todos los scripts se hayan cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarUserPage);
} else {
  // Si el DOM ya está listo, ejecutar inmediatamente
  setTimeout(inicializarUserPage, 100);
}
