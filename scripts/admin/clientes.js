// Obtener la configuración de la API usando variables de entorno
const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
  ? window.config.API_CONFIG.usuarios 
  : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
    ? `${process.env.USUARIOS_SERVICE_URL}/api` 
    : "http://localhost:3000/api";

let apiBase = USUARIOS_SERVICE_URL;
let API_CLIENTES = `${apiBase}/clientes`;

// Función para inicializar API
function inicializarAPI() {
  if (typeof window !== 'undefined' && window.config && window.config.API_CONFIG) {
    const usuariosApi = window.config.API_CONFIG.usuarios;
    if (usuariosApi) {
      apiBase = usuariosApi;
      API_CLIENTES = `${apiBase}/clientes`;
      console.log('🔧 API_CLIENTES configurada desde config.js:', API_CLIENTES);
    }
  } else {
    console.log('🔧 API_CLIENTES usando valor por defecto:', API_CLIENTES);
  }
}

// Inicializar cuando el script se carga
inicializarAPI();

// También intentar inicializar después de que config.js se cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAPI);
} else {
  setTimeout(inicializarAPI, 100);
}

// Función para verificar si el servicio de usuarios está conectado
async function verificarConexionServicio() {
  console.log('🔍 Verificando conexión con servicio de usuarios...');
  console.log('🔍 URL del servicio:', API_CLIENTES);
  
  try {
    // Intentar hacer una petición al endpoint de clientes para verificar conexión
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos
    
    const response = await fetch(API_CLIENTES, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      credentials: "include"
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw err;
    });
    
    clearTimeout(timeoutId);
    
    // Si responde (incluso con error 500), el servicio está corriendo
    if (response.status >= 200 && response.status < 600) {
      console.log('✅ Servicio de usuarios está conectado (status:', response.status, ')');
      return { conectado: true, mensaje: 'Servicio conectado correctamente' };
    }
    
    console.log('⚠️ Servicio responde pero con error:', response.status);
    return { conectado: true, mensaje: 'Servicio conectado (con errores)' };
    
  } catch (error) {
    console.error('❌ Error verificando conexión:', error);
    
    if (error.message === 'TIMEOUT' || error.name === 'AbortError') {
      return { 
        conectado: false, 
        mensaje: 'El servicio de usuarios no responde (timeout). Verifica que esté corriendo en el puerto 3000.' 
      };
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return { 
        conectado: false, 
        mensaje: `No se puede conectar con el servicio de usuarios. Verifica que el servicio esté corriendo en ${USUARIOS_SERVICE_URL}` 
      };
    }
    
    return { 
      conectado: false, 
      mensaje: `Error de conexión: ${error.message}` 
    };
  }
}

console.log('📦 Script clientes.js cargado');
console.log('📦 API_CLIENTES inicial:', API_CLIENTES);
console.log('📦 window.config disponible:', !!(window.config && window.config.API_CONFIG));

