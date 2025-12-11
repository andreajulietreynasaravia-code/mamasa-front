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

let ordenActual = null; // null = sin orden, 'asc' = ascendente, 'desc' = descendente

// Variables para almacenar los filtros aplicados (solo se actualizan al hacer clic en "Filtrar")
let filtrosAplicados = {
  fecha: '',
  estado: '',
  tipo: ''
};

// Función para ordenar reservas por ID
function ordenarReservasPorId(reservas) {
  if (!ordenActual) return reservas; // Si no hay orden, retornar sin cambios
  
  const reservasOrdenadas = [...reservas];
  reservasOrdenadas.sort((a, b) => {
    // Ordenar por _id (string de MongoDB)
    const idA = a._id || '';
    const idB = b._id || '';
    return ordenActual === 'asc' ? idA.localeCompare(idB) : idB.localeCompare(idA);
  });
  return reservasOrdenadas;
}

// Función para actualizar el icono de ordenamiento
function actualizarIconoOrdenamiento() {
  const sortIcon = document.getElementById('sort-icon');
  if (!sortIcon) return;
  
  // Remover clases anteriores
  sortIcon.classList.remove('asc', 'desc');
  
  // Agregar clase según el orden actual
  if (ordenActual === 'asc') {
    sortIcon.classList.add('asc');
  } else if (ordenActual === 'desc') {
    sortIcon.classList.add('desc');
  }
}

// Función para cambiar el orden
function cambiarOrden() {
  if (ordenActual === null || ordenActual === 'desc') {
    ordenActual = 'asc';
  } else {
    ordenActual = 'desc';
  }
  actualizarIconoOrdenamiento();
  
  // Recargar reservas para aplicar el ordenamiento
  cargarReservas();
}

// Función para aplicar filtros (se llama cuando se hace clic en "Filtrar")
function filtrarReservas() {
  // Guardar los valores actuales de los filtros
  filtrosAplicados = {
    fecha: document.getElementById('fechaFiltro')?.value || '',
    estado: document.getElementById('estadoFiltro')?.value || '',
    tipo: document.getElementById('tipoFiltro')?.value || ''
  };
  
  console.log('🔍 Filtros aplicados:', filtrosAplicados);
  cargarReservas();
}

// Función para actualizar reservas manteniendo los filtros actuales
function actualizarReservas() {
  cargarReservas();
}

