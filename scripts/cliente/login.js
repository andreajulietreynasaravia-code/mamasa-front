// Sistema de login unificado para clientes
// Usa el sistema de autenticación compartido

// Obtener URLs de API usando variables de entorno
const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
  ? window.config.API_CONFIG.usuarios 
  : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
    ? `${process.env.USUARIOS_SERVICE_URL}/api` 
    : "http://localhost:3000/api";

const MENU_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.menu) 
  ? window.config.API_CONFIG.menu 
  : (typeof process !== 'undefined' && process.env?.MENU_SERVICE_URL) 
    ? `${process.env.MENU_SERVICE_URL}/api` 
    : "http://localhost:4000/api";

const API_CONFIG = {
  usuarios: USUARIOS_SERVICE_URL,
  menu: MENU_SERVICE_URL
};

// ================================
// FUNCIONES DE MODAL
// ================================
function mostrarRegistro() {
  console.log('🔍 mostrarRegistro() - Abriendo modal de registro');
  const modal = document.getElementById('registroVentana');
  
  if (!modal) {
    alert('Error: No se encontró el modal. Recarga la página.');
    return;
  }
  
  // SIMPLIFICADO: Solo mostrar el modal sin restricciones
  modal.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0, 0, 0, 0.7) !important; justify-content: center !important; align-items: center !important; z-index: 99999 !important; visibility: visible !important; opacity: 1 !important;';
  document.body.style.overflow = 'hidden';
  
  console.log('✅ Modal mostrado');
}

function cerrarRegistro() {
  console.log('🔍 cerrarRegistro() - Cerrando modal de registro');
  try {
    const modal = document.getElementById('registroVentana');
    if (modal) {
      // Ocultar el modal
      modal.style.setProperty('display', 'none', 'important');
      modal.style.setProperty('visibility', 'hidden', 'important');
      modal.style.setProperty('opacity', '0', 'important');
      
      // Restaurar scroll del body
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Limpiar el formulario si existe
      const registroForm = document.getElementById('registroForm');
      if (registroForm) {
        registroForm.reset();
      }
      
      // Limpiar mensajes de error
      const errorMessages = modal.querySelectorAll('.error-message');
      errorMessages.forEach(msg => {
        if (msg) msg.style.display = 'none';
      });
      
      const mensajeRegistro = document.getElementById('mensajeRegistro');
      if (mensajeRegistro) {
        mensajeRegistro.textContent = '';
        mensajeRegistro.className = '';
      }
      
      console.log('✅ Modal de registro ocultado');
    } else {
      console.error('❌ No se encontró el elemento registroVentana');
    }
  } catch (error) {
    console.error('❌ Error al cerrar el modal:', error);
  }
}

// Hacer las funciones disponibles globalmente INMEDIATAMENTE
// Esto se ejecuta tan pronto como el script se carga, antes de DOMContentLoaded
window.mostrarRegistro = mostrarRegistro;
window.cerrarRegistro = cerrarRegistro;

console.log('✅ Funciones mostrarRegistro y cerrarRegistro disponibles globalmente');

// ================================
// MOSTRAR / OCULTAR CONTRASEÑAS
// ================================
function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  if (toggle && input) {
    toggle.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
    });
  }
}

// ================================
// VALIDACIÓN DE CORREO
// ================================
function validarCorreoGmail(correo) {
  if (!correo) return false;
  const correoLower = correo.toLowerCase().trim();
  return correoLower.endsWith('@gmail.com') && correoLower.length > 11;
}

// ================================
// VALIDACIÓN DE CONTRASEÑAS
// ================================
function esContrasenaSegura(pass) {
  if (!pass || pass.length < 8) return false;
  const tieneMayuscula = /[A-Z]/.test(pass);
  const tieneNumero = /[0-9]/.test(pass);
  const tieneSimbolo = /[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~]/.test(pass);
  return tieneMayuscula && tieneNumero && tieneSimbolo;
}

