// Configuración de API usando variables de entorno
const RESERVAS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.reservas) 
  ? window.config.API_CONFIG.reservas 
  : (typeof process !== 'undefined' && process.env?.RESERVAS_SERVICE_URL) 
    ? `${process.env.RESERVAS_SERVICE_URL}/api` 
    : "http://localhost:4004/api";

let API_BASE = `${RESERVAS_SERVICE_URL}/reservas`;

// Función para inicializar API_BASE
function inicializarAPI() {
  if (window.config && window.config.API_CONFIG && window.config.API_CONFIG.reservas) {
    const reservasApi = window.config.API_CONFIG.reservas;
    // Asegurar que termine con /reservas
    API_BASE = reservasApi.endsWith('/reservas') ? reservasApi : `${reservasApi}/reservas`;
    console.log('✅ API_BASE inicializado:', API_BASE);
  } else {
    console.warn('⚠️ window.config no disponible, usando API_BASE por defecto');
  }
}

// Obtener el cliente logueado
function obtenerClienteLogueado() {
  try {
    // Usar window.auth si está disponible
    let user = null;
    if (window.auth && typeof window.auth.getCurrentUser === 'function') {
      user = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      
      // Verificar que el usuario tenga rol de cliente
      if (user && (role === 'cliente' || user.rol === 'usuario')) {
        console.log('✅ Cliente logueado encontrado via window.auth:', user);
        return user;
      }
    }
    
    // Fallback: verificar localStorage directamente
    const userStr = localStorage.getItem("user");
    const roleStr = localStorage.getItem("role");
    
    if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
      try {
        user = JSON.parse(userStr);
        if (user && (user.rol === "usuario" || roleStr === "cliente")) {
          console.log('✅ Cliente logueado encontrado via localStorage:', user);
          return user;
        }
      } catch (e) {
        console.error('❌ Error parseando user de localStorage:', e);
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    }
    
    // Fallback adicional: verificar localStorage antiguo
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      try {
        user = JSON.parse(usuarioStr);
        if (user && user.rol === "usuario") {
          // Migrar al sistema nuevo
          if (window.auth && window.auth.setUser) {
            window.auth.setUser(user, 'cliente');
          } else {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", "cliente");
          }
          console.log('✅ Cliente logueado encontrado (migrado):', user);
          return user;
        }
      } catch (e) {
        console.error('❌ Error parseando usuario de localStorage:', e);
        localStorage.removeItem("usuario");
      }
    }
    
    console.warn('⚠️ No hay usuario logueado');
    return null;
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return null;
  }
}