async function cargarReservas() {
  const tbody = document.querySelector('#tablaReservas tbody');
  
  // Mostrar estado de carga
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #666;">Cargando reservas...</td></tr>`;
  }
  
  try {
    // Usar los filtros guardados (solo se actualizan al hacer clic en "Filtrar")
    const fecha = filtrosAplicados.fecha;
    const estado = filtrosAplicados.estado;
    const tipo = filtrosAplicados.tipo;
    let url = API_BASE;
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    if (estado) params.append('estado', estado);
    if (params.toString()) url += '?' + params.toString();
    
    console.log('📡 Obteniendo reservas desde:', url);
    console.log('📡 API_BASE completo:', API_BASE);
    
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
        // Intentar parsear como JSON
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
    if (tipo) reservas = reservas.filter(r => r.tipo_reserva === tipo);
    
    // Actualizar icono de ordenamiento
    actualizarIconoOrdenamiento();
    
    // Ordenar por ID si hay ordenamiento activo, sino ordenar por fecha (comportamiento original)
    if (ordenActual) {
      reservas = ordenarReservasPorId(reservas);
    } else {
      reservas.sort((a, b) => new Date(b.fecha_reserva) - new Date(a.fecha_reserva));
    }
    
    mostrarReservas(reservas);
    actualizarEstadisticas(reservas);
  } catch (error) {
    console.error('❌ Error cargando reservas:', error);
    console.error('❌ Tipo de error:', error.name);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    
    // Mostrar mensaje más descriptivo
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
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #dc3545;">
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

function obtenerHoyPeru() {
  const hoy = new Date();
  const fechaPeruStr = hoy.toLocaleString('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [month, day, year] = fechaPeruStr.split('/');
  return `${day}/${month}/${year}`;
}

function mostrarReservas(reservas) {
  const tbody = document.querySelector('#tablaReservas tbody');
  tbody.innerHTML = '';
  if (reservas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 3rem; color: #999;">No hay reservas disponibles</td></tr>`;
    return;
  }
  const hoyPeru = obtenerHoyPeru();
  reservas.forEach(reserva => {
    const fechaReserva = formatearFechaPeru(reserva.fecha_reserva);
    const esHoy = fechaReserva === hoyPeru;
    const fila = document.createElement('tr');
    if (esHoy) fila.classList.add('hoy');
    fila.innerHTML = `
      <td><strong>${reserva._id.substring(0, 8)}...</strong></td>
      <td><strong>${reserva.cliente_nombre}</strong><br><small style="color: #666;">📞 ${reserva.cliente_telefono}</small><br><small style="color: #666;">✉️ ${reserva.cliente_email}</small></td>
      <td><strong>${fechaReserva}</strong></td>
      <td><strong>${reserva.hora_reserva}</strong></td>
      <td>${reserva.numero_personas} 👥</td>
      <td>${obtenerEtiquetaTipo(reserva.tipo_reserva)}</td>
      <td><span class="estado ${reserva.estado}">${reserva.estado}</span></td>
      <td>
        <button class="btn-accion btn-detalles" onclick="verDetalles('${reserva._id}')" title="Ver detalles">👁️</button>
        ${reserva.estado === 'pendiente' ? `<button class="btn-accion btn-confirmar" onclick="cambiarEstado('${reserva._id}', 'confirmada')" title="Confirmar">✓</button>` : ''}
        ${reserva.estado === 'confirmada' ? `<button class="btn-accion btn-confirmar" onclick="cambiarEstado('${reserva._id}', 'completada')" title="Marcar como completada">✓✓</button>` : ''}
        ${reserva.estado !== 'cancelada' && reserva.estado !== 'completada' ? `<button class="btn-accion btn-cancelar" onclick="cambiarEstado('${reserva._id}', 'cancelada')" title="Cancelar">✕</button>` : ''}
      </td>
    `;
    tbody.appendChild(fila);
  });
}

function obtenerEtiquetaTipo(tipo) {
  const tipos = { desayuno: '☀️ Desayuno', almuerzo: '🍽️ Almuerzo', cena: '🌙 Cena', merienda: '🍵 Merienda' };
  return tipos[tipo] || tipo;
}

async function verDetalles(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const reserva = await response.json();
    let platosHTML = '';
    if (reserva.platos_reservados && reserva.platos_reservados.length > 0) {
      platosHTML = `<h3>Platos Reservados:</h3><div class="platos-lista">${reserva.platos_reservados.map(plato => `<div class="plato-item"><span>${plato.cantidad}x ${plato.plato_nombre}</span><span>S/ ${(plato.precio * plato.cantidad).toFixed(2)}</span></div>`).join('')}</div>`;
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
  } catch (error) { alert('Error al cargar los detalles'); }
}

// Función para obtener información del trabajador logueado
async function obtenerTrabajadorLogueado() {
  try {
    const user = window.auth?.getCurrentUser();
    if (user && user.rol === 'trabajador') {
      return { 
        id: user.id || user.id_usuario || user.idUsuario, 
        nombre: user.nombre 
      };
    }
    
    // Fallback: intentar desde localStorage
    const trabajadorLocal = localStorage.getItem("user");
    if (trabajadorLocal) {
      try {
        const trabajador = JSON.parse(trabajadorLocal);
        if (trabajador.rol === 'trabajador') {
          return { 
            id: trabajador.id || trabajador.id_usuario || trabajador.idUsuario, 
            nombre: trabajador.nombre 
          };
        }
      } catch (e) {
        console.error("Error parsing trabajador from localStorage:", e);
      }
    }
    
    return null;
  } catch (err) {
    console.error("Error al obtener trabajador:", err);
    return null;
  }
}

async function cambiarEstado(id, nuevoEstado) {
  const acciones = { confirmada: { mensaje: '¿Confirmar esta reserva?' }, cancelada: { mensaje: '¿Cancelar esta reserva?' }, completada: { mensaje: '¿Marcar como completada?' } };
  if (!confirm(acciones[nuevoEstado]?.mensaje || '¿Estás seguro?')) return;
  
  // Obtener información del trabajador logueado
  const trabajador = await obtenerTrabajadorLogueado();
  
  try {
    const body = { estado: nuevoEstado };
    if (trabajador) {
      body.trabajador_id = trabajador.id;
      body.trabajador_nombre = trabajador.nombre;
    }
    
    const response = await fetch(`${API_BASE}/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    });
    if (response.ok) { alert('✅ Reserva actualizada correctamente'); cargarReservas(); }
    else { const error = await response.json(); throw new Error(error.error); }
  } catch (error) { alert(`❌ Error: ${error.message}`); }
}

function actualizarEstadisticas(reservas) {
  const hoyPeru = obtenerHoyPeru();
  const reservasHoy = reservas.filter(r => formatearFechaPeru(r.fecha_reserva) === hoyPeru);
  document.getElementById('total').textContent = reservas.length;
  document.getElementById('hoy').textContent = reservasHoy.length;
  document.getElementById('confirmadas').textContent = reservas.filter(r => r.estado === 'confirmada').length;
  document.getElementById('pendientes').textContent = reservas.filter(r => r.estado === 'pendiente').length;
}

function limpiarFiltros() {
  // Limpiar los campos del formulario
  document.getElementById('fechaFiltro').value = '';
  document.getElementById('estadoFiltro').value = '';
  document.getElementById('tipoFiltro').value = '';
  
  // Resetear los filtros guardados
  filtrosAplicados = {
    fecha: '',
    estado: '',
    tipo: ''
  };
  
  console.log('🧹 Filtros limpiados');
  cargarReservas();
}

function cerrarModal() { document.getElementById('modalDetalles').style.display = 'none'; }
window.onclick = function(event) { const modal = document.getElementById('modalDetalles'); if (event.target === modal) cerrarModal(); }

// Exportar funciones globalmente
window.cargarReservas = cargarReservas;
window.filtrarReservas = filtrarReservas;
window.actualizarReservas = actualizarReservas;
window.limpiarFiltros = limpiarFiltros;
window.verDetalles = verDetalles;
window.cambiarEstado = cambiarEstado;
window.cerrarModal = cerrarModal;

document.addEventListener('DOMContentLoaded', function() { 
  // Inicializar API
  inicializarAPI();
  
  cargarReservas(); 
  setInterval(() => { cargarReservas(); }, 15000);
  
  // Event listener para el icono de ordenamiento
  const sortIcon = document.getElementById('sort-icon');
  if (sortIcon) {
    sortIcon.addEventListener('click', cambiarOrden);
  }
  
  // Actualizar nombre del trabajador en el sidebar
  if (window.auth && window.auth.getCurrentUser) {
    const user = window.auth.getCurrentUser();
    if (user && user.rol === 'trabajador') {
      const sidebarName = document.getElementById('sidebarTrabajadorName');
      if (sidebarName) {
        sidebarName.textContent = user.nombre || 'Trabajador';
      }
    }
  }
});