// Función para cargar clientes
async function cargarClientes() {
  console.log('🔍 ========== cargarClientes() INICIADA ==========');
  
  // Asegurarse de que la API esté inicializada antes de hacer la petición
  inicializarAPI();
  
  const tbody = document.getElementById("tbody-clientes");
  const totalClientes = document.getElementById("total-clientes");

  if (!tbody) {
    console.error('❌ No se encontró el elemento tbody-clientes');
    return;
  }

  // Validar que apiBase esté definido
  if (!apiBase || apiBase === 'undefined' || apiBase.includes('undefined')) {
    console.error('❌ ERROR CRÍTICO: apiBase no está definido correctamente');
    console.error('❌ window.config:', window.config);
    console.error('❌ API_CONFIG:', window.config?.API_CONFIG);
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color: #dc3545;">Error de configuración: URL de API no disponible</td></tr>`;
    if (totalClientes) totalClientes.textContent = 0;
    return;
  }

  // Mostrar mensaje de carga
  tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Cargando clientes...</td></tr>`;

  try {
    console.log('📡 ========== INICIANDO PETICIÓN GET ==========');
    console.log('📡 URL completa:', API_CLIENTES);
    console.log('📡 apiBase:', apiBase);
    console.log('📡 API_CONFIG:', API_CONFIG);
    console.log('📡 window.config:', window.config);

    const response = await fetch(API_CLIENTES, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    });

    console.log('📦 ========== RESPUESTA RECIBIDA ==========');
    console.log('📦 Status:', response.status);
    console.log('📦 Status Text:', response.statusText);
    console.log('📦 OK:', response.ok);
    console.log('📦 Headers:', Object.fromEntries(response.headers.entries()));

    // Verificar CORS
    const corsHeader = response.headers.get('access-control-allow-origin');
    console.log('📦 CORS Header:', corsHeader);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ========== ERROR EN RESPUESTA ==========');
      console.error('❌ Status:', response.status);
      console.error('❌ Status Text:', response.statusText);
      console.error('❌ Error Text:', errorText);

      let mensajeError = '';
      if (response.status === 0) {
        mensajeError = `
          <tr>
            <td colspan="5" style='padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
              <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error de Conexión</h3>
              <p style='margin: 0.5rem 0;'><strong>No se puede conectar con el servicio de usuarios</strong></p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Posibles causas: CORS bloqueado, servicio no corriendo, o error de red.</p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${API_CLIENTES}</p>
              <p style='margin: 1rem 0 0 0; font-size: 0.85rem; color: #666;'>
                <strong>Soluciones:</strong><br>
                1. Verifica que el servicio de usuarios esté corriendo en ${USUARIOS_SERVICE_URL}<br>
                2. Verifica que CORS esté habilitado en el servicio<br>
                3. Revisa la consola del navegador para más detalles
              </p>
            </td>
          </tr>
        `;
      } else {
        mensajeError = `<tr><td colspan="5" class="empty-state">Error al cargar clientes: ${response.status} ${response.statusText}<br><small>${errorText}</small></td></tr>`;
      }
      tbody.innerHTML = mensajeError;
      if (totalClientes) totalClientes.textContent = 0;
      return;
    }

    console.log('📊 ========== PROCESANDO RESPUESTA ==========');
    let data;
    const responseText = await response.text();
    console.log('📊 Response Text (raw):', responseText);

    // Detectar si la respuesta es HTML en lugar de JSON
    if (responseText.trim().startsWith('<') && responseText.trim().endsWith('>')) {
      console.error('❌ Error: El servidor está devolviendo HTML en lugar de JSON');
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style='padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
            <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error: Respuesta HTML</h3>
            <p style='margin: 0.5rem 0;'><strong>El servidor está devolviendo HTML en lugar de JSON</strong></p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Esto puede indicar que la ruta no existe o hay un error en el servidor.</p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${API_CLIENTES}</p>
          </td>
        </tr>
      `;
      if (totalClientes) totalClientes.textContent = 0;
      return;
    }

    try {
      data = JSON.parse(responseText);
      console.log('📊 Datos parseados:', data);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style='padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
            <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error: JSON Inválido</h3>
            <p style='margin: 0.5rem 0;'><strong>No se pudo parsear la respuesta del servidor</strong></p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Respuesta recibida: ${responseText.substring(0, 200)}...</p>
          </td>
        </tr>
      `;
      if (totalClientes) totalClientes.textContent = 0;
      return;
    }
    
    // Validar estructura de datos
    if (!data || typeof data !== 'object') {
      console.error('❌ Error: La respuesta no es un objeto válido');
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error: Respuesta inválida del servidor</td></tr>`;
      if (totalClientes) totalClientes.textContent = 0;
      return;
    }

    let clientes = data.clientes || [];
    console.log('✅ Clientes encontrados:', clientes.length);

    // Validar que clientes sea un array
    if (!Array.isArray(clientes)) {
      console.error('❌ Error: clientes no es un array, es:', typeof clientes);
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Error: Formato de datos inválido (se esperaba un array)</td></tr>`;
      if (totalClientes) totalClientes.textContent = 0;
      return;
    }

    // Aplicar filtro de búsqueda si existe
    const buscarInput = document.getElementById("buscar-cliente");
    const busqueda = buscarInput ? buscarInput.value.toLowerCase().trim() : '';
    
    if (busqueda) {
      clientes = clientes.filter(c =>
        (c.nombre && c.nombre.toLowerCase().includes(busqueda)) ||
        (c.correo && c.correo.toLowerCase().includes(busqueda)) ||
        (c.telefono && c.telefono.toLowerCase().includes(busqueda))
      );
      console.log('🔍 Clientes filtrados:', clientes.length);
    }

    mostrarClientes(clientes);
    
    // Actualizar total (mostrar total sin filtrar)
    if (totalClientes) {
      const totalSinFiltrar = data.clientes ? data.clientes.length : 0;
      totalClientes.textContent = totalSinFiltrar;
    }

  } catch (error) {
    console.error("❌ Error completo al cargar clientes:", error);
    console.error("❌ Stack:", error.stack);
    console.error("❌ Tipo de error:", error.name);
    console.error("❌ Mensaje:", error.message);
    
    // Verificar si es un error de conexión
    let mensajeError = '';
    
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') || 
        error.message.includes('Network request failed') ||
        error.name === 'TypeError' ||
        error.message.includes('CORS')) {
      mensajeError = `
        <tr>
          <td colspan="5" style='padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
            <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error de Conexión</h3>
            <p style='margin: 0.5rem 0;'><strong>No se puede conectar con el servicio de usuarios</strong></p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>El servicio de usuarios no está disponible o no está corriendo.</p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${API_CLIENTES}</p>
            <p style='margin: 1rem 0 0 0; font-size: 0.85rem; color: #666;'>
              <strong>Soluciones:</strong><br>
              1. Verifica que el servicio de usuarios esté corriendo en http://localhost:3000<br>
              2. Verifica que CORS esté habilitado en el servicio<br>
              3. Revisa la consola del navegador para más detalles<br>
              4. Abre una terminal en la carpeta del servicio de usuarios y ejecuta: <code style='background: #f0f0f0; padding: 2px 6px; border-radius: 4px;'>npm start</code>
            </p>
          </td>
        </tr>
      `;
    } else {
      mensajeError = `
        <tr>
          <td colspan="5" style='padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
            <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error al Cargar Clientes</h3>
            <p style='margin: 0.5rem 0;'><strong>${error.message || 'Error desconocido'}</strong></p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${API_CLIENTES}</p>
            <p style='margin: 1rem 0 0 0; font-size: 0.85rem; color: #666;'>
              Revisa la consola del navegador para más detalles del error.
            </p>
          </td>
        </tr>
      `;
    }
    
    if (tbody) {
      tbody.innerHTML = mensajeError;
    }
    if (totalClientes) {
      totalClientes.textContent = 0;
    }
  }
}

// Función para mostrar clientes en la tabla
function mostrarClientes(clientes) {
  console.log('📋 mostrarClientes() llamada con', clientes.length, 'clientes');
  const tbody = document.getElementById("tbody-clientes");

  if (!tbody) {
    console.error('❌ No se encontró el elemento tbody-clientes en mostrarClientes');
    return;
  }

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No se encontraron clientes</td></tr>`;
    return;
  }

  tbody.innerHTML = clientes
    .map(c => {
      const nombre = c.nombre || 'N/A';
      const correo = c.correo || 'N/A';
      const telefono = c.telefono || 'N/A';
      const direccion = c.direccion || 'N/A';
      const id = c.id || 'N/A';
      
      return `
        <tr>
          <td>${id}</td>
          <td>${nombre}</td>
          <td>${correo}</td>
          <td>${telefono}</td>
          <td>${direccion}</td>
        </tr>
      `;
    })
    .join('');
  
  console.log('✅ Clientes renderizados en la tabla');
}

