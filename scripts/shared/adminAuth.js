// Script compartido para verificación de sesión en todas las páginas del admin
// Este script debe cargarse después de config.js y auth.js

(function() {
  'use strict';

  const { API_CONFIG } = window.config || {};
  const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
    ? window.config.API_CONFIG.usuarios 
    : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
      ? `${process.env.USUARIOS_SERVICE_URL}/api` 
      : "http://localhost:3000/api";
  const apiBase = API_CONFIG?.usuarios || USUARIOS_SERVICE_URL;

  /**
   * Verifica si hay sesión de administrador activa
   */
  async function verificarSesionAdmin() {
    try {
      // Usar el sistema de autenticación unificado
      let admin = null;
      
      // Esperar a que window.auth esté disponible
      if (typeof window !== 'undefined' && window.auth) {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        
        console.log('🔍 Verificando sesión - User:', user, 'Role:', role);
        
        if (user && role === 'administrador') {
          admin = user;
          console.log('✅ Sesión de admin encontrada:', admin);
        } else if (user && user.rol === 'administrador') {
          // Si el rol está en el objeto user
          admin = user;
          // Asegurar que el role esté guardado correctamente
          if (role !== 'administrador') {
            window.auth.setUser(user, 'administrador');
          }
          console.log('✅ Sesión de admin encontrada (rol en user):', admin);
        }
      }
      
      // Fallback: verificar localStorage directamente
      if (!admin) {
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        
        if (userStr && roleStr === 'administrador') {
          try {
            admin = JSON.parse(userStr);
            if (admin.rol === "administrador" || roleStr === "administrador") {
              console.log('✅ Sesión de admin encontrada (localStorage):', admin);
            } else {
              admin = null;
            }
          } catch (e) {
            console.error('Error parseando user de localStorage:', e);
            localStorage.removeItem("user");
            localStorage.removeItem("role");
          }
        }
      }
      
      // Fallback adicional: verificar localStorage antiguo
      if (!admin) {
        const adminLocal = localStorage.getItem("admin");
        if (adminLocal) {
          try {
            admin = JSON.parse(adminLocal);
            if (admin.rol === "administrador") {
              // Migrar al sistema nuevo
              if (window.auth && window.auth.setUser) {
                window.auth.setUser(admin, 'administrador');
              } else {
                localStorage.setItem("user", JSON.stringify(admin));
                localStorage.setItem("role", "administrador");
              }
              console.log('✅ Sesión de admin encontrada (migrada):', admin);
            } else {
              admin = null;
            }
          } catch (e) {
            localStorage.removeItem("admin");
          }
        }
      }

      if (admin) {
        mostrarPanelAdmin(admin);
        return true;
      }

      // Si no hay sesión en localStorage, verificar cookie
      try {
        const res = await fetch(apiBase + "/sesion/admin", {
          credentials: "include"
        });
        const data = await res.json();

        if (data.logueado && data.admin && data.admin.rol === "administrador") {
          // Guardar usando el sistema unificado
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(data.admin, 'administrador');
          } else {
            localStorage.setItem("user", JSON.stringify(data.admin));
            localStorage.setItem("role", "administrador");
          }
          mostrarPanelAdmin(data.admin);
          return true;
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
      }

      // No hay sesión, retornar false (el init mostrará el login)
      return false;
    } catch (err) {
      console.error("Error al verificar sesión:", err);
      mostrarLoginAdmin();
      return false;
    }
  }

  /**
   * Muestra el formulario de login
   */
  function mostrarLoginAdmin() {
    const headerNav = document.getElementById("headerNav");
    const loginContainer = document.getElementById("loginContainer");
    const adminPanel = document.getElementById("adminPanel");
    const layoutContainer = document.querySelector(".layout-container");
    
    // Ocultar panel y header
    if (headerNav) headerNav.style.display = "none";
    if (layoutContainer) layoutContainer.style.display = "none";
    if (adminPanel) adminPanel.style.display = "none";
    
    // Mostrar login
    if (loginContainer) {
      loginContainer.style.display = "block";
    }
    
    document.body.classList.remove("logged-in");
  }

  /**
   * Muestra el panel de administración
   */
  function mostrarPanelAdmin(admin) {
    const headerNav = document.getElementById("headerNav");
    const loginContainer = document.getElementById("loginContainer");
    const adminPanel = document.getElementById("adminPanel");
    const layoutContainer = document.querySelector(".layout-container");
    
    // Ocultar login
    if (loginContainer) {
      loginContainer.style.display = "none";
    }
    
    // Mostrar panel y header
    if (adminPanel) {
      adminPanel.style.display = "flex";
      adminPanel.style.flexDirection = "column";
      adminPanel.style.flex = "1";
      adminPanel.style.overflow = "hidden";
      adminPanel.style.width = "100%";
      adminPanel.style.minHeight = "100vh";
    }
    if (layoutContainer) {
      layoutContainer.style.display = "flex";
    }
    if (headerNav) {
      headerNav.style.display = "flex";
    }
    
    document.body.classList.add("logged-in");
    
    // Actualizar nombre del admin en el sidebar
    const sidebarAdminName = document.getElementById("sidebarAdminName");
    if (sidebarAdminName && admin.nombre) {
      sidebarAdminName.textContent = admin.nombre;
    }
    
    // Actualizar avatar
    const sidebarAvatar = document.querySelector(".sidebar-avatar");
    if (sidebarAvatar && admin.nombre) {
      const nombres = admin.nombre.split(" ");
      let iniciales = "";
      if (nombres.length >= 2) {
        iniciales = nombres[0].charAt(0).toUpperCase() + nombres[nombres.length - 1].charAt(0).toUpperCase();
      } else {
        iniciales = nombres[0].substring(0, 2).toUpperCase();
      }
      sidebarAvatar.textContent = iniciales;
    }
    
    // Llamar a función específica de la página si existe
    // Esperar un poco para asegurar que los scripts de la página hayan cargado
    setTimeout(() => {
      if (typeof window.cargarDatosAdmin === 'function') {
        console.log('✅ Llamando a window.cargarDatosAdmin desde adminAuth.js');
        window.cargarDatosAdmin(admin);
      } else {
        console.warn('⚠️ window.cargarDatosAdmin no está definida después de esperar');
        // Intentar una vez más después de otro delay
        setTimeout(() => {
          if (typeof window.cargarDatosAdmin === 'function') {
            console.log('✅ window.cargarDatosAdmin encontrada en segundo intento');
            window.cargarDatosAdmin(admin);
          } else {
            console.error('❌ window.cargarDatosAdmin nunca se definió');
          }
        }, 500);
      }
    }, 500);
  }

  /**
   * Configura el formulario de login
   */
  function configurarLoginAdmin() {
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (!adminLoginForm) return;

    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = document.getElementById("correo").value.trim();
      const contrasena = document.getElementById("contrasena").value.trim();
      const msg = document.getElementById("mensaje");

      if (!msg) return;

      // Usar el sistema de autenticación unificado
      if (window.auth && window.auth.loginAdmin) {
        const result = await window.auth.loginAdmin(correo, contrasena);
        
        if (result.success) {
          // Asegurar que la sesión esté guardada
          console.log('✅ Login exitoso, guardando sesión:', result.user);
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(result.user, 'administrador');
            console.log('✅ Sesión guardada en localStorage');
          }
          
          msg.textContent = "✅ Bienvenido Administrador";
          msg.className = "success";
          msg.style.color = "green";

          // Mostrar panel inmediatamente sin recargar
          setTimeout(() => {
            mostrarPanelAdmin(result.user);
          }, 300);
        } else {
          msg.textContent = result.error || "❌ Error en el inicio de sesión";
          msg.className = "error";
          msg.style.color = "red";
        }
      } else {
        // Fallback
        try {
          const res = await fetch(apiBase + "/login/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena }),
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && data.logueado && data.admin && data.admin.rol === "administrador") {
            // Asegurar que la sesión esté guardada
            console.log('✅ Login exitoso (fallback), guardando sesión:', data.admin);
            if (window.auth && window.auth.setUser) {
              window.auth.setUser(data.admin, 'administrador');
            } else {
              localStorage.setItem("user", JSON.stringify(data.admin));
              localStorage.setItem("role", "administrador");
            }
            console.log('✅ Sesión guardada en localStorage');
            
            msg.textContent = "✅ Bienvenido Administrador";
            msg.className = "success";
            msg.style.color = "green";

            // Mostrar panel inmediatamente sin recargar
            setTimeout(() => {
              mostrarPanelAdmin(data.admin);
            }, 500);
          } else {
            msg.textContent = data.error || "❌ Error en el inicio de sesión";
            msg.className = "error";
            msg.style.color = "red";
          }
        } catch (err) {
          console.error("Error en login:", err);
          msg.textContent = "❌ Error al conectar con el servidor";
          msg.className = "error";
          msg.style.color = "red";
        }
      }
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Verificar que estamos en una página de admin, no de trabajador
    const esPaginaAdmin = window.location.pathname.includes('/admin/');
    const esPaginaTrabajador = window.location.pathname.includes('/trabajador/');
    
    if (esPaginaTrabajador) {
      console.log('⚠️ adminAuth.js detectado en página de trabajador, saliendo');
      return; // No ejecutar si estamos en una página de trabajador
    }
    
    if (!esPaginaAdmin) {
      console.log('⚠️ adminAuth.js detectado fuera de páginas de admin, saliendo');
      return;
    }
    
    // Ocultar login por defecto (evitar flash)
    const loginContainer = document.getElementById("loginContainer");
    if (loginContainer) {
      loginContainer.style.display = "none";
    }
    
    // Verificar que no existe trabajadorLoginForm (conflicto)
    const trabajadorLoginForm = document.getElementById("trabajadorLoginForm");
    if (trabajadorLoginForm) {
      console.error('❌ Conflicto: trabajadorLoginForm encontrado en página de admin');
    }
    
    // Configurar formulario de login
    console.log('🔧 Configurando login de admin...');
    configurarLoginAdmin();
    
    // Verificar sesión inmediatamente (síncrono primero, luego asíncrono)
    // Primero verificar localStorage directamente (más rápido)
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    
    if (userStr && roleStr === 'administrador') {
      try {
        const admin = JSON.parse(userStr);
        if (admin && (admin.rol === "administrador" || roleStr === "administrador")) {
          // Hay sesión, mostrar panel inmediatamente
          console.log('✅ Sesión encontrada en localStorage, mostrando panel');
          mostrarPanelAdmin(admin);
          return; // Salir temprano, no verificar más
        }
      } catch (e) {
        console.error('Error parseando user:', e);
      }
    }
    
    // Si no hay sesión en localStorage, verificar con el servidor
    // Pero hacerlo de forma asíncrona sin mostrar el login primero
    setTimeout(() => {
      verificarSesionAdmin().then((tieneSesion) => {
        if (!tieneSesion) {
          // Solo mostrar login si no hay sesión
          console.log('❌ No hay sesión activa, mostrando login');
          mostrarLoginAdmin();
        } else {
          console.log('✅ Sesión activa encontrada, mostrando panel');
        }
      }).catch((err) => {
        // Si hay error, mostrar login
        console.error('❌ Error verificando sesión:', err);
        mostrarLoginAdmin();
      });
    }, 100);
  }

  // Exportar funciones para uso global
  window.adminAuth = {
    verificarSesionAdmin,
    mostrarLoginAdmin,
    mostrarPanelAdmin
  };
})();

