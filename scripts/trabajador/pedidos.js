// Obtener la configuración de la API usando variables de entorno
const PEDIDOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.pedidos) 
  ? window.config.API_CONFIG.pedidos 
  : (typeof process !== 'undefined' && process.env?.PEDIDOS_SERVICE_URL) 
    ? `${process.env.PEDIDOS_SERVICE_URL}/api` 
    : "http://localhost:4001/api";

let API_BASE = `${PEDIDOS_SERVICE_URL}/pedidos`;

// Función para inicializar API_BASE
function inicializarAPI() {
  if (typeof window !== 'undefined' && window.config && window.config.API_CONFIG) {
    const pedidosApi = window.config.API_CONFIG.pedidos;
    if (pedidosApi) {
      // Si pedidosApi es "http://localhost:4001/api", agregar "/pedidos"
      API_BASE = pedidosApi.endsWith('/pedidos') ? pedidosApi : `${pedidosApi}/pedidos`;
      console.log('🔧 API_BASE configurada desde config.js:', API_BASE);
    }
  } else {
    console.log('🔧 API_BASE usando valor por defecto:', API_BASE);
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

// Variable para controlar el ordenamiento por ID
let ordenAscendente = true;

// Variable para almacenar los pedidos cargados (para usar en el modal de detalles)
let pedidosCargados = [];

// Variable para almacenar todos los pedidos sin filtrar (para mostrar el total real)
let todosLosPedidos = [];

// Variables para almacenar los filtros aplicados (solo se actualizan al hacer clic en "Filtrar")
let filtrosAplicados = {
  fechaDesde: '',
  fechaHasta: '',
  estado: '',
  tipoServicio: ''
};

// Función para obtener información del trabajador logueado
async function obtenerTrabajadorLogueado() {
  try {
    const user = window.auth?.getCurrentUser();
    if (user && (user.rol === 'trabajador' || user.role === 'trabajador')) {
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
        if (trabajador.rol === 'trabajador' || trabajador.role === 'trabajador') {
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

// Función para actualizar el nombre del trabajador en el sidebar
function actualizarNombreTrabajador() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const sidebarNameEl = document.getElementById('sidebarTrabajadorName');
      if (sidebarNameEl && user && user.nombre) {
        sidebarNameEl.textContent = user.nombre;
      }
    }
  } catch (err) {
    console.error('Error al actualizar nombre del trabajador:', err);
  }
}

// Función para aplicar filtros (se llama cuando se hace clic en "Filtrar")
function filtrarPedidos() {
  // Guardar los valores actuales de los filtros
  const fechaDesde = document.getElementById('fecha-desde');
  const fechaHasta = document.getElementById('fecha-hasta');
  const estadoFiltro = document.getElementById('estadoFiltro');
  const tipoServicioFiltro = document.getElementById('tipoServicioFiltro');
  
  filtrosAplicados = {
    fechaDesde: fechaDesde ? fechaDesde.value : '',
    fechaHasta: fechaHasta ? fechaHasta.value : '',
    estado: estadoFiltro ? estadoFiltro.value : '',
    tipoServicio: tipoServicioFiltro ? tipoServicioFiltro.value : ''
  };
  
  console.log('🔍 Filtros aplicados:', filtrosAplicados);
  cargarPedidos();
}

// Función para actualizar pedidos manteniendo los filtros actuales
function actualizarPedidos() {
  // Mantener los filtros guardados (no cambiar nada)
  cargarPedidos();
}

// Cargar pedidos
async function cargarPedidos() {
  try {
    console.log('🚀 Iniciando carga de pedidos...');
    
    // Verificar que la tabla exista
    const tablaPedidos = document.querySelector('#tablaPedidos');
    if (!tablaPedidos) {
      console.log('⚠️ No se encontró la tabla de pedidos');
      return;
    }
    
    // Usar los filtros guardados (solo se actualizan al hacer clic en "Filtrar")
    const fechaDesdeValue = filtrosAplicados.fechaDesde;
    const fechaHastaValue = filtrosAplicados.fechaHasta;
    const estado = filtrosAplicados.estado;
    const tipoServicio = filtrosAplicados.tipoServicio;

    // Asegurar que API_BASE esté inicializada
    inicializarAPI();
    
    const url = `${API_BASE}/listar`;
    console.log('📦 Cargando pedidos desde:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    let pedidos = await response.json();
    console.log('📦 Pedidos recibidos:', Array.isArray(pedidos) ? pedidos.length : 'No es un array', pedidos);
    
    // Asegurar que pedidos sea un array
    if (!Array.isArray(pedidos)) {
      console.error('❌ La respuesta no es un array:', pedidos);
      pedidos = [];
    }

    // Guardar todos los pedidos sin filtrar para mostrar el total real
    todosLosPedidos = [...pedidos];
    pedidosCargados = [...pedidos];

    // Filtrar por fecha desde si está especificado (incluye el día exacto)
    if (fechaDesdeValue) {
      // Parsear la fecha en hora local (añadir T00:00:00 para evitar problemas de zona horaria)
      const [yearDesde, monthDesde, dayDesde] = fechaDesdeValue.split('-').map(Number);
      const desde = new Date(yearDesde, monthDesde - 1, dayDesde, 0, 0, 0, 0); // Inicio del día en hora local
      
      pedidos = pedidos.filter(p => {
        if (!p.fecha_pedido) return false;
        const fechaPedido = new Date(p.fecha_pedido);
        // Obtener solo la fecha del pedido en hora local
        const fechaPedidoLocal = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate(), 0, 0, 0, 0);
        return fechaPedidoLocal >= desde;
      });
    }

    // Filtrar por fecha hasta si está especificado (incluye el día exacto)
    if (fechaHastaValue) {
      // Parsear la fecha en hora local
      const [yearHasta, monthHasta, dayHasta] = fechaHastaValue.split('-').map(Number);
      const hasta = new Date(yearHasta, monthHasta - 1, dayHasta, 23, 59, 59, 999); // Fin del día en hora local
      
      pedidos = pedidos.filter(p => {
        if (!p.fecha_pedido) return false;
        const fechaPedido = new Date(p.fecha_pedido);
        return fechaPedido <= hasta;
      });
    }

    // Filtrar por estado
    if (estado) {
      const estadoNormalizado = normalizarEstado(estado);
      if (estadoNormalizado === 'completado') {
        // Si filtra por completado, incluir también entregado, listo, en_camino
        const estadosCompletados = ['entregado', 'completado', 'listo', 'en_camino'];
        pedidos = pedidos.filter(p => {
          const estadoPedido = normalizarEstado(p.estado);
          return estadosCompletados.some(e => normalizarEstado(e) === estadoPedido);
        });
      } else {
        pedidos = pedidos.filter(p => normalizarEstado(p.estado) === estadoNormalizado);
      }
    }

    // Filtrar por tipo de servicio
    if (tipoServicio) {
      pedidos = pedidos.filter(p => p.tipo_servicio === tipoServicio);
    }

    console.log('📦 Pedidos después de filtrar:', pedidos.length);
    
    // Mostrar pedidos en la tabla
    mostrarPedidos(pedidos);
    
    // Actualizar estadísticas
    actualizarEstadisticas(pedidos);
    
  } catch (error) {
    console.error('❌ Error cargando pedidos:', error);
    const tbody = document.querySelector('#tablaPedidos tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: #dc3545;">
            <strong>Error al cargar pedidos:</strong><br>
            ${error.message}<br>
            <small>Verifica que el servicio de pedidos esté corriendo en el puerto 4001</small>
          </td>
        </tr>
      `;
    }
    
    // Re-lanzar el error para que se pueda capturar en el catch externo
    throw error;
  }
}

// Normalizar estado para comparación
function normalizarEstado(estado) {
  if (!estado) return '';
  return estado.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[áéíóú]/g, (m) => {
      const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
      return map[m] || m;
    });
}

// Formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatear fecha corta para etiquetas (DD/MM/YYYY)
function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
}

// Función para ordenar pedidos por ID
function ordenarPorId(pedidos) {
  const pedidosOrdenados = [...pedidos];
  pedidosOrdenados.sort((a, b) => {
    const idA = a.id_pedido || 0;
    const idB = b.id_pedido || 0;
    return ordenAscendente ? idA - idB : idB - idA;
  });
  return pedidosOrdenados;
}

// Mostrar pedidos en tabla
function mostrarPedidos(pedidos) {
  console.log('📋 Mostrando pedidos en tabla:', pedidos.length);
  const tbody = document.querySelector('#tablaPedidos tbody');
  if (!tbody) {
    console.error('❌ No se encontró el tbody de la tabla');
    return;
  }
  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    console.log('📋 No hay pedidos para mostrar');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: #999;">
          No hay pedidos disponibles
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por ID antes de mostrar
  const pedidosOrdenados = ordenarPorId(pedidos);
  console.log('📋 Pedidos ordenados:', pedidosOrdenados.length);

  pedidosOrdenados.forEach((pedido, index) => {
    console.log(`📋 Procesando pedido ${index + 1}:`, pedido);
    const fila = document.createElement('tr');
    
    // Determinar qué botones mostrar según el estado
    // El trabajador solo puede cambiar entre: Pendiente, En Preparación y Completado
    const estadoNormalizado = normalizarEstado(pedido.estado || 'pendiente');
    let botonesAccion = '';
    
    if (estadoNormalizado === 'pendiente') {
      // Desde pendiente puede ir a en preparación
      botonesAccion = `<button class="btn-actualizar" onclick="actualizarEstado(${pedido.id_pedido}, 'en_preparacion')">En Preparación</button>`;
    } else if (estadoNormalizado === 'en_preparacion' || estadoNormalizado === 'en_preparación') {
      // Desde en preparación puede ir a completado
      botonesAccion = `<button class="btn-actualizar" onclick="actualizarEstado(${pedido.id_pedido}, 'completado')">Completado</button>`;
    } else if (estadoNormalizado === 'completado' || estadoNormalizado === 'entregado') {
      // Completado es el estado final, no se puede cambiar
      botonesAccion = '<span style="color: #28a745; font-weight: 600;">✅ Completado</span>';
    } else {
      // Para cualquier otro estado, permitir cambiar a los estados permitidos
      botonesAccion = `
        <button class="btn-actualizar" onclick="actualizarEstado(${pedido.id_pedido}, 'pendiente')" style="margin-right: 0.5rem;">Pendiente</button>
        <button class="btn-actualizar" onclick="actualizarEstado(${pedido.id_pedido}, 'en_preparacion')" style="margin-right: 0.5rem;">En Preparación</button>
        <button class="btn-actualizar" onclick="actualizarEstado(${pedido.id_pedido}, 'completado')">Completado</button>
      `;
    }
    
    // Para pedidos de tipo "local" y "llevar", no mostrar dirección (dejar en blanco)
    const esLocalOLlevar = pedido.tipo_servicio === 'local' || pedido.tipo_servicio === 'llevar';
    const mostrarDireccion = esLocalOLlevar ? '' : `<br><small style="color: #666;">${pedido.calle_avenida || 'Sin dirección'}</small>`;
    
    fila.innerHTML = `
      <td><strong>#${pedido.id_pedido || 'N/A'}</strong></td>
      <td>
        <strong>${pedido.cliente_nombre || 'N/A'}</strong>${mostrarDireccion}
      </td>
      <td>${formatearFecha(pedido.fecha_pedido)}</td>
      <td>${obtenerEtiquetaTipoServicio(pedido.tipo_servicio)}</td>
      <td><strong>S/ ${parseFloat(pedido.monto_total || 0).toFixed(2)}</strong></td>
      <td><span class="estado ${pedido.estado || 'pendiente'}">${obtenerEtiquetaEstado(pedido.estado || 'pendiente')}</span></td>
      <td>
        <button onclick="verDetalles(${pedido.id_pedido})" class="btn-ver">Ver</button>
        ${botonesAccion}
      </td>
    `;
    tbody.appendChild(fila);
  });
  
  console.log('✅ Tabla actualizada con', pedidosOrdenados.length, 'pedidos');
}

// Obtener etiqueta para tipo de servicio
function obtenerEtiquetaTipoServicio(tipo) {
  const tipos = {
    local: '🏪 Local',
    domicilio: '🚚 Domicilio',
    llevar: '📦 Llevar'
  };
  return tipos[tipo] || tipo;
}

// Obtener etiqueta para estado
function obtenerEtiquetaEstado(estado) {
  const estados = {
    pendiente: '⏳ Pendiente',
    en_preparacion: '👨‍🍳 En Preparación',
    'en preparación': '👨‍🍳 En Preparación',
    completado: '✅ Completado',
    entregado: '✅ Completado', // Mapear entregado a completado para el trabajador
    listo: '✅ Completado', // Mapear listo a completado
    en_camino: '✅ Completado', // Mapear en_camino a completado
    cancelado: '❌ Cancelado'
  };
  return estados[estado] || estado;
}

// Actualizar estado del pedido
// El trabajador solo puede cambiar a: pendiente, en_preparacion, completado
async function actualizarEstado(id, nuevoEstado) {
  // Validar que el estado sea uno de los permitidos
  const estadosPermitidos = ['pendiente', 'en_preparacion', 'completado'];
  const estadoNormalizado = normalizarEstado(nuevoEstado);
  
  if (!estadosPermitidos.includes(estadoNormalizado)) {
    alert('❌ Estado no permitido. Solo se puede cambiar a: Pendiente, En Preparación o Completado.');
    return;
  }
  
  // Mapear el estado al formato que espera el backend
  let estadoParaBackend = nuevoEstado;
  if (estadoNormalizado === 'completado') {
    estadoParaBackend = 'entregado';
  } else if (estadoNormalizado === 'en_preparacion') {
    // El backend espera "en preparacion" (con espacio, sin tilde) o "en preparación" (con tilde)
    estadoParaBackend = 'en preparacion';
  } else if (estadoNormalizado === 'pendiente') {
    estadoParaBackend = 'pendiente';
  }
  
  if (!confirm(`¿Deseas cambiar el estado del pedido #${id} a "${obtenerEtiquetaEstado(nuevoEstado)}"?`)) {
    return;
  }
  
  // Obtener información del trabajador logueado
  const trabajador = await obtenerTrabajadorLogueado();
  
  try {
    const body = { estado: estadoParaBackend };
    if (trabajador) {
      body.trabajador_id = trabajador.id;
      body.trabajador_nombre = trabajador.nombre;
    }
    
    console.log('📦 Actualizando estado del pedido:', id, 'a', estadoParaBackend, '(mostrado como:', nuevoEstado, ')');
    const response = await fetch(`${API_BASE}/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error al actualizar estado:', errorText);
      throw new Error(`Error ${response.status}: ${errorText || 'No se pudo actualizar el estado'}`);
    }
    
    const data = await response.json();
    console.log('✅ Estado actualizado:', data);
    alert('✅ Estado del pedido actualizado correctamente');
    
    // Recargar pedidos
    await cargarPedidos();
  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
    alert(`❌ Error al actualizar el estado: ${error.message}`);
  }
}

// Ver detalles de pedido
async function verDetalles(id) {
  try {
    // Primero intentar obtener el pedido de la lista cargada (tiene información del historial)
    let pedido = pedidosCargados.find(p => p.id_pedido == id);
    
    // Si no está en la lista, obtenerlo del API
    if (!pedido) {
      const response = await fetch(`${API_BASE}/${id}`);
      const data = await response.json();

      if (!data.ok || !data.pedido) {
        throw new Error('Pedido no encontrado');
      }
      pedido = data.pedido;
    }

    document.getElementById('detallesContenido').innerHTML = `
      <p><strong>ID Pedido:</strong> #${pedido.id_pedido}</p>
      <p><strong>Cliente:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha_pedido)}</p>
      <p><strong>Tipo Servicio:</strong> ${obtenerEtiquetaTipoServicio(pedido.tipo_servicio)}</p>
      <p><strong>Método de Pago:</strong> ${pedido.metodo_pago || 'N/A'}</p>
      <p><strong>Monto Total:</strong> S/ ${parseFloat(pedido.monto_total || 0).toFixed(2)}</p>
      <p><strong>Estado:</strong> <span class="estado ${pedido.estado}">${obtenerEtiquetaEstado(pedido.estado)}</span></p>
      ${pedido.calle_avenida ? `<p><strong>Dirección:</strong> ${pedido.calle_avenida}</p>` : ''}
      ${pedido.platos && pedido.platos.length > 0 ? `
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid #ddd;">
        <p><strong>Platos:</strong></p>
        <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
          ${pedido.platos.map(plato => `<li>${plato.nombre || plato.plato_nombre} - Cantidad: ${plato.cantidad || 1}</li>`).join('')}
        </ul>
      ` : ''}
    `;
    
    document.getElementById('modalDetalles').style.display = 'block';
  } catch (error) {
    console.error('❌ Error al obtener detalles:', error);
    alert(`❌ Error al obtener detalles: ${error.message}`);
  }
}

// Actualizar estadísticas
function actualizarEstadisticas(pedidos) {
  const totalEl = document.getElementById('total');
  const hoyEl = document.getElementById('hoy');
  const pendientesEl = document.getElementById('pendientes');
  const preparacionEl = document.getElementById('preparacion');
  const completadosEl = document.getElementById('completados');
  const statPeriodoEl = document.getElementById('statPeriodo');
  const periodoEl = document.getElementById('periodo');
  const labelPeriodoEl = document.getElementById('labelPeriodo');
  
  if (!totalEl || !hoyEl || !pendientesEl || !preparacionEl || !completadosEl) {
    return; // No es la página de pedidos
  }
  
  // Total de todos los pedidos (sin filtrar)
  totalEl.textContent = todosLosPedidos.length;
  
  // Fecha de hoy
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Contar pedidos de hoy de todos los pedidos (sin filtrar)
  const pedidosHoyTotal = todosLosPedidos.filter(p => {
    if (!p.fecha_pedido) return false;
    const fechaPedido = new Date(p.fecha_pedido);
    fechaPedido.setHours(0, 0, 0, 0);
    return fechaPedido.getTime() === hoy.getTime();
  });
  hoyEl.textContent = pedidosHoyTotal.length;
  
  // Contar pendientes (normalizado)
  const estadoPendienteNormalizado = normalizarEstado('pendiente');
  pendientesEl.textContent = pedidos.filter(p => normalizarEstado(p.estado) === estadoPendienteNormalizado).length;
  
  // Contar en preparación (normalizado)
  const estadoPreparacionNormalizado = normalizarEstado('en_preparacion');
  preparacionEl.textContent = pedidos.filter(p => normalizarEstado(p.estado) === estadoPreparacionNormalizado).length;
  
  // Contar completados (normalizado - incluye entregado, completado, listo, en_camino)
  const estadosCompletados = ['entregado', 'completado', 'listo', 'en_camino'];
  completadosEl.textContent = pedidos.filter(p => {
    const estadoNorm = normalizarEstado(p.estado);
    return estadosCompletados.some(e => normalizarEstado(e) === estadoNorm);
  }).length;
  
  // Mostrar/ocultar tarjeta de período según si hay filtros de fecha
  const fechaDesde = document.getElementById('fecha-desde');
  const fechaHasta = document.getElementById('fecha-hasta');
  
  if (statPeriodoEl && periodoEl && labelPeriodoEl && fechaDesde && fechaHasta) {
    const fechaDesdeValue = fechaDesde.value;
    const fechaHastaValue = fechaHasta.value;
    
    if (fechaDesdeValue || fechaHastaValue) {
      // Mostrar tarjeta de período
      statPeriodoEl.style.display = 'block';
      periodoEl.textContent = pedidos.length;
      
      // Actualizar etiqueta del período
      if (fechaDesdeValue && fechaHastaValue) {
        labelPeriodoEl.textContent = `Del ${formatearFechaCorta(fechaDesdeValue)} al ${formatearFechaCorta(fechaHastaValue)}`;
      } else if (fechaDesdeValue) {
        labelPeriodoEl.textContent = `Desde ${formatearFechaCorta(fechaDesdeValue)}`;
      } else if (fechaHastaValue) {
        labelPeriodoEl.textContent = `Hasta ${formatearFechaCorta(fechaHastaValue)}`;
      }
    } else {
      // Ocultar tarjeta de período si no hay filtros de fecha
      statPeriodoEl.style.display = 'none';
    }
  }
}

// Función para alternar ordenamiento por ID
function alternarOrdenamiento() {
  ordenAscendente = !ordenAscendente;
  const btnOrdenar = document.getElementById('btn-ordenar-id');
  
  if (!btnOrdenar) {
    return;
  }
  
  // Actualizar texto del botón
  if (ordenAscendente) {
    btnOrdenar.textContent = '🔢 Ordenar por ID (Asc)';
  } else {
    btnOrdenar.textContent = '🔢 Ordenar por ID (Desc)';
  }
  
  // Recargar pedidos para aplicar el nuevo orden
  cargarPedidos();
}

// Limpiar filtros
function limpiarFiltros() {
  const fechaDesde = document.getElementById('fecha-desde');
  const fechaHasta = document.getElementById('fecha-hasta');
  const estadoFiltro = document.getElementById('estadoFiltro');
  const tipoServicioFiltro = document.getElementById('tipoServicioFiltro');
  
  // Limpiar los campos del formulario
  if (fechaDesde) fechaDesde.value = '';
  if (fechaHasta) fechaHasta.value = '';
  if (estadoFiltro) estadoFiltro.value = '';
  if (tipoServicioFiltro) tipoServicioFiltro.value = '';
  
  // Resetear los filtros guardados
  filtrosAplicados = {
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    tipoServicio: ''
  };
  
  console.log('🧹 Filtros limpiados');
  cargarPedidos();
}

// Modal functions
function cerrarModal() {
  const modal = document.getElementById('modalDetalles');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
  const modal = document.getElementById('modalDetalles');
  if (event.target === modal) {
    cerrarModal();
  }
}

// Variable para evitar múltiples intervalos
let intervaloPedidos = null;

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', function() {
  // Actualizar nombre del trabajador en el sidebar
  actualizarNombreTrabajador();
  
  // Verificar si estamos en la página de pedidos
  const tablaPedidos = document.querySelector('#tablaPedidos');
  if (!tablaPedidos) {
    return;
  }
  
  console.log('📦 Script de pedidos cargado para trabajador');
  
  // Cargar pedidos
  cargarPedidos().catch(err => {
    console.error('❌ Error al cargar pedidos:', err);
    const tbody = document.querySelector('#tablaPedidos tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: #dc3545;">
            <strong>Error al cargar pedidos:</strong><br>
            ${err.message}<br>
            <small>Verifica que el servicio de pedidos esté corriendo en el puerto 4001</small>
          </td>
        </tr>
      `;
    }
  });
  
  // Inicializar texto del botón de ordenamiento
  const btnOrdenar = document.getElementById('btn-ordenar-id');
  if (btnOrdenar) {
    btnOrdenar.textContent = ordenAscendente 
      ? '🔢 Ordenar por ID (Asc)' 
      : '🔢 Ordenar por ID (Desc)';
  }
  
  // Auto-refresh cada 10 segundos para ver cambios en tiempo real (solo una vez)
  if (!intervaloPedidos) {
    intervaloPedidos = setInterval(() => {
      cargarPedidos().catch(err => {
        console.error('❌ Error en auto-refresh:', err);
      });
    }, 10000);
  }
});

// Exportar funciones globalmente
window.cargarPedidos = cargarPedidos;
window.filtrarPedidos = filtrarPedidos;
window.actualizarPedidos = actualizarPedidos;
window.limpiarFiltros = limpiarFiltros;
window.alternarOrdenamiento = alternarOrdenamiento;
window.verDetalles = verDetalles;
window.actualizarEstado = actualizarEstado;
window.cerrarModal = cerrarModal;

