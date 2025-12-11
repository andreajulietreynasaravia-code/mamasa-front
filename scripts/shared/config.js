// Configuración de APIs de microservicios usando variables de entorno
// Las variables se pueden inyectar desde window.__ENV__ si están disponibles
// Si no están disponibles, se usan valores por defecto
const getEnvVar = (varName, defaultValue) => {
  // Intentar obtener desde window.__ENV__ (inyectado por el servidor en producción)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[varName]) {
    return window.__ENV__[varName];
  }
  // Intentar obtener desde process.env (si está disponible, por ejemplo en Node.js o con bundler)
  if (typeof process !== 'undefined' && process.env && process.env[varName]) {
    return process.env[varName];
  }
  // Fallback a valores por defecto (solo para desarrollo local)
  return defaultValue;
};

// Variables de entorno para servicios
const USUARIOS_SERVICE_URL = getEnvVar('USUARIOS_SERVICE_URL', 'http://localhost:3000');
const MENU_SERVICE_URL = getEnvVar('MENU_SERVICE_URL', 'http://localhost:4000');
const PEDIDOS_SERVICE_URL = getEnvVar('PEDIDOS_SERVICE_URL', 'http://localhost:4001');
const PAGOS_SERVICE_URL = getEnvVar('PAGOS_SERVICE_URL', 'http://localhost:4002');
const RESERVAS_SERVICE_URL = getEnvVar('RESERVAS_SERVICE_URL', 'http://localhost:4004');
const NOTIFICACIONES_SERVICE_URL = getEnvVar('NOTIFICACIONES_SERVICE_URL', 'http://localhost:4003');

const API_CONFIG = {
  usuarios: `${USUARIOS_SERVICE_URL}/api`,
  menu: `${MENU_SERVICE_URL}/api`,
  pedidos: `${PEDIDOS_SERVICE_URL}/api`,
  pagos: PAGOS_SERVICE_URL,
  reservas: `${RESERVAS_SERVICE_URL}/api`,
  notificaciones: `${NOTIFICACIONES_SERVICE_URL}/api`
};

// Claves de localStorage unificadas
const STORAGE_KEYS = {
  user: "user", // Usuario logueado (cliente, trabajador o admin)
  token: "token", // Token de autenticación (si se usa)
  role: "role" // Rol del usuario: 'cliente', 'trabajador', 'administrador'
};

// Exportar para uso en otros scripts
if (typeof window !== 'undefined') {
  window.config = { API_CONFIG, STORAGE_KEYS };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, STORAGE_KEYS };
}

