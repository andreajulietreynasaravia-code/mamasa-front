// ========== VALIDACIÓN INICIAL DE CONFIGURACIÓN ==========
console.log('🔧 ========== INICIALIZANDO trabajadores.js ==========');

// Obtener la configuración de la API usando variables de entorno
const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
  ? window.config.API_CONFIG.usuarios 
  : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
    ? `${process.env.USUARIOS_SERVICE_URL}/api` 
    : "http://localhost:3000/api";
let apiBase = USUARIOS_SERVICE_URL;

// Función para inicializar API
function inicializarAPI() {
  if (typeof window !== 'undefined' && window.config && window.config.API_CONFIG) {
    const usuariosApi = window.config.API_CONFIG.usuarios;
    if (usuariosApi) {
      apiBase = usuariosApi;
      console.log('🔧 apiBase configurado desde config.js:', apiBase);
    }
  } else {
    console.log('🔧 apiBase usando valor por defecto:', apiBase);
  }
  console.log('🔧 URL completa GET trabajadores:', `${apiBase}/trabajadores`);
  console.log('🔧 URL completa POST trabajador:', `${apiBase}/trabajadores`);
}

// Inicializar cuando el script se carga
inicializarAPI();

// También intentar inicializar después de que config.js se cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarAPI);
} else {
  setTimeout(inicializarAPI, 100);
}

// Variable para almacenar turnos de trabajadores
let turnosTrabajadores = {};

// Validar que la URL sea correcta
if (!apiBase || apiBase === 'undefined') {
  console.error('❌ ERROR: apiBase no está definido correctamente');
}

// Hacer crearTrabajador disponible globalmente - se asignará después de definir la función

// Función para verificar si el servicio de usuarios está conectado (simplificada)
async function verificarConexionServicio() {
  console.log('🔍 Verificando conexión con servicio de usuarios...');
  const urlBase = apiBase.replace('/api', '') || 'http://localhost:3000';
  
  try {
    // Intentar hacer una petición simple al endpoint de trabajadores (más confiable que /health)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos
    
    const response = await fetch(`${apiBase}/trabajadores`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw err;
    });
    
    clearTimeout(timeoutId);
    
    // Si responde (incluso con error 500), el servicio está corriendo
    console.log('✅ Servicio de usuarios está conectado (respuesta:', response.status, ')');
    return { conectado: true, mensaje: 'Servicio conectado correctamente' };
    
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
        mensaje: 'No se puede conectar con el servicio de usuarios. Verifica que el servicio esté corriendo en http://localhost:3000' 
      };
    }
    
    return { 
      conectado: false, 
      mensaje: `Error de conexión: ${error.message}` 
    };
  }
}

    // Cerrar sesión
    async function cerrarSesionAdmin() {
      try {
        // Usar el sistema de autenticación unificado
        if (window.auth && window.auth.logout) {
          await window.auth.logout("/pages/admin/trabajadores.html");
        } else {
          // Fallback
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          localStorage.removeItem("admin");
          
          await fetch(apiBase + "/logout/admin", {
            method: "POST",
            credentials: "include"
          });
          
          window.location.href = "/pages/admin/trabajadores.html";
        }
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("admin");
        window.location.href = "/pages/admin/trabajadores.html";
      }
    }

// Crear trabajador - Función global
async function crearTrabajador(e) {
  console.log('🔧 ========== crearTrabajador() INICIADA ==========');
  
  // Asegurarse de que la API esté inicializada antes de hacer la petición
  inicializarAPI();
  
  if (e) {
    e.preventDefault();
    console.log('✅ Evento preventDefault ejecutado');
  }
  
  // Validar que apiBase esté definido
  if (!apiBase || apiBase === 'undefined' || apiBase.includes('undefined')) {
    console.error('❌ ERROR CRÍTICO: apiBase no está definido');
    const mensajeError = document.getElementById("mensajeError");
    if (mensajeError) {
      mensajeError.textContent = "❌ Error de configuración: URL del servicio no disponible";
      mensajeError.style.display = "block";
    }
    return;
  }
  
  // Obtener valores del formulario
  const nombreInput = document.getElementById("nombreTrabajador");
  const correoInput = document.getElementById("correoTrabajador");
  const contrasenaInput = document.getElementById("contrasenaTrabajador");
  const telefonoInput = document.getElementById("telefonoTrabajador");
  const direccionInput = document.getElementById("direccionTrabajador");
  
  if (!nombreInput || !correoInput || !contrasenaInput) {
    console.error('❌ ERROR: Campos del formulario no encontrados');
    const mensajeError = document.getElementById("mensajeError");
    if (mensajeError) {
      mensajeError.textContent = "❌ Error: Formulario no encontrado. Recarga la página.";
      mensajeError.style.display = "block";
    }
    return;
  }
  
  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();
  const contrasena = contrasenaInput.value;
  const telefono = telefonoInput ? telefonoInput.value.trim() : '';
  const direccion = direccionInput ? direccionInput.value.trim() : '';

  console.log('📝 Datos del formulario:', {
    nombre: nombre ? '✓' : '✗',
    correo: correo ? '✓' : '✗',
    contrasena: contrasena ? '✓' : '✗',
    telefono: telefono || '(opcional)',
    direccion: direccion || '(opcional)'
  });

  // Validar campos obligatorios
  if (!nombre || !correo || !contrasena) {
    console.error('❌ ERROR: Campos obligatorios faltantes');
    const mensajeError = document.getElementById("mensajeError");
    if (mensajeError) {
      mensajeError.textContent = "❌ Por favor completa todos los campos obligatorios (*)";
      mensajeError.style.display = "block";
    }
    return;
  }

  const mensajeExito = document.getElementById("mensajeExito");
  const mensajeError = document.getElementById("mensajeError");
  
  if (!mensajeExito || !mensajeError) {
    console.error('❌ ERROR: Elementos de mensaje no encontrados');
    alert('Error: No se encontraron los elementos de mensaje. Recarga la página.');
    return;
  }

  // Ocultar mensajes anteriores
  mensajeExito.style.display = "none";
  mensajeError.style.display = "none";
  
  // Mostrar mensaje de carga
  mensajeExito.textContent = "⏳ Creando trabajador...";
  mensajeExito.style.display = "block";

  const url = apiBase + "/trabajadores";
  const expectedUrl = "http://localhost:3000/api/trabajadores";
  const payload = {
    nombre,
    correo,
    contrasena,
    telefono: telefono || null,
    direccion: direccion || null
  };

  console.log('📡 ========== INICIANDO PETICIÓN POST ==========');
  console.log('📡 URL completa construida:', url);
  console.log('📡 URL esperada:', expectedUrl);
  console.log('📡 ¿URLs coinciden?', url === expectedUrl);
  console.log('📡 apiBase:', apiBase);
  console.log('📡 Payload:', { ...payload, contrasena: '***' });
  
  // Validar URL antes de hacer la petición
  if (!url || url.includes('undefined') || !url.startsWith('http')) {
    console.error('❌ ERROR: URL inválida:', url);
    const mensajeError = document.getElementById("mensajeError");
    if (mensajeError) {
      mensajeError.textContent = "❌ Error de configuración: URL inválida";
      mensajeError.style.display = "block";
    }
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      credentials: "include"
    });

    console.log('📦 ========== RESPUESTA RECIBIDA ==========');
    console.log('📦 Status:', res.status);
    console.log('📦 Status Text:', res.statusText);
    console.log('📦 OK:', res.ok);
    console.log('📦 Headers:', Object.fromEntries(res.headers.entries()));

    // Verificar CORS
    const corsHeader = res.headers.get('access-control-allow-origin');
    console.log('📦 CORS Header:', corsHeader);

    let data;
    try {
      const responseText = await res.text();
      console.log('📦 Response Text (raw):', responseText);
      data = JSON.parse(responseText);
      console.log('📦 Datos parseados:', data);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      mensajeExito.style.display = "none";
      mensajeError.textContent = "❌ Error: La respuesta del servidor no es válida";
      mensajeError.style.display = "block";
      return;
    }

    if (res.ok) {
      console.log('✅ Trabajador creado exitosamente');
      mensajeError.style.display = "none";
      mensajeExito.textContent = "✅ " + (data.message || "Trabajador creado exitosamente");
      mensajeExito.style.display = "block";
      
      // Limpiar formulario
      const form = document.getElementById("formCrearTrabajador");
      if (form) {
        form.reset();
        console.log('✅ Formulario limpiado');
      }
      
      // Recargar lista de trabajadores
      console.log('🔄 Recargando lista de trabajadores...');
      setTimeout(() => {
        if (typeof cargarTrabajadores === 'function') {
          cargarTrabajadores();
        } else {
          console.error('❌ cargarTrabajadores no está disponible');
        }
      }, 500);
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        if (mensajeExito) {
          mensajeExito.style.display = "none";
        }
      }, 5000);
    } else {
      console.error('❌ Error en la respuesta:', res.status, data);
      mensajeExito.style.display = "none";
      const errorMsg = data.error || data.message || "Error al crear trabajador";
      mensajeError.textContent = "❌ " + errorMsg;
      mensajeError.style.display = "block";
      
      // Mantener el mensaje de error visible
      setTimeout(() => {
        if (mensajeError) {
          mensajeError.style.display = "block";
        }
      }, 100);
    }
  } catch (err) {
    console.error("❌ ========== ERROR EN PETICIÓN ==========");
    console.error("❌ Error completo:", err);
    console.error("❌ Tipo:", err.name);
    console.error("❌ Mensaje:", err.message);
    console.error("❌ Stack:", err.stack);
    
    mensajeExito.style.display = "none";
    
    let errorMsg = "❌ Error al conectar con el servidor";
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      errorMsg = "❌ No se puede conectar con el servidor. Verifica que el servicio de usuarios esté corriendo en el puerto 3000.";
    } else if (err.message) {
      errorMsg = "❌ Error: " + err.message;
    }
    
    mensajeError.textContent = errorMsg;
    mensajeError.style.display = "block";
  }
}

