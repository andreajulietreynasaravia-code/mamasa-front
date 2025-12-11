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
    
    // Verificar si los elementos existen (solo en página de pedidos)
    const fechaDesde = document.getElementById('fecha-desde');
    const fechaHasta = document.getElementById('fecha-hasta');
    const estadoFiltro = document.getElementById('estadoFiltro');
    const tipoServicioFiltro = document.getElementById('tipoServicioFiltro');
    
    // Si no existen los filtros, usar valores por defecto
    const fechaDesdeValue = fechaDesde ? fechaDesde.value : '';
    const fechaHastaValue = fechaHasta ? fechaHasta.value : '';
    const estado = estadoFiltro ? estadoFiltro.value : '';
    const tipoServicio = tipoServicioFiltro ? tipoServicioFiltro.value : '';

    // Asegurar que API_BASE esté inicializada
    inicializarAPI();
    
    // Asegurar que API_BASE esté inicializada
    inicializarAPI();
    
    const url = `${API_BASE}/listar`;
    console.log('📦 Cargando pedidos desde:', url);
    console.log('📦 API_BASE:', API_BASE);
    console.log('📦 API_BASE:', API_BASE);
    
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

    // Filtrar por fecha desde si está especificado
    if (fechaDesdeValue) {
      // Crear fecha desde en formato YYYY-MM-DD para comparación precisa
      const [yearDesde, monthDesde, dayDesde] = fechaDesdeValue.split('-').map(Number);
      const desdeSolo = new Date(yearDesde, monthDesde - 1, dayDesde);
      desdeSolo.setHours(0, 0, 0, 0);
      
      pedidos = pedidos.filter(p => {
        if (!p.fecha_pedido) return false;
        const fechaPedido = new Date(p.fecha_pedido);
        // Extraer solo año, mes y día para comparación precisa
        const fechaPedidoSolo = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate());
        fechaPedidoSolo.setHours(0, 0, 0, 0);
        
        // Comparar timestamps
        return fechaPedidoSolo.getTime() >= desdeSolo.getTime();
      });
      console.log(`📅 Filtrado desde ${fechaDesdeValue}: ${pedidos.length} pedidos`);
    }

    // Filtrar por fecha hasta si está especificado
    if (fechaHastaValue) {
      // Crear fecha hasta en formato YYYY-MM-DD para comparación precisa
      const [yearHasta, monthHasta, dayHasta] = fechaHastaValue.split('-').map(Number);
      const hastaSolo = new Date(yearHasta, monthHasta - 1, dayHasta);
      hastaSolo.setHours(23, 59, 59, 999);
      
      pedidos = pedidos.filter(p => {
        if (!p.fecha_pedido) return false;
        const fechaPedido = new Date(p.fecha_pedido);
        // Extraer solo año, mes y día para comparación precisa
        const fechaPedidoSolo = new Date(fechaPedido.getFullYear(), fechaPedido.getMonth(), fechaPedido.getDate());
        fechaPedidoSolo.setHours(0, 0, 0, 0);
        
        // Comparar timestamps
        return fechaPedidoSolo.getTime() <= hastaSolo.getTime();
      });
      console.log(`📅 Filtrado hasta ${fechaHastaValue}: ${pedidos.length} pedidos`);
    }

    // Filtrar por estado si está especificado
    if (estado) {
      console.log('🔍 Filtrando por estado:', estado);
      console.log('🔍 Estados de pedidos antes del filtro:', pedidos.map(p => ({ id: p.id_pedido, estado: p.estado })));
      
      // Normalizar el estado del filtro para comparar con diferentes variantes
      const estadoNormalizado = estado.toLowerCase().replace(/[_\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      pedidos = pedidos.filter(p => {
        if (!p.estado) return false;
        // Normalizar el estado del pedido para comparar
        const estadoPedidoNormalizado = p.estado.toLowerCase().replace(/[_\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const coincide = estadoPedidoNormalizado === estadoNormalizado;
        
        // Log para debugging
        if (coincide) {
          console.log(`✅ Pedido ${p.id_pedido} coincide: "${p.estado}" (normalizado: "${estadoPedidoNormalizado}") con filtro "${estado}" (normalizado: "${estadoNormalizado}")`);
        }
        
        return coincide;
      });
      
      console.log(`🔍 Pedidos después del filtro: ${pedidos.length}`);
      console.log('🔍 Estados de pedidos después del filtro:', pedidos.map(p => ({ id: p.id_pedido, estado: p.estado })));
    }

    // Filtrar por tipo de servicio si está especificado
    if (tipoServicio) {
      pedidos = pedidos.filter(p => p.tipo_servicio === tipoServicio);
    }

    // Guardar pedidos cargados para usar en el modal de detalles
    pedidosCargados = pedidos;
    
    // Ordenar por ID
    mostrarPedidos(pedidos);
    actualizarEstadisticas(pedidos);
    
    // Mostrar notificación si hay pedidos
    if (pedidos.length > 0) {
      console.log(`✅ ${pedidos.length} pedidos cargados correctamente`);
    }
  } catch (error) {
    console.error('❌ Error cargando pedidos:', error);
    console.error('❌ Stack trace:', error.stack);
    const tbody = document.querySelector('#tablaPedidos tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: #dc3545;">
            <strong>Error al cargar pedidos:</strong><br>
            ${error.message}<br>
            <small>Verifica que el servicio de pedidos esté corriendo en el puerto 4001</small><br>
            <small>URL intentada: ${API_BASE}/listar</small>
          </td>
        </tr>
      `;
    }
    
    // Actualizar estadísticas con valores en 0
    actualizarEstadisticas([]);
    
    // Re-lanzar el error para que se pueda capturar en el catch externo
    throw error;
  }
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
    return; // No es la página de pedidos
  }
  tbody.innerHTML = '';

  if (pedidos.length === 0) {
    console.log('📋 No hay pedidos para mostrar');
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #999;">
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
    console.log(`📋 Datos de último cambio - ultimo_cambio_por:`, pedido.ultimo_cambio_por, 'trabajador_nombre:', pedido.trabajador_nombre, 'fecha_ultimo_cambio:', pedido.fecha_ultimo_cambio);
    const fila = document.createElement('tr');
    
    // Formatear información del último cambio
    // Verificar si hay información del trabajador (puede venir como ultimo_cambio_por, trabajador_nombre, etc.)
    let ultimoCambioPor = pedido.ultimo_cambio_por || pedido.trabajador_nombre || null;
    
    // Si el valor es 'N/A' o está vacío, verificar si hay fecha de cambio (significa que hubo un cambio pero sin trabajador registrado)
    if (!ultimoCambioPor || ultimoCambioPor === 'N/A' || ultimoCambioPor.trim() === '') {
      if (pedido.fecha_ultimo_cambio) {
        ultimoCambioPor = 'Sistema'; // Si hay fecha pero no trabajador, fue cambio automático
      } else {
        ultimoCambioPor = 'Sin cambios'; // Si no hay fecha ni trabajador, nunca se ha cambiado
      }
    }
    
    const fechaUltimoCambio = pedido.fecha_ultimo_cambio ? formatearFecha(pedido.fecha_ultimo_cambio) : 'N/A';
    
    // Obtener nombre del cliente (puede venir como cliente_nombre o cliente)
    const nombreCliente = pedido.cliente_nombre || pedido.cliente || 'Sin nombre';
    
    // Para pedidos de tipo "local" y "llevar", mostrar el nombre del cliente de manera destacada
    const esLocalOLlevar = pedido.tipo_servicio === 'local' || pedido.tipo_servicio === 'llevar';
    const mostrarNombreCliente = esLocalOLlevar ? 
      `<strong style="color: #2c3e50; font-size: 1.05em;">${nombreCliente}</strong>` : 
      `<strong>${nombreCliente}</strong>`;
    
    // Para pedidos de tipo "local" y "llevar", no mostrar dirección (dejar en blanco)
    const mostrarDireccion = esLocalOLlevar ? '' : `<br><small style="color: #666;">${pedido.calle_avenida || 'Sin dirección'}</small>`;
    
    // Formatear la celda de último cambio: trabajador en negrita, fecha debajo
    const mostrarUltimoCambio = fechaUltimoCambio !== 'N/A' ? 
      `<strong style="color: #2c3e50;">${ultimoCambioPor}</strong><br><small style="color: #666;">${fechaUltimoCambio}</small>` :
      `<strong style="color: #999;">${ultimoCambioPor}</strong>`;
    
    fila.innerHTML = `
      <td><strong>#${pedido.id_pedido || 'N/A'}</strong></td>
      <td>
        ${mostrarNombreCliente}${mostrarDireccion}
      </td>
      <td>${formatearFecha(pedido.fecha_pedido)}</td>
      <td>${obtenerEtiquetaTipoServicio(pedido.tipo_servicio)}</td>
      <td><strong>S/ ${parseFloat(pedido.monto_total || 0).toFixed(2)}</strong></td>
      <td><span class="estado ${pedido.estado || 'pendiente'}">${obtenerEtiquetaEstado(pedido.estado || 'pendiente')}</span></td>
      <td>
        ${mostrarUltimoCambio}
      </td>
      <td>
        <button onclick="verDetalles(${pedido.id_pedido})" class="btn-ver">Ver</button>
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
    listo: '✅ Listo',
    en_camino: '🚚 En Camino',
    entregado: '🎉 Entregado',
    cancelado: '❌ Cancelado'
  };
  return estados[estado] || estado;
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

    // Formatear información del último cambio
    const ultimoCambioPor = pedido.ultimo_cambio_por || 'N/A';
    const fechaUltimoCambio = pedido.fecha_ultimo_cambio ? formatearFecha(pedido.fecha_ultimo_cambio) : 'N/A';

    document.getElementById('detallesContenido').innerHTML = `
      <p><strong>ID Pedido:</strong> #${pedido.id_pedido}</p>
      <p><strong>Cliente:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
      <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha_pedido)}</p>
      <p><strong>Tipo Servicio:</strong> ${obtenerEtiquetaTipoServicio(pedido.tipo_servicio)}</p>
      <p><strong>Método de Pago:</strong> ${pedido.metodo_pago || 'N/A'}</p>
      <p><strong>Monto Total:</strong> S/ ${parseFloat(pedido.monto_total || 0).toFixed(2)}</p>
      <p><strong>Estado:</strong> <span class="estado ${pedido.estado}">${obtenerEtiquetaEstado(pedido.estado)}</span></p>
      ${pedido.calle_avenida ? `<p><strong>Dirección:</strong> ${pedido.calle_avenida}</p>` : ''}
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid #ddd;">
      <p><strong>Último cambio realizado por:</strong> ${ultimoCambioPor}</p>
      <p><strong>Fecha del último cambio:</strong> ${fechaUltimoCambio}</p>
    `;

    document.getElementById('modalDetalles').style.display = 'block';
  } catch (error) {
    console.error('Error cargando detalles:', error);
    alert('Error al cargar los detalles del pedido');
  }
}

// Nota: El administrador no puede actualizar estados, solo verlos
// Las funciones actualizarEstado y obtenerEstadoActual han sido eliminadas

// Actualizar estadísticas
function actualizarEstadisticas(pedidos) {
  const totalEl = document.getElementById('total');
  const hoyEl = document.getElementById('hoy');
  const pendientesEl = document.getElementById('pendientes');
  const preparacionEl = document.getElementById('preparacion');
  const completadosEl = document.getElementById('completados');
  const periodoEl = document.getElementById('periodo');
  const labelPeriodoEl = document.getElementById('labelPeriodo');
  const statPeriodoEl = document.getElementById('statPeriodo');
  
  // Solo actualizar si los elementos existen (página de pedidos)
  if (!totalEl || !hoyEl || !pendientesEl || !preparacionEl || !completadosEl) {
    return;
  }
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const pedidosHoy = pedidos.filter(p => {
    if (!p.fecha_pedido) return false;
    const fechaPedido = new Date(p.fecha_pedido);
    fechaPedido.setHours(0, 0, 0, 0);
    return fechaPedido.getTime() === hoy.getTime();
  });

  // Función auxiliar para normalizar estados (igual que en el filtro)
  const normalizarEstado = (estado) => {
    if (!estado) return '';
    return estado.toLowerCase().replace(/[_\s]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // El total siempre muestra todos los pedidos sin filtrar
  const pedidosParaTotal = todosLosPedidos.length > 0 ? todosLosPedidos : pedidosCargados;
  totalEl.textContent = pedidosParaTotal.length;
  
  // Contar pedidos de hoy de todos los pedidos (sin filtrar)
  const pedidosHoyTotal = pedidosParaTotal.filter(p => {
    if (!p.fecha_pedido) return false;
    const fechaPedido = new Date(p.fecha_pedido);
    fechaPedido.setHours(0, 0, 0, 0);
    return fechaPedido.getTime() === hoy.getTime();
  });
  hoyEl.textContent = pedidosHoyTotal.length;
  
  // Contar pendientes (normalizado)
  const estadoPendienteNormalizado = normalizarEstado('pendiente');
  pendientesEl.textContent = pedidos.filter(p => normalizarEstado(p.estado) === estadoPendienteNormalizado).length;
  
  // Contar en preparación (normalizado - puede ser "en_preparacion", "en preparación", "en preparacion")
  const estadoPreparacionNormalizado = normalizarEstado('en_preparacion');
  preparacionEl.textContent = pedidos.filter(p => normalizarEstado(p.estado) === estadoPreparacionNormalizado).length;
  
  // Contar completados/entregados (normalizado)
  const estadoEntregadoNormalizado = normalizarEstado('entregado');
  completadosEl.textContent = pedidos.filter(p => normalizarEstado(p.estado) === estadoEntregadoNormalizado).length;
  
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
    return; // No es la página de pedidos
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
  
  if (fechaDesde) fechaDesde.value = '';
  if (fechaHasta) fechaHasta.value = '';
  if (estadoFiltro) estadoFiltro.value = '';
  if (tipoServicioFiltro) tipoServicioFiltro.value = '';
  
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

// Función para cargar datos cuando el admin está logueado
window.cargarDatosAdmin = function(admin) {
  console.log('📦 cargarDatosAdmin llamado para pedidos');
  // Verificar si estamos en la página de pedidos
  const tablaPedidos = document.querySelector('#tablaPedidos');
  if (tablaPedidos) {
    console.log('📦 Página de pedidos detectada, cargando datos...');
    // Esperar un poco para asegurar que el DOM esté listo y el panel esté visible
    setTimeout(() => {
      console.log('📦 Ejecutando cargarPedidos()...');
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
    }, 500);
  }
};

// Cargar al iniciar - mostrar todos los pedidos
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si estamos en la página de pedidos
  const tablaPedidos = document.querySelector('#tablaPedidos');
  if (!tablaPedidos) {
    // No es la página de pedidos, no hacer nada
    return;
  }
  
  console.log('📦 Script de pedidos cargado, esperando autenticación...');
  
  // Esperar a que adminAuth.js cargue el admin
  setTimeout(() => {
    // Si ya hay sesión, cargar pedidos
    if (window.auth && window.auth.getCurrentUser && window.auth.getCurrentRole) {
      const user = window.auth.getCurrentUser();
      const role = window.auth.getCurrentRole();
      if (user && role === 'administrador') {
        console.log('📦 Admin logueado, cargando pedidos...');
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
      } else {
        console.log('📦 No hay admin logueado aún');
      }
    } else {
      console.log('📦 window.auth no está disponible aún');
    }
  }, 1000);
});

