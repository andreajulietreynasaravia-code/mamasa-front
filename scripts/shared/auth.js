// Sistema de autenticación unificado
// Maneja login de cliente, trabajador y administrador

// Usar API_CONFIG de config.js si está disponible, sino usar variables de entorno
const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
  ? window.config.API_CONFIG.usuarios 
  : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
    ? `${process.env.USUARIOS_SERVICE_URL}/api` 
    : "http://localhost:3000/api";

const API_CONFIG = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG) || {
  usuarios: USUARIOS_SERVICE_URL
};

const STORAGE_KEYS = {
  user: "user",
  role: "role"
};

/**
 * Obtiene el usuario actual desde localStorage
 * @returns {Object|null} Usuario o null si no hay sesión
 */
function getCurrentUser() {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.user);
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    console.error("Error al obtener usuario:", e);
    return null;
  }
}

/**
 * Obtiene el rol del usuario actual
 * @returns {string|null} 'cliente', 'trabajador', 'administrador' o null
 */
function getCurrentRole() {
  const role = localStorage.getItem(STORAGE_KEYS.role);
  return role || null;
}

/**
 * Guarda el usuario en localStorage
 * @param {Object} user - Objeto usuario
 * @param {string} role - Rol del usuario
 */
function setUser(user, role) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.role, role);
}

/**
 * Elimina la sesión del usuario
 */
function clearUser() {
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.role);
}

/**
 * Verifica si hay una sesión activa
 * @returns {boolean}
 */
function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Rol a verificar
 * @returns {boolean}
 */
function hasRole(role) {
  return getCurrentRole() === role;
}

/**
 * Login de cliente
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<Object>}
 */
async function loginCliente(correo, contrasena) {
  try {
    // Validar campos antes de enviar
    if (!correo || !contrasena) {
      return { success: false, error: "⚠️ Por favor, completa todos los campos." };
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return { success: false, error: "⚠️ Por favor, ingresa un correo electrónico válido." };
    }

    console.log('🔐 Intentando login para:', correo);
    
    const res = await fetch(`${API_CONFIG.usuarios}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });

    // Verificar si la respuesta es JSON
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta:', parseError);
      return { success: false, error: "❌ Error al procesar la respuesta del servidor." };
    }

    console.log('📦 Respuesta del servidor:', { status: res.status, data });

    // Manejar diferentes códigos de estado
    if (res.status === 404) {
      return { success: false, error: data.error || "⚠️ Usuario no encontrado. Verifica tu correo electrónico." };
    }
    
    if (res.status === 401) {
      return { success: false, error: data.error || "❌ Contraseña incorrecta. Verifica tu contraseña." };
    }
    
    if (res.status === 400) {
      return { success: false, error: data.error || "⚠️ Faltan credenciales. Completa todos los campos." };
    }

    if (!res.ok) {
      return { success: false, error: data.error || `❌ Error ${res.status}: No se pudo iniciar sesión.` };
    }
    
    // Verificar estructura de respuesta exitosa
    if (data.logueado && data.usuario) {
      // Verificar que el usuario tenga rol 'usuario' (cliente)
      if (data.usuario.rol === 'usuario') {
        setUser(data.usuario, 'cliente');
        console.log('✅ Login exitoso para:', data.usuario.correo);
        return { success: true, user: data.usuario };
      } else {
        return { success: false, error: "⚠️ Este correo no corresponde a un cliente. Por favor, usa el login correcto." };
      }
    }
    
    // Si llega aquí, la respuesta no tiene la estructura esperada
    return { success: false, error: data.error || "❌ Error: Respuesta del servidor inválida." };
  } catch (err) {
    console.error('❌ Error en loginCliente:', err);
    return { success: false, error: `❌ Error al conectar con el servidor: ${err.message}` };
  }
}

/**
 * Login de trabajador
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<Object>}
 */
async function loginTrabajador(correo, contrasena) {
  try {
    const res = await fetch(`${API_CONFIG.usuarios}/login/trabajador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ correo, contrasena })
    });
    const data = await res.json();
    
    if (res.ok && data.logueado && data.trabajador && data.trabajador.rol === 'trabajador') {
      setUser(data.trabajador, 'trabajador');
      return { success: true, user: data.trabajador };
    }
    return { success: false, error: data.error || "Credenciales incorrectas" };
  } catch (err) {
    return { success: false, error: "Error al conectar con el servidor" };
  }
}

/**
 * Login de administrador
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<Object>}
 */
async function loginAdmin(correo, contrasena) {
  try {
    // Asegurarse de que API_CONFIG esté disponible
    const apiUrl = API_CONFIG?.usuarios || "http://localhost:3000/api";
    const url = `${apiUrl}/login/admin`;
    
    console.log('🔐 Intentando login admin en:', url);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ correo, contrasena })
    });
    
    console.log('📡 Respuesta del servidor:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Error del servidor:', errorText);
      return { success: false, error: `Error ${res.status}: ${res.statusText}` };
    }
    
    const data = await res.json();
    console.log('📦 Datos recibidos:', data);
    
    if (data.logueado && data.admin && data.admin.rol === 'administrador') {
      setUser(data.admin, 'administrador');
      return { success: true, user: data.admin };
    }
    return { success: false, error: data.error || "Credenciales incorrectas" };
  } catch (err) {
    console.error('❌ Error en loginAdmin:', err);
    return { success: false, error: `Error al conectar con el servidor: ${err.message}` };
  }
}

/**
 * Logout - limpia la sesión y redirige
 * @param {string} redirectUrl - URL a la que redirigir después del logout
 */
async function logout(redirectUrl = '/pages/cliente/login.html') {
  const role = getCurrentRole();
  const user = getCurrentUser();
  
  // Llamar al endpoint de logout según el rol
  try {
    if (role === 'cliente') {
      await fetch(`${API_CONFIG.usuarios}/logout`, { method: 'POST' });
      // Vaciar carrito si existe
      if (user && user.id) {
        try {
          await fetch(`http://localhost:4000/api/menu/carrito/vaciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id })
          });
        } catch (err) {
          console.error("Error al vaciar carrito:", err);
        }
      }
    } else if (role === 'trabajador') {
      await fetch(`${API_CONFIG.usuarios}/logout/trabajador`, { method: 'POST', credentials: 'include' });
    } else if (role === 'administrador') {
      await fetch(`${API_CONFIG.usuarios}/logout/admin`, { method: 'POST', credentials: 'include' });
    }
  } catch (err) {
    console.error("Error en logout:", err);
  }
  
  clearUser();
  window.location.href = redirectUrl;
}

/**
 * Verifica la sesión actual y redirige si no está autenticado
 * @param {string} requiredRole - Rol requerido (opcional)
 * @returns {boolean} true si está autenticado, false si no
 */
function requireAuth(requiredRole = null) {
  const user = getCurrentUser();
  const role = getCurrentRole();
  
  if (!user) {
    window.location.href = '/pages/cliente/login.html';
    return false;
  }
  
  if (requiredRole && role !== requiredRole) {
    // Redirigir según el rol actual
    if (role === 'cliente') {
      window.location.href = '/pages/cliente/menu.html';
    } else if (role === 'trabajador') {
      window.location.href = '/pages/trabajador/dashboard.html';
    } else if (role === 'administrador') {
      window.location.href = '/pages/admin/dashboard.html';
    }
    return false;
  }
  
  return true;
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.auth = {
    getCurrentUser,
    getCurrentRole,
    setUser,
    clearUser,
    isAuthenticated,
    hasRole,
    loginCliente,
    loginTrabajador,
    loginAdmin,
    logout,
    requireAuth
  };
}

