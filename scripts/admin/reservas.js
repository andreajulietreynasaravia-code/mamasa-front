// Script para la página de reservas del administrador
// Obtener URL de API de reservas usando variables de entorno
const RESERVAS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.reservas) 
  ? window.config.API_CONFIG.reservas 
  : (typeof process !== 'undefined' && process.env?.RESERVAS_SERVICE_URL) 
    ? `${process.env.RESERVAS_SERVICE_URL}/api` 
    : "http://localhost:4004/api";
const API_BASE = `${RESERVAS_SERVICE_URL}/reservas`;
    
// Variable para controlar el ordenamiento por ID
let ordenAscendente = true;

// Variables para almacenar los filtros aplicados (solo se actualizan al hacer clic en "Filtrar")
let filtrosAplicados = {
  fechaDesde: '',
  fechaHasta: '',
  estado: '',
  tipo: ''
};

// Formatear fecha corta para etiquetas (DD/MM/YYYY)
function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
}

// Aplicar filtros (solo cuando se presiona el botón Filtrar)
function aplicarFiltros() {
  // Guardar los valores actuales de los filtros
  filtrosAplicados = {
    fechaDesde: document.getElementById('fecha-desde')?.value || '',
    fechaHasta: document.getElementById('fecha-hasta')?.value || '',
    estado: document.getElementById('estadoFiltro')?.value || '',
    tipo: document.getElementById('tipoFiltro')?.value || ''
  };
  
  console.log('🔍 Filtros aplicados:', filtrosAplicados);
  cargarReservas();
}

