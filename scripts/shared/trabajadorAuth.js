// Script compartido para verificación de sesión en todas las páginas del trabajador
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
   * Verifica si hay sesión de trabajador activa
   */
  async function verificarSesionTrabajador() {
    try {
      // Usar el sistema de autenticación unificado
      let trabajador = null;
      
      // Esperar a que window.auth esté disponible
      if (typeof window !== 'undefined' && window.auth) {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        
        console.log('🔍 Verificando sesión trabajador - User:', user, 'Role:', role);
        
        if (user && role === 'trabajador') {
          trabajador = user;
          console.log('✅ Sesión de trabajador encontrada:', trabajador);
        } else if (user && user.rol === 'trabajador') {
          // Si el rol está en el objeto user
          trabajador = user;
          // Asegurar que el role esté guardado correctamente
          if (role !== 'trabajador') {
            window.auth.setUser(user, 'trabajador');
          }
          console.log('✅ Sesión de trabajador encontrada (rol en user):', trabajador);
        }
      }
      
      // Fallback: verificar localStorage directamente
      if (!trabajador) {
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        
        if (userStr && roleStr === 'trabajador') {
          try {
            trabajador = JSON.parse(userStr);
            if (trabajador && (trabajador.rol === "trabajador" || roleStr === "trabajador")) {
              console.log('✅ Sesión de trabajador encontrada (localStorage):', trabajador);
            } else {
              trabajador = null;
            }
          } catch (e) {
            console.error('Error parseando user de localStorage:', e);
            localStorage.removeItem("user");
            localStorage.removeItem("role");
          }
        }
      }
      
      // Fallback adicional: verificar localStorage antiguo
      if (!trabajador) {
        const trabajadorLocal = localStorage.getItem("trabajador");
        if (trabajadorLocal) {
          try {
            trabajador = JSON.parse(trabajadorLocal);
            if (trabajador.rol === "trabajador") {
              // Migrar al sistema nuevo
              if (window.auth && window.auth.setUser) {
                window.auth.setUser(trabajador, 'trabajador');
              } else {
                localStorage.setItem("user", JSON.stringify(trabajador));
                localStorage.setItem("role", "trabajador");
              }
              console.log('✅ Sesión de trabajador encontrada (migrada):', trabajador);
            } else {
              trabajador = null;
            }
          } catch (e) {
            localStorage.removeItem("trabajador");
          }
        }
      }

      if (trabajador) {
        mostrarPanelTrabajador(trabajador);
        return true;
      }

      // Si no hay sesión en localStorage, verificar cookie
      try {
        const res = await fetch(apiBase + "/sesion/trabajador", {
          credentials: "include"
        });
        const data = await res.json();

        if (data.logueado && data.trabajador && data.trabajador.rol === "trabajador") {
          // Guardar usando el sistema unificado
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(data.trabajador, 'trabajador');
          } else {
            localStorage.setItem("user", JSON.stringify(data.trabajador));
            localStorage.setItem("role", "trabajador");
          }
          mostrarPanelTrabajador(data.trabajador);
          return true;
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
      }

      // No hay sesión, redirigir al login
      return false;
    } catch (err) {
      console.error("Error al verificar sesión:", err);
      redirigirALogin();
      return false;
    }
  }

  /**
   * Redirige a la página de login del trabajador
   */
  function redirigirALogin() {
    // Redirigir a la página principal del trabajador que mostrará el login
    window.location.href = "/pages/trabajador/trabajador.html";
  }

  /**
   * Muestra el formulario de login
   */
  function mostrarLoginTrabajador() {
    const topHeader = document.querySelector(".top-header");
    const loginContainer = document.getElementById("loginContainer");
    const layoutContainer = document.querySelector(".layout-container");
    
    // Ocultar panel y header
    if (topHeader) topHeader.style.display = "none";
    if (layoutContainer) layoutContainer.style.display = "none";
    
    // Mostrar login
    if (loginContainer) {
      loginContainer.style.display = "block";
    }
    
    document.body.classList.remove("logged-in");
  }

  /**
   * Muestra el panel del trabajador
   */
  function mostrarPanelTrabajador(trabajador) {
    // Agregar clase logged-in primero para que el CSS oculte el login y muestre el contenido
    document.body.classList.add("logged-in");
    
    const topHeader = document.querySelector(".top-header");
    const loginContainer = document.getElementById("loginContainer");
    const layoutContainer = document.querySelector(".layout-container");
    
    // Ocultar login (el CSS también lo hace, pero por si acaso)
    if (loginContainer) {
      loginContainer.style.display = "none";
    }
    
    // Mostrar panel y header (el CSS también lo hace, pero por si acaso)
    if (layoutContainer) {
      layoutContainer.style.display = "flex";
    }
    if (topHeader) {
      topHeader.style.display = "flex";
    }
    
    // Actualizar nombre del trabajador en el sidebar
    const sidebarTrabajadorName = document.getElementById("sidebarTrabajadorName");
    if (sidebarTrabajadorName && trabajador.nombre) {
      sidebarTrabajadorName.textContent = trabajador.nombre;
    }
    
    // Actualizar avatar
    const sidebarAvatar = document.querySelector(".sidebar-avatar");
    if (sidebarAvatar && trabajador.nombre) {
      const nombres = trabajador.nombre.split(" ");
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
      if (typeof window.cargarDatosTrabajador === 'function') {
        console.log('✅ Llamando a window.cargarDatosTrabajador desde trabajadorAuth.js');
        window.cargarDatosTrabajador(trabajador);
      } else {
        console.warn('⚠️ window.cargarDatosTrabajador no está definida después de esperar');
        // Intentar una vez más después de otro delay
        setTimeout(() => {
          if (typeof window.cargarDatosTrabajador === 'function') {
            console.log('✅ window.cargarDatosTrabajador encontrada en segundo intento');
            window.cargarDatosTrabajador(trabajador);
          } else {
            console.error('❌ window.cargarDatosTrabajador nunca se definió');
          }
        }, 500);
      }
    }, 500);
  }

  /**
   * Configura el formulario de login
   */
  function configurarLoginTrabajador() {
    const trabajadorLoginForm = document.getElementById("trabajadorLoginForm");
    if (!trabajadorLoginForm) {
      console.log('⚠️ Formulario trabajadorLoginForm no encontrado');
      return;
    }

    // Remover listeners previos si existen (clonar y reemplazar)
    const nuevoForm = trabajadorLoginForm.cloneNode(true);
    trabajadorLoginForm.parentNode.replaceChild(nuevoForm, trabajadorLoginForm);

    nuevoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Buscar elementos dentro del formulario o en el documento
      const correoInput = nuevoForm.querySelector("#correo") || document.getElementById("correo");
      const contrasenaInput = nuevoForm.querySelector("#contrasena") || document.getElementById("contrasena");
      const msg = nuevoForm.querySelector("#mensaje") || document.getElementById("mensaje");

      if (!correoInput || !contrasenaInput) {
        console.error('❌ Campos de formulario no encontrados');
        return;
      }

      const correo = correoInput.value.trim();
      const contrasena = contrasenaInput.value.trim();

      if (!msg) {
        console.error('❌ Elemento mensaje no encontrado');
        return;
      }

      // Usar el sistema de autenticación unificado
      if (window.auth && window.auth.loginTrabajador) {
        const result = await window.auth.loginTrabajador(correo, contrasena);
        
        if (result.success) {
          // Asegurar que la sesión esté guardada
          console.log('✅ Login exitoso, guardando sesión:', result.user);
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(result.user, 'trabajador');
            console.log('✅ Sesión guardada en localStorage');
          }
          
          msg.textContent = "✅ Bienvenido Trabajador";
          msg.className = "success";
          msg.style.color = "green";

          // Mostrar panel inmediatamente sin recargar
          setTimeout(() => {
            mostrarPanelTrabajador(result.user);
          }, 300);
        } else {
          msg.textContent = result.error || "❌ Error en el inicio de sesión";
          msg.className = "error";
          msg.style.color = "red";
        }
      } else {
        // Fallback
        try {
          const res = await fetch(apiBase + "/login/trabajador", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena }),
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && data.logueado && data.trabajador && data.trabajador.rol === "trabajador") {
            // Asegurar que la sesión esté guardada
            console.log('✅ Login exitoso (fallback), guardando sesión:', data.trabajador);
            if (window.auth && window.auth.setUser) {
              window.auth.setUser(data.trabajador, 'trabajador');
            } else {
              localStorage.setItem("user", JSON.stringify(data.trabajador));
              localStorage.setItem("role", "trabajador");
            }
            console.log('✅ Sesión guardada en localStorage');
            
            msg.textContent = "✅ Bienvenido Trabajador";
            msg.className = "success";
            msg.style.color = "green";

            // Mostrar panel inmediatamente sin recargar
            setTimeout(() => {
              mostrarPanelTrabajador(data.trabajador);
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
    // Verificar que estamos en una página de trabajador, no de admin
    const esPaginaTrabajador = window.location.pathname.includes('/trabajador/');
    const esPaginaAdmin = window.location.pathname.includes('/admin/');
    
    if (esPaginaAdmin) {
      console.log('⚠️ trabajadorAuth.js detectado en página de admin, saliendo');
      return; // No ejecutar si estamos en una página de admin
    }
    
    if (!esPaginaTrabajador) {
      console.log('⚠️ trabajadorAuth.js detectado fuera de páginas de trabajador, saliendo');
      return;
    }
    
    // Ocultar contenido por defecto (evitar flash)
    const topHeader = document.querySelector(".top-header");
    const layoutContainer = document.querySelector(".layout-container");
    if (topHeader) {
      topHeader.style.display = "none";
    }
    if (layoutContainer) {
      layoutContainer.style.display = "none";
    }
    
    // Asegurar que el login esté visible por defecto
    const loginContainer = document.getElementById("loginContainer");
    if (loginContainer) {
      loginContainer.style.display = "block";
    }
    
    // Verificar que no existe adminLoginForm (conflicto)
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
      console.error('❌ Conflicto: adminLoginForm encontrado en página de trabajador');
    }
    
    // Configurar formulario de login
    console.log('🔧 Configurando login de trabajador...');
    configurarLoginTrabajador();
    
    // Verificar sesión inmediatamente (síncrono primero, luego asíncrono)
    // Primero verificar localStorage directamente (más rápido)
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    
    if (userStr && roleStr === 'trabajador') {
      try {
        const trabajador = JSON.parse(userStr);
        if (trabajador && (trabajador.rol === "trabajador" || roleStr === "trabajador")) {
          // Hay sesión, mostrar panel inmediatamente
          console.log('✅ Sesión encontrada en localStorage, mostrando panel');
          mostrarPanelTrabajador(trabajador);
          return; // Salir temprano, no verificar más
        }
      } catch (e) {
        console.error('Error parseando user:', e);
      }
    }
    
    // Si no hay sesión en localStorage, verificar con el servidor
    // Pero hacerlo de forma asíncrona sin mostrar el login primero
    setTimeout(() => {
      verificarSesionTrabajador().then((tieneSesion) => {
        if (!tieneSesion) {
          // Verificar si estamos en trabajador.html (página de login)
          const esPaginaLogin = window.location.pathname.includes('trabajador.html');
          if (esPaginaLogin) {
            // Si estamos en la página de login, mostrar el formulario
            console.log('❌ No hay sesión activa, mostrando login');
            mostrarLoginTrabajador();
          } else {
            // Si estamos en otra página, redirigir al login
            console.log('❌ No hay sesión activa, redirigiendo al login');
            redirigirALogin();
          }
        } else {
          console.log('✅ Sesión activa encontrada, mostrando panel');
        }
      }).catch((err) => {
        // Si hay error, verificar si estamos en la página de login
        console.error('❌ Error verificando sesión:', err);
        const esPaginaLogin = window.location.pathname.includes('trabajador.html');
        if (esPaginaLogin) {
          mostrarLoginTrabajador();
        } else {
          redirigirALogin();
        }
      });
    }, 100);
  }

  // Exportar funciones para uso global
  window.trabajadorAuth = {
    verificarSesionTrabajador,
    mostrarLoginTrabajador,
    mostrarPanelTrabajador,
    redirigirALogin
  };
})();