function verificarContraseñas() {
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  const errorMsg = document.getElementById("errorConfirmacion");
  const errorSecurity = document.getElementById("errorSeguridad");
  
  let valido = true;
  const password = passwordInput ? passwordInput.value : '';

  // Validar y mostrar requisitos de seguridad en tiempo real
  if (passwordInput && password) {
    const tieneLongitud = password.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    const tieneSimbolo = /[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~]/.test(password);
    
    // Actualizar iconos de requisitos
    actualizarRequisito('reqLongitud', tieneLongitud);
    actualizarRequisito('reqMayuscula', tieneMayuscula);
    actualizarRequisito('reqNumero', tieneNumero);
    actualizarRequisito('reqSimbolo', tieneSimbolo);
    
    // Validar si cumple todos los requisitos
    if (!esContrasenaSegura(password)) {
      if (errorSecurity) {
        errorSecurity.style.display = "block";
        errorSecurity.style.color = "#dc3545";
      }
      valido = false;
    } else {
      if (errorSecurity) errorSecurity.style.display = "none";
    }
  } else {
    // Si no hay contraseña, mostrar todos los requisitos como no cumplidos
    actualizarRequisito('reqLongitud', false);
    actualizarRequisito('reqMayuscula', false);
    actualizarRequisito('reqNumero', false);
    actualizarRequisito('reqSimbolo', false);
    if (errorSecurity) errorSecurity.style.display = "none";
  }

  // Validar coincidencia de contraseñas
  if (confirmInput && passwordInput && confirmInput.value) {
    if (passwordInput.value !== confirmInput.value) {
      if (errorMsg) {
        errorMsg.style.display = "block";
        errorMsg.style.color = "#dc3545";
      }
      valido = false;
    } else {
      if (errorMsg) errorMsg.style.display = "none";
    }
  } else {
    if (errorMsg) errorMsg.style.display = "none";
  }

  return valido;
}

// Función para actualizar el estado visual de cada requisito
function actualizarRequisito(id, cumple) {
  const elemento = document.getElementById(id);
  if (elemento) {
    const icono = elemento.querySelector('.requisito-icono');
    if (icono) {
      if (cumple) {
        icono.textContent = '✅';
        icono.style.color = '#28a745';
        elemento.style.color = '#28a745';
      } else {
        icono.textContent = '❌';
        icono.style.color = '#dc3545';
        elemento.style.color = '#dc3545';
      }
    }
  }
}

function verificarCorreo() {
  const correoInput = document.getElementById("correoRegistro");
  const errorCorreo = document.getElementById("errorCorreo");
  
  if (correoInput && correoInput.value) {
    if (!validarCorreoGmail(correoInput.value)) {
      if (errorCorreo) {
        errorCorreo.style.display = "block";
        errorCorreo.style.color = "#dc3545";
      }
      return false;
    } else {
      if (errorCorreo) errorCorreo.style.display = "none";
      return true;
    }
  }
  return false;
}