// Cargar reservas
async function cargarReservas() {
  try {
    // Verificar si los elementos existen (solo en página de reservas)
    const fechaDesdeEl = document.getElementById('fecha-desde');
    const fechaHastaEl = document.getElementById('fecha-hasta');
    const estadoFiltroEl = document.getElementById('estadoFiltro');
    const tipoFiltroEl = document.getElementById('tipoFiltro');
    
    // Si no existen, no es la página de reservas, salir
    if (!fechaDesdeEl || !fechaHastaEl || !estadoFiltroEl || !tipoFiltroEl) {
      return;
    }
    
    // Usar los filtros guardados (no leer de los campos directamente)
    const fechaDesdeValue = filtrosAplicados.fechaDesde;
    const fechaHastaValue = filtrosAplicados.fechaHasta;
    const estado = filtrosAplicados.estado;
    const tipo = filtrosAplicados.tipo;

    let url = API_BASE;
    const params = new URLSearchParams();
    
    // Agregar filtros a los parámetros de la URL si están especificados
    if (estado) {
      params.append('estado', estado);
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log('📅 Cargando reservas desde:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    let reservas = await response.json();
    console.log('📅 Reservas recibidas:', reservas.length);

    // Filtrar por rango de fechas si está especificado
    if (fechaDesdeValue) {
      const [yearDesde, monthDesde, dayDesde] = fechaDesdeValue.split('-').map(Number);
      const desdeSolo = new Date(yearDesde, monthDesde - 1, dayDesde, 0, 0, 0, 0);
      
      reservas = reservas.filter(r => {
        if (!r.fecha_reserva) return false;
        // Usar zona horaria de Perú para la fecha de reserva
        const fechaReserva = new Date(r.fecha_reserva);
        const fechaPeruStr = fechaReserva.toLocaleString('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [month, day, year] = fechaPeruStr.split('/');
        const fechaReservaSolo = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
        return fechaReservaSolo.getTime() >= desdeSolo.getTime();
      });
      console.log(`📅 Filtrado desde ${fechaDesdeValue}: ${reservas.length} reservas`);
    }

    if (fechaHastaValue) {
      const [yearHasta, monthHasta, dayHasta] = fechaHastaValue.split('-').map(Number);
      const hastaSolo = new Date(yearHasta, monthHasta - 1, dayHasta, 23, 59, 59, 999);
      
      reservas = reservas.filter(r => {
        if (!r.fecha_reserva) return false;
        // Usar zona horaria de Perú para la fecha de reserva
        const fechaReserva = new Date(r.fecha_reserva);
        const fechaPeruStr = fechaReserva.toLocaleString('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });
        const [month, day, year] = fechaPeruStr.split('/');
        const fechaReservaSolo = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
        return fechaReservaSolo.getTime() <= hastaSolo.getTime();
      });
      console.log(`📅 Filtrado hasta ${fechaHastaValue}: ${reservas.length} reservas`);
    }

    // Filtrar por tipo si es necesario
    if (tipo) {
      reservas = reservas.filter(r => r.tipo_reserva === tipo);
    }

    // No ordenar por fecha aquí, se ordenará por ID en mostrarReservas
    mostrarReservas(reservas);
    actualizarEstadisticas(reservas);
    
    // Mostrar notificación si hay reservas
    if (reservas.length > 0) {
      console.log(`✅ ${reservas.length} reservas cargadas correctamente`);
    }
  } catch (error) {
    console.error('❌ Error cargando reservas:', error);
    alert(`Error al cargar las reservas: ${error.message}`);
  }
}

// Formatear fecha en zona horaria de Perú (para fecha_reserva)
function formatearFechaPeru(fecha) {
  if (!fecha) return '-';
  
  try {
    // MongoDB devuelve fechas en formato ISO (UTC)
    // Necesitamos extraer la fecha original que se guardó
    const date = new Date(fecha);
    
    // Cuando MongoDB guarda una fecha con timezone -05:00, la convierte a UTC
    // Por ejemplo: 2024-11-20T00:00:00-05:00 se guarda como 2024-11-20T05:00:00Z
    // Necesitamos revertir esto para mostrar la fecha correcta
    
    // Obtener la fecha en zona horaria de Perú
    const fechaPeruStr = date.toLocaleString('en-US', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Parsear la fecha formateada
    const [month, day, year] = fechaPeruStr.split('/');
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error, fecha);
    // Si hay error, intentar formatear directamente
    const date = new Date(fecha);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
}

// Función para formatear la fecha (exactamente igual que en pedidos)
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

// Obtener fecha como string YYYY-MM-DD desde fecha de MongoDB
function obtenerFechaString(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  const fechaPeru = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const year = fechaPeru.getFullYear();
  const month = String(fechaPeru.getMonth() + 1).padStart(2, '0');
  const day = String(fechaPeru.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtener fecha de hoy en zona horaria de Perú
function obtenerHoyPeru() {
  const hoy = new Date();
  const fechaPeruStr = hoy.toLocaleString('en-US', { 
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = fechaPeruStr.split('/');
  return `${day}/${month}/${year}`;
}

// Función para ordenar reservas por ID
function ordenarPorId(reservas) {
  const reservasOrdenadas = [...reservas];
  reservasOrdenadas.sort((a, b) => {
    // Usar los primeros 8 caracteres del _id para ordenar
    const idA = a._id.substring(0, 8);
    const idB = b._id.substring(0, 8);
    return ordenAscendente ? idA.localeCompare(idB) : idB.localeCompare(idA);
  });
  return reservasOrdenadas;
}

// Mostrar reservas en tabla
function mostrarReservas(reservas) {
  const tbody = document.querySelector('#tablaReservas tbody');
  if (!tbody) {
    return; // No es la página de reservas
  }
  tbody.innerHTML = '';

  if (reservas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #999;">
          No hay reservas disponibles
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por ID antes de mostrar
  const reservasOrdenadas = ordenarPorId(reservas);

  const hoyPeru = obtenerHoyPeru();

  reservasOrdenadas.forEach(reserva => {
    const fechaReserva = formatearFechaPeru(reserva.fecha_reserva);
    const esHoy = fechaReserva === hoyPeru;
    
    // Formatear información del último cambio
    const ultimoCambioPor = reserva.ultimo_cambio_por || 'N/A';
    const fechaUltimoCambio = reserva.fecha_ultimo_cambio ? formatearFecha(reserva.fecha_ultimo_cambio) : 'N/A';
    
    const fila = document.createElement('tr');
    if (esHoy) fila.classList.add('hoy');
    
    fila.innerHTML = `
      <td><strong>${reserva._id.substring(0, 8)}...</strong></td>
      <td>
        <strong>${reserva.cliente_nombre}</strong><br>
        <small style="color: #666;">📞 ${reserva.cliente_telefono}</small><br>
        <small style="color: #666;">✉️ ${reserva.cliente_email}</small>
      </td>
      <td><strong>${fechaReserva}</strong></td>
      <td><strong>${reserva.hora_reserva}</strong></td>
      <td>${reserva.numero_personas} 👥</td>
      <td>${obtenerEtiquetaTipo(reserva.tipo_reserva)}</td>
      <td><span class="estado ${reserva.estado}">${reserva.estado}</span></td>
      <td>
        <small style="color: #666;">
          ${ultimoCambioPor !== 'N/A' ? `<strong>${ultimoCambioPor}</strong><br>` : ''}
          ${fechaUltimoCambio !== 'N/A' ? fechaUltimoCambio : ''}
        </small>
      </td>
    `;
    tbody.appendChild(fila);
  });
}

// Obtener etiqueta para tipo de reserva
function obtenerEtiquetaTipo(tipo) {
  const tipos = {
    desayuno: '☀️ Desayuno',
    almuerzo: '🍽️ Almuerzo',
    cena: '🌙 Cena',
    merienda: '🍵 Merienda'
  };
  return tipos[tipo] || tipo;
}

// Ver detalles de reserva
async function verDetalles(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const reserva = await response.json();

    let platosHTML = '';
    if (reserva.platos_reservados && reserva.platos_reservados.length > 0) {
      platosHTML = `
        <h3>Platos Reservados:</h3>
        <div class="platos-lista">
          ${reserva.platos_reservados.map(plato => `
            <div class="plato-item">
              <span>${plato.cantidad}x ${plato.plato_nombre}</span>
              <span>S/ ${(plato.precio * plato.cantidad).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Formatear información del último cambio
    const ultimoCambioPor = reserva.ultimo_cambio_por || 'N/A';
    const fechaUltimoCambio = reserva.fecha_ultimo_cambio ? formatearFecha(reserva.fecha_ultimo_cambio) : 'N/A';
    const ultimoCambioHTML = ultimoCambioPor !== 'N/A' && fechaUltimoCambio !== 'N/A' 
      ? `<p><strong>Último Cambio:</strong> ${ultimoCambioPor} - ${fechaUltimoCambio}</p>`
      : '';

    document.getElementById('detallesContenido').innerHTML = `
      <p><strong>Cliente:</strong> ${reserva.cliente_nombre}</p>
      <p><strong>Email:</strong> ${reserva.cliente_email}</p>
      <p><strong>Teléfono:</strong> ${reserva.cliente_telefono}</p>
      <p><strong>Fecha:</strong> ${formatearFechaPeru(reserva.fecha_reserva)}</p>
      <p><strong>Hora:</strong> ${reserva.hora_reserva}</p>
      <p><strong>Personas:</strong> ${reserva.numero_personas}</p>
      <p><strong>Tipo:</strong> ${obtenerEtiquetaTipo(reserva.tipo_reserva)}</p>
      <p><strong>Estado:</strong> <span class="estado ${reserva.estado}">${reserva.estado}</span></p>
      ${ultimoCambioHTML}
      ${reserva.notas_especiales ? `<p><strong>Notas:</strong> ${reserva.notas_especiales}</p>` : ''}
      ${platosHTML}
    `;

    document.getElementById('modalDetalles').style.display = 'block';
  } catch (error) {
    console.error('Error cargando detalles:', error);
    alert('Error al cargar los detalles');
  }
}

// Actualizar estadísticas
function actualizarEstadisticas(reservas) {
  const totalEl = document.getElementById('total');
  const hoyEl = document.getElementById('hoy');
  const confirmadasEl = document.getElementById('confirmadas');
  const pendientesEl = document.getElementById('pendientes');
  
  // Solo actualizar si los elementos existen (página de reservas)
  if (!totalEl || !hoyEl || !confirmadasEl || !pendientesEl) {
    return;
  }
  
  const hoyPeru = obtenerHoyPeru();
  const reservasHoy = reservas.filter(r => 
    formatearFechaPeru(r.fecha_reserva) === hoyPeru
  );

  totalEl.textContent = reservas.length;
  hoyEl.textContent = reservasHoy.length;
  confirmadasEl.textContent = reservas.filter(r => r.estado === 'confirmada').length;
  pendientesEl.textContent = reservas.filter(r => r.estado === 'pendiente').length;
}

// Función para alternar ordenamiento por ID
function alternarOrdenamiento() {
  ordenAscendente = !ordenAscendente;
  const btnOrdenar = document.getElementById('btn-ordenar-id');
  
  if (!btnOrdenar) {
    return; // No es la página de reservas
  }
  
  // Actualizar texto del botón
  if (ordenAscendente) {
    btnOrdenar.textContent = '🔢 Ordenar por ID (Asc)';
  } else {
    btnOrdenar.textContent = '🔢 Ordenar por ID (Desc)';
  }
  
  // Recargar reservas para aplicar el nuevo orden
  cargarReservas();
}

// Limpiar filtros
function limpiarFiltros() {
  const fechaDesde = document.getElementById('fecha-desde');
  const fechaHasta = document.getElementById('fecha-hasta');
  const estadoFiltro = document.getElementById('estadoFiltro');
  const tipoFiltro = document.getElementById('tipoFiltro');
  
  // Limpiar los campos del formulario
  if (fechaDesde) fechaDesde.value = '';
  if (fechaHasta) fechaHasta.value = '';
  if (estadoFiltro) estadoFiltro.value = '';
  if (tipoFiltro) tipoFiltro.value = '';
  
  // Resetear los filtros guardados
  filtrosAplicados = {
    fechaDesde: '',
    fechaHasta: '',
    estado: '',
    tipo: ''
  };
  
  console.log('🧹 Filtros limpiados');
  
  if (fechaDesde && fechaHasta && estadoFiltro && tipoFiltro) {
    cargarReservas();
  }
}

// Mostrar notificación de actualización
function mostrarNotificacionActualizacion() {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = '✅ Lista actualizada';
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Modal functions
function cerrarModal() {
  document.getElementById('modalDetalles').style.display = 'none';
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
  const modal = document.getElementById('modalDetalles');
  if (event.target === modal) {
    cerrarModal();
  }
}

// Función para mostrar modal de nueva reserva (placeholder)
function mostrarModalNuevaReserva() {
  alert('Funcionalidad de nueva reserva desde admin - próximamente');
  // Aquí se puede implementar un modal para crear reservas desde el admin
}

// Cargar al iniciar - mostrar todas las reservas
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si estamos en la página de reservas
  const tablaReservas = document.querySelector('#tablaReservas');
  if (tablaReservas) {
    // Es la página de reservas
    // No establecer filtro de fecha por defecto para mostrar todas las reservas
    // El usuario puede filtrar si lo desea
    cargarReservas();
    
    // Inicializar texto del botón de ordenamiento
    const btnOrdenar = document.getElementById('btn-ordenar-id');
    if (btnOrdenar) {
      btnOrdenar.textContent = ordenAscendente 
        ? '🔢 Ordenar por ID (Asc)' 
        : '🔢 Ordenar por ID (Desc)';
    }
    
    // Auto-refresh cada 5 segundos para ver cambios en tiempo real
    setInterval(() => {
      cargarReservas();
    }, 5000);
  }
});

// Función global para cargar datos cuando se muestra el panel (llamada por adminAuth.js)
window.cargarDatosAdmin = function(admin) {
  console.log('📦 cargarDatosAdmin llamado para reservas', admin);
  
  // Verificar si estamos en la página de reservas
  const tablaReservas = document.querySelector('#tablaReservas');
  if (tablaReservas) {
    // Es la página de reservas, cargar reservas
    setTimeout(() => {
      cargarReservas();
    }, 300);
  }
};