// Cargar reservas del cliente
async function cargarReservas() {
  const tbody = document.querySelector('#tablaReservas tbody');
  
  // Mostrar estado de carga
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #666;">Cargando reservas...</td></tr>`;
  }

  // Obtener cliente logueado
  const cliente = obtenerClienteLogueado();
  if (!cliente) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #dc3545;">
        ⚠️ Debes iniciar sesión para ver tus reservas.<br>
        <a href="/pages/cliente/login.html" style="color: #8b0000; text-decoration: underline;">Iniciar sesión</a>
      </td></tr>`;
    }
    return;
  }

  try {
    const fecha = document.getElementById('fechaFiltro')?.value || '';
    const estado = document.getElementById('estadoFiltro')?.value || '';
    const tipo = document.getElementById('tipoFiltro')?.value || '';
    let url = API_BASE;
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    if (estado) params.append('estado', estado);
    if (params.toString()) url += '?' + params.toString();
    
    console.log('📡 Obteniendo reservas desde:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error || errorJson.message || errorText;
        } catch (e) {
          // Si no es JSON, usar el texto tal cual
        }
      } catch (e) {
        errorText = 'No se pudo leer el mensaje de error';
      }
      console.error('❌ Error en la respuesta:', response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText || 'No se pudo obtener las reservas'}`);
    }
    
    // Verificar que la respuesta sea JSON válido
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Respuesta no es JSON:', text);
      throw new Error('El servidor no devolvió JSON válido');
    }
    
    let reservas = await response.json();
    console.log('✅ Reservas obtenidas:', reservas.length);
    
    // Filtrar por email del cliente logueado
    const emailCliente = cliente.correo || cliente.email;
    reservas = reservas.filter(r => {
      const emailReserva = r.cliente_email || r.clienteEmail;
      return emailReserva && emailReserva.toLowerCase() === emailCliente.toLowerCase();
    });
    
    console.log('✅ Reservas del cliente:', reservas.length);
    
    // Filtrar por tipo si está seleccionado
    if (tipo) {
      reservas = reservas.filter(r => r.tipo_reserva === tipo);
    }
    
    // Ordenar por fecha (más recientes primero)
    reservas.sort((a, b) => new Date(b.fecha_reserva) - new Date(a.fecha_reserva));
    
    mostrarReservas(reservas);
    actualizarEstadisticas(reservas);
  } catch (error) {
    console.error('❌ Error cargando reservas:', error);
    
    let mensajeError = 'Error al cargar las reservas';
    let instrucciones = '';
    
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError' || error.message.includes('NetworkError')) {
      mensajeError = '❌ No se pudo conectar con el servidor de reservas.';
      instrucciones = `
        <br><br>
        <strong>Instrucciones para iniciar el servicio:</strong><br>
        1. Abre una terminal en la carpeta <code>servicio-reservas</code><br>
        2. Ejecuta: <code>npm start</code><br>
        3. Espera a ver: <code>🍽️ Servicio reservas en puerto 4004</code><br>
        4. Recarga esta página<br><br>
        <small style="color: #999;">URL intentada: ${API_BASE}</small>
      `;
    } else if (error.message.includes('404')) {
      mensajeError = '❌ Endpoint no encontrado.';
      instrucciones = `<br><small>Verifica que la ruta /api/reservas esté configurada en el servicio.</small><br><small style="color: #999;">URL: ${API_BASE}</small>`;
    } else {
      mensajeError = `❌ Error: ${error.message}`;
      instrucciones = `<br><small style="color: #999;">URL: ${API_BASE}</small>`;
    }
    
    // Mostrar en la tabla
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #dc3545;">
        ${mensajeError}${instrucciones}
      </td></tr>`;
    }
  }
}

function formatearFechaPeru(fecha) {
  if (!fecha) return '-';
  try {
    const date = new Date(fecha);
    const fechaPeruStr = date.toLocaleString('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [month, day, year] = fechaPeruStr.split('/');
    return `${day}/${month}/${year}`;
  } catch (error) {
    const date = new Date(fecha);
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
  }
}

function mostrarReservas(reservas) {
  const tbody = document.querySelector('#tablaReservas tbody');
  tbody.innerHTML = '';
  if (reservas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #999;">
      No tienes reservas registradas.<br>
      <a href="/pages/cliente/cliente.html" style="color: #8b0000; text-decoration: underline; margin-top: 1rem; display: inline-block;">Crear nueva reserva</a>
    </td></tr>`;
    return;
  }
  
  reservas.forEach(reserva => {
    const fechaReserva = formatearFechaPeru(reserva.fecha_reserva);
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><strong>${reserva._id ? reserva._id.substring(0, 8) : reserva.id || 'N/A'}...</strong></td>
      <td><strong>${fechaReserva}</strong></td>
      <td><strong>${reserva.hora_reserva || '-'}</strong></td>
      <td>${reserva.numero_personas || '-'} 👥</td>
      <td>${obtenerEtiquetaTipo(reserva.tipo_reserva)}</td>
      <td><span class="estado ${reserva.estado}">${reserva.estado}</span></td>
      <td>
        <button class="btn-ver" onclick="verDetalles('${reserva._id || reserva.id}')" title="Ver detalles">👁️ Ver</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

function obtenerEtiquetaTipo(tipo) {
  const tipos = { 
    desayuno: '☀️ Desayuno', 
    almuerzo: '🍽️ Almuerzo', 
    cena: '🌙 Cena', 
    merienda: '🍵 Merienda' 
  };
  return tipos[tipo] || tipo;
}

async function verDetalles(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('No se pudo obtener los detalles');
    }
    const reserva = await response.json();
    
    let platosHTML = '';
    if (reserva.platos_reservados && reserva.platos_reservados.length > 0) {
      platosHTML = `
        <h3 style="margin-top: 1.5rem; color: #8b0000;">Platos Reservados:</h3>
        <div style="margin-top: 1rem;">
          ${reserva.platos_reservados.map(plato => `
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;">
              <span>${plato.cantidad}x ${plato.plato_nombre}</span>
              <span><strong>S/ ${(plato.precio * plato.cantidad).toFixed(2)}</strong></span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    document.getElementById('detallesContenido').innerHTML = `
      <p><strong>Cliente:</strong> ${reserva.cliente_nombre}</p>
      <p><strong>Email:</strong> ${reserva.cliente_email}</p>
      <p><strong>Teléfono:</strong> ${reserva.cliente_telefono}</p>
      <p><strong>Fecha:</strong> ${formatearFechaPeru(reserva.fecha_reserva)}</p>
      <p><strong>Hora:</strong> ${reserva.hora_reserva}</p>
      <p><strong>Personas:</strong> ${reserva.numero_personas}</p>
      <p><strong>Tipo:</strong> ${obtenerEtiquetaTipo(reserva.tipo_reserva)}</p>
      <p><strong>Estado:</strong> <span class="estado ${reserva.estado}">${reserva.estado}</span></p>
      ${reserva.notas_especiales ? `<p><strong>Notas:</strong> ${reserva.notas_especiales}</p>` : ''}
      ${platosHTML}
    `;
    document.getElementById('modalDetalles').style.display = 'block';
  } catch (error) {
    console.error('❌ Error al cargar los detalles:', error);
    alert('Error al cargar los detalles de la reserva');
  }
}

function cerrarModal() {
  document.getElementById('modalDetalles').style.display = 'none';
}

function actualizarEstadisticas(reservas) {
  const total = reservas.length;
  const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
  const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;
  const completadas = reservas.filter(r => r.estado === 'completada').length;
  
  document.getElementById('total').textContent = total;
  document.getElementById('pendientes').textContent = pendientes;
  document.getElementById('confirmadas').textContent = confirmadas;
  document.getElementById('completadas').textContent = completadas;
}

function aplicarFiltros() {
  cargarReservas();
}

function limpiarFiltros() {
  document.getElementById('fechaFiltro').value = '';
  document.getElementById('estadoFiltro').value = '';
  document.getElementById('tipoFiltro').value = '';
  cargarReservas();
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
  const modal = document.getElementById('modalDetalles');
  if (event.target === modal) {
    cerrarModal();
  }
}

// Función para actualizar nombre de usuario en navegación
function actualizarNombreUsuarioNav() {
  const cliente = obtenerClienteLogueado();
  const userTextNav = document.getElementById('userTextNav');
  const userLinkNav = document.getElementById('userLinkNav');
  
  if (cliente && cliente.nombre) {
    const primerNombre = cliente.nombre.split(" ")[0];
    if (userTextNav) {
      userTextNav.textContent = primerNombre;
    }
    if (userLinkNav) {
      userLinkNav.href = '/pages/cliente/user.html';
      userLinkNav.onclick = null;
    }
  } else {
    if (userTextNav) {
      userTextNav.textContent = 'Login';
    }
    if (userLinkNav) {
      userLinkNav.href = '/pages/cliente/login.html';
      userLinkNav.onclick = null;
    }
  }
}

// Verificar sesión con el servidor si es necesario
async function verificarSesionServidor() {
  try {
    const { API_CONFIG } = window.config || {};
    const apiBase = API_CONFIG?.usuarios || "http://localhost:3000/api";
    
    // Verificar cookie de sesión
    const res = await fetch(apiBase + "/sesion", {
      credentials: "include"
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.logueado && data.usuario && data.usuario.rol === "usuario") {
        // Guardar usando el sistema unificado
        if (window.auth && window.auth.setUser) {
          window.auth.setUser(data.usuario, 'cliente');
          console.log('✅ Sesión sincronizada desde servidor');
        } else {
          localStorage.setItem("user", JSON.stringify(data.usuario));
          localStorage.setItem("role", "cliente");
        }
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("❌ Error verificando sesión con servidor:", err);
    return false;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
  inicializarAPI();
  
  // Verificar sesión primero
  const cliente = obtenerClienteLogueado();
  if (!cliente) {
    // Intentar verificar con el servidor
    console.log('🔍 No hay sesión local, verificando con servidor...');
    const tieneSesion = await verificarSesionServidor();
    if (!tieneSesion) {
      console.warn('⚠️ No hay sesión activa, redirigiendo a login...');
      // Guardar URL de destino para redirigir después del login
      localStorage.setItem('redirectAfterLogin', '/pages/cliente/reservas.html');
      // No redirigir automáticamente, solo mostrar mensaje
      const tbody = document.querySelector('#tablaReservas tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: #dc3545;">
          ⚠️ Debes iniciar sesión para ver tus reservas.<br>
          <a href="/pages/cliente/login.html" style="color: #8b0000; text-decoration: underline; margin-top: 1rem; display: inline-block;">Iniciar sesión</a>
        </td></tr>`;
      }
    }
  }
  
  // Actualizar nombre de usuario en la navegación
  actualizarNombreUsuarioNav();
  
  // Cargar reservas solo si hay sesión
  if (obtenerClienteLogueado()) {
    cargarReservas();
  }
  
  // Auto-refrescar cada 30 segundos
  setInterval(() => {
    if (obtenerClienteLogueado()) {
      cargarReservas();
    }
  }, 30000);
  
  // Actualizar nombre cuando la ventana gana foco
  window.addEventListener('focus', async () => {
    // Verificar sesión cuando la ventana gana foco
    await verificarSesionServidor();
    actualizarNombreUsuarioNav();
    if (obtenerClienteLogueado()) {
      cargarReservas();
    }
  });
  
  // Actualizar periódicamente
  setInterval(async () => {
    await verificarSesionServidor();
    actualizarNombreUsuarioNav();
  }, 2000);
});