// ================================
// FUNCIÓN PARA PROCESAR EL REGISTRO
// ================================
async function procesarRegistro() {
  console.log('🔍 ===== INICIANDO PROCESO DE REGISTRO =====');
  
  // Obtener elementos del DOM
  const msg = document.getElementById("mensajeRegistro");
  const form = document.getElementById("registroForm");
  
  // Verificar que los elementos existan
  if (!msg) {
    console.error('❌ No se encontró el elemento mensajeRegistro');
    alert('Error: No se encontró el elemento de mensaje. Por favor, recarga la página.');
    return;
  }
  
  if (!form) {
    console.error('❌ No se encontró el formulario');
    mostrarError(msg, "❌ Error: No se encontró el formulario.");
    return;
  }
  
  // Configurar mensaje para mostrar
  msg.textContent = "";
  msg.className = "";
  msg.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 1rem; text-align: center; font-weight: 500; min-height: 30px; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.5;";
  
  // Obtener valores del formulario
  const nombre = form.nombre ? form.nombre.value.trim() : '';
  const correo = form.correo ? form.correo.value.trim() : '';
  const contrasena = form.contrasena ? form.contrasena.value : '';
  const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '';
  const telefono = form.telefono ? form.telefono.value.trim() : '';
  const direccion = form.direccion ? form.direccion.value.trim() : '';
  
  console.log('📋 Valores del formulario:', {
    nombre: nombre ? '✓' : '✗',
    correo: correo ? '✓' : '✗',
    contrasena: contrasena ? '✓' : '✗',
    confirmPassword: confirmPassword ? '✓' : '✗',
    telefono: telefono ? '✓' : '✗',
    direccion: direccion ? '✓' : '✗'
  });
  
  // VALIDACIÓN COMPLETA DE CAMPOS
  if (!nombre) {
    mostrarError(msg, "⚠️ Por favor, ingresa tu nombre completo.");
    if (form.nombre) form.nombre.focus();
    return;
  }
  
  if (!correo) {
    mostrarError(msg, "⚠️ Por favor, ingresa tu correo electrónico.");
    if (form.correo) form.correo.focus();
    return;
  }
  
  if (!correo.toLowerCase().endsWith('@gmail.com')) {
    mostrarError(msg, "⚠️ El correo debe terminar en @gmail.com");
    if (form.correo) form.correo.focus();
    return;
  }
  
  if (!contrasena) {
    mostrarError(msg, "⚠️ Por favor, ingresa una contraseña.");
    if (form.contrasena) form.contrasena.focus();
    return;
  }
  
  if (!esContrasenaSegura(contrasena)) {
    mostrarError(msg, "⚠️ La contraseña no cumple con los requisitos de seguridad. Debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo especial.");
    if (form.contrasena) form.contrasena.focus();
    return;
  }
  
  if (!confirmPassword) {
    mostrarError(msg, "⚠️ Por favor, confirma tu contraseña.");
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) confirmInput.focus();
    return;
  }
  
  if (contrasena !== confirmPassword) {
    mostrarError(msg, "⚠️ Las contraseñas no coinciden.");
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) confirmInput.focus();
    return;
  }
  
  if (!telefono) {
    mostrarError(msg, "⚠️ Por favor, ingresa tu número de teléfono.");
    if (form.telefono) form.telefono.focus();
    return;
  }
  
  if (!direccion) {
    mostrarError(msg, "⚠️ Por favor, ingresa tu dirección.");
    if (form.direccion) form.direccion.focus();
    return;
  }
  
  // Si todas las validaciones pasan, proceder con el registro
  console.log('✅ Todas las validaciones pasaron, enviando datos al servidor...');
  
  // Mostrar mensaje de carga
  mostrarExito(msg, "⏳ Registrando usuario...");
  
  // Preparar datos para enviar
  const body = {
    nombre: nombre,
    correo: correo.toLowerCase(),
    contrasena: contrasena,
    telefono: telefono,
    direccion: direccion,
  };
  
  console.log('📤 Enviando datos de registro a:', API_CONFIG.usuarios + "/register");
  console.log('📤 Datos (sin contraseña):', { ...body, contrasena: '***' });

  try {
    const res = await fetch(API_CONFIG.usuarios + "/register", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });
    
    console.log('📥 Respuesta del servidor:', res.status, res.statusText);
    
    // Intentar parsear la respuesta
    let data;
    try {
      data = await res.json();
      console.log('📦 Datos recibidos:', data);
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta:', parseError);
      const textResponse = await res.text();
      console.error('📦 Respuesta como texto:', textResponse);
      mostrarError(msg, "❌ Error: Respuesta inválida del servidor.");
      return;
    }

    if (res.ok && (res.status === 200 || res.status === 201)) {
      console.log('✅ Registro exitoso');
      mostrarExito(msg, "✅ Registro exitoso. Redirigiendo al login...");
      
      // Limpiar el formulario
      form.reset();
      
      // Limpiar los requisitos de contraseña
      if (typeof actualizarRequisito === 'function') {
        actualizarRequisito('reqLongitud', false);
        actualizarRequisito('reqMayuscula', false);
        actualizarRequisito('reqNumero', false);
        actualizarRequisito('reqSimbolo', false);
      }
      
      // Cerrar modal y redirigir después de un delay
      setTimeout(() => {
        if (typeof cerrarRegistro === 'function') {
          cerrarRegistro();
        }
        window.location.href = "/pages/cliente/login.html";
      }, 1500);
    } else {
      // Error del servidor
      console.error('❌ Error en el registro:', data);
      const errorMessage = data.error || data.message || "⚠️ Error al registrar. Por favor, intenta nuevamente.";
      mostrarError(msg, errorMessage);
    }
  } catch (err) {
    console.error('❌ Error al conectar con el servidor:', err);
    mostrarError(msg, "❌ Error al conectar con el servidor. Verifica que el servicio esté funcionando.");
  }
}

// Función auxiliar para mostrar errores
function mostrarError(msg, texto) {
  if (!msg) return;
  msg.textContent = texto;
  msg.classList.remove("exito");
  msg.classList.add("error");
  msg.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 1rem; text-align: center; font-weight: 500; min-height: 30px; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; color: #dc3545; background-color: #f8d7da; border: 1px solid #f5c6cb;";
  msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Función auxiliar para mostrar éxito
function mostrarExito(msg, texto) {
  if (!msg) return;
  msg.textContent = texto;
  msg.classList.remove("error");
  msg.classList.add("exito");
  msg.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 1rem; text-align: center; font-weight: 500; min-height: 30px; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.5; color: #28a745; background-color: #d4edda; border: 1px solid #c3e6cb;";
}

// Exponer procesarRegistro al ámbito global
window.procesarRegistro = procesarRegistro;

// ================================
// CONFIGURAR FORMULARIO DE REGISTRO
// ================================
function setupRegistroForm() {
  const registroForm = document.getElementById("registroForm");
  if (!registroForm) {
    console.error('❌ No se encontró el formulario de registro');
    return;
  }

  // PREVENIR CUALQUIER ENVÍO TRADICIONAL DEL FORMULARIO
  registroForm.onsubmit = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    return false;
  };
  
  // También prevenir con addEventListener en capture phase
  registroForm.addEventListener("submit", function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  }, true);
}

// ================================
// LOGIN
// ================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir cualquier comportamiento por defecto
    
    const msg = document.getElementById('mensajeLogin');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Limpiar mensaje anterior
    if (msg) {
      msg.textContent = "";
      msg.style.color = "";
      msg.className = "";
    }

    const form = e.target;
    const correo = form.correo.value.trim();
    const contrasena = form.contrasena.value;

    // Validación básica en el frontend
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
      // Verificar que window.auth esté disponible
      if (!window.auth) {
        // Esperar un momento y reintentar
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!window.auth || !window.auth.loginCliente) {
          throw new Error("El sistema de autenticación no está disponible. Asegúrate de que todos los scripts se hayan cargado correctamente.");
        }
      }

      if (!window.auth.loginCliente) {
        throw new Error("La función de login no está disponible. Recarga la página.");
      }

      console.log('🔐 Iniciando proceso de login...');
      
      // Usar el sistema de autenticación unificado
      const result = await window.auth.loginCliente(correo, contrasena);
      
      console.log('📦 Resultado del login:', result);

      if (result.success) {
        if (msg) {
          msg.textContent = "✅ Login exitoso. Redirigiendo...";
          msg.style.color = "green";
          msg.className = "success";
        }
        
        // Obtener URL de destino desde localStorage o usar pedido.html por defecto
        const urlDestino = localStorage.getItem('redirectAfterLogin') || '/pages/cliente/pedido.html';
        localStorage.removeItem('redirectAfterLogin'); // Limpiar después de usar
        
        setTimeout(() => {
          // Limpiar cualquier parámetro de la URL antes de redirigir
          window.location.href = urlDestino;
        }, 1000);
      } else {
        // Mostrar mensaje de error específico
        if (msg) {
          msg.textContent = result.error || "❌ Credenciales incorrectas. Verifica tu correo y contraseña.";
          msg.style.color = "red";
          msg.className = "error";
        }
        
        // Rehabilitar botón
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Ingresar";
        }
      }
    } catch (error) {
      console.error('❌ Error en el proceso de login:', error);
      if (msg) {
        msg.textContent = `❌ Error: ${error.message || "No se pudo iniciar sesión. Intenta nuevamente."}`;
        msg.style.color = "red";
        msg.className = "error";
      }
      
      // Rehabilitar botón
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Ingresar";
      }
    }
  });
}


