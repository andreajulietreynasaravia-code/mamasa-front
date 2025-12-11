// Obtener URL de API de pagos desde config o usar variable de entorno
const PAGOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.pagos) 
  ? window.config.API_CONFIG.pagos 
  : (typeof process !== 'undefined' && process.env?.PAGOS_SERVICE_URL) 
    ? process.env.PAGOS_SERVICE_URL 
    : "http://localhost:4002";
const API_URL = `${PAGOS_SERVICE_URL}/pagos`;
let todosPagos = [];
let pagosFiltrados = [];

// Variable para controlar el ordenamiento por ID
let ordenAscendente = true;

// Variables para almacenar los filtros aplicados (solo se actualizan al hacer clic en "Filtrar")
let filtrosAplicados = {
  fechaDesde: '',
  fechaHasta: '',
  estado: 'todos',
  metodo: 'todos'
};

// Cargar total del día
async function cargarTotalDelDia() {
  try {
    const res = await fetch(`${API_URL}/total-del-dia`);
    if (!res.ok) throw new Error("Error al cargar total del día");
    const data = await res.json();
    document.getElementById("totalDia").textContent = `S/. ${data.total.toFixed(2)}`;
  } catch (err) {
    console.error("Error al cargar total del día:", err);
    document.getElementById("totalDia").textContent = "S/. 0.00";
  }
}

// Cargar total general
async function cargarTotalGeneral() {
  try {
    const res = await fetch(`${API_URL}/total-general`);
    if (!res.ok) throw new Error("Error al cargar total general");
    const data = await res.json();
    document.getElementById("totalGeneral").textContent = `S/. ${data.total.toFixed(2)}`;
  } catch (err) {
    console.error("Error al cargar total general:", err);
    document.getElementById("totalGeneral").textContent = "S/. 0.00";
  }
}

// Cargar todos los pagos desde la API
async function cargarTodosPagos() {
  try {
    const res = await fetch(`${API_URL}/todos`);
    if (!res.ok) throw new Error("Error al cargar pagos");
    todosPagos = await res.json();
    
    // Debug: verificar que se reciben las fechas
    if (todosPagos.length > 0) {
      console.log("💳 Primer pago recibido:", {
        id: todosPagos[0].id,
        fecha_ultimo_cambio: todosPagos[0].fecha_ultimo_cambio,
        tipo: typeof todosPagos[0].fecha_ultimo_cambio
      });
    }
    
    // Usar los filtros guardados (no leer de los campos)
    const hayFiltrosActivos = filtrosAplicados.fechaDesde || 
                              filtrosAplicados.fechaHasta || 
                              (filtrosAplicados.estado && filtrosAplicados.estado !== "todos") || 
                              (filtrosAplicados.metodo && filtrosAplicados.metodo !== "todos");
    
    if (hayFiltrosActivos) {
      // Si hay filtros guardados, aplicarlos
      pagosFiltrados = [...todosPagos];
      ejecutarFiltrado();
    } else {
      // Si no hay filtros guardados, mostrar todos
      pagosFiltrados = [...todosPagos];
      actualizarTarjetas(pagosFiltrados);
      mostrarPagos(pagosFiltrados);
    }
    
    // Inicializar texto del botón de ordenamiento
    const btnOrdenar = document.getElementById("btn-ordenar-id");
    if (btnOrdenar) {
      btnOrdenar.textContent = ordenAscendente 
        ? "🔢 Ordenar por ID (Asc)" 
        : "🔢 Ordenar por ID (Desc)";
    }
    
    return todosPagos;
  } catch (err) {
    console.error("Error al cargar pagos:", err);
    todosPagos = [];
    pagosFiltrados = [];
    actualizarTarjetas([]);
    mostrarPagos([]);
  }
}