// Función para limpiar búsqueda
function limpiarBusqueda() {
  console.log('🧹 limpiarBusqueda() llamada');
  const buscarInput = document.getElementById("buscar-cliente");
  if (buscarInput) {
    buscarInput.value = '';
  }
  cargarClientes();
}


// Hacer funciones disponibles globalmente para los botones del HTML
window.cargarClientes = cargarClientes;
window.limpiarBusqueda = limpiarBusqueda;

// Fallback: Cargar clientes si el panel ya está visible al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOMContentLoaded en clientes.js');
  
  // Configurar event listener para el input de búsqueda
  const buscarInput = document.getElementById("buscar-cliente");
  if (buscarInput) {
    buscarInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        cargarClientes();
      }
    });
  }
  
  // Fallback: Si el panel ya está visible y hay sesión, cargar clientes
  setTimeout(() => {
    const adminPanel = document.getElementById("adminPanel");
    const tbody = document.getElementById("tbody-clientes");
    
    console.log('🔍 Verificando panel:', {
      adminPanel: !!adminPanel,
      tbody: !!tbody,
      panelDisplay: adminPanel ? adminPanel.style.display : 'N/A',
      hasAuth: !!(window.auth && window.auth.getCurrentUser)
    });
    
    if (adminPanel && tbody) {
      // Verificar si el panel está visible (no es 'none')
      const isPanelVisible = adminPanel.style.display !== 'none' || 
                            window.getComputedStyle(adminPanel).display !== 'none';
      
      if (isPanelVisible) {
        if (window.auth && window.auth.getCurrentUser && window.auth.getCurrentRole) {
          const user = window.auth.getCurrentUser();
          const role = window.auth.getCurrentRole();
          if (user && role === 'administrador') {
            console.log('🔄 Fallback: Panel ya visible, cargando clientes...');
            cargarClientes();
          } else {
            console.log('⚠️ Usuario no es administrador:', { user, role });
          }
        } else {
          console.log('⚠️ window.auth no está disponible');
        }
      } else {
        console.log('⚠️ Panel no está visible aún');
      }
    } else {
      console.log('⚠️ Elementos no encontrados:', { adminPanel: !!adminPanel, tbody: !!tbody });
    }
  }, 1500);
});

