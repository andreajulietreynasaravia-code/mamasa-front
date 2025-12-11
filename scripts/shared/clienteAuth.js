// Script compartido para verificación de sesión en todas las páginas del cliente
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
   * Verifica si hay sesión de cliente activa
   */
  async function verificarSesionCliente() {
    try {
      // Usar el sistema de autenticación unificado
      let cliente = null;
      
      // Esperar a que window.auth esté disponible
      if (typeof window !== 'undefined' && window.auth) {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        
        console.log('🔍 Verificando sesión cliente - User:', user, 'Role:', role);
        
        if (user && role === 'cliente') {
          cliente = user;
          console.log('✅ Sesión de cliente encontrada:', cliente);
        } else if (user && user.rol === 'usuario') {
          // Si el rol está en el objeto user como 'usuario' (que es el rol de cliente en BD)
          cliente = user;
          // Asegurar que el role esté guardado correctamente
          if (role !== 'cliente') {
            window.auth.setUser(user, 'cliente');
          }
          console.log('✅ Sesión de cliente encontrada (rol en user):', cliente);
        }
      }
      
      // Fallback: verificar localStorage directamente
      if (!cliente) {
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        
        if (userStr && roleStr === 'cliente') {
          try {
            cliente = JSON.parse(userStr);
            if (cliente && (cliente.rol === "usuario" || roleStr === "cliente")) {
              console.log('✅ Sesión de cliente encontrada (localStorage):', cliente);
            } else {
              cliente = null;
            }
          } catch (e) {
            console.error('Error parseando user de localStorage:', e);
            localStorage.removeItem("user");
            localStorage.removeItem("role");
          }
        }
      }
      
      // Fallback adicional: verificar localStorage antiguo
      if (!cliente) {
        const clienteLocal = localStorage.getItem("usuario");
        if (clienteLocal) {
          try {
            cliente = JSON.parse(clienteLocal);
            if (cliente.rol === "usuario") {
              // Migrar al sistema nuevo
              if (window.auth && window.auth.setUser) {
                window.auth.setUser(cliente, 'cliente');
              } else {
                localStorage.setItem("user", JSON.stringify(cliente));
                localStorage.setItem("role", "cliente");
              }
              console.log('✅ Sesión de cliente encontrada (migrada):', cliente);
            } else {
              cliente = null;
            }
          } catch (e) {
            localStorage.removeItem("usuario");
          }
        }
      }

      if (cliente) {
        return true;
      }

      // Si no hay sesión en localStorage, verificar cookie
      try {
        const res = await fetch(apiBase + "/sesion", {
          credentials: "include"
        });
        const data = await res.json();

        if (data.logueado && data.usuario && data.usuario.rol === "usuario") {
          // Guardar usando el sistema unificado
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(data.usuario, 'cliente');
          } else {
            localStorage.setItem("user", JSON.stringify(data.usuario));
            localStorage.setItem("role", "cliente");
          }
          return true;
        }
      } catch (err) {
        console.error("Error verificando sesión:", err);
      }

      // No hay sesión
      return false;
    } catch (err) {
      console.error("Error al verificar sesión:", err);
      return false;
    }
  }

  /**
   * Configura el formulario de login del cliente
   */
  function configurarLoginCliente() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
      console.warn('⚠️ Formulario de login no encontrado');
      return;
    }

    // Clonar el formulario para evitar listeners duplicados
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    // Configurar el nuevo formulario
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const msg = document.getElementById('mensajeLogin');
      const submitBtn = form.querySelector('button[type="submit"]');
      
      // Limpiar mensaje anterior
      if (msg) {
        msg.textContent = "";
        msg.style.color = "";
        msg.className = "";
      }

      const correo = form.correo.value.trim();
      const contrasena = form.contrasena.value;

      // Validación básica
      if (!correo || !contrasena) {
        if (msg) {
          msg.textContent = "⚠️ Por favor, completa todos los campos.";
          msg.style.color = "red";
          msg.className = "error";
        }
        return;
      }

      // Deshabilitar botón durante el proceso
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Iniciando sesión...";
      }

      try {
        // Intentar usar el sistema de autenticación unificado
        if (window.auth && window.auth.loginCliente) {
          console.log('🔐 Usando window.auth.loginCliente');
          const result = await window.auth.loginCliente(correo, contrasena);
          
          if (result.success) {
            // Asegurar que la sesión esté guardada
            console.log('✅ Login exitoso, guardando sesión:', result.user);
            if (window.auth && window.auth.setUser) {
              window.auth.setUser(result.user, 'cliente');
              console.log('✅ Sesión guardada en localStorage');
            }
            
            if (msg) {
              msg.textContent = "✅ Bienvenido";
              msg.className = "success";
              msg.style.color = "green";
            }
            
            // Obtener URL de destino desde localStorage o usar pedido.html por defecto
            const urlDestino = localStorage.getItem('redirectAfterLogin') || '/pages/cliente/pedido.html';
            localStorage.removeItem('redirectAfterLogin'); // Limpiar después de usar
            
            // Redirigir después de un breve delay
            setTimeout(() => {
              window.location.href = urlDestino;
            }, 500);
          } else {
            if (msg) {
              msg.textContent = result.error || "❌ Credenciales incorrectas. Verifica tu correo y contraseña.";
              msg.className = "error";
              msg.style.color = "red";
            }
            
            // Rehabilitar botón
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Ingresar";
            }
          }
        } else {
          // Fallback: hacer fetch directo
          console.log('🔐 Usando fetch directo (fallback)');
          const res = await fetch(apiBase + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena }),
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && data.logueado && data.usuario && data.usuario.rol === "usuario") {
            // Asegurar que la sesión esté guardada
            console.log('✅ Login exitoso (fallback), guardando sesión:', data.usuario);
            if (window.auth && window.auth.setUser) {
              window.auth.setUser(data.usuario, 'cliente');
            } else {
              localStorage.setItem("user", JSON.stringify(data.usuario));
              localStorage.setItem("role", "cliente");
            }
            console.log('✅ Sesión guardada en localStorage');
            
            if (msg) {
              msg.textContent = "✅ Bienvenido";
              msg.className = "success";
              msg.style.color = "green";
            }
            
            // Obtener URL de destino desde localStorage o usar pedido.html por defecto
            const urlDestino = localStorage.getItem('redirectAfterLogin') || '/pages/cliente/pedido.html';
            localStorage.removeItem('redirectAfterLogin'); // Limpiar después de usar
            
            // Redirigir después de un breve delay
            setTimeout(() => {
              window.location.href = urlDestino;
            }, 500);
          } else {
            if (msg) {
              msg.textContent = data.error || "❌ Error en el inicio de sesión";
              msg.className = "error";
              msg.style.color = "red";
            }
            
            // Rehabilitar botón
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Ingresar";
            }
          }
        }
      } catch (err) {
        console.error("Error en login:", err);
        if (msg) {
          msg.textContent = "❌ Error al conectar con el servidor";
          msg.className = "error";
          msg.style.color = "red";
        }
        
        // Rehabilitar botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Ingresar";
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

  /**
   * Actualiza el nombre del usuario en la navegación
   */
  function actualizarNombreUsuario(cliente) {
    if (!cliente) return;
    
    const userTextNav = document.getElementById('userTextNav');
    const userLinkNav = document.getElementById('userLinkNav');
    
    if (cliente.nombre) {
      const primerNombre = cliente.nombre.split(" ")[0];
      if (userTextNav) {
        userTextNav.textContent = primerNombre;
      }
      if (userLinkNav) {
        userLinkNav.href = "/pages/cliente/user.html";
        // Remover cualquier onclick anterior
        userLinkNav.onclick = null;
      }
    } else {
      if (userTextNav) {
        userTextNav.textContent = "Login";
      }
      if (userLinkNav) {
        userLinkNav.href = "/pages/cliente/login.html";
        userLinkNav.onclick = null;
      }
    }
  }

  function init() {
    // Verificar que estamos en una página de cliente
    const esPaginaCliente = window.location.pathname.includes('/cliente/');
    const esPaginaAdmin = window.location.pathname.includes('/admin/');
    const esPaginaTrabajador = window.location.pathname.includes('/trabajador/');
    
    if (esPaginaAdmin || esPaginaTrabajador) {
      console.log('⚠️ clienteAuth.js detectado en página de admin/trabajador, saliendo');
      return; // No ejecutar si estamos en una página de admin o trabajador
    }
    
    if (!esPaginaCliente) {
      console.log('⚠️ clienteAuth.js detectado fuera de páginas de cliente, saliendo');
      return;
    }
    
    // Configurar formulario de login si existe
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      console.log('🔧 Configurando login de cliente...');
      configurarLoginCliente();
    }
    
    // Verificar sesión inmediatamente (síncrono primero, luego asíncrono)
    // Primero verificar localStorage directamente (más rápido)
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    
    let cliente = null;
    if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
      try {
        cliente = JSON.parse(userStr);
        if (cliente && (cliente.rol === "usuario" || roleStr === "cliente")) {
          // Hay sesión, el usuario ya está logueado
          console.log('✅ Sesión de cliente encontrada en localStorage');
          // Actualizar nombre del usuario en la navegación
          actualizarNombreUsuario(cliente);
          // Continuar verificando con el servidor en segundo plano
        } else {
          cliente = null;
        }
      } catch (e) {
        console.error('Error parseando user:', e);
        cliente = null;
      }
    }
    
    // También verificar usando window.auth si está disponible
    if (!cliente && window.auth) {
      const user = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      if (user && (role === 'cliente' || user.rol === 'usuario')) {
        cliente = user;
        console.log('✅ Sesión de cliente encontrada via window.auth');
        actualizarNombreUsuario(cliente);
      }
    }
    
    // Si estamos en login.html, verificar sesión para mostrar perfil si ya está logueado
    const esPaginaLogin = window.location.pathname.includes('login.html');
    if (esPaginaLogin && cliente) {
      console.log('📄 Página de login con sesión activa, mostrando perfil');
      // La página de login manejará mostrar el perfil
      return;
    }
    
    // Verificar sesión con el servidor en segundo plano para sincronizar
    setTimeout(() => {
      verificarSesionCliente().then((tieneSesion) => {
        if (tieneSesion) {
          // Actualizar nombre del usuario si no se había actualizado antes
          if (!cliente && window.auth) {
            const user = window.auth.getCurrentUser();
            if (user) {
              actualizarNombreUsuario(user);
            }
          }
          console.log('✅ Sesión activa de cliente verificada');
        } else {
          // Si no hay sesión, actualizar navegación para mostrar "Login"
          if (!cliente) {
            actualizarNombreUsuario(null);
          }
          console.log('⚠️ No hay sesión activa de cliente');
        }
      }).catch((err) => {
        console.error('❌ Error verificando sesión:', err);
      });
    }, 100);
    
    // Actualizar nombre del usuario periódicamente (por si cambia en otra pestaña)
    setInterval(() => {
      if (window.auth) {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        if (user && (role === 'cliente' || user.rol === 'usuario')) {
          actualizarNombreUsuario(user);
        } else {
          actualizarNombreUsuario(null);
        }
      }
    }, 2000);
  }

  // Exportar funciones para uso global
  window.clienteAuth = {
    verificarSesionCliente,
    configurarLoginCliente
  };
})();