// ================================
// OBTENER USUARIO LOGEADO (CON FALLBACKS)
// ================================
function obtenerUsuarioLogueado() {
  try {
    // Método 1: Usar window.auth si está disponible
    if (window.auth && typeof window.auth.getCurrentUser === 'function') {
      const usuario = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      
      if (usuario && (role === 'cliente' || usuario.rol === 'usuario')) {
        console.log('✅ Usuario encontrado via window.auth:', usuario);
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
          return usuario;
        }
      } catch (e) {
        console.error("❌ Error parseando usuario de localStorage:", e);
      }
    }
    
    console.warn('⚠️ No se encontró usuario logueado');
    return null;
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return null;
  }
}

// ================================
// MOSTRAR / OCULTAR FORMULARIO LOGIN
// ================================
function verificarSesionEnLogin() {
  console.log('🔍 verificarSesionEnLogin() - Iniciando verificación...');
  const user = obtenerUsuarioLogueado();
  console.log('🔍 verificarSesionEnLogin() - Usuario obtenido:', user ? 'Sí' : 'No');
  
  const loginSection = document.getElementById("loginSection");
  const profileSection = document.getElementById("profileSection");
  const btnCrearCuenta = document.getElementById("btnCrearCuenta");
  
  if (!user) {
    console.log('⚠️ No hay sesión activa - Mostrando formulario de login');
    // Si no hay sesión, mostrar solo el formulario
    if (loginSection) {
      loginSection.style.display = "block";
      console.log('✅ Formulario de login mostrado');
    }
    if (profileSection) {
      profileSection.style.display = "none";
      console.log('✅ Sección de perfil ocultada');
    }
    // Asegurar que el botón de crear cuenta esté visible
    if (btnCrearCuenta) {
      btnCrearCuenta.style.display = "block";
      btnCrearCuenta.style.visibility = "visible";
    }
    return;
  }
  
  console.log('✅ Hay sesión activa - Mostrando perfil del usuario');
  // Si ya hay sesión, mostrar perfil, ocultar formulario PERO mantener botón de crear cuenta visible
  if (loginSection) {
    loginSection.style.display = "none";
    console.log('✅ Formulario de login ocultado');
  }
  if (profileSection) {
    profileSection.style.display = "flex";
    console.log('✅ Sección de perfil mostrada');
    mostrarPerfilUsuario(user);
  }
  // Asegurar que el botón de crear cuenta esté siempre visible, incluso con sesión activa
  if (btnCrearCuenta) {
    btnCrearCuenta.style.display = "block";
    btnCrearCuenta.style.visibility = "visible";
    btnCrearCuenta.style.position = "relative";
    console.log('✅ Botón crear cuenta mantenido visible incluso con sesión activa');
  }
}

// ================================
// MOSTRAR PERFIL DEL USUARIO
// ================================
function mostrarPerfilUsuario(user) {
  const nombreUsuarioProfile = document.getElementById("nombreUsuarioProfile");
  const correoUsuarioProfile = document.getElementById("correoUsuarioProfile");
  const avatarInitialsProfile = document.getElementById("avatarInitialsProfile");
  
  if (nombreUsuarioProfile) nombreUsuarioProfile.textContent = user.nombre || "N/A";
  if (correoUsuarioProfile) correoUsuarioProfile.textContent = user.correo || "N/A";
  
  // Mostrar iniciales en el avatar
  if (avatarInitialsProfile && user.nombre) {
    const nombres = user.nombre.split(" ");
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
    updatedLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.auth.logout("/pages/cliente/login.html");
    });
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
    updatedLogoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await window.auth.logout("/pages/cliente/login.html");
    });
  }
}