// Función global para cargar datos cuando se muestra el panel (llamada por adminAuth.js)
// DEFINIDA AL FINAL para que todas las funciones estén disponibles
window.cargarDatosAdmin = function(admin) {
  console.log('📦 window.cargarDatosAdmin llamado para clientes', admin);
  console.log('📦 cargarClientes disponible:', typeof cargarClientes);
  
  // Verificar que el elemento exista
  const tbody = document.getElementById("tbody-clientes");
  if (!tbody) {
    console.error('❌ tbody-clientes no encontrado, esperando...');
    setTimeout(() => {
      if (window.cargarDatosAdmin) {
        console.log('🔄 Reintentando cargar clientes...');
        window.cargarDatosAdmin(admin);
      }
    }, 500);
    return;
  }
  
  // Verificar que la función esté disponible
  if (typeof cargarClientes !== 'function') {
    console.error('❌ cargarClientes no está definida');
    setTimeout(() => {
      if (typeof cargarClientes === 'function') {
        console.log('✅ cargarClientes ahora disponible, cargando...');
        cargarClientes();
      } else {
        console.error('❌ cargarClientes nunca se definió');
      }
    }, 500);
    return;
  }
  
  console.log('✅ Elemento tbody-clientes encontrado, cargando clientes...');
  
  // Esperar un poco para asegurar que el DOM esté listo
  setTimeout(() => {
    console.log('🚀 Ejecutando cargarClientes()...');
    try {
      cargarClientes();
    } catch (error) {
      console.error('❌ Error al ejecutar cargarClientes:', error);
    }
  }, 300);
};

console.log('✅ window.cargarDatosAdmin definida para clientes al final del archivo');