// Actualizar las tarjetas con los datos filtrados
function actualizarTarjetas(pagos) {
  // Calcular total en período (solo pagos completados)
  const totalPeriodo = pagos
    .filter(p => p.estado === "completado")
    .reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
  
  // Contar pendientes y completados
  const pendientes = pagos.filter(p => p.estado === "pendiente").length;
  const completados = pagos.filter(p => p.estado === "completado").length;
  
  // Actualizar elementos del DOM
  document.getElementById("totalPeriodo").textContent = `S/. ${totalPeriodo.toFixed(2)}`;
  document.getElementById("totalPendientesCard").textContent = pendientes;
  document.getElementById("totalCompletadosCard").textContent = completados;
  
  // Actualizar etiqueta del período
  const fechaDesde = document.getElementById("fecha-desde").value;
  const fechaHasta = document.getElementById("fecha-hasta").value;
  const labelPeriodo = document.getElementById("labelPeriodo");
  
  if (fechaDesde && fechaHasta) {
    labelPeriodo.textContent = `Del ${formatearFechaCorta(fechaDesde)} al ${formatearFechaCorta(fechaHasta)}`;
  } else if (fechaDesde) {
    labelPeriodo.textContent = `Desde ${formatearFechaCorta(fechaDesde)}`;
  } else if (fechaHasta) {
    labelPeriodo.textContent = `Hasta ${formatearFechaCorta(fechaHasta)}`;
  } else {
    labelPeriodo.textContent = "Todos los pagos";
  }
}

// Formatear fecha corta para la etiqueta
function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
}

// Aplicar filtros (solo cuando se presiona el botón Filtrar)
function aplicarFiltros() {
  // Guardar los valores actuales de los filtros
  filtrosAplicados = {
    fechaDesde: document.getElementById("fecha-desde").value,
    fechaHasta: document.getElementById("fecha-hasta").value,
    estado: document.getElementById("filtro-estado").value,
    metodo: document.getElementById("filtro-metodo").value
  };
  
  console.log('🔍 Filtros aplicados:', filtrosAplicados);
  
  // Ejecutar el filtrado con los valores guardados
  ejecutarFiltrado();
}

// Ejecutar el filtrado usando los filtros guardados
function ejecutarFiltrado() {
  const fechaDesde = filtrosAplicados.fechaDesde;
  const fechaHasta = filtrosAplicados.fechaHasta;
  const estadoFiltro = filtrosAplicados.estado;
  const metodoFiltro = filtrosAplicados.metodo;
  
  // Empezar con todos los pagos
  pagosFiltrados = [...todosPagos];
  
  // Filtrar por fecha desde (incluye el día exacto)
  if (fechaDesde) {
    // Parsear la fecha en hora local (evitar problemas de zona horaria)
    const [yearDesde, monthDesde, dayDesde] = fechaDesde.split('-').map(Number);
    const desde = new Date(yearDesde, monthDesde - 1, dayDesde, 0, 0, 0, 0); // Inicio del día en hora local
    
    pagosFiltrados = pagosFiltrados.filter(p => {
      const fechaPago = new Date(p.fecha_pago || p.fecha_creacion);
      // Obtener solo la fecha del pago en hora local
      const fechaPagoLocal = new Date(fechaPago.getFullYear(), fechaPago.getMonth(), fechaPago.getDate(), 0, 0, 0, 0);
      return fechaPagoLocal >= desde;
    });
  }
  
  // Filtrar por fecha hasta (incluye el día exacto)
  if (fechaHasta) {
    // Parsear la fecha en hora local
    const [yearHasta, monthHasta, dayHasta] = fechaHasta.split('-').map(Number);
    const hasta = new Date(yearHasta, monthHasta - 1, dayHasta, 23, 59, 59, 999); // Fin del día en hora local
    
    pagosFiltrados = pagosFiltrados.filter(p => {
      const fechaPago = new Date(p.fecha_pago || p.fecha_creacion);
      return fechaPago <= hasta;
    });
  }
  
  // Filtrar por estado
  if (estadoFiltro === "pendientes") {
    pagosFiltrados = pagosFiltrados.filter(p => p.estado === "pendiente");
  } else if (estadoFiltro === "completados") {
    pagosFiltrados = pagosFiltrados.filter(p => p.estado === "completado");
  }
  
  // Filtrar por método de pago
  if (metodoFiltro === "yape") {
    pagosFiltrados = pagosFiltrados.filter(p => {
      const metodo = (p.metodo_pago || '').toLowerCase();
      return metodo === 'yape';
    });
  } else if (metodoFiltro === "efectivo") {
    pagosFiltrados = pagosFiltrados.filter(p => {
      const metodo = (p.metodo_pago || '').toLowerCase();
      return metodo === 'efectivo';
    });
  }
  
  // Actualizar tarjetas y tabla
  actualizarTarjetas(pagosFiltrados);
  mostrarPagos(pagosFiltrados);
}

// Función para alternar ordenamiento por ID
function alternarOrdenamiento() {
  ordenAscendente = !ordenAscendente;
  const btnOrdenar = document.getElementById("btn-ordenar-id");
  
  if (!btnOrdenar) {
    console.error('❌ No se encontró el botón de ordenamiento');
    return;
  }
  
  // Actualizar texto del botón
  btnOrdenar.textContent = ordenAscendente 
    ? "🔢 Ordenar por ID (Asc)" 
    : "🔢 Ordenar por ID (Desc)";
  
  // Re-renderizar la tabla con el nuevo orden
  // Si hay pagos filtrados, usar esos; si no, usar todos los pagos
  if (pagosFiltrados && pagosFiltrados.length > 0) {
    mostrarPagos(pagosFiltrados);
  } else if (todosPagos && todosPagos.length > 0) {
    mostrarPagos(todosPagos);
  } else {
    // Si no hay datos, recargar
    cargarTodosPagos();
  }
}

// Limpiar filtros
function limpiarFiltros() {
  // Limpiar los campos del formulario
  document.getElementById("fecha-desde").value = "";
  document.getElementById("fecha-hasta").value = "";
  document.getElementById("filtro-estado").value = "todos";
  document.getElementById("filtro-metodo").value = "todos";
  
  // Resetear los filtros guardados
  filtrosAplicados = {
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos',
    metodo: 'todos'
  };
  
  console.log('🧹 Filtros limpiados');
  
  // Restaurar todos los pagos
  pagosFiltrados = [...todosPagos];
  
  // Actualizar tarjetas y tabla (se ordenará por ID automáticamente en mostrarPagos)
  actualizarTarjetas(pagosFiltrados);
  mostrarPagos(pagosFiltrados);
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

// Función para ordenar pagos por ID
function ordenarPorId(pagos) {
  if (!pagos || pagos.length === 0) {
    return [];
  }
  
  const pagosOrdenados = [...pagos];
  pagosOrdenados.sort((a, b) => {
    // Convertir IDs a números, manejando casos donde el ID puede ser string o número
    const idA = parseInt(a.id) || parseInt(String(a.id || '').replace(/\D/g, '')) || 0;
    const idB = parseInt(b.id) || parseInt(String(b.id || '').replace(/\D/g, '')) || 0;
    return ordenAscendente ? idA - idB : idB - idA;
  });
  
  return pagosOrdenados;
}

// Mostrar pagos en la tabla
function mostrarPagos(lista) {
  const tbody = document.querySelector("#tablaPagos tbody");
  tbody.innerHTML = "";

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
          No hay pagos que coincidan con los filtros
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por ID antes de mostrar
  const pagosOrdenados = ordenarPorId(lista);

  pagosOrdenados.forEach(pago => {
    const fila = document.createElement("tr");
    const estadoClass = pago.estado === "completado" ? "estado-completado" : "estado-pendiente";
    const fechaFormateada = formatearFecha(pago.fecha_pago);
    
    // Badge para el estado (solo lectura)
    const estadoBadge = `<span class="estado-badge ${estadoClass}">${(pago.estado || "pendiente").charAt(0).toUpperCase() + (pago.estado || "pendiente").slice(1)}</span>`;
    
    // Formatear información del último cambio - solo mostrar la fecha
    // Si el pago es en efectivo, dejar en blanco
    const esEfectivo = pago.metodo_pago && pago.metodo_pago.toLowerCase() === 'efectivo';
    const fechaUltimoCambio = esEfectivo ? '' : (pago.fecha_ultimo_cambio ? formatearFecha(pago.fecha_ultimo_cambio) : 'N/A');
    
    fila.innerHTML = `
      <td>${pago.id}</td>
      <td>${pago.pedido_id || "-"}</td>
      <td><strong>${pago.metodo_pago || "-"}</strong></td>
      <td><strong style="color: #28a745;">S/. ${parseFloat(pago.monto_total || 0).toFixed(2)}</strong></td>
      <td>${fechaFormateada}</td>
      <td>${estadoBadge}</td>
      <td>${fechaUltimoCambio}</td>
    `;
    tbody.appendChild(fila);
  });
}

// Confirmar pago
async function confirmarPago(id, metodo_pago) {
  console.log("💳 Confirmar pago - ID:", id, "Método:", metodo_pago);
  
  if (!id) {
    alert("❌ ID de pago inválido");
    return;
  }

  if (metodo_pago && metodo_pago.toLowerCase() === "efectivo") {
    alert("ℹ️ Los pagos en efectivo se confirman automáticamente");
    return;
  }

  const confirmar = confirm("¿Deseas confirmar este pago?");
  if (!confirmar) return;

  try {
    console.log("💳 Enviando confirmación a:", `${API_URL}/confirmar/${id}`);
    const res = await fetch(`${API_URL}/confirmar/${id}`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });
    
    console.log("💳 Respuesta status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Error al confirmar pago:", errorText);
      alert(`❌ Error al confirmar pago: ${res.status}`);
      return;
    }
    
    const data = await res.json();
    console.log("✅ Pago confirmado:", data);
    alert("✅ Pago confirmado correctamente");
    
    // Recargar todos los datos y mantener los filtros aplicados
    await cargarTodosPagos();
    await cargarTotalDelDia();
    await cargarTotalGeneral();
    
    // Volver a aplicar los filtros actuales
    aplicarFiltros();
  } catch (err) {
    console.error("❌ Error al confirmar pago:", err);
    alert("❌ Error al confirmar el pago: " + err.message);
  }
}

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos iniciales
  cargarTodosPagos();
  cargarTotalDelDia();
  cargarTotalGeneral();
  
  // Event listeners para los botones de filtro
  document.getElementById("btn-filtrar").addEventListener("click", aplicarFiltros);
  document.getElementById("btn-limpiar").addEventListener("click", limpiarFiltros);
  document.getElementById("btn-ordenar-id").addEventListener("click", alternarOrdenamiento);
  
  // Inicializar texto del botón de ordenamiento
  const btnOrdenar = document.getElementById("btn-ordenar-id");
  if (btnOrdenar) {
    btnOrdenar.textContent = ordenAscendente 
      ? "🔢 Ordenar por ID (Asc)" 
      : "🔢 Ordenar por ID (Desc)";
  }
  
  // Auto-refresh cada 5 segundos para ver cambios en tiempo real
  setInterval(async () => {
    await cargarTodosPagos();
    await cargarTotalDelDia();
    await cargarTotalGeneral();
    
    // Usar los filtros guardados (no leer de los campos)
    const hayFiltrosActivos = filtrosAplicados.fechaDesde || 
                              filtrosAplicados.fechaHasta || 
                              (filtrosAplicados.estado && filtrosAplicados.estado !== "todos") || 
                              (filtrosAplicados.metodo && filtrosAplicados.metodo !== "todos");
    
    // Solo aplicar filtros si hay alguno guardado
    if (hayFiltrosActivos) {
      ejecutarFiltrado();
    }
  }, 5000);
});

// ⚡ Exponer funciones globalmente para los botones inline
window.confirmarPago = confirmarPago;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