// ================================
// LIMPIAR PARÁMETROS DE LA URL AL CARGAR
// ================================
function limpiarParametrosURL() {
  // Si hay parámetros en la URL (como ?correo=...&contrasena=...), limpiarlos
  if (window.location.search) {
    // Reemplazar la URL sin los parámetros
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// ================================
// AL CARGAR
// ================================
document.addEventListener("DOMContentLoaded", () => {
  console.log('📋 login.js - DOMContentLoaded - Iniciando verificación de sesión...');
  // Limpiar parámetros de la URL inmediatamente
  limpiarParametrosURL();
  
  // Configurar botón de crear cuenta - SIMPLIFICADO SIN RESTRICCIONES
  const btnCrearCuenta = document.getElementById('btnCrearCuenta');
  if (btnCrearCuenta) {
    btnCrearCuenta.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Abrir modal directamente sin verificaciones
      const modal = document.getElementById('registroVentana');
      if (modal) {
        modal.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0, 0, 0, 0.7) !important; justify-content: center !important; align-items: center !important; z-index: 99999 !important; visibility: visible !important; opacity: 1 !important;';
        document.body.style.overflow = 'hidden';
        console.log('✅ Modal abierto desde DOMContentLoaded');
      }
      return false;
    };
    console.log('✅ Botón crear cuenta configurado');
  }
  
  // Asegurar que la función esté disponible globalmente
  window.mostrarRegistro = mostrarRegistro;
  window.cerrarRegistro = cerrarRegistro;
  console.log('✅ Funciones disponibles globalmente en DOMContentLoaded');
  
  // Configurar cerrar modal al hacer clic fuera
  const modal = document.getElementById('registroVentana');
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Si se hace clic en el fondo del modal (no en el contenido), cerrar
      if (e.target === modal) {
        console.log('🔍 Clic fuera del modal, cerrando...');
        cerrarRegistro();
      }
    });
    console.log('✅ Event listener agregado para cerrar modal al hacer clic fuera');
  }
  
  // Configurar botón cancelar - usando onclick directo para mayor compatibilidad
  const btnCancelarRegistro = document.getElementById('btnCancelarRegistro');
  if (btnCancelarRegistro) {
    btnCancelarRegistro.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 Botón cancelar clickeado');
      cerrarRegistro();
      return false;
    };
    console.log('✅ Event listener agregado al botón cancelar');
  }
  
  // Configurar validaciones en tiempo real
  const correoInput = document.getElementById('correoRegistro');
  if (correoInput) {
    correoInput.addEventListener('input', verificarCorreo);
    correoInput.addEventListener('blur', verificarCorreo);
  }
  
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", verificarContraseñas);
  }
  if (confirmInput) {
    confirmInput.addEventListener("input", verificarContraseñas);
  }
  
  // Configurar formulario de registro
  setupRegistroForm();
  
  // CONFIGURAR BOTÓN REGISTRAR - usando onclick directo para mayor compatibilidad
  const btnRegistrar = document.getElementById('btnRegistrar');
  if (btnRegistrar) {
    btnRegistrar.onclick = async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔍 Botón Registrar clickeado');
      
      // Llamar a procesarRegistro
      await procesarRegistro();
      return false;
    };
    console.log('✅ Botón registrar configurado');
  } else {
    console.warn('⚠️ Botón btnRegistrar no encontrado');
  }
  
  setupPasswordToggle("togglePassword", "password");
  setupPasswordToggle("toggleConfirmPassword", "confirmPassword");
  setupPasswordToggle("toggleLoginPassword", "loginPassword");
  verificarSesionEnLogin();
  setupLogoutButton();
  
  // Verificar sesión cuando la ventana gana foco (por si el usuario inicia sesión en otra pestaña)
  window.addEventListener('focus', () => {
    console.log('📋 login.js - Window focus - Verificando sesión...');
    verificarSesionEnLogin();
  });
  
  // Verificar sesión periódicamente para detectar cambios
  setInterval(() => {
    verificarSesionEnLogin();
  }, 2000);
});