// Hacer la función disponible globalmente INMEDIATAMENTE después de definirla
window.crearTrabajador = crearTrabajador;
console.log('✅ ========== crearTrabajador DEFINIDA Y ASIGNADA A WINDOW ==========');
console.log('✅ typeof crearTrabajador:', typeof crearTrabajador);
console.log('✅ typeof window.crearTrabajador:', typeof window.crearTrabajador);
console.log('✅ window.crearTrabajador === crearTrabajador:', window.crearTrabajador === crearTrabajador);

// Eliminar trabajador
async function eliminarTrabajador(id, nombre) {
      if (!confirm(`¿Estás seguro de que deseas eliminar al trabajador "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
      }

      const mensajeError = document.getElementById("mensajeError");
      const mensajeExito = document.getElementById("mensajeExito");

      try {
        console.log("🗑️ Eliminando trabajador ID:", id);
        const url = apiBase + `/trabajadores/${id}`;
        console.log("📡 URL:", url);

        const res = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        console.log("📥 Respuesta recibida, status:", res.status);
        console.log("📥 Content-Type:", res.headers.get("content-type"));

        let data = {};
        const contentType = res.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          try {
            data = await res.json();
            console.log("✅ JSON parseado correctamente:", data);
          } catch (parseErr) {
            console.error("❌ Error al parsear JSON:", parseErr);
            const text = await res.text();
            console.error("📄 Texto recibido:", text);
            data = { error: "Error al procesar la respuesta del servidor" };
          }
        } else {
          // Si no es JSON, intentar leer como texto
          const text = await res.text();
          console.log("📄 Respuesta texto (no JSON):", text);
          if (text) {
            try {
              data = JSON.parse(text);
            } catch (e) {
              // Si no es JSON válido, crear un objeto con el texto
              data = { 
                message: text || (res.ok ? "Trabajador eliminado exitosamente" : "Error desconocido"),
                error: !res.ok ? (text || "Error desconocido") : undefined
              };
            }
          } else {
            // Si no hay contenido, crear respuesta basada en el status
            data = res.ok 
              ? { message: "Trabajador eliminado exitosamente" }
              : { error: `Error ${res.status}: ${res.statusText}` };
          }
        }

        if (res.ok) {
          mensajeError.style.display = "none";
          mensajeExito.textContent = "✅ " + (data.message || "Trabajador eliminado exitosamente");
          mensajeExito.style.display = "block";
          
          // Recargar lista de trabajadores
          setTimeout(() => {
            cargarTrabajadores();
          }, 500);
          
          // Ocultar mensaje después de 3 segundos
          setTimeout(() => {
            mensajeExito.style.display = "none";
          }, 3000);
        } else {
          mensajeExito.style.display = "none";
          mensajeError.textContent = "❌ " + (data.error || `Error al eliminar trabajador (${res.status})`);
          mensajeError.style.display = "block";
          setTimeout(() => {
            mensajeError.style.display = "none";
          }, 5000);
        }
      } catch (err) {
        console.error("❌ Error completo:", err);
        console.error("❌ Stack:", err.stack);
        mensajeExito.style.display = "none";
        mensajeError.textContent = "❌ Error al conectar con el servidor: " + (err.message || "Error desconocido");
        mensajeError.style.display = "block";
        setTimeout(() => {
          mensajeError.style.display = "none";
        }, 5000);
      }
    }

    // Modal para designar turno
    function mostrarModalTurno(id, nombre) {
      const modal = document.getElementById('modalTurno');
      const modalNombre = document.getElementById('modalTrabajadorNombre');
      const modalId = document.getElementById('modalTrabajadorId');
      
      modalNombre.textContent = nombre;
      modalId.value = id;
      
      // Limpiar selección anterior
      document.querySelectorAll('.btn-turno-option').forEach(btn => {
        btn.classList.remove('selected');
      });
      
      modal.style.display = 'flex';
    }

    function cerrarModalTurno() {
      const modal = document.getElementById('modalTurno');
      modal.style.display = 'none';
    }

    // Almacenar turnos en memoria (no en base de datos)

    function guardarTurno() {
      const id = document.getElementById('modalTrabajadorId').value;
      const turnoSeleccionado = document.querySelector('.btn-turno-option.selected');
      
      if (!turnoSeleccionado) {
        alert('Por favor selecciona un turno');
        return;
      }

      const turno = turnoSeleccionado.getAttribute('data-turno');
      
      // Guardar turno en memoria (no en base de datos)
      turnosTrabajadores[id] = turno;
      
      // Actualizar la visualización inmediatamente
      actualizarTurnoEnUI(id, turno);
      
      // Cerrar modal
      cerrarModalTurno();
      
      // Mostrar mensaje de éxito
      const mensajeExito = document.getElementById("mensajeExito");
      mensajeExito.textContent = "✅ Turno asignado: " + turno;
      mensajeExito.style.display = "block";
      
      setTimeout(() => {
        mensajeExito.style.display = "none";
      }, 3000);
    }

    function actualizarTurnoEnUI(trabajadorId, turno) {
      const trabajadorCard = document.getElementById(`trabajador-${trabajadorId}`);
      if (!trabajadorCard) return;
      
      const nombreElement = trabajadorCard.querySelector('h3');
      if (!nombreElement) return;
      
      // Remover badge anterior si existe
      const badgeAnterior = nombreElement.querySelector('.turno-badge');
      if (badgeAnterior) {
        badgeAnterior.remove();
      }
      
      // Agregar nuevo badge
      if (turno) {
        const turnoBadge = document.createElement('span');
        turnoBadge.className = `turno-badge ${turno.toLowerCase()}`;
        turnoBadge.textContent = turno;
        nombreElement.appendChild(turnoBadge);
      }
    }

// Event listeners para opciones de turno
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-turno-option')) {
    document.querySelectorAll('.btn-turno-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    e.target.classList.add('selected');
  }
});

// Cargar lista de trabajadores
async function cargarTrabajadores() {
      console.log('🔍 ========== cargarTrabajadores() INICIADA ==========');
      
      // Asegurarse de que la API esté inicializada antes de hacer la petición
      inicializarAPI();
      
      const listaContainer = document.getElementById("listaTrabajadores");
      
      if (!listaContainer) {
        console.error('❌ ERROR: No se encontró el elemento listaTrabajadores');
        console.error('❌ El elemento con id="listaTrabajadores" no existe en el DOM');
        return;
      }
      
      console.log('✅ Elemento listaTrabajadores encontrado');
      
      // Validar que apiBase esté definido
      if (!apiBase || apiBase === 'undefined' || apiBase.includes('undefined')) {
        console.error('❌ ERROR CRÍTICO: apiBase no está definido correctamente');
        console.error('❌ apiBase actual:', apiBase);
        console.error('❌ API_CONFIG:', API_CONFIG);
        console.error('❌ window.config:', window.config);
        listaContainer.innerHTML = `
          <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
            <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error de Configuración</h3>
            <p style='margin: 0.5rem 0;'><strong>La URL del servicio no está configurada correctamente</strong></p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Verifica que config.js se haya cargado antes de trabajadores.js</p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>apiBase: ${apiBase}</p>
            <p style='margin: 0.5rem 0; font-size: 0.9rem;'>API_CONFIG.usuarios: ${API_CONFIG.usuarios}</p>
          </div>
        `;
        return;
      }
      
      // Mostrar mensaje de carga
      listaContainer.innerHTML = "<p style='color: #666; padding: 2rem; text-align: center;'>Cargando trabajadores...</p>";
      
      // Construir URL: servicio-usuarios corre en puerto 3000, endpoint es /api/trabajadores
      // El endpoint está definido en: servicio-usuarios/index.js línea 53: app.get("/api/trabajadores", listarTrabajadores)
      const url = apiBase + "/trabajadores";
      const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
        ? window.config.API_CONFIG.usuarios 
        : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
          ? `${process.env.USUARIOS_SERVICE_URL}/api` 
          : "http://localhost:3000/api";
      const urlEsperada = `${USUARIOS_SERVICE_URL}/trabajadores`;
      
      console.log('📡 ========== INICIANDO PETICIÓN GET ==========');
      console.log('📡 URL completa construida:', url);
      console.log('📡 URL esperada:', urlEsperada);
      console.log('📡 ¿URLs coinciden?', url === urlEsperada);
      console.log('📡 apiBase:', apiBase);
      console.log('📡 API_CONFIG:', API_CONFIG);
      console.log('📡 API_CONFIG.usuarios:', API_CONFIG.usuarios);
      console.log('📡 window.config:', window.config);
      console.log('📡 Servicio: servicio-usuarios');
      console.log('📡 Puerto: 3000');
      console.log('📡 Endpoint: GET /api/trabajadores');
      console.log('📡 Verificar manualmente en navegador:', urlEsperada);
      
      // Validar URL antes de hacer la petición
      if (!url || url.includes('undefined') || !url.startsWith('http')) {
        console.error('❌ ERROR: URL inválida:', url);
        listaContainer.innerHTML = `
          <div style='color: #dc3545; padding: 2rem; text-align: center;'>
            <p><strong>Error: URL inválida</strong></p>
            <p>${url}</p>
            <p style='font-size: 0.9rem; margin-top: 1rem;'>Verifica la configuración en config.js</p>
          </div>
        `;
        return;
      }
      
      try {
        console.log('🚀 Ejecutando fetch...');
        console.log('🚀 Método: GET');
        console.log('🚀 Headers: Content-Type: application/json');
        console.log('🚀 Credentials: include');
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: "include"
        });
        
        console.log('📦 ========== RESPUESTA RECIBIDA ==========');
        console.log('📦 Status:', res.status);
        console.log('📦 Status Text:', res.statusText);
        console.log('📦 OK:', res.ok);
        console.log('📦 Headers:', Object.fromEntries(res.headers.entries()));
        
        // Verificar CORS
        const corsHeader = res.headers.get('access-control-allow-origin');
        const contentType = res.headers.get('content-type');
        console.log('📦 CORS Header:', corsHeader);
        console.log('📦 Content-Type:', contentType);
        
        // Verificar si la respuesta es HTML en lugar de JSON
        if (contentType && contentType.includes('text/html')) {
          console.error('❌ ERROR: El servidor está devolviendo HTML en lugar de JSON');
          const htmlResponse = await res.text();
          console.error('❌ Respuesta HTML (primeros 500 caracteres):', htmlResponse.substring(0, 500));
          listaContainer.innerHTML = `
            <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
              <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error: Respuesta HTML en lugar de JSON</h3>
              <p style='margin: 0.5rem 0;'><strong>El servidor está devolviendo HTML en lugar de JSON</strong></p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Esto puede deberse a:</p>
              <ul style='text-align: left; display: inline-block; margin: 1rem 0;'>
                <li>La ruta no existe y el servidor devuelve una página de error HTML</li>
                <li>El endpoint está mal configurado</li>
                <li>El servidor está redirigiendo a otra página</li>
              </ul>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${url}</p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>Status:</strong> ${res.status}</p>
            </div>
          `;
          return;
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ ========== ERROR EN RESPUESTA ==========');
          console.error('❌ Status:', res.status);
          console.error('❌ Status Text:', res.statusText);
          console.error('❌ Error Text:', errorText);
          console.error('❌ Content-Type:', contentType);
          
          // Verificar si el error es HTML
          if (errorText.trim().startsWith('<')) {
            console.error('❌ El error es HTML, no JSON');
            listaContainer.innerHTML = `
              <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
                <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error: El servidor devolvió HTML</h3>
                <p style='margin: 0.5rem 0;'><strong>Status ${res.status}: ${res.statusText}</strong></p>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'>El endpoint puede no existir o estar mal configurado</p>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${url}</p>
              </div>
            `;
            return;
          }
          
          let mensajeError = '';
          if (res.status === 0) {
            mensajeError = `
              <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
                <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error de Conexión (CORS o Servicio)</h3>
                <p style='margin: 0.5rem 0;'><strong>No se pudo conectar con el servicio</strong></p>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Esto puede deberse a:</p>
                <ul style='text-align: left; display: inline-block; margin: 1rem 0;'>
                  <li>El servicio no está corriendo en el puerto 3000</li>
                  <li>Problema de CORS (verifica que http://localhost:5000 esté en la lista de origins permitidos)</li>
                  <li>El puerto es incorrecto</li>
                </ul>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${url}</p>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>Verifica:</strong> Abre http://localhost:3000/api/trabajadores en tu navegador para ver si el servicio responde</p>
              </div>
            `;
          } else {
            mensajeError = `
              <div style='color: #dc3545; padding: 2rem; text-align: center;'>
                <p><strong>Error al cargar trabajadores: ${res.status} ${res.statusText}</strong></p>
                <p style='font-size: 0.9rem; margin-top: 0.5rem;'>${errorText}</p>
                <p style='font-size: 0.9rem; margin-top: 1rem;'><strong>URL intentada:</strong> ${url}</p>
              </div>
            `;
          }
          
          listaContainer.innerHTML = mensajeError;
          return;
        }
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ ========== ERROR EN RESPUESTA ==========');
          console.error('❌ Status:', res.status);
          console.error('❌ Status Text:', res.statusText);
          console.error('❌ Error Text:', errorText);
          
          let mensajeError = '';
          if (res.status === 0) {
            mensajeError = `
              <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
                <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Error de Conexión (CORS o Servicio)</h3>
                <p style='margin: 0.5rem 0;'><strong>No se pudo conectar con el servicio</strong></p>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'>Esto puede deberse a:</p>
                <ul style='text-align: left; display: inline-block; margin: 1rem 0;'>
                  <li>El servicio no está corriendo</li>
                  <li>Problema de CORS (verifica que http://localhost:5000 esté en la lista de origins permitidos)</li>
                  <li>El puerto es incorrecto</li>
                </ul>
                <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${url}</p>
              </div>
            `;
          } else {
            mensajeError = `<p style='color: #dc3545; padding: 2rem; text-align: center;'>Error al cargar trabajadores: ${res.status} ${res.statusText}<br><small>${errorText}</small></p>`;
          }
          
          listaContainer.innerHTML = mensajeError;
          return;
        }
        
        console.log('📊 ========== PROCESANDO RESPUESTA ==========');
        let data;
        try {
          const responseText = await res.text();
          console.log('📊 Response Text (raw):', responseText);
          data = JSON.parse(responseText);
          console.log('📊 Datos parseados:', data);
        } catch (parseError) {
          console.error('❌ Error parseando JSON:', parseError);
          listaContainer.innerHTML = `
            <div style='color: #dc3545; padding: 2rem; text-align: center;'>
              <p><strong>Error: La respuesta no es JSON válido</strong></p>
              <p>${parseError.message}</p>
            </div>
          `;
          return;
        }
        
        console.log('📊 Estructura de datos:', Object.keys(data));
        console.log('📊 Tipo de data.trabajadores:', typeof data.trabajadores);
        console.log('📊 Es array?:', Array.isArray(data.trabajadores));
        
        if (data.trabajadores) {
          if (!Array.isArray(data.trabajadores)) {
            console.error('❌ ERROR: data.trabajadores no es un array');
            console.error('❌ Tipo:', typeof data.trabajadores);
            console.error('❌ Valor:', data.trabajadores);
            listaContainer.innerHTML = `
              <div style='color: #dc3545; padding: 2rem; text-align: center;'>
                <p><strong>Error: Formato de respuesta incorrecto</strong></p>
                <p>data.trabajadores no es un array</p>
              </div>
            `;
            return;
          }
          
          console.log('✅ Trabajadores encontrados:', data.trabajadores.length);
          console.log('✅ Primer trabajador (ejemplo):', data.trabajadores[0]);
          
          if (data.trabajadores.length === 0) {
            listaContainer.innerHTML = "<p style='color: #666; padding: 2rem; text-align: center;'>No hay trabajadores registrados aún.</p>";
            return;
          }
          
          // Renderizar trabajadores con turno desde la base de datos
          listaContainer.innerHTML = data.trabajadores.map(trabajador => {
            const nombreEscapado = (trabajador.nombre || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            // Obtener turno desde la base de datos (trabajador.turno)
            const turno = trabajador.turno || null;
            const turnoBadge = turno 
              ? `<span class="turno-badge ${turno.toLowerCase().replace(/\s+/g, '-')}">${turno}</span>`
              : '';
            
            console.log(`📋 Trabajador: ${trabajador.nombre}, Turno: ${turno}`);
            
            return `
              <div class="trabajador-card" id="trabajador-${trabajador.id}">
                <div class="trabajador-info-container">
                  <h3>${trabajador.nombre || 'Sin nombre'}${turnoBadge}</h3>
                  <div class="trabajador-info">📧 ${trabajador.correo || 'N/A'}</div>
                  ${trabajador.telefono ? `<div class="trabajador-info">📞 ${trabajador.telefono}</div>` : ''}
                  ${trabajador.direccion ? `<div class="trabajador-info">📍 ${trabajador.direccion}</div>` : ''}
                </div>
                <div class="trabajador-acciones">
                  <button class="btn-eliminar-trabajador" data-id="${trabajador.id}" data-nombre="${nombreEscapado}">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            `;
          }).join('');
          
          console.log('✅ Trabajadores renderizados en el DOM');
          
          // Llenar el select de trabajadores para horarios con los trabajadores recién cargados
          setTimeout(() => {
            console.log('🔄 Llenando select de trabajadores después de cargar lista...');
            llenarSelectTrabajadores();
            
            // Verificar que el select se llenó correctamente
            const select = document.getElementById("selectTrabajadorHorario");
            if (select && select.options.length > 1) {
              console.log(`✅ Select llenado correctamente con ${select.options.length - 1} trabajadores`);
            } else {
              console.warn('⚠️ El select no se llenó correctamente, reintentando...');
              setTimeout(() => llenarSelectTrabajadores(), 500);
            }
          }, 150);
          
          // Agregar event listeners a los botones de eliminar
          setTimeout(() => {
            document.querySelectorAll('.btn-eliminar-trabajador').forEach(btn => {
              btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const nombre = this.getAttribute('data-nombre');
                eliminarTrabajador(id, nombre);
              });
            });
          }, 100);
        } else {
          console.error('❌ No se encontró la propiedad trabajadores en la respuesta');
          console.error('❌ Estructura de datos recibida:', Object.keys(data));
          listaContainer.innerHTML = "<p style='color: #dc3545; padding: 2rem; text-align: center;'>Error: Formato de respuesta incorrecto.<br><small>La respuesta no contiene 'trabajadores'</small></p>";
        }
      } catch (err) {
        console.error("❌ ========== ERROR EN CATCH ==========");
        console.error("❌ Error completo:", err);
        console.error("❌ Tipo de error:", err.name);
        console.error("❌ Mensaje:", err.message);
        console.error("❌ Stack:", err.stack);
        
        // Verificar si es un error de conexión
        let mensajeError = '';
        let esErrorConexion = false;
        
        if (err.message.includes('Failed to fetch') || 
            err.message.includes('NetworkError') || 
            err.message.includes('Network request failed') ||
            err.message.includes('ERR_CONNECTION_REFUSED') ||
            err.message.includes('ERR_INTERNET_DISCONNECTED') ||
            err.name === 'TypeError' ||
            err.name === 'NetworkError') {
          esErrorConexion = true;
          console.error('❌ Es un error de conexión/red');
          mensajeError = `
            <div style='color: #dc3545; padding: 2rem; text-align: center; background: #fff5f5; border: 2px solid #dc3545; border-radius: 8px;'>
              <h3 style='margin: 0 0 1rem 0; color: #dc3545;'>❌ Servicio No Conectado</h3>
              <p style='margin: 0.5rem 0;'><strong>No se puede conectar con el servicio de usuarios</strong></p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'>El servicio de usuarios no está disponible o no está corriendo.</p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>URL intentada:</strong> ${url}</p>
              <p style='margin: 0.5rem 0; font-size: 0.9rem;'><strong>Error:</strong> ${err.message}</p>
              <p style='margin: 1rem 0 0 0; font-size: 0.85rem; color: #666;'>
                <strong>Soluciones:</strong><br>
                1. Verifica que el servicio de usuarios esté corriendo en el puerto 3000<br>
                2. Abre una terminal y ejecuta: <code style='background: #f0f0f0; padding: 2px 6px; border-radius: 4px;'>npm start</code> en la carpeta servicio-usuarios<br>
                3. Verifica que puedas acceder a http://localhost:3000/api/trabajadores en tu navegador<br>
                4. Revisa la consola del navegador (F12) para más detalles
              </p>
            </div>
          `;
        } else {
          console.error('❌ Es un error diferente a conexión');
          mensajeError = `
            <div style='color: #dc3545; padding: 2rem; text-align: center;'>
              <p><strong>Error al cargar trabajadores:</strong></p>
              <p style='font-weight: bold;'>${err.name}: ${err.message}</p>
              <p style='font-size: 0.9rem; margin-top: 1rem;'><strong>URL intentada:</strong> ${url}</p>
              <p style='font-size: 0.9rem; margin-top: 0.5rem;'><small>Verifica que el servicio de usuarios esté corriendo en el puerto 3000</small></p>
              ${err.stack ? `<details style='margin-top: 1rem; text-align: left;'><summary style='cursor: pointer;'>Ver detalles técnicos</summary><pre style='font-size: 0.75rem; overflow: auto;'>${err.stack}</pre></details>` : ''}
            </div>
          `;
        }
        
        if (listaContainer) {
          listaContainer.innerHTML = mensajeError;
        } else {
          console.error('❌ listaContainer no está disponible para mostrar el error');
        }
      }
    }

// Configurar event listeners cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log('📄 ========== DOMContentLoaded en trabajadores.js ==========');
  console.log('📄 crearTrabajador disponible (scope global):', typeof crearTrabajador);
  console.log('📄 window.crearTrabajador disponible:', typeof window.crearTrabajador);
  
  // Asegurarse de que la función esté disponible globalmente
  if (typeof crearTrabajador === 'function' && (!window.crearTrabajador || window.crearTrabajador !== crearTrabajador)) {
    window.crearTrabajador = crearTrabajador;
    console.log('✅ crearTrabajador asignada a window.crearTrabajador desde DOMContentLoaded');
  }
  
  // Configurar event listeners
  const logoutBtn = document.getElementById("logoutAdminBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", cerrarSesionAdmin);
  }

  const formCrearTrabajador = document.getElementById("formCrearTrabajador");
  if (formCrearTrabajador) {
    console.log('✅ Formulario formCrearTrabajador encontrado, registrando event listener');
    console.log('✅ crearTrabajador disponible:', typeof crearTrabajador);
    console.log('✅ window.crearTrabajador disponible:', typeof window.crearTrabajador);
    console.log('✅ apiBase:', apiBase);
    
    // Función helper para obtener la función crearTrabajador
    const obtenerCrearTrabajador = () => {
      // Intentar obtener desde el scope local primero
      if (typeof crearTrabajador === 'function') {
        console.log('📝 Usando crearTrabajador del scope global');
        return crearTrabajador;
      }
      // Si no está disponible, intentar desde window
      if (typeof window.crearTrabajador === 'function') {
        console.log('📝 Usando window.crearTrabajador');
        return window.crearTrabajador;
      }
      console.error('❌ crearTrabajador no está disponible en ningún scope');
      console.error('❌ typeof crearTrabajador:', typeof crearTrabajador);
      console.error('❌ typeof window.crearTrabajador:', typeof window.crearTrabajador);
      return null;
    };
    
    // Registrar el event listener con preventDefault explícito
    formCrearTrabajador.addEventListener("submit", function(e) {
          console.log('📝 ========== EVENTO SUBMIT CAPTURADO ==========');
          console.log('📝 Formulario:', formCrearTrabajador);
          console.log('📝 Evento:', e);
          
          // Prevenir el comportamiento por defecto
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          console.log('📝 preventDefault ejecutado');
          
          // Obtener la función - usar window.crearTrabajador directamente
          let funcionCrearTrabajador = null;
          
          // Intentar desde window primero (más confiable)
          if (typeof window.crearTrabajador === 'function') {
            funcionCrearTrabajador = window.crearTrabajador;
            console.log('📝 Usando window.crearTrabajador');
          } else if (typeof crearTrabajador === 'function') {
            funcionCrearTrabajador = crearTrabajador;
            // Asegurarse de que esté en window también
            window.crearTrabajador = crearTrabajador;
            console.log('📝 Usando crearTrabajador del scope local y asignando a window');
          } else {
            console.error('❌ crearTrabajador no está disponible');
            console.error('❌ typeof crearTrabajador:', typeof crearTrabajador);
            console.error('❌ typeof window.crearTrabajador:', typeof window.crearTrabajador);
            console.error('❌ Intentando cargar desde window global...');
            
            // Último intento: buscar en el objeto global
            if (typeof globalThis !== 'undefined' && typeof globalThis.crearTrabajador === 'function') {
              funcionCrearTrabajador = globalThis.crearTrabajador;
              window.crearTrabajador = globalThis.crearTrabajador;
              console.log('📝 Usando globalThis.crearTrabajador');
            }
          }
          
          // Verificar que la función esté disponible
          if (funcionCrearTrabajador && typeof funcionCrearTrabajador === 'function') {
            console.log('📝 Llamando a crearTrabajador...');
            funcionCrearTrabajador(e).catch(err => {
              console.error('❌ Error en crearTrabajador:', err);
              const mensajeError = document.getElementById("mensajeError");
              if (mensajeError) {
                mensajeError.textContent = "❌ Error: " + err.message;
                mensajeError.style.display = "block";
              }
            });
          } else {
            console.error('❌ crearTrabajador no es una función después de todos los intentos');
            console.error('❌ Tipo de crearTrabajador:', typeof crearTrabajador);
            console.error('❌ Tipo de window.crearTrabajador:', typeof window.crearTrabajador);
            console.error('❌ Revisa la consola para ver dónde está definida la función');
            alert('Error: La función crearTrabajador no está disponible. Recarga la página. Si el problema persiste, revisa la consola del navegador (F12).');
          }
          
          return false;
        }, false); // Usar capture phase para asegurar que se ejecute primero
        
        console.log('✅ Event listener registrado para crearTrabajador');
        
        // También registrar en el botón como fallback
        const submitButton = formCrearTrabajador.querySelector('button[type="submit"]');
        if (submitButton) {
          console.log('✅ Botón submit encontrado, agregando fallback');
          submitButton.addEventListener("click", function(e) {
            console.log('📝 Click en botón submit (fallback)');
            // El submit del form ya manejará el evento
          });
        }
      } else {
        console.error('❌ ERROR: No se encontró el formulario formCrearTrabajador');
        console.error('❌ El formulario con id="formCrearTrabajador" no existe en el DOM');
        console.error('❌ Verifica que el HTML tenga el formulario con id="formCrearTrabajador"');
      }

      // Event listeners para gestión de horarios
      const selectTrabajadorHorario = document.getElementById("selectTrabajadorHorario");
      if (selectTrabajadorHorario) {
        selectTrabajadorHorario.addEventListener("change", function() {
          const trabajadorId = this.value;
          if (trabajadorId) {
            document.getElementById("btnCrearHorario").style.display = "block";
            document.getElementById("tablaHorarios").style.display = "block";
            cargarHorariosTrabajador(trabajadorId);
          } else {
            document.getElementById("btnCrearHorario").style.display = "none";
            document.getElementById("tablaHorarios").style.display = "none";
            document.getElementById("tbodyHorarios").innerHTML = "";
          }
        });
      }

      const btnCrearHorario = document.getElementById("btnCrearHorario");
      if (btnCrearHorario) {
        btnCrearHorario.addEventListener("click", abrirModalCrearHorario);
      }

      const formHorario = document.getElementById("formHorario");
      if (formHorario) {
        formHorario.addEventListener("submit", guardarHorario);
      }

  // Fallback agresivo: Intentar cargar trabajadores después de un delay
  setTimeout(() => {
    const adminPanel = document.getElementById("adminPanel");
    const listaContainer = document.getElementById("listaTrabajadores");
    
    console.log('🔄 Fallback: Verificando si necesitamos cargar trabajadores...');
    console.log('   - adminPanel existe:', !!adminPanel);
    console.log('   - listaContainer existe:', !!listaContainer);
    console.log('   - window.cargarDatosAdmin existe:', typeof window.cargarDatosAdmin);
    console.log('   - cargarTrabajadores existe:', typeof cargarTrabajadores);
    
    if (adminPanel && listaContainer) {
      const isPanelVisible = adminPanel.style.display !== 'none' || 
                            window.getComputedStyle(adminPanel).display !== 'none';
      
      console.log('   - Panel visible:', isPanelVisible);
      
      if (isPanelVisible) {
        // Verificar si ya hay contenido cargado
        const contenidoActual = listaContainer.innerHTML.trim();
        const estaCargando = contenidoActual.includes('Cargando') || contenidoActual === '';
        
        console.log('   - Contenido actual:', contenidoActual.substring(0, 50));
        console.log('   - Está cargando:', estaCargando);
        
        if (estaCargando && typeof cargarTrabajadores === 'function') {
          console.log('🔄 Fallback: Ejecutando cargarTrabajadores()...');
          cargarTrabajadores();
          
          if (typeof cargarTrabajadoresParaHorarios === 'function') {
            cargarTrabajadoresParaHorarios();
          }
        }
      }
    }
  }, 2500);

  // Fallback: Si el panel ya está visible y hay sesión, cargar trabajadores
  setTimeout(() => {
    const adminPanel = document.getElementById("adminPanel");
    const listaContainer = document.getElementById("listaTrabajadores");
    
    if (adminPanel && listaContainer && adminPanel.style.display !== 'none') {
      if (window.auth && window.auth.getCurrentUser && window.auth.getCurrentRole) {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        if (user && role === 'administrador') {
          console.log('🔄 Fallback: Panel ya visible, cargando trabajadores...');
          cargarTrabajadores();
          cargarTrabajadoresParaHorarios();
        }
      }
    }
  }, 1500);
});

// ========== FUNCIONES DE GESTIÓN DE HORARIOS ==========

    // Cargar trabajadores en el select de horarios
    async function cargarTrabajadoresParaHorarios() {
      console.log('🔍 cargarTrabajadoresParaHorarios() llamada');
      
      // Asegurarse de que la API esté inicializada antes de hacer la petición
      inicializarAPI();
      
      const select = document.getElementById("selectTrabajadorHorario");
      if (!select) {
        console.error('❌ No se encontró el elemento selectTrabajadorHorario');
        return;
      }

      try {
        const url = apiBase + "/trabajadores";
        console.log('📡 Cargando trabajadores para horarios desde:', url);
        
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: "include"
        });
        
        console.log('📦 Respuesta recibida (horarios):', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Error al cargar trabajadores para horarios:', res.status, errorText);
          select.innerHTML = '<option value="">Error al cargar trabajadores</option>';
          return;
        }
        
        const data = await res.json();
        console.log('📊 Datos recibidos (horarios):', data);
        
        if (data.trabajadores && Array.isArray(data.trabajadores)) {
          console.log('✅ Trabajadores encontrados para horarios:', data.trabajadores.length);
          select.innerHTML = '<option value="">-- Seleccione un trabajador --</option>';
          
          data.trabajadores.forEach(trabajador => {
            const option = document.createElement("option");
            option.value = trabajador.id;
            option.textContent = trabajador.nombre || `Trabajador ${trabajador.id}`;
            select.appendChild(option);
          });
          
          console.log('✅ Trabajadores agregados al select de horarios');
        } else {
          console.error('❌ No se encontró la propiedad trabajadores o no es un array');
          select.innerHTML = '<option value="">No hay trabajadores disponibles</option>';
        }
      } catch (err) {
        console.error("❌ Error completo al cargar trabajadores para horarios:", err);
        console.error("❌ Stack:", err.stack);
        if (select) {
          select.innerHTML = '<option value="">Error al cargar trabajadores</option>';
        }
      }
    }

    // Cargar horarios de un trabajador
    async function cargarHorariosTrabajador(trabajadorId) {
      const tbody = document.getElementById("tbodyHorarios");
      const mensaje = document.getElementById("mensajeHorarios");
      
      if (!tbody) return;

      try {
        const res = await fetch(apiBase + `/horarios?trabajador_id=${trabajadorId}`, {
          credentials: "include"
        });

        const data = await res.json();

        if (res.ok && data.horarios) {
          if (data.horarios.length === 0) {
            tbody.innerHTML = `
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                  No hay horarios registrados para este trabajador.
                </td>
              </tr>
            `;
            mensaje.innerHTML = "";
            return;
          }

          tbody.innerHTML = data.horarios.map(horario => `
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 12px;">
                <span class="turno-badge ${horario.turno ? horario.turno.toLowerCase() : ''}">${horario.turno || 'N/A'}</span>
              </td>
              <td style="padding: 12px;">${horario.hora_inicio || 'N/A'}</td>
              <td style="padding: 12px;">${horario.hora_fin || 'N/A'}</td>
              <td style="padding: 12px;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ${horario.activo ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                  ${horario.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </td>
              <td style="padding: 12px;">
                <button onclick="editarHorario(${horario.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  ✏️ Editar
                </button>
                <button class="btn-eliminar-trabajador" onclick="eliminarHorario(${horario.id})" style="padding: 5px 10px; font-size: 12px;">
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          `).join('');
          mensaje.innerHTML = "";
        } else {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px; color: #dc3545;">
                Error al cargar horarios: ${data.error || "Error desconocido"}
              </td>
            </tr>
          `;
        }
      } catch (err) {
        console.error("Error al cargar horarios:", err);
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 20px; color: #dc3545;">
              Error al conectar con el servidor: ${err.message}
            </td>
          </tr>
        `;
      }
    }

    // Función para llenar el select de trabajadores desde la lista ya cargada
    function llenarSelectTrabajadores() {
      console.log('🔍 ========== llenarSelectTrabajadores() INICIADA ==========');
      const select = document.getElementById("selectTrabajadorHorario");
      const listaContainer = document.getElementById("listaTrabajadores");
      
      if (!select) {
        console.error('❌ No se encontró el elemento selectTrabajadorHorario');
        return;
      }
      
      if (!listaContainer) {
        console.error('❌ No se encontró el elemento listaTrabajadores');
        return;
      }
      
      // Obtener todos los trabajadores de las cards renderizadas
      const trabajadorCards = listaContainer.querySelectorAll('.trabajador-card');
      console.log('📋 Trabajadores encontrados en la lista:', trabajadorCards.length);
      
      if (trabajadorCards.length === 0) {
        console.warn('⚠️ No hay trabajadores en la lista, verificando si hay trabajadores cargados...');
        
        // Verificar si hay un mensaje de "Cargando" o "No hay trabajadores"
        const contenido = listaContainer.innerHTML.trim();
        if (contenido.includes('Cargando') || contenido.includes('No hay trabajadores')) {
          console.warn('⚠️ Los trabajadores aún se están cargando o no hay trabajadores');
          // Limpiar el select y mostrar mensaje
          select.innerHTML = '<option value="">-- Cargando trabajadores... --</option>';
          return;
        }
        
        // Si no hay trabajadores, intentar cargar desde la API
        console.log('🔄 Intentando cargar trabajadores desde API...');
        cargarTrabajadoresParaHorarios();
        return;
      }
      
      // Limpiar el select
      select.innerHTML = '<option value="">-- Seleccione un trabajador --</option>';
      
      let trabajadoresAgregados = 0;
      
      // Agregar cada trabajador al select
      trabajadorCards.forEach(card => {
        const trabajadorId = card.id.replace('trabajador-', '');
        const nombreElement = card.querySelector('h3');
        if (nombreElement && trabajadorId) {
          // Obtener el nombre sin el badge de turno
          let nombre = nombreElement.textContent.trim();
          // Remover el badge de turno si existe
          const turnoBadge = nombreElement.querySelector('.turno-badge');
          if (turnoBadge) {
            nombre = nombre.replace(turnoBadge.textContent, '').trim();
          }
          
          // Asegurarse de que el nombre no esté vacío
          if (nombre && nombre !== 'Sin nombre') {
            const option = document.createElement("option");
            option.value = trabajadorId;
            option.textContent = nombre;
            select.appendChild(option);
            trabajadoresAgregados++;
            console.log(`✅ Trabajador agregado al select: ${nombre} (ID: ${trabajadorId})`);
          }
        }
      });
      
      if (trabajadoresAgregados === 0) {
        console.warn('⚠️ No se pudieron agregar trabajadores al select');
        select.innerHTML = '<option value="">-- No hay trabajadores disponibles --</option>';
      } else {
        console.log(`✅ Select de trabajadores llenado correctamente con ${trabajadoresAgregados} trabajadores`);
      }
    }

    // Abrir modal para crear horario
    function abrirModalCrearHorario() {
      console.log('🔍 abrirModalCrearHorario() llamada');
      
      const selectTrabajador = document.getElementById("selectTrabajadorHorario");
      
      if (!selectTrabajador) {
        console.error('❌ No se encontró el elemento selectTrabajadorHorario');
        alert("Error: No se encontró el selector de trabajadores.");
        return;
      }
      
      // Guardar el valor seleccionado antes de llenar el select (por si se resetea)
      const trabajadorIdSeleccionado = selectTrabajador.value || '';
      console.log('📋 Trabajador seleccionado antes de llenar select:', trabajadorIdSeleccionado);
      
      // Verificar si el select tiene opciones
      if (selectTrabajador.options.length <= 1) {
        console.warn('⚠️ El select no tiene trabajadores cargados, intentando llenar...');
        // Solo llenar si no tiene opciones
        llenarSelectTrabajadores();
        // Esperar un momento para que se llene
        setTimeout(() => {
          if (selectTrabajador.options.length <= 1) {
            alert("⚠️ No hay trabajadores disponibles. Por favor, asegúrate de que los trabajadores se hayan cargado correctamente.");
            return;
          }
          // Si había una selección previa, restaurarla
          if (trabajadorIdSeleccionado) {
            selectTrabajador.value = trabajadorIdSeleccionado;
            console.log('✅ Valor restaurado después de llenar select:', trabajadorIdSeleccionado);
          }
        }, 200);
        return;
      }
      
      // Si el select ya tiene opciones, verificar si hay un valor seleccionado
      const trabajadorId = selectTrabajador.value || trabajadorIdSeleccionado || '';
      console.log('📋 Trabajador ID obtenido:', trabajadorId);
      console.log('📋 Opciones en el select:', selectTrabajador.options.length);
      console.log('📋 selectedIndex:', selectTrabajador.selectedIndex);
      
      if (!trabajadorId || trabajadorId === '') {
        console.warn('⚠️ No hay trabajador seleccionado');
        alert("⚠️ Por favor, seleccione un trabajador del menú desplegable antes de crear un horario.");
        // Enfocar el select para que el usuario lo vea
        selectTrabajador.focus();
        return;
      }

      // Obtener el nombre del trabajador seleccionado
      let trabajadorNombre = '';
      const selectedOption = selectTrabajador.options[selectTrabajador.selectedIndex];
      if (selectedOption && selectedOption.value === trabajadorId) {
        trabajadorNombre = selectedOption.text;
      } else {
        // Si no coincide el índice, buscar por valor
        for (let i = 0; i < selectTrabajador.options.length; i++) {
          if (selectTrabajador.options[i].value === trabajadorId) {
            trabajadorNombre = selectTrabajador.options[i].text;
            break;
          }
        }
      }
      
      if (!trabajadorNombre) {
        console.error('❌ No se pudo obtener el nombre del trabajador con ID:', trabajadorId);
        console.error('❌ Opciones disponibles:', Array.from(selectTrabajador.options).map(opt => ({ value: opt.value, text: opt.text })));
        alert("Error: No se pudo obtener la información del trabajador seleccionado. Por favor, seleccione un trabajador nuevamente.");
        return;
      }
      
      console.log('✅ Trabajador seleccionado:', trabajadorNombre, 'ID:', trabajadorId);

      // Limpiar y configurar el formulario con validación de elementos
      const horarioIdEl = document.getElementById("horarioId");
      const horarioTrabajadorIdEl = document.getElementById("horarioTrabajadorId");
      const horarioTrabajadorNombreEl = document.getElementById("horarioTrabajadorNombre");
      const horarioTurnoEl = document.getElementById("horarioTurno");
      const horarioHoraInicioEl = document.getElementById("horarioHoraInicio");
      const horarioHoraFinEl = document.getElementById("horarioHoraFin");
      const horarioActivoEl = document.getElementById("horarioActivo");
      const modalHorarioTituloEl = document.getElementById("modalHorarioTitulo");
      const mensajeErrorHorarioEl = document.getElementById("mensajeErrorHorario");
      const modalHorarioEl = document.getElementById("modalHorario");
      
      if (!modalHorarioEl) {
        console.error('❌ No se encontró el elemento modalHorario');
        alert("Error: No se encontró el modal de horarios.");
        return;
      }
      
      if (horarioIdEl) horarioIdEl.value = "";
      if (horarioTrabajadorIdEl) horarioTrabajadorIdEl.value = trabajadorId;
      if (horarioTrabajadorNombreEl) horarioTrabajadorNombreEl.textContent = "👤 " + trabajadorNombre;
      if (horarioTurnoEl) horarioTurnoEl.value = "";
      if (horarioHoraInicioEl) horarioHoraInicioEl.value = "";
      if (horarioHoraFinEl) horarioHoraFinEl.value = "";
      if (horarioActivoEl) horarioActivoEl.checked = true;
      if (modalHorarioTituloEl) modalHorarioTituloEl.textContent = "➕ Crear Horario para: " + trabajadorNombre;
      if (mensajeErrorHorarioEl) {
        mensajeErrorHorarioEl.textContent = "";
        mensajeErrorHorarioEl.style.display = "none";
      }
      
      modalHorarioEl.style.display = "flex";
      console.log('✅ Modal de horario abierto para trabajador:', trabajadorNombre);
    }

    // Editar horario
    async function editarHorario(horarioId) {
      try {
        const trabajadorId = document.getElementById("selectTrabajadorHorario").value;
        const selectTrabajador = document.getElementById("selectTrabajadorHorario");
        const trabajadorNombre = selectTrabajador.options[selectTrabajador.selectedIndex].text;
        
        const res = await fetch(apiBase + `/horarios?trabajador_id=${trabajadorId}`, {
          credentials: "include"
        });

        const data = await res.json();

        if (res.ok && data.horarios) {
          const horario = data.horarios.find(h => h.id === horarioId);
          if (horario) {
            document.getElementById("horarioId").value = horario.id;
            document.getElementById("horarioTrabajadorId").value = horario.trabajador_id;
            document.getElementById("horarioTrabajadorNombre").textContent = "👤 " + (horario.trabajador_nombre || trabajadorNombre);
            document.getElementById("horarioTurno").value = horario.turno;
            document.getElementById("horarioHoraInicio").value = horario.hora_inicio;
            document.getElementById("horarioHoraFin").value = horario.hora_fin;
            document.getElementById("horarioActivo").checked = horario.activo === true || horario.activo === 'true';
            document.getElementById("modalHorarioTitulo").textContent = "✏️ Editar Horario de: " + (horario.trabajador_nombre || trabajadorNombre);
            document.getElementById("mensajeErrorHorario").textContent = "";
            document.getElementById("mensajeErrorHorario").style.display = "none";
            document.getElementById("modalHorario").style.display = "flex";
          }
        }
      } catch (err) {
        console.error("Error al cargar horario para editar:", err);
        alert("Error al cargar el horario: " + err.message);
      }
    }

    // Guardar horario (crear o actualizar)
    async function guardarHorario(e) {
      e.preventDefault();

      const horarioId = document.getElementById("horarioId").value;
      const trabajadorId = document.getElementById("horarioTrabajadorId").value;
      const turno = document.getElementById("horarioTurno").value;
      const horaInicio = document.getElementById("horarioHoraInicio").value;
      const horaFin = document.getElementById("horarioHoraFin").value;
      const activo = document.getElementById("horarioActivo").checked;

      const mensajeError = document.getElementById("mensajeErrorHorario");

      if (!trabajadorId || !turno || !horaInicio || !horaFin) {
        mensajeError.textContent = "⚠️ Todos los campos son obligatorios.";
        mensajeError.style.display = "block";
        return;
      }

      try {
        const url = horarioId 
          ? apiBase + `/horarios/${horarioId}`
          : apiBase + "/horarios";
        
        const method = horarioId ? "PUT" : "POST";

        const res = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trabajador_id: parseInt(trabajadorId),
            turno,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            activo: activo
          }),
          credentials: "include"
        });

        // Verificar el Content-Type antes de parsear
        const contentType = res.headers.get("content-type");
        let data = {};

        if (contentType && contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (parseErr) {
            console.error("❌ Error al parsear JSON:", parseErr);
            const text = await res.text();
            console.error("📄 Texto recibido:", text.substring(0, 200));
            mensajeError.textContent = "❌ Error al procesar la respuesta del servidor.";
            mensajeError.style.display = "block";
            return;
          }
        } else {
          const text = await res.text();
          console.error("❌ Respuesta no es JSON:", text.substring(0, 200));
          mensajeError.textContent = "❌ El servidor devolvió una respuesta no válida. Verifica la consola para más detalles.";
          mensajeError.style.display = "block";
          return;
        }

        if (res.ok) {
          mensajeError.style.display = "none";
          cerrarModalHorario();
          cargarHorariosTrabajador(trabajadorId);
          cargarTrabajadoresParaHorarios();
          
          // Mostrar mensaje de éxito
          const mensajeHorarios = document.getElementById("mensajeHorarios");
          mensajeHorarios.innerHTML = `<div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin-top: 1rem;">
            ✅ ${data.message || "Horario guardado exitosamente para el trabajador seleccionado."}
          </div>`;
          setTimeout(() => {
            mensajeHorarios.innerHTML = "";
          }, 3000);
        } else {
          mensajeError.textContent = "❌ " + (data.error || "Error al guardar horario");
          mensajeError.style.display = "block";
        }
      } catch (err) {
        console.error("Error al guardar horario:", err);
        mensajeError.textContent = "❌ Error al conectar con el servidor: " + err.message;
        mensajeError.style.display = "block";
      }
    }

    // Eliminar horario
    async function eliminarHorario(horarioId) {
      if (!confirm("¿Estás seguro de que deseas eliminar este horario?")) {
        return;
      }

      try {
        const res = await fetch(apiBase + `/horarios/${horarioId}`, {
          method: "DELETE",
          credentials: "include"
        });

        const data = await res.json();

        if (res.ok) {
          const trabajadorId = document.getElementById("selectTrabajadorHorario").value;
          cargarHorariosTrabajador(trabajadorId);
        } else {
          alert("Error al eliminar horario: " + (data.error || "Error desconocido"));
        }
      } catch (err) {
        console.error("Error al eliminar horario:", err);
        alert("Error al conectar con el servidor: " + err.message);
      }
    }

    // Cerrar modal de horario
    function cerrarModalHorario() {
      document.getElementById("modalHorario").style.display = "none";
      document.getElementById("formHorario").reset();
    }

    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
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
            msg.textContent = "✅ Bienvenido Administrador";
            msg.className = "success";
            msg.style.color = "green";

            setTimeout(() => {
              window.location.href = "/pages/admin/admin.html";
            }, 1500);
          } else {
            msg.textContent = result.error || "❌ Error en el inicio de sesión";
            msg.className = "error";
            msg.style.color = "red";
          }
        } else {
          // Fallback si auth no está disponible
          try {
            const { API_CONFIG } = window.config || {};
            const apiBase = API_CONFIG?.usuarios || "http://localhost:3000/api";
            
            const res = await fetch(apiBase + "/login/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ correo, contrasena }),
              credentials: "include",
            });

            const data = await res.json();

            if (res.ok && data.logueado) {
              if (data.admin && data.admin.rol === "administrador") {
                if (window.auth && window.auth.setUser) {
                  window.auth.setUser(data.admin, 'administrador');
                } else {
                  localStorage.setItem("user", JSON.stringify(data.admin));
                  localStorage.setItem("role", "administrador");
                }
                
                msg.textContent = "✅ Bienvenido Administrador";
                msg.className = "success";
                msg.style.color = "green";

                setTimeout(() => {
                  window.location.href = "/pages/admin/admin.html";
                }, 1500);
              } else {
                msg.textContent = "❌ No tienes permisos de administrador";
                msg.className = "error";
                msg.style.color = "red";
              }
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

// Función global para cargar datos cuando se muestra el panel (llamada por adminAuth.js)
// DEFINIDA AL FINAL para que todas las funciones estén disponibles
window.cargarDatosAdmin = function(admin) {
  console.log('📦 ========== cargarDatosAdmin llamado para trabajadores ==========');
  console.log('📦 Admin recibido:', admin);
  console.log('📦 cargarTrabajadores disponible:', typeof cargarTrabajadores);
  console.log('📦 cargarTrabajadoresParaHorarios disponible:', typeof cargarTrabajadoresParaHorarios);
  
  // Verificar que el elemento exista
  const listaContainer = document.getElementById("listaTrabajadores");
  if (!listaContainer) {
    console.error('❌ listaTrabajadores no encontrado, esperando...');
    setTimeout(() => {
      if (window.cargarDatosAdmin) {
        console.log('🔄 Reintentando cargar trabajadores...');
        window.cargarDatosAdmin(admin);
      }
    }, 500);
    return;
  }
  
  console.log('✅ Elemento listaTrabajadores encontrado');
  
  // Verificar que las funciones estén disponibles
  if (typeof cargarTrabajadores !== 'function') {
    console.error('❌ cargarTrabajadores no está definida, esperando...');
    setTimeout(() => {
      if (typeof cargarTrabajadores === 'function') {
        console.log('✅ cargarTrabajadores ahora disponible, cargando...');
        cargarTrabajadores();
        if (typeof cargarTrabajadoresParaHorarios === 'function') {
          cargarTrabajadoresParaHorarios();
        }
      } else {
        console.error('❌ cargarTrabajadores nunca se definió después de esperar');
        if (listaContainer) {
          listaContainer.innerHTML = `
            <div style='color: #dc3545; padding: 2rem; text-align: center;'>
              <p><strong>Error interno:</strong> La función cargarTrabajadores no está disponible.</p>
              <p style='font-size: 0.9rem;'>Recarga la página o contacta al administrador.</p>
            </div>
          `;
        }
      }
    }, 1000);
    return;
  }
  
  console.log('✅ Todas las funciones disponibles, ejecutando carga...');
  
  // Ejecutar inmediatamente sin esperar
  try {
    console.log('🚀 Ejecutando cargarTrabajadores() directamente...');
    cargarTrabajadores();
    
    if (typeof cargarTrabajadoresParaHorarios === 'function') {
      console.log('🚀 Ejecutando cargarTrabajadoresParaHorarios()...');
      cargarTrabajadoresParaHorarios();
    } else {
      console.warn('⚠️ cargarTrabajadoresParaHorarios no está disponible');
    }
  } catch (error) {
    console.error('❌ Error al ejecutar funciones:', error);
    console.error('❌ Stack:', error.stack);
    if (listaContainer) {
      listaContainer.innerHTML = `
        <div style='color: #dc3545; padding: 2rem; text-align: center;'>
          <p><strong>Error al ejecutar carga de trabajadores:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
};

console.log('✅ window.cargarDatosAdmin definida para trabajadores al final del archivo');