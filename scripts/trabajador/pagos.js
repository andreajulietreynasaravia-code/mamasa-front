// Inicializar API desde config usando variables de entorno
const PAGOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.pagos) 
  ? window.config.API_CONFIG.pagos 
  : (typeof process !== 'undefined' && process.env?.PAGOS_SERVICE_URL) 
    ? process.env.PAGOS_SERVICE_URL 
    : "http://localhost:4002";
let API_URL = `${PAGOS_SERVICE_URL}/pagos`;
let todosPagos = [];
let pagosFiltrados = [];
let filtrosActivos = false; // Variable para rastrear si hay filtros aplicados
let ordenActual = null; // null = sin orden, 'asc' = ascendente, 'desc' = descendente

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

async function cargarTodosPagos() {
  try {
    const res = await fetch(`${API_URL}/todos`);
    if (!res.ok) throw new Error("Error al cargar pagos");
    todosPagos = await res.json();
    
    // Actualizar icono de ordenamiento
    actualizarIconoOrdenamiento();
    
    // Si hay filtros activos, reaplicarlos automáticamente
    if (filtrosActivos) {
      aplicarFiltros();
    } else {
      // Si no hay filtros, mostrar todos los pagos (con ordenamiento si está activo)
      const pagosOrdenados = ordenActual ? ordenarPagosPorId(todosPagos) : todosPagos;
      pagosFiltrados = [...pagosOrdenados];
      actualizarTarjetas(pagosFiltrados);
      mostrarPagos(pagosFiltrados);
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

function actualizarTarjetas(pagos) {
  const totalPeriodo = pagos.filter(p => p.estado === "completado").reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
  const pendientes = pagos.filter(p => p.estado === "pendiente").length;
  const completados = pagos.filter(p => p.estado === "completado").length;
  document.getElementById("totalPeriodo").textContent = `S/. ${totalPeriodo.toFixed(2)}`;
  document.getElementById("totalPendientesCard").textContent = pendientes;
  document.getElementById("totalCompletadosCard").textContent = completados;
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

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return "";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
}

// Función auxiliar para obtener solo la fecha (año, mes, día) sin hora en zona horaria de Perú
function obtenerSoloFecha(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  // Obtener componentes de fecha en zona horaria de Perú
  const fechaPeruStr = d.toLocaleString('en-US', { 
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Parsear la fecha (formato MM/DD/YYYY)
  const [month, day, year] = fechaPeruStr.split('/');
  // Crear una nueva fecha solo con año, mes y día (sin hora, minutos, segundos)
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

// Función para convertir fecha del input (YYYY-MM-DD) a Date
function parsearFechaInput(fechaInput) {
  if (!fechaInput) return null;
  // El input type="date" devuelve formato YYYY-MM-DD
  // Crear fecha directamente sin problemas de zona horaria
  const partes = fechaInput.split('-');
  if (partes.length !== 3) return null;
  return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
}

function aplicarFiltros() {
  const fechaDesde = document.getElementById("fecha-desde").value;
  const fechaHasta = document.getElementById("fecha-hasta").value;
  const estadoFiltro = document.getElementById("filtro-estado").value;
  
  // Verificar si hay algún filtro activo
  filtrosActivos = !!(fechaDesde || fechaHasta || (estadoFiltro && estadoFiltro !== "todos"));
  
  pagosFiltrados = [...todosPagos];
  
  // Filtro por fecha desde
  if (fechaDesde) {
    const desde = parsearFechaInput(fechaDesde);
    if (desde) {
      pagosFiltrados = pagosFiltrados.filter(p => {
        const fechaPago = obtenerSoloFecha(p.fecha_pago || p.fecha_creacion);
        if (!fechaPago) return false;
        // Incluir pagos del mismo día o posteriores (>= incluye el extremo "desde")
        return fechaPago.getTime() >= desde.getTime();
      });
    }
  }
  
  // Filtro por fecha hasta
  if (fechaHasta) {
    const hasta = parsearFechaInput(fechaHasta);
    if (hasta) {
      pagosFiltrados = pagosFiltrados.filter(p => {
        const fechaPago = obtenerSoloFecha(p.fecha_pago || p.fecha_creacion);
        if (!fechaPago) return false;
        // Incluir pagos del mismo día o anteriores (<= incluye el extremo "hasta")
        return fechaPago.getTime() <= hasta.getTime();
      });
    }
  }
  
  // Filtro por estado
  if (estadoFiltro === "pendientes") {
    pagosFiltrados = pagosFiltrados.filter(p => p.estado === "pendiente");
  } else if (estadoFiltro === "completados") {
    pagosFiltrados = pagosFiltrados.filter(p => p.estado === "completado");
  }
  
  // El ordenamiento se aplicará en mostrarPagos si está activo
  actualizarTarjetas(pagosFiltrados);
  mostrarPagos(pagosFiltrados);
}

function limpiarFiltros() {
  document.getElementById("fecha-desde").value = "";
  document.getElementById("fecha-hasta").value = "";
  document.getElementById("filtro-estado").value = "todos";
  filtrosActivos = false; // Marcar que no hay filtros activos
  // Aplicar ordenamiento si está activo
  const pagosOrdenados = ordenActual ? ordenarPagosPorId(todosPagos) : todosPagos;
  pagosFiltrados = [...pagosOrdenados];
  actualizarTarjetas(pagosFiltrados);
  mostrarPagos(pagosFiltrados);
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  try {
    const date = new Date(fecha);
    return new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
  } catch (err) { return fecha; }
}

// Función para ordenar pagos por ID
function ordenarPagosPorId(pagos) {
  if (!ordenActual) return pagos; // Si no hay orden, retornar sin cambios
  
  const pagosOrdenados = [...pagos];
  pagosOrdenados.sort((a, b) => {
    const idA = parseInt(a.id) || 0;
    const idB = parseInt(b.id) || 0;
    return ordenActual === 'asc' ? idA - idB : idB - idA;
  });
  return pagosOrdenados;
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
  
  // Reaplicar filtros si están activos, o mostrar todos los pagos
  if (filtrosActivos) {
    aplicarFiltros();
  } else {
    const pagosOrdenados = ordenarPagosPorId(todosPagos);
    mostrarPagos(pagosOrdenados);
    actualizarTarjetas(pagosOrdenados);
  }
}

function mostrarPagos(lista) {
  const tbody = document.querySelector("#tablaPagos tbody");
  tbody.innerHTML = "";
  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #999;">No hay pagos</td></tr>`;
    return;
  }
  
  // Ordenar por ID si hay ordenamiento activo, sino ordenar por fecha (comportamiento original)
  let listaOrdenada;
  if (ordenActual) {
    listaOrdenada = ordenarPagosPorId(lista);
  } else {
    listaOrdenada = [...lista];
    listaOrdenada.sort((a, b) => new Date(b.fecha_pago || b.fecha_creacion || 0) - new Date(a.fecha_pago || a.fecha_creacion || 0));
  }
  
  listaOrdenada.forEach(pago => {
    const fila = document.createElement("tr");
    const estadoClass = pago.estado === "completado" ? "estado-completado" : "estado-pendiente";
    fila.innerHTML = `
      <td>${pago.id}</td>
      <td>${pago.pedido_id || "-"}</td>
      <td><strong>${pago.metodo_pago || "-"}</strong></td>
      <td><strong style="color: #28a745;">S/. ${parseFloat(pago.monto_total || 0).toFixed(2)}</strong></td>
      <td>${formatearFecha(pago.fecha_pago)}</td>
      <td><span class="estado-badge ${estadoClass}">${pago.estado || "pendiente"}</span></td>
      <td><button class="confirmar" onclick="confirmarPago(${pago.id}, '${pago.metodo_pago || ""}')" ${pago.estado === "completado" || (pago.metodo_pago && pago.metodo_pago.toLowerCase() === "efectivo") ? "disabled" : ""}>${pago.estado === "completado" ? "✅ Confirmado" : "Confirmar"}</button></td>
    `;
    tbody.appendChild(fila);
  });
}

// Función para obtener información del trabajador logueado
async function obtenerTrabajadorLogueado() {
  try {
    // Intentar obtener desde localStorage
    const trabajadorLocal = localStorage.getItem("trabajador");
    if (trabajadorLocal) {
      try {
        const trabajador = JSON.parse(trabajadorLocal);
        return { 
          id: trabajador.id || trabajador.id_usuario || trabajador.idUsuario, 
          nombre: trabajador.nombre 
        };
      } catch (e) {
        localStorage.removeItem("trabajador");
      }
    }
    
    // Si no está en localStorage, consultar al servidor
    const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
      ? window.config.API_CONFIG.usuarios 
      : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
        ? `${process.env.USUARIOS_SERVICE_URL}/api` 
        : "http://localhost:3000/api";
    const res = await fetch(`${USUARIOS_SERVICE_URL}/sesion/trabajador`, {
      credentials: "include"
    });
    const data = await res.json();
    
    if (data.logueado && data.trabajador) {
      localStorage.setItem("trabajador", JSON.stringify(data.trabajador));
      return { 
        id: data.trabajador.id || data.trabajador.id_usuario || data.trabajador.idUsuario, 
        nombre: data.trabajador.nombre 
      };
    }
    
    return null;
  } catch (err) {
    console.error("Error al obtener trabajador:", err);
    return null;
  }
}

async function confirmarPago(id, metodo_pago) {
  if (!id) { alert("❌ ID de pago inválido"); return; }
  if (metodo_pago && metodo_pago.toLowerCase() === "efectivo") { alert("ℹ️ Los pagos en efectivo se confirman automáticamente"); return; }
  if (!confirm("¿Deseas confirmar este pago?")) return;
  
  // Obtener información del trabajador logueado
  const trabajador = await obtenerTrabajadorLogueado();
  
  try {
    const body = {};
    if (trabajador) {
      body.trabajador_id = trabajador.id;
      body.trabajador_nombre = trabajador.nombre;
    }
    
    const res = await fetch(`${API_URL}/confirmar/${id}`, { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) { alert(`❌ Error al confirmar pago: ${res.status}`); return; }
    alert("✅ Pago confirmado correctamente");
    await cargarTodosPagos();
    await cargarTotalGeneral();
    aplicarFiltros();
  } catch (err) { alert("❌ Error al confirmar el pago: " + err.message); }
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

document.addEventListener("DOMContentLoaded", () => {
  // Actualizar nombre del trabajador en el sidebar
  actualizarNombreTrabajador();
  
  cargarTodosPagos();
  cargarTotalGeneral();
  document.getElementById("btn-filtrar").addEventListener("click", aplicarFiltros);
  document.getElementById("btn-limpiar").addEventListener("click", limpiarFiltros);
  
  // Event listener para el icono de ordenamiento
  const sortIcon = document.getElementById("sort-icon");
  if (sortIcon) {
    sortIcon.addEventListener("click", cambiarOrden);
  }
  
  setInterval(async () => { await cargarTodosPagos(); await cargarTotalGeneral(); }, 30000);
});

window.confirmarPago = confirmarPago;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;

