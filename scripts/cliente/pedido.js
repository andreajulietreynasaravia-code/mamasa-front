// Obtener URLs de API usando variables de entorno
const MENU_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.menu) 
  ? window.config.API_CONFIG.menu 
  : (typeof process !== 'undefined' && process.env?.MENU_SERVICE_URL) 
    ? `${process.env.MENU_SERVICE_URL}/api` 
    : "http://localhost:4000/api";
const API_CARRITO = `${MENU_SERVICE_URL}/menu/carrito`;

const PEDIDOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.pedidos) 
  ? window.config.API_CONFIG.pedidos 
  : (typeof process !== 'undefined' && process.env?.PEDIDOS_SERVICE_URL) 
    ? `${process.env.PEDIDOS_SERVICE_URL}/api` 
    : "http://localhost:4001/api";

// 🔹 Obtener URL de API de pedidos desde config o usar valor por defecto
function obtenerAPI_PEDIDOS() {
  if (typeof window !== 'undefined' && window.config && window.config.API_CONFIG) {
    const pedidosApi = window.config.API_CONFIG.pedidos;
    if (pedidosApi) {
      // Si pedidosApi es "http://localhost:4001/api", agregar "/pedidos"
      const apiUrl = pedidosApi.endsWith('/pedidos') ? pedidosApi : `${pedidosApi}/pedidos`;
      console.log('🔧 API_PEDIDOS configurada desde config.js:', apiUrl);
      return apiUrl;
    }
  }
  // Valor por defecto usando variable de entorno
  const defaultUrl = `${PEDIDOS_SERVICE_URL}/pedidos`;
  console.log('🔧 API_PEDIDOS usando valor por defecto:', defaultUrl);
  return defaultUrl;
}

const API_PEDIDOS = obtenerAPI_PEDIDOS();

    // 🔹 Obtener usuario del localStorage
    function obtenerUsuario() {
      try {
        console.log('🔍 pedido.js - obtenerUsuario() - Iniciando búsqueda de usuario...');
        
        // Método 1: Usar window.auth.getCurrentUser() si está disponible
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
          const usuario = window.auth.getCurrentUser();
          const role = window.auth.getCurrentRole();
          console.log('🔍 pedido.js - Método 1 (window.auth) - Usuario:', usuario, 'Role:', role);
          
          if (usuario) {
            // Verificar que sea un cliente (rol 'usuario' en BD o 'cliente' en localStorage)
            if (role === 'cliente' || usuario.rol === 'usuario') {
              // Asegurar que tenga id
              if (!usuario.id && usuario._id) {
                usuario.id = usuario._id;
              }
              console.log('✅ pedido.js - Usuario encontrado via window.auth.getCurrentUser()');
              return usuario;
            } else {
              console.log('⚠️ pedido.js - Usuario encontrado pero no es cliente. Role:', role, 'Usuario.rol:', usuario.rol);
            }
          } else {
            console.log('⚠️ pedido.js - window.auth.getCurrentUser() retornó null');
          }
        } else {
          console.log('⚠️ pedido.js - window.auth o getCurrentUser no está disponible');
        }
        
        // Método 2: Verificar localStorage directamente
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        console.log('🔍 pedido.js - Método 2 (localStorage) - user:', userStr ? 'existe' : 'no existe', 'role:', roleStr);
        
        if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
          try {
            const usuario = JSON.parse(userStr);
            if (usuario && (usuario.rol === "usuario" || roleStr === "cliente")) {
              // Asegurar que tenga id
              if (!usuario.id && usuario._id) {
                usuario.id = usuario._id;
              }
              console.log('✅ pedido.js - Usuario encontrado via localStorage (user)');
              return usuario;
            }
          } catch (e) {
            console.error("❌ pedido.js - Error parseando user de localStorage:", e);
          }
        }
        
        // Método 3: Verificar localStorage antiguo
        const usuarioStr = localStorage.getItem("usuario");
        console.log('🔍 pedido.js - Método 3 (localStorage antiguo) - usuario:', usuarioStr ? 'existe' : 'no existe');
        
        if (usuarioStr) {
          try {
            const usuario = JSON.parse(usuarioStr);
            if (usuario && usuario.rol === "usuario") {
              // Asegurar que tenga id
              if (!usuario.id && usuario._id) {
                usuario.id = usuario._id;
              }
              console.log('✅ pedido.js - Usuario encontrado via localStorage (usuario) - Migrando...');
              // Migrar al sistema nuevo
              if (window.auth && window.auth.setUser) {
                window.auth.setUser(usuario, 'cliente');
              } else {
                localStorage.setItem("user", JSON.stringify(usuario));
                localStorage.setItem("role", "cliente");
              }
              return usuario;
            }
          } catch (e) {
            console.error("❌ pedido.js - Error parseando usuario de localStorage:", e);
          }
        }
        
        console.log('❌ pedido.js - No se encontró usuario en ningún método');
      } catch (err) {
        console.error("❌ pedido.js - Error al obtener usuario:", err);
      }
      return null;
    }

    // 🔹 Actualizar cabezal con información del usuario
    function actualizarCabezalUsuario() {
      const usuario = obtenerUsuario();
      const userText = document.getElementById("userText");
      const userLink = document.getElementById("userLink");
      const userTextNav = document.getElementById("userTextNav");
      const userLinkNav = document.getElementById("userLinkNav");
      const userMenu = document.getElementById("userMenu");

      if (usuario && usuario.nombre) {
        const primerNombre = usuario.nombre.split(" ")[0];
        if (userText) userText.textContent = primerNombre;
        if (userTextNav) userTextNav.textContent = primerNombre;
        
        if (userLink) {
          userLink.href = "/pages/cliente/user.html";
          userLink.onclick = null;
        }
        if (userLinkNav) {
          userLinkNav.href = "/pages/cliente/user.html";
          userLinkNav.onclick = null;
        }
        if (userMenu) userMenu.style.display = "none";
      } else {
        if (userText) userText.textContent = "Login";
        if (userTextNav) userTextNav.textContent = "Login";
        if (userLink) {
          userLink.href = "/pages/cliente/login.html";
          userLink.onclick = null;
        }
        if (userLinkNav) {
          userLinkNav.href = "/pages/cliente/login.html";
          userLinkNav.onclick = null;
        }
        if (userMenu) userMenu.style.display = "none";
      }
    }
    
    // 🔹 Cerrar sesión (botón antiguo si existe)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await cerrarSesion();
      });
    }

    // Inicializar
    actualizarCabezalUsuario();

    // Cerrar menú de usuario al hacer click fuera
    document.addEventListener("click", (e) => {
      const userMenu = document.getElementById("userMenu");
      const userLink = document.getElementById("userLink");
      if (userMenu && !userMenu.contains(e.target) && userLink && !userLink.contains(e.target)) {
        userMenu.style.display = "none";
      }
    });

    // ========== VARIABLES GLOBALES ==========
    let tipoServicio = null;
    let datosCliente = {};
    let datosDireccion = {};
    let metodoPago = null;
    let pedidoId = null;

    // ========== CARGAR CARRITO ==========
    async function cargarCarrito() {
      console.log('🛒 cargarCarrito() - Iniciando...');
      const carritoDiv = document.getElementById("carrito");
      
      if (!carritoDiv) {
        console.error('❌ cargarCarrito() - No se encontró el elemento #carrito');
        return;
      }
      
      const usuario = obtenerUsuario();
      console.log('🛒 cargarCarrito() - Usuario obtenido:', usuario);
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        console.log('🛒 cargarCarrito() - Verificación directa - Usuario:', usuarioVerificado, 'Role:', role);
        
        if (usuarioVerificado && (role === 'cliente' || usuarioVerificado.rol === 'usuario')) {
          // Asegurar que tenga id
          if (!usuarioVerificado.id && usuarioVerificado._id) {
            usuarioVerificado.id = usuarioVerificado._id;
          }
          console.log('✅ cargarCarrito() - Usuario verificado correctamente');
        }
      }
      
      // Usar el usuario encontrado por cualquiera de los métodos
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (!usuarioFinal || !usuarioFinal.id) {
        console.log('❌ cargarCarrito() - No hay usuario o no tiene id');
        carritoDiv.innerHTML = "<p>Por favor, inicia sesión para ver tu carrito.</p>";
        return;
      }

      // Normalizar el ID del usuario (puede ser id o _id)
      let usuarioId = usuarioFinal.id || usuarioFinal._id;
      if (!usuarioId) {
        console.error('❌ cargarCarrito() - No se pudo obtener el ID del usuario');
        carritoDiv.innerHTML = "<p style='color: #dc3545;'>Error: No se pudo obtener el ID del usuario.</p>";
        return;
      }

      // Asegurar que sea string
      usuarioId = String(usuarioId).trim();
      
      console.log('🛒 cargarCarrito() - Usuario ID normalizado:', usuarioId);
      console.log('🛒 cargarCarrito() - Tipo de ID:', typeof usuarioId);
      console.log('🛒 cargarCarrito() - URL:', `${API_CARRITO}?usuario_id=${usuarioId}`);

      try {
        // Intentar con el usuario_id normalizado
        let url = `${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`;
        console.log('🛒 cargarCarrito() - URL:', url);
        
        let res = await fetch(url);
        console.log('🛒 cargarCarrito() - Respuesta del servidor:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ cargarCarrito() - Error en respuesta:', res.status, errorText);
          carritoDiv.innerHTML = `<p style='color: #dc3545;'>Error al cargar el carrito (${res.status}).</p>`;
          return;
        }
        
        let data = await res.json();
        console.log('🛒 cargarCarrito() - Datos recibidos:', data);
        console.log('🛒 cargarCarrito() - Tipo de data:', typeof data);
        console.log('🛒 cargarCarrito() - Tiene items?:', data.items ? 'Sí' : 'No');
        console.log('🛒 cargarCarrito() - Cantidad de items:', data.items ? data.items.length : 0);
        console.log('🛒 cargarCarrito() - Usuario ID usado para buscar:', usuarioId);
        console.log('🛒 cargarCarrito() - Tipo de usuario ID:', typeof usuarioId);
        
        // Si no hay items y el usuario_id es numérico, intentar también como string y viceversa
        let itemsEncontrados = (data.items && data.items.length > 0) || (Array.isArray(data) && data.length > 0);
        
        if (!itemsEncontrados && usuarioFinal.id) {
          // Intentar con el ID original sin normalizar
          const idOriginal = usuarioFinal.id;
          const idAlternativo = usuarioFinal._id || String(idOriginal);
          
          if (String(idAlternativo) !== String(usuarioId)) {
            console.log('🛒 cargarCarrito() - Intentando búsqueda alternativa con ID:', idAlternativo);
            try {
              const urlAlternativa = `${API_CARRITO}?usuario_id=${encodeURIComponent(idAlternativo)}`;
              const resAlternativa = await fetch(urlAlternativa);
              if (resAlternativa.ok) {
                const dataAlternativa = await resAlternativa.json();
                console.log('🛒 cargarCarrito() - Respuesta alternativa:', dataAlternativa);
                if ((dataAlternativa.items && dataAlternativa.items.length > 0) || (Array.isArray(dataAlternativa) && dataAlternativa.length > 0)) {
                  console.log('✅ cargarCarrito() - Items encontrados con ID alternativo');
                  data = dataAlternativa;
                  usuarioId = String(idAlternativo);
                }
              }
            } catch (errAlt) {
              console.warn('⚠️ cargarCarrito() - Error en búsqueda alternativa:', errAlt);
            }
          }
        }
        
        // Verificar si la respuesta es un array (formato antiguo) o un objeto con items
        let items = [];
        if (Array.isArray(data)) {
          // Formato antiguo: array directo
          items = data;
          console.log('⚠️ cargarCarrito() - Formato antiguo detectado (array), items:', items.length);
        } else if (data.items && Array.isArray(data.items)) {
          // Formato nuevo: objeto con items
          items = data.items;
          console.log('✅ cargarCarrito() - Formato nuevo detectado (objeto con items), items:', items.length);
        } else if (data.error) {
          // Error del servidor
          console.error('❌ cargarCarrito() - Error del servidor:', data.error);
          carritoDiv.innerHTML = `<p style='color: #dc3545;'>Error: ${data.error}</p>`;
          return;
        } else {
          // Formato desconocido - intentar buscar items en diferentes lugares
          console.warn('⚠️ cargarCarrito() - Formato de respuesta desconocido:', data);
          console.warn('⚠️ cargarCarrito() - Claves del objeto:', Object.keys(data));
          
          // Intentar diferentes posibles ubicaciones de items
          if (data.carrito && Array.isArray(data.carrito)) {
            items = data.carrito;
            console.log('✅ cargarCarrito() - Items encontrados en data.carrito:', items.length);
          } else if (data.productos && Array.isArray(data.productos)) {
            items = data.productos;
            console.log('✅ cargarCarrito() - Items encontrados en data.productos:', items.length);
          } else {
            console.warn('⚠️ cargarCarrito() - No se encontraron items en ningún formato conocido');
            console.warn('⚠️ cargarCarrito() - Respuesta completa:', JSON.stringify(data, null, 2));
          }
        }
        
        // Log detallado de items encontrados
        if (items && items.length > 0) {
          console.log('✅ cargarCarrito() - Items encontrados:', items.length);
          console.log('✅ cargarCarrito() - Primer item:', items[0]);
          let total = 0;
          let html = "<div style='text-align: left; max-width: 600px; margin: 0 auto;'>";
          
          items.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            html += `
              <div style='display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin: 0.5rem 0; background: #f9f9f9; border-radius: 8px;'>
                <div style='flex: 1;'>
                  <strong>${item.nombre}</strong><br>
                  <span style='color: #666;'>Cantidad: ${item.cantidad} x S/. ${item.precio.toFixed(2)}</span>
                </div>
                <div style='font-weight: bold; color: #8b0000; min-width: 80px; text-align: right;'>S/. ${subtotal.toFixed(2)}</div>
              </div>
            `;
          });
          
          html += `
            <div style='margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid #d4c5a9; display: flex; justify-content: space-between; align-items: center;'>
              <strong style='font-size: 1.3rem;'>Total:</strong>
              <strong style='font-size: 1.5rem; color: #8b0000;'>S/. ${total.toFixed(2)}</strong>
            </div>
          </div>`;
          
          carritoDiv.innerHTML = html;
          console.log('✅ cargarCarrito() - Carrito mostrado correctamente');
        } else {
          console.log('⚠️ cargarCarrito() - Carrito vacío o sin items');
          console.log('⚠️ cargarCarrito() - Usuario ID usado:', usuarioId);
          console.log('⚠️ cargarCarrito() - Respuesta completa:', JSON.stringify(data, null, 2));
          carritoDiv.innerHTML = `
            <p style='color: #666;'>
              Tu carrito está vacío. <a href='/pages/cliente/menu.html' style='color: #8b0000;'>Ir al menú</a>
            </p>
            <p style='color: #999; font-size: 0.8rem; margin-top: 0.5rem;'>
              ID de usuario: ${usuarioId}
            </p>
          `;
        }
      } catch (err) {
        console.error("❌ cargarCarrito() - Error al cargar carrito:", err);
        carritoDiv.innerHTML = `<p style='color: #dc3545;'>Error al cargar el carrito: ${err.message}</p>`;
      }
    }

    // ========== GUARDAR ESTADO DEL PROCESO ==========
    function guardarEstadoProceso() {
      const seccionActual = obtenerSeccionActual();
      const estado = {
        seccionActual: seccionActual,
        tipoServicio: tipoServicio,
        datosCliente: datosCliente,
        datosDireccion: datosDireccion,
        metodoPago: metodoPago,
        pedidoId: pedidoId,
        fechaActualizacion: new Date().toISOString()
      };
      
      // Si está en seguimiento de pedido o pago, guardar también esa información
      if (seccionActual === "pantalla-seguimiento-pedido" || seccionActual === "pantalla-seguimiento-pago") {
        estado.enSeguimiento = true;
        estado.seccionSeguimiento = seccionActual;
      }
      
      localStorage.setItem("estado_proceso_pedido", JSON.stringify(estado));
      console.log('💾 Estado del proceso guardado:', estado);
    }

    // ========== OBTENER SECCIÓN ACTUAL ==========
    function obtenerSeccionActual() {
      const secciones = document.querySelectorAll("section");
      for (const seccion of secciones) {
        if (!seccion.classList.contains("oculto")) {
          return seccion.id;
        }
      }
      return "carrito-servicio-section"; // Por defecto
    }

    // ========== NAVEGACIÓN ENTRE SECCIONES ==========
    function mostrarSeccion(idSeccion) {
      document.querySelectorAll("section").forEach(sec => {
        sec.classList.add("oculto");
      });
      const seccion = document.getElementById(idSeccion);
      if (seccion) {
        seccion.classList.remove("oculto");
        
        // Si se muestra la sección del carrito, cargar el carrito
        if (idSeccion === "carrito-servicio-section") {
          cargarCarrito();
        }
        
        // Si se muestra la sección de pago, restaurar el método de pago seleccionado
        if (idSeccion === "pago-section" && metodoPago) {
          // Pequeño delay para asegurar que el DOM esté listo
          setTimeout(() => {
            const pagoBtn = document.querySelector(`.pago-btn[data-metodo="${metodoPago}"]`);
            if (pagoBtn) {
              document.querySelectorAll(".pago-btn").forEach(b => b.classList.remove("selected"));
              pagoBtn.classList.add("selected");
              // Disparar el evento para mostrar la información de pago
              pagoBtn.click();
            }
          }, 50);
        }
        
        // Guardar el estado cada vez que se cambia de sección
        guardarEstadoProceso();
        
        // Llenar automáticamente los datos del cliente cuando se muestra la sección
        if (idSeccion === "cliente-section") {
          llenarDatosCliente();
        }
        
        // Llenar automáticamente la dirección cuando se muestra la sección
        if (idSeccion === "direccion-section") {
          llenarDatosDireccion();
        }
      }
    }
    
    // ========== LLENAR DATOS DEL CLIENTE AUTOMÁTICAMENTE ==========
    function llenarDatosCliente() {
      const usuario = obtenerUsuario();
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
      }
      
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (usuarioFinal) {
        // Llenar nombre si está disponible
        const nombreInput = document.getElementById("nombre");
        if (nombreInput && usuarioFinal.nombre && !nombreInput.value.trim()) {
          nombreInput.value = usuarioFinal.nombre;
          console.log('✅ Datos del cliente: Nombre llenado automáticamente');
        }
        
        // Llenar teléfono si está disponible
        const telefonoInput = document.getElementById("telefono");
        if (telefonoInput && usuarioFinal.telefono && !telefonoInput.value.trim()) {
          telefonoInput.value = usuarioFinal.telefono;
          console.log('✅ Datos del cliente: Teléfono llenado automáticamente');
        }
      } else {
        console.log('⚠️ No se encontró usuario para llenar datos automáticamente');
      }
    }
    
    // ========== LLENAR DATOS DE DIRECCIÓN AUTOMÁTICAMENTE ==========
    function llenarDatosDireccion() {
      const usuario = obtenerUsuario();
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
      }
      
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (usuarioFinal) {
        // Llenar dirección (calle) si está disponible
        const calleInput = document.getElementById("calle");
        if (calleInput && usuarioFinal.direccion && !calleInput.value.trim()) {
          calleInput.value = usuarioFinal.direccion;
          console.log('✅ Datos de dirección: Calle llenada automáticamente');
        }
      } else {
        console.log('⚠️ No se encontró usuario para llenar dirección automáticamente');
      }
    }

    // Hacer la función global para que pueda ser llamada desde HTML
    window.mostrarSeccion = mostrarSeccion;

    // ========== BOTONES DE SERVICIO ==========
    document.querySelectorAll(".servicio-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        document.querySelectorAll(".servicio-btn").forEach(b => b.classList.remove("selected"));
        this.classList.add("selected");
        tipoServicio = this.getAttribute("data-tipo");
        guardarEstadoProceso(); // Guardar cuando se selecciona tipo de servicio
        
        // Si es "domicilio", mostrar sección de cliente para pedir datos y dirección
        // Si es "local" o "llevar", ir directamente al resumen (no se necesitan datos del cliente)
        if (tipoServicio === "domicilio") {
          setTimeout(() => mostrarSeccion("cliente-section"), 300);
        } else {
          // Para "local" y "llevar", ir directamente al resumen
          setTimeout(() => {
            mostrarSeccion("resumen-section");
            mostrarResumen();
          }, 300);
        }
      });
    });

    // ========== BOTÓN REGRESAR AL MENÚ ==========
    document.getElementById("btn-regresar-menu")?.addEventListener("click", () => {
      window.location.href = "/pages/cliente/menu.html";
    });

    // ========== SECCIÓN CLIENTE ==========
    document.getElementById("btn-regresar-cliente")?.addEventListener("click", () => {
      // Guardar los datos actuales del cliente antes de regresar
      const nombre = document.getElementById("nombre")?.value.trim() || "";
      const telefono = document.getElementById("telefono")?.value.trim() || "";
      if (nombre || telefono) {
        datosCliente = { nombre, telefono };
      }
      guardarEstadoProceso(); // Guardar estado actual antes de regresar
      mostrarSeccion("carrito-servicio-section");
    });

    document.getElementById("btn-confirmar-datos")?.addEventListener("click", () => {
      const nombre = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      
      if (!nombre || !telefono) {
        Swal.fire({
          icon: "error",
          title: "Campos requeridos",
          text: "Por favor, completa todos los campos."
        });
        return;
      }
      
      datosCliente = { nombre, telefono };
      guardarEstadoProceso(); // Guardar después de confirmar datos
      
      if (tipoServicio === "domicilio") {
        mostrarSeccion("direccion-section");
      } else {
        mostrarSeccion("resumen-section");
        mostrarResumen();
      }
    });

    // ========== SECCIÓN DIRECCIÓN ==========
    document.getElementById("btn-regresar-direccion")?.addEventListener("click", () => {
      // Guardar los datos actuales de la dirección antes de regresar
      const calle = document.getElementById("calle")?.value.trim() || "";
      const referencia = document.getElementById("referencia")?.value.trim() || "";
      if (calle || referencia) {
        datosDireccion = { calle, referencia };
      }
      guardarEstadoProceso(); // Guardar estado actual antes de regresar
      mostrarSeccion("cliente-section");
    });

    document.getElementById("btn-confirmar-direccion")?.addEventListener("click", () => {
      const calle = document.getElementById("calle").value.trim();
      const referencia = document.getElementById("referencia").value.trim();
      
      if (!calle) {
        Swal.fire({
          icon: "error",
          title: "Campo requerido",
          text: "Por favor, ingresa la dirección."
        });
        return;
      }
      
      datosDireccion = { calle, referencia };
      guardarEstadoProceso(); // Guardar después de confirmar dirección
      mostrarSeccion("resumen-section");
      mostrarResumen();
    });

    // ========== SECCIÓN RESUMEN ==========
    document.getElementById("btn-regresar-resumen")?.addEventListener("click", () => {
      guardarEstadoProceso(); // Guardar estado actual antes de regresar
      // Regresar a dirección si es domicilio, sino al carrito (para local y llevar)
      if (tipoServicio === "domicilio") {
        mostrarSeccion("direccion-section");
      } else {
        // Para "local" y "llevar", regresar al carrito
        mostrarSeccion("carrito-servicio-section");
      }
    });

    document.getElementById("btn-continuar-resumen")?.addEventListener("click", () => {
      guardarEstadoProceso(); // Guardar estado actual antes de continuar
      mostrarSeccion("pago-section");
    });

    // ========== MOSTRAR RESUMEN ==========
    async function mostrarResumen() {
      console.log('📋 mostrarResumen() - Iniciando...');
      const resumenDiv = document.getElementById("resumen");
      
      if (!resumenDiv) {
        console.error('❌ mostrarResumen() - No se encontró el elemento #resumen');
        return;
      }
      
      // Mostrar mensaje de carga
      resumenDiv.innerHTML = "<p style='text-align: center; padding: 2rem;'>Cargando resumen...</p>";
      
      const usuario = obtenerUsuario();
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
        if (usuarioVerificado && (!usuarioVerificado.id && usuarioVerificado._id)) {
          usuarioVerificado.id = usuarioVerificado._id;
        }
      }
      
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (!usuarioFinal || !usuarioFinal.id) {
        console.error('❌ mostrarResumen() - Usuario no encontrado');
        resumenDiv.innerHTML = "<p style='color: #dc3545; text-align: center; padding: 2rem;'>Error: Usuario no encontrado. Por favor, inicia sesión.</p>";
        return;
      }

      // Validar que datosCliente exista solo si es domicilio
      if (tipoServicio === "domicilio" && (!datosCliente || !datosCliente.nombre || !datosCliente.telefono)) {
        console.error('❌ mostrarResumen() - Datos del cliente incompletos:', datosCliente);
        resumenDiv.innerHTML = "<p style='color: #dc3545; text-align: center; padding: 2rem;'>Error: Los datos del cliente no están completos. Por favor, completa el formulario.</p>";
        return;
      }

      console.log('📋 mostrarResumen() - Usuario ID:', usuarioFinal.id);
      console.log('📋 mostrarResumen() - Datos cliente:', datosCliente);
      console.log('📋 mostrarResumen() - Tipo servicio:', tipoServicio);
      console.log('📋 mostrarResumen() - Datos dirección:', datosDireccion);

      try {
        // Normalizar el ID del usuario (puede ser id o _id)
        let usuarioId = usuarioFinal.id || usuarioFinal._id;
        if (!usuarioId) {
          console.error('❌ mostrarResumen() - No se pudo obtener el ID del usuario');
          resumenDiv.innerHTML = "<p style='color: #dc3545; text-align: center; padding: 2rem;'>Error: No se pudo obtener el ID del usuario.</p>";
          return;
        }

        // Asegurar que sea string
        usuarioId = String(usuarioId).trim();
        
        const url = `${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`;
        console.log('📋 mostrarResumen() - Usuario ID normalizado:', usuarioId);
        console.log('📋 mostrarResumen() - Tipo de ID:', typeof usuarioId);
        console.log('📋 mostrarResumen() - URL:', url);
        
        const res = await fetch(url);
        console.log('📋 mostrarResumen() - Respuesta status:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ mostrarResumen() - Error en respuesta:', res.status, errorText);
          resumenDiv.innerHTML = `<p style='color: #dc3545; text-align: center; padding: 2rem;'>Error al cargar el carrito (${res.status}).</p>`;
          return;
        }
        
        const data = await res.json();
        console.log('📋 mostrarResumen() - Datos recibidos:', data);
        console.log('📋 mostrarResumen() - Tipo de data:', typeof data);
        console.log('📋 mostrarResumen() - Tiene items?:', data.items ? 'Sí' : 'No');
        console.log('📋 mostrarResumen() - Es array?:', Array.isArray(data));
        console.log('📋 mostrarResumen() - Usuario ID usado para buscar:', usuarioId);
        
        // Verificar si la respuesta es un array (formato antiguo) o un objeto con items
        let items = [];
        if (Array.isArray(data)) {
          // Formato antiguo: array directo
          items = data;
          console.log('⚠️ mostrarResumen() - Formato antiguo detectado (array), items:', items.length);
        } else if (data.items && Array.isArray(data.items)) {
          // Formato nuevo: objeto con items
          items = data.items;
          console.log('✅ mostrarResumen() - Formato nuevo detectado (objeto con items), items:', items.length);
        } else if (data.error) {
          // Error del servidor
          console.error('❌ mostrarResumen() - Error del servidor:', data.error);
          resumenDiv.innerHTML = `<p style='color: #dc3545; text-align: center; padding: 2rem;'>Error: ${data.error}</p>`;
          return;
        } else {
          // Formato desconocido
          console.warn('⚠️ mostrarResumen() - Formato de respuesta desconocido:', data);
          console.warn('⚠️ mostrarResumen() - Respuesta completa:', JSON.stringify(data, null, 2));
        }
        
        // Verificar si hay items en el carrito
        if (!items || items.length === 0) {
          console.warn('⚠️ mostrarResumen() - El carrito está vacío');
          console.warn('⚠️ mostrarResumen() - Usuario ID usado:', usuarioId);
          console.warn('⚠️ mostrarResumen() - Respuesta completa:', JSON.stringify(data, null, 2));
          resumenDiv.innerHTML = `
            <div style='text-align: center; padding: 2rem;'>
              <p style='color: #666; margin-bottom: 1rem;'>Tu carrito está vacío.</p>
              <p style='color: #999; font-size: 0.8rem; margin-bottom: 1rem;'>ID de usuario: ${usuarioId}</p>
              <button onclick="window.location.href='/pages/cliente/menu.html'" style='padding: 0.75rem 1.5rem; background: #8b0000; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;'>Ir al Menú</button>
            </div>
          `;
          return;
        }
        
        console.log('✅ mostrarResumen() - Items encontrados:', items.length);
        
        // Construir el HTML del resumen
        let total = 0;
        let html = "<div style='text-align: left; max-width: 600px; margin: 0 auto;'>";
        
        // Datos del Cliente (solo si es domicilio)
        if (tipoServicio === "domicilio") {
          html += "<h3 style='margin-bottom: 1rem; color: #8b0000;'>Datos del Cliente:</h3>";
          html += `<p><strong>Nombre:</strong> ${datosCliente.nombre || 'No especificado'}</p>`;
          html += `<p><strong>Teléfono:</strong> ${datosCliente.telefono || 'No especificado'}</p>`;
          
          // Dirección de entrega
          if (datosDireccion && datosDireccion.calle) {
            html += "<h3 style='margin-top: 1.5rem; margin-bottom: 1rem; color: #8b0000;'>Dirección de Entrega:</h3>";
            html += `<p><strong>Calle:</strong> ${datosDireccion.calle}</p>`;
            if (datosDireccion.referencia) {
              html += `<p><strong>Referencia:</strong> ${datosDireccion.referencia}</p>`;
            }
          } else {
            html += "<p style='color: #dc3545; margin-top: 1rem;'>⚠️ Dirección no especificada</p>";
          }
        }
        
        // Tipo de Servicio
        html += "<h3 style='margin-top: 1.5rem; margin-bottom: 1rem; color: #8b0000;'>Tipo de Servicio:</h3>";
        const tipoServicioTexto = tipoServicio === "local" ? "En el local" : 
                                  tipoServicio === "llevar" ? "Para llevar" : 
                                  tipoServicio === "domicilio" ? "A domicilio" : "No especificado";
        html += `<p><strong>${tipoServicioTexto}</strong></p>`;
        
        // Pedido
        html += "<h3 style='margin-top: 1.5rem; margin-bottom: 1rem; color: #8b0000;'>Pedido:</h3>";
        
        items.forEach(item => {
          const subtotal = item.precio * item.cantidad;
          total += subtotal;
          html += `
            <div style='display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e0e0e0;'>
              <span>${item.nombre} x ${item.cantidad}</span>
              <span><strong>S/. ${subtotal.toFixed(2)}</strong></span>
            </div>
          `;
        });
        
        // Total
        html += `
          <div style='margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid #8b0000; display: flex; justify-content: space-between; align-items: center;'>
            <strong style='font-size: 1.2rem;'>Total:</strong>
            <strong style='font-size: 1.5rem; color: #8b0000;'>S/. ${total.toFixed(2)}</strong>
          </div>
        </div>`;
        
        // No agregar botón aquí, ya está en el HTML de la sección
        resumenDiv.innerHTML = html;
        console.log('✅ mostrarResumen() - Resumen generado correctamente');
      } catch (err) {
        console.error("❌ mostrarResumen() - Error completo:", err);
        console.error("❌ mostrarResumen() - Stack:", err.stack);
        resumenDiv.innerHTML = `
          <div style='text-align: center; padding: 2rem;'>
            <p style='color: #dc3545; margin-bottom: 1rem;'>Error al cargar el resumen.</p>
            <p style='color: #666; font-size: 0.9rem;'>${err.message || 'Error desconocido'}</p>
          </div>
        `;
      }
    }

    // ========== FUNCIÓN PARA OBTENER TOTAL DEL CARRITO ==========
    async function obtenerTotalCarrito() {
      try {
        const usuario = obtenerUsuario();
        let usuarioVerificado = null;
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
          usuarioVerificado = window.auth.getCurrentUser();
        }
        const usuarioFinal = usuario || usuarioVerificado;
        
        if (!usuarioFinal || !usuarioFinal.id) {
          return 0;
        }
        
        let usuarioId = usuarioFinal.id || usuarioFinal._id;
        usuarioId = String(usuarioId).trim();
        
        const res = await fetch(`${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`);
        if (!res.ok) return 0;
        
        const data = await res.json();
        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data.items && Array.isArray(data.items)) {
          items = data.items;
        } else if (data.total !== undefined) {
          return Number(data.total) || 0;
        }
        
        const total = items.reduce((sum, item) => {
          return sum + ((Number(item.precio) || 0) * (Number(item.cantidad) || 0));
        }, 0);
        
        return total;
      } catch (err) {
        console.error("Error al obtener total del carrito:", err);
        return 0;
      }
    }

    // ========== SECCIÓN PAGO ==========
    document.querySelectorAll(".pago-btn").forEach(btn => {
      btn.addEventListener("click", async function() {
        document.querySelectorAll(".pago-btn").forEach(b => b.classList.remove("selected"));
        this.classList.add("selected");
        metodoPago = this.getAttribute("data-metodo");
        guardarEstadoProceso(); // Guardar cuando se selecciona método de pago
        
        const pagoExtra = document.getElementById("pago-extra");
        const btnEnviar = document.getElementById("btn-enviar-pedido");
        
        if (metodoPago === "yape") {
          // Cambiar texto del botón a "Enviar Pago"
          if (btnEnviar) {
            btnEnviar.textContent = "Enviar Pago";
          }
          
          pagoExtra.innerHTML = `
            <div style='text-align: center; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; max-width: 400px; margin: 0 auto;'>
              <h3 style='color: #8b0000; margin-bottom: 1rem;'>Paga con Yape</h3>
              <div style='margin: 1.5rem 0;'>
                <img src="../../assets/qr_yape.jpeg" 
                     alt="Código QR de Yape" 
                     style='max-width: 250px; width: 100%; height: auto; border: 2px solid #8b0000; border-radius: 8px; padding: 0.5rem; background: white; display: block; margin: 0 auto;'
                     onerror="console.error('Error al cargar qr_yape.jpeg'); this.style.display='none'; this.nextElementSibling.style.display='block';"
                     onload="console.log('Imagen qr_yape.jpeg cargada correctamente');">
                <div style='display: none; padding: 2rem; background: #e0e0e0; border-radius: 8px; color: #666;'>
                  <p>⚠️ No se pudo cargar la imagen del código QR</p>
                </div>
              </div>
              <p style='margin-top: 1rem; font-size: 1rem; color: #333;'>Escanea el código QR o envía a:</p>
              <p style='font-size: 1.3rem; font-weight: bold; color: #8b0000; margin: 0.5rem 0;'>999 999 999</p>
            </div>
          `;
        } else if (metodoPago === "efectivo") {
          // Cambiar texto del botón a "Enviar Pedido"
          if (btnEnviar) {
            btnEnviar.textContent = "Enviar Pedido";
          }
          
          // Obtener el total del carrito
          const total = await obtenerTotalCarrito();
          pagoExtra.innerHTML = `
            <div style='text-align: center; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; max-width: 400px; margin: 0 auto;'>
              <h3 style='color: #8b0000; margin-bottom: 1rem;'>Pago en Efectivo</h3>
              <div style='margin: 1.5rem 0; padding: 1.5rem; background: white; border: 2px solid #8b0000; border-radius: 8px;'>
                <p style='font-size: 1rem; color: #666; margin-bottom: 0.5rem;'>Total a pagar:</p>
                <p style='font-size: 2rem; font-weight: bold; color: #8b0000;'>S/. ${total.toFixed(2)}</p>
              </div>
              <p style='font-size: 0.9rem; color: #666; margin-top: 1rem;'>Pagarás al momento de recibir tu pedido</p>
            </div>
          `;
        } else {
          // Restaurar texto por defecto
          if (btnEnviar) {
            btnEnviar.textContent = "Enviar Pago";
          }
          pagoExtra.innerHTML = "";
        }
      });
    });

    document.getElementById("btn-regresar-pago")?.addEventListener("click", () => {
      // Guardar el método de pago actual antes de regresar (si hay uno seleccionado)
      const pagoBtnSeleccionado = document.querySelector(".pago-btn.selected");
      if (pagoBtnSeleccionado) {
        metodoPago = pagoBtnSeleccionado.getAttribute("data-metodo");
        console.log('💾 Guardando método de pago antes de regresar:', metodoPago);
      } else {
        // Si no hay botón seleccionado, mantener el método de pago actual si existe
        console.log('💾 No hay botón seleccionado, método de pago actual:', metodoPago);
      }
      
      // Guardar estado actual con la sección de pago ANTES de cambiar
      // Necesitamos guardar manualmente porque mostrarSeccion() cambiará la sección
      const estadoActual = {
        seccionActual: "pago-section", // Forzar que se guarde como pago-section
        tipoServicio: tipoServicio,
        datosCliente: datosCliente,
        datosDireccion: datosDireccion,
        metodoPago: metodoPago,
        pedidoId: pedidoId,
        fechaActualizacion: new Date().toISOString()
      };
      localStorage.setItem("estado_proceso_pedido", JSON.stringify(estadoActual));
      console.log('💾 Estado guardado con sección pago-section antes de regresar:', estadoActual);
      
      // Ahora cambiar a resumen (mostrarSeccion también guardará, pero ya tenemos el estado correcto)
      mostrarSeccion("resumen-section");
      mostrarResumen();
    });

    document.getElementById("btn-enviar-pedido")?.addEventListener("click", async () => {
      if (!metodoPago) {
        Swal.fire({
          icon: "error",
          title: "Método de pago requerido",
          text: "Por favor, selecciona un método de pago."
        });
        return;
      }

      if (!tipoServicio) {
        Swal.fire({
          icon: "error",
          title: "Tipo de servicio requerido",
          text: "Por favor, selecciona un tipo de servicio."
        });
        return;
      }

      const usuario = obtenerUsuario();
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
        if (usuarioVerificado && (!usuarioVerificado.id && usuarioVerificado._id)) {
          usuarioVerificado.id = usuarioVerificado._id;
        }
      }
      
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (!usuarioFinal || !usuarioFinal.id) {
        Swal.fire({
          icon: "error",
          title: "Sesión requerida",
          text: "Por favor, inicia sesión para realizar un pedido."
        });
        return;
      }

      try {
        // Normalizar el ID del usuario (puede ser id o _id)
        let usuarioId = usuarioFinal.id || usuarioFinal._id;
        if (!usuarioId) {
          console.error('❌ Enviar pedido - No se pudo obtener el ID del usuario');
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo obtener el ID del usuario."
          });
          return;
        }

        // Asegurar que sea string
        usuarioId = String(usuarioId).trim();
        console.log('📦 Enviar pedido - Usuario ID normalizado:', usuarioId);
        
        // Obtener carrito
        const urlCarrito = `${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`;
        console.log('📦 Enviar pedido - URL carrito:', urlCarrito);
        
        const resCarrito = await fetch(urlCarrito);
        console.log('📦 Enviar pedido - Respuesta carrito:', resCarrito.status, resCarrito.statusText);
        
        if (!resCarrito.ok) {
          const errorText = await resCarrito.text();
          console.error('❌ Enviar pedido - Error al obtener carrito:', resCarrito.status, errorText);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `Error al obtener el carrito (${resCarrito.status}).`
          });
          return;
        }
        
        const dataCarrito = await resCarrito.json();
        console.log('📦 Enviar pedido - Datos carrito recibidos:', dataCarrito);
        
        // Manejar diferentes formatos de respuesta (igual que en cargarCarrito)
        let items = [];
        if (Array.isArray(dataCarrito)) {
          // Formato antiguo: array directo
          items = dataCarrito;
          console.log('✅ Enviar pedido - Formato array detectado, items:', items.length);
        } else if (dataCarrito.items && Array.isArray(dataCarrito.items)) {
          // Formato nuevo: objeto con items
          items = dataCarrito.items;
          console.log('✅ Enviar pedido - Formato objeto con items detectado, items:', items.length);
        } else if (dataCarrito.carrito && Array.isArray(dataCarrito.carrito)) {
          items = dataCarrito.carrito;
          console.log('✅ Enviar pedido - Items encontrados en dataCarrito.carrito:', items.length);
        } else if (dataCarrito.productos && Array.isArray(dataCarrito.productos)) {
          items = dataCarrito.productos;
          console.log('✅ Enviar pedido - Items encontrados en dataCarrito.productos:', items.length);
        } else if (dataCarrito.error) {
          console.error('❌ Enviar pedido - Error del servidor:', dataCarrito.error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: dataCarrito.error || "Error al obtener el carrito."
          });
          return;
        } else {
          console.warn('⚠️ Enviar pedido - Formato de respuesta desconocido:', dataCarrito);
          console.warn('⚠️ Enviar pedido - Claves del objeto:', Object.keys(dataCarrito));
        }
        
        if (!items || items.length === 0) {
          console.warn('⚠️ Enviar pedido - Carrito vacío o sin items');
          console.warn('⚠️ Enviar pedido - Usuario ID usado:', usuarioId);
          console.warn('⚠️ Enviar pedido - Respuesta completa:', JSON.stringify(dataCarrito, null, 2));
          Swal.fire({
            icon: "error",
            title: "Carrito vacío",
            text: "Tu carrito está vacío. Agrega productos antes de realizar el pedido."
          });
          return;
        }
        
        console.log('✅ Enviar pedido - Items encontrados:', items.length);

        // Calcular el total del pedido
        const totalPedido = items.reduce((sum, item) => {
          return sum + ((Number(item.precio) || 0) * (Number(item.cantidad) || 0));
        }, 0);
        
        console.log('📦 Enviar pedido - Total calculado:', totalPedido);

        // Obtener nombre del usuario logueado si no hay datos del cliente
        // Priorizar: datosCliente > usuarioFinal > "Cliente"
        let nombreCliente = datosCliente.nombre;
        let telefonoCliente = datosCliente.telefono;
        
        // Si no hay datos del cliente, usar los del usuario logueado
        if (!nombreCliente && usuarioFinal) {
          nombreCliente = usuarioFinal.nombre || usuarioFinal.nombre_completo || "Cliente";
          console.log('📦 Usando nombre del usuario logueado:', nombreCliente);
        } else if (!nombreCliente) {
          nombreCliente = "Cliente";
          console.warn('⚠️ No se encontró nombre del cliente ni del usuario logueado');
        }
        
        if (!telefonoCliente && usuarioFinal) {
          telefonoCliente = usuarioFinal.telefono || "Sin teléfono";
        } else if (!telefonoCliente) {
          telefonoCliente = "Sin teléfono";
        }
        
        console.log('📦 Datos del cliente a enviar:', {
          nombre: nombreCliente,
          telefono: telefonoCliente,
          tieneDatosCliente: !!datosCliente.nombre,
          tieneUsuarioFinal: !!usuarioFinal,
          usuarioFinalNombre: usuarioFinal?.nombre
        });
        
        // Preparar datos del pedido según el formato que espera el backend
        const pedidoData = {
          cliente: {
            nombre: nombreCliente,
            telefono: telefonoCliente
          },
          direccion: tipoServicio === "domicilio" ? {
            calle_avenida: datosDireccion.calle || "Sin dirección",
            referencia: datosDireccion.referencia || ""
          } : {},
          tipo_servicio: tipoServicio,
          metodo_pago: metodoPago,
          monto_total: totalPedido,
          total: totalPedido,
          detalles: items.map(item => ({
            id_producto_mongo: item.plato_id || item.producto_id || item.id || "",
            nombre_producto: item.nombre || "Producto sin nombre",
            cantidad: Number(item.cantidad) || 1,
            precio_unitario: Number(item.precio) || 0,
            subtotal: (Number(item.precio) || 0) * (Number(item.cantidad) || 0)
          }))
        };

        // Enviar pedido a la ruta /crear
        const apiPedidosUrl = obtenerAPI_PEDIDOS();
        const urlCrearPedido = `${apiPedidosUrl}/crear`;
        console.log('📦 Enviar pedido - URL API pedidos:', urlCrearPedido);
        console.log('📦 Enviar pedido - Datos a enviar:', pedidoData);
        
        const res = await fetch(urlCrearPedido, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoData)
        });

        console.log('📦 Enviar pedido - Respuesta status:', res.status, res.statusText);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Enviar pedido - Error en respuesta:', res.status, errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText || `Error ${res.status}: ${res.statusText}` };
          }
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('📦 Enviar pedido - Respuesta recibida:', data);

        // El backend devuelve { ok: true, id_pedido, monto_total } o { ok: false, error }
        if (res.ok && data.ok && data.id_pedido) {
          pedidoId = data.id_pedido;
          console.log('✅ Enviar pedido - Pedido creado exitosamente con ID:', pedidoId);
          
          // Guardar el pedidoId en localStorage para persistencia
          localStorage.setItem("pedido_en_seguimiento", JSON.stringify({
            pedidoId: pedidoId,
            metodoPago: metodoPago,
            fechaCreacion: new Date().toISOString()
          }));
          console.log('💾 Pedido guardado en localStorage para persistencia');
          
          // Vaciar carrito
          try {
            await fetch(`${API_CARRITO}/vaciar`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario_id: usuarioId })
            });
            console.log('✅ Carrito vaciado correctamente');
          } catch (err) {
            console.error('⚠️ Error al vaciar carrito:', err);
            // No bloquear el flujo si falla vaciar el carrito
          }

          // Si es pago en efectivo, ir directamente al seguimiento del pedido
          if (metodoPago === "efectivo") {
            mostrarSeccion("pantalla-seguimiento-pedido");
            iniciarSeguimientoPedido();
          } else {
            // Para Yape, mostrar seguimiento de pago primero
            mostrarSeccion("pantalla-seguimiento-pago");
            iniciarSeguimientoPago();
          }
        } else {
          const errorMsg = data.error || data.message || "Error al crear el pedido.";
          console.error('❌ Enviar pedido - Error en respuesta:', errorMsg);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorMsg
          });
        }
      } catch (err) {
        console.error("Error al enviar pedido:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al conectar con el servidor."
        });
      }
    });

    // ========== SEGUIMIENTO DE PAGO ==========
    // Variable global para el intervalo de seguimiento de pago
    let intervaloPago = null;
    
    function iniciarSeguimientoPago() {
      if (!pedidoId) {
        console.error("❌ iniciarSeguimientoPago() - No hay pedidoId");
        return;
      }

      // Limpiar intervalo anterior si existe
      if (intervaloPago) {
        console.log('🧹 Limpiando intervalo de seguimiento de pago anterior');
        clearInterval(intervaloPago);
        intervaloPago = null;
      }

      console.log('💳 iniciarSeguimientoPago() - Iniciando seguimiento del pago para pedido:', pedidoId);
      console.log('💳 iniciarSeguimientoPago() - pedidoId tipo:', typeof pedidoId);
      console.log('💳 iniciarSeguimientoPago() - pedidoId valor:', pedidoId);

      // Actualizar inmediatamente al iniciar
      console.log('💳 Llamando a actualizarEstadoPago() inmediatamente...');
      actualizarEstadoPago();

      // Luego verificar periódicamente (igual que el seguimiento del pedido)
      console.log('💳 Configurando intervalo para verificar cada 3 segundos...');
      intervaloPago = setInterval(() => {
        console.log('💳 [INTERVALO] Ejecutando verificación periódica del estado del pago...');
        actualizarEstadoPago();
      }, 3000); // Verificar cada 3 segundos (igual que el seguimiento del pedido)
      
      console.log('✅ Intervalo de seguimiento de pago iniciado, ID:', intervaloPago);
      console.log('✅ El intervalo se ejecutará cada 3 segundos');
    }

    // Función para actualizar el estado del pago - CONSULTA DIRECTA AL SERVICIO DE PAGOS
    async function actualizarEstadoPago() {
      if (!pedidoId) {
        console.error("❌ [ACTUALIZAR ESTADO PAGO] No hay pedidoId");
        return;
      }

      try {
        // CONSULTAR DIRECTAMENTE AL SERVICIO DE PAGOS
        const PAGOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.pagos) 
          ? window.config.API_CONFIG.pagos 
          : (typeof process !== 'undefined' && process.env?.PAGOS_SERVICE_URL) 
            ? process.env.PAGOS_SERVICE_URL 
            : "http://localhost:4002";
        const urlPago = `${PAGOS_SERVICE_URL}/pagos/por-pedido/${pedidoId}`;
        console.log('💳 [ACTUALIZAR ESTADO PAGO] Consultando directamente servicio de pagos:', urlPago);
        
        const resPago = await fetch(urlPago);
        console.log('💳 [ACTUALIZAR ESTADO PAGO] Respuesta servicio pagos:', resPago.status, resPago.statusText);
        
        let estadoPago = "pendiente";
        
        if (resPago.ok) {
          const dataPago = await resPago.json();
          console.log('💳 [ACTUALIZAR ESTADO PAGO] Datos del pago:', JSON.stringify(dataPago, null, 2));
          estadoPago = dataPago.estado || "pendiente";
          console.log('💳 [ACTUALIZAR ESTADO PAGO] Estado obtenido:', estadoPago);
        } else {
          console.warn('⚠️ [ACTUALIZAR ESTADO PAGO] No se pudo obtener pago del servicio de pagos, usando servicio de pedidos como fallback');
          // Fallback: consultar servicio de pedidos
          const apiPedidosUrl = obtenerAPI_PEDIDOS();
          const url = `${apiPedidosUrl}/${pedidoId}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            estadoPago = data.pedido?.estado_pago || data.pedido?.estadoPago || data.pedido?.estado || "pendiente";
            console.log('💳 [ACTUALIZAR ESTADO PAGO] Estado desde servicio pedidos:', estadoPago);
          }
        }
        
        // Normalizar el estado
        const estadoNormalizado = estadoPago.toString().toLowerCase().trim();
        console.log('💳 [ACTUALIZAR ESTADO PAGO] Estado normalizado:', estadoNormalizado);
        
        // Verificar si está completado
        const esCompletado = estadoNormalizado === "completado" || 
                            estadoNormalizado === "completo" || 
                            estadoNormalizado === "confirmado" ||
                            estadoNormalizado === "pagado" ||
                            estadoNormalizado.includes("complet") ||
                            estadoNormalizado.includes("confirm");
        
        console.log('💳 [ACTUALIZAR ESTADO PAGO] ¿Es completado?', esCompletado);
        
        if (esCompletado) {
          console.log('✅✅✅ [ACTUALIZAR ESTADO PAGO] PAGO COMPLETADO - Actualizando UI');
          
          if (intervaloPago) {
            clearInterval(intervaloPago);
            intervaloPago = null;
          }
          
          // Actualizar UI
          const stepCompletado = document.getElementById("step-completado-pago");
          if (stepCompletado) {
            const circle = stepCompletado.querySelector(".circle");
            if (circle) {
              circle.classList.add("activo");
              circle.style.backgroundColor = "#8b0000";
              circle.style.color = "white";
            }
            const textoPaso = stepCompletado.querySelector("p");
            if (textoPaso) {
              textoPaso.style.color = "#8b0000";
              textoPaso.style.fontWeight = "bold";
            }
            stepCompletado.style.color = "#8b0000";
            stepCompletado.style.fontWeight = "bold";
          }
          
          const stepPendiente = document.getElementById("step-pendiente-pago");
          if (stepPendiente) {
            const circlePendiente = stepPendiente.querySelector(".circle");
            if (circlePendiente) {
              circlePendiente.classList.add("activo");
              circlePendiente.style.backgroundColor = "#8b0000";
              circlePendiente.style.color = "white";
            }
          }
          
          const estadoTexto = document.getElementById("estado-texto-pago");
          if (estadoTexto) {
            estadoTexto.textContent = "✅ Tu pago ha sido confirmado.";
            estadoTexto.style.color = "#28a745";
          }
          
          const btnContinuar = document.getElementById("btn-continuar-pago");
          if (btnContinuar) {
            btnContinuar.disabled = false;
            btnContinuar.removeAttribute("disabled");
            btnContinuar.style.opacity = "1";
            btnContinuar.style.cursor = "pointer";
            btnContinuar.style.backgroundColor = "#8b0000";
            btnContinuar.style.color = "white";
            btnContinuar.style.border = "none";
            btnContinuar.style.padding = "10px 20px";
            btnContinuar.style.borderRadius = "5px";
          }
          
          const loader = document.getElementById("loader-pago");
          if (loader) {
            loader.style.display = "none";
            loader.style.visibility = "hidden";
          }
          
          console.log('✅ [ACTUALIZAR ESTADO PAGO] UI actualizada correctamente');
        } else {
          console.log('💳 [ACTUALIZAR ESTADO PAGO] Pago aún pendiente:', estadoPago);
          const estadoTexto = document.getElementById("estado-texto-pago");
          if (estadoTexto) {
            estadoTexto.textContent = `⏳ Tu pago está pendiente de confirmación. Estado: ${estadoPago}`;
            estadoTexto.style.color = "#ffc107";
          }
        }
      } catch (err) {
        console.error("❌ [ACTUALIZAR ESTADO PAGO] Error:", err);
      }
    }

    document.getElementById("btn-continuar-pago")?.addEventListener("click", () => {
      if (pedidoId) {
        iniciarSeguimientoPedido();
      }
    });

    // ========== SEGUIMIENTO DE PEDIDO ==========
    function iniciarSeguimientoPedido() {
      mostrarSeccion("pantalla-seguimiento-pedido");
      
      // Ocultar botón finalizar al iniciar (solo se mostrará cuando esté entregado)
      const btnFinalizar = document.getElementById("btn-finalizar-pedido");
      const btnVolver = document.getElementById("btn-volver-inicio-pedido");
      if (btnFinalizar) {
        btnFinalizar.classList.add("oculto");
        btnFinalizar.style.display = "none";
      }
      if (btnVolver) {
        btnVolver.style.display = "block";
      }
      
      // Guardar estado de seguimiento
      guardarEstadoProceso();
      
      if (!pedidoId) {
        console.error("❌ iniciarSeguimientoPedido() - No hay pedidoId");
        return;
      }

      console.log('📍 iniciarSeguimientoPedido() - Iniciando seguimiento del pedido:', pedidoId);

      // Mapeo de estados del backend a estados del frontend
      const mapeoEstados = {
        "pendiente": "pendiente",
        "en preparación": "preparacion",
        "en preparacion": "preparacion",
        "preparacion": "preparacion",
        "en camino": "entregado", // Mapear "en camino" directamente a "entregado"
        "camino": "entregado", // Mapear "camino" directamente a "entregado"
        "entregado": "entregado"
      };

      const estados = ["pendiente", "preparacion", "entregado"];
      let indiceActual = -1;

      // Función para normalizar el estado del backend al formato del frontend
      function normalizarEstado(estadoBackend) {
        if (!estadoBackend) return null;
        const estadoLower = estadoBackend.toLowerCase().trim();
        return mapeoEstados[estadoLower] || estadoLower;
      }

      // Función para actualizar la UI según el estado
      function actualizarUI(estadoBackend) {
        const estado = normalizarEstado(estadoBackend);
        if (!estado) {
          console.warn('⚠️ Estado no reconocido:', estadoBackend);
          return;
        }
        
        const nuevoIndice = estados.indexOf(estado);
        console.log('📍 Estado backend:', estadoBackend, '→ Estado normalizado:', estado, 'Índice:', nuevoIndice, 'Índice anterior:', indiceActual);
        
        if (nuevoIndice !== -1) {
          // Marcar todos los estados hasta el actual como activos
          estados.forEach((est, index) => {
            const step = document.getElementById(`step-${est}`);
            if (step) {
              if (index <= nuevoIndice) {
                step.classList.add("active");
                step.style.color = "#8b0000";
                step.style.fontWeight = "bold";
              } else {
                step.classList.remove("active");
                step.style.color = "#666";
                step.style.fontWeight = "normal";
              }
            } else {
              console.warn(`⚠️ No se encontró el elemento step-${est}`);
            }
          });
          
          indiceActual = nuevoIndice;
        } else {
          console.warn('⚠️ Estado normalizado no encontrado en array de estados:', estado);
        }
      }

      // Actualizar inmediatamente al iniciar
      actualizarUI("pendiente");

      const intervalo = setInterval(async () => {
        try {
          const apiPedidosUrl = obtenerAPI_PEDIDOS();
          // Usar la ruta /:id que devuelve el pedido completo
          const url = `${apiPedidosUrl}/${pedidoId}`;
          console.log('📍 Verificando estado del pedido:', url);
          
          const res = await fetch(url);
          
          if (!res.ok) {
            console.error('❌ Error al obtener estado del pedido:', res.status, res.statusText);
            if (res.status === 404) {
              console.warn('⚠️ Pedido no encontrado, deteniendo seguimiento');
              clearInterval(intervalo);
            }
            return;
          }

          const data = await res.json();
          console.log('📍 Respuesta del servidor:', data);

          // El backend devuelve { ok: true, pedido: { estado, ... } } según obtenerPedidoPorId
          let estado = null;
          if (data.ok && data.pedido) {
            // El campo es "estado" según la consulta SQL en obtenerPedidoPorId
            estado = data.pedido.estado || data.pedido.estadoPedido || data.pedido.estado_pedido;
          } else if (data.pedido) {
            // Formato alternativo sin "ok"
            estado = data.pedido.estado || data.pedido.estadoPedido || data.pedido.estado_pedido;
          }
          
          if (estado) {
            console.log('📍 Estado del pedido obtenido:', estado);
            
            actualizarUI(estado);

            // Si el pedido está entregado, detener el intervalo y mostrar botón finalizar
            const estadoNormalizado = normalizarEstado(estado);
            if (estadoNormalizado === "entregado") {
              console.log('✅ Pedido entregado, deteniendo seguimiento y mostrando botón finalizar');
              clearInterval(intervalo);
              // Mostrar botón finalizar en lugar de limpiar automáticamente
              mostrarBotonFinalizar();
              // Guardar el estado actualizado
              guardarEstadoProceso();
            }
          } else {
            console.warn('⚠️ No se pudo obtener el estado del pedido de la respuesta:', data);
            console.warn('⚠️ Estructura de data:', JSON.stringify(data, null, 2));
          }
        } catch (err) {
          console.error("❌ Error al verificar pedido:", err);
        }
      }, 3000); // Verificar cada 3 segundos
    }

    // ========== MOSTRAR BOTÓN FINALIZAR ==========
    function mostrarBotonFinalizar() {
      const btnFinalizar = document.getElementById("btn-finalizar-pedido");
      const btnVolver = document.getElementById("btn-volver-inicio-pedido");
      
      if (btnFinalizar) {
        btnFinalizar.classList.remove("oculto");
        btnFinalizar.style.display = "block";
        console.log('✅ Botón "Finalizar" mostrado');
      }
      
      if (btnVolver) {
        btnVolver.style.display = "none";
      }
    }

    // ========== BOTÓN FINALIZAR ==========
    document.getElementById("btn-finalizar-pedido")?.addEventListener("click", async () => {
      console.log('✅ Finalizando pedido, limpiando estado y redirigiendo al menú');
      // Limpiar todo el estado
      limpiarEstadoProceso();
      // Vaciar el carrito
      await vaciarCarrito();
      // Redirigir al menú
      window.location.href = "/pages/cliente/menu.html";
    });

    // ========== VACIAR CARRITO ==========
    async function vaciarCarrito() {
      const usuario = obtenerUsuario();
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
      }
      
      const usuarioFinal = usuario || usuarioVerificado;
      
      if (!usuarioFinal || (!usuarioFinal.id && !usuarioFinal._id)) {
        console.warn('⚠️ No se puede vaciar carrito: usuario no encontrado');
        return;
      }

      try {
        const usuarioId = String(usuarioFinal.id || usuarioFinal._id).trim();
        const apiCarrito = API_CARRITO;
        
        console.log('🧹 Vaciando carrito para usuario:', usuarioId);
        
        // Método 1: Intentar usar el endpoint /vaciar
        try {
          const resVaciar = await fetch(`${apiCarrito}/vaciar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: usuarioId })
          });
          
          if (resVaciar.ok) {
            console.log('✅ Carrito vaciado correctamente usando /vaciar');
            return;
          }
        } catch (err) {
          console.warn('⚠️ Endpoint /vaciar no disponible, usando método alternativo');
        }
        
        // Método 2: Eliminar cada item individualmente
        const resGet = await fetch(`${apiCarrito}?usuario_id=${encodeURIComponent(usuarioId)}`);
        if (resGet.ok) {
          const data = await resGet.json();
          const items = data.items || (Array.isArray(data) ? data : []);
          
          if (items.length === 0) {
            console.log('✅ Carrito ya está vacío');
            return;
          }
          
          // Eliminar cada item del carrito
          for (const item of items) {
            try {
              const itemId = item._id || item.id;
              if (itemId) {
                const resDelete = await fetch(`${apiCarrito}/${itemId}`, {
                  method: "DELETE"
                });
                if (resDelete.ok) {
                  console.log(`✅ Item eliminado del carrito: ${itemId}`);
                }
              }
            } catch (err) {
              console.warn(`⚠️ Error al eliminar item:`, err);
            }
          }
          console.log('✅ Carrito vaciado correctamente');
        } else {
          console.warn('⚠️ No se pudo obtener el carrito para vaciarlo:', resGet.status);
        }
      } catch (err) {
        console.error('❌ Error al vaciar carrito:', err);
      }
    }

    document.getElementById("btn-volver-inicio-pedido")?.addEventListener("click", async () => {
      // Limpiar todo el estado cuando el usuario vuelve al menú
      limpiarEstadoProceso();
      // Vaciar el carrito
      await vaciarCarrito();
      // Redirigir al menú
      window.location.href = "/pages/cliente/menu.html";
    });

    // ========== FUNCIONES PARA AUMENTAR/DISMINUIR CANTIDAD ==========
    // NOTA: Estas funciones han sido eliminadas - los botones de aumentar/disminuir/eliminar ya no están disponibles

    // ========== RESTAURAR ESTADO DEL PEDIDO ==========
    async function restaurarEstadoPedido() {
      try {
        const pedidoGuardado = localStorage.getItem("pedido_en_seguimiento");
        if (!pedidoGuardado) {
          console.log('📋 No hay pedido en seguimiento guardado');
          return false;
        }

        const pedidoData = JSON.parse(pedidoGuardado);
        const pedidoIdGuardado = pedidoData.pedidoId;
        const metodoPagoGuardado = pedidoData.metodoPago;

        if (!pedidoIdGuardado) {
          console.log('📋 Pedido guardado sin ID válido');
          localStorage.removeItem("pedido_en_seguimiento");
          return false;
        }

        console.log('📋 Restaurando pedido en seguimiento:', pedidoIdGuardado);

        // Verificar que el pedido aún existe y obtener su estado actual
        const apiPedidosUrl = obtenerAPI_PEDIDOS();
        const res = await fetch(`${apiPedidosUrl}/${pedidoIdGuardado}`);
        
        if (!res.ok) {
          console.log('📋 Pedido no encontrado o ya completado, limpiando localStorage');
          localStorage.removeItem("pedido_en_seguimiento");
          return false;
        }

        const data = await res.json();
        if (!data.ok || !data.pedido) {
          console.log('📋 Respuesta inválida del servidor');
          localStorage.removeItem("pedido_en_seguimiento");
          return false;
        }

        const pedido = data.pedido;
        const estadoPago = pedido.estado_pago || pedido.estadoPago || "pendiente";
        const estadoPedido = pedido.estado || pedido.estadoPedido || "pendiente";

        console.log('📋 Estado del pedido:', { estadoPago, estadoPedido });

        // Restaurar el pedidoId
        pedidoId = pedidoIdGuardado;

        // Si el pedido está entregado, limpiar y mostrar carrito
        if (estadoPedido === "entregado" || estadoPedido === "Entregado") {
          console.log('✅ Pedido ya entregado, limpiando seguimiento');
          localStorage.removeItem("pedido_en_seguimiento");
          return false;
        }

        // Si es pago en efectivo o el pago ya está completado, mostrar seguimiento del pedido
        if (metodoPagoGuardado === "efectivo" || estadoPago === "completado" || estadoPago === "Completado") {
          console.log('📍 Restaurando seguimiento del pedido');
          mostrarSeccion("pantalla-seguimiento-pedido");
          iniciarSeguimientoPedido();
          return true;
        }

        // Si el pago está pendiente (Yape), mostrar seguimiento de pago
        if (estadoPago === "pendiente" || estadoPago === "Pendiente") {
          console.log('💳 Restaurando seguimiento del pago');
          mostrarSeccion("pantalla-seguimiento-pago");
          iniciarSeguimientoPago();
          return true;
        }

        // Por defecto, mostrar seguimiento del pedido
        console.log('📍 Restaurando seguimiento del pedido (por defecto)');
        mostrarSeccion("pantalla-seguimiento-pedido");
        iniciarSeguimientoPedido();
        return true;

      } catch (err) {
        console.error('❌ Error al restaurar estado del pedido:', err);
        localStorage.removeItem("pedido_en_seguimiento");
        return false;
      }
    }

    // ========== RESTAURAR ESTADO COMPLETO DEL PROCESO ==========
    async function restaurarEstadoProceso() {
      try {
        const estadoGuardado = localStorage.getItem("estado_proceso_pedido");
        if (!estadoGuardado) {
          console.log('📋 No hay estado del proceso guardado');
          return false;
        }

        const estado = JSON.parse(estadoGuardado);
        console.log('📋 Restaurando estado del proceso:', estado);

        // Si hay un pedidoId, verificar primero si el pedido está entregado
        if (estado.pedidoId) {
          const apiPedidosUrl = obtenerAPI_PEDIDOS();
          try {
            const res = await fetch(`${apiPedidosUrl}/${estado.pedidoId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.ok && data.pedido) {
                const estadoPedido = data.pedido.estado || data.pedido.estadoPedido || "pendiente";
                if (estadoPedido === "entregado" || estadoPedido === "Entregado") {
                  console.log('✅ Pedido ya entregado, limpiando estado');
                  limpiarEstadoProceso();
                  return false;
                }
              }
            }
          } catch (err) {
            console.warn('⚠️ Error al verificar pedido, continuando con restauración:', err);
          }
        }

        // Restaurar variables globales
        tipoServicio = estado.tipoServicio || null;
        datosCliente = estado.datosCliente || {};
        datosDireccion = estado.datosDireccion || {};
        metodoPago = estado.metodoPago || null;
        pedidoId = estado.pedidoId || null;

        // Restaurar valores en los campos del formulario
        if (datosCliente.nombre) {
          const nombreInput = document.getElementById("nombre");
          if (nombreInput) nombreInput.value = datosCliente.nombre;
        }
        if (datosCliente.telefono) {
          const telefonoInput = document.getElementById("telefono");
          if (telefonoInput) telefonoInput.value = datosCliente.telefono;
        }
        if (datosDireccion.calle) {
          const calleInput = document.getElementById("calle");
          if (calleInput) calleInput.value = datosDireccion.calle;
        }
        if (datosDireccion.referencia) {
          const referenciaInput = document.getElementById("referencia");
          if (referenciaInput) referenciaInput.value = datosDireccion.referencia;
        }

        // Restaurar selección de tipo de servicio
        if (tipoServicio) {
          const servicioBtn = document.querySelector(`.servicio-btn[data-tipo="${tipoServicio}"]`);
          if (servicioBtn) {
            document.querySelectorAll(".servicio-btn").forEach(b => b.classList.remove("selected"));
            servicioBtn.classList.add("selected");
          }
        }

        // Si hay un pedidoId, significa que el pedido ya fue creado, ir directamente al seguimiento
        if (pedidoId) {
          // Verificar si está en seguimiento según el estado guardado
          if (estado.enSeguimiento && estado.seccionSeguimiento) {
            const seccionSeguimiento = estado.seccionSeguimiento;
            
            // Verificar el estado actual del pedido para determinar qué seguimiento mostrar
            try {
              const apiPedidosUrl = obtenerAPI_PEDIDOS();
              const res = await fetch(`${apiPedidosUrl}/${pedidoId}`);
              if (res.ok) {
                const data = await res.json();
                if (data.ok && data.pedido) {
                  const estadoPago = data.pedido.estado_pago || data.pedido.estadoPago || "pendiente";
                  const estadoPedido = data.pedido.estado || data.pedido.estadoPedido || "pendiente";
                  
                  // Si el pedido está entregado, mostrar botón finalizar
                  if (estadoPedido === "entregado" || estadoPedido === "Entregado") {
                    mostrarSeccion("pantalla-seguimiento-pedido");
                    mostrarBotonFinalizar();
                    return true;
                  }
                  
                  // Si es pago en efectivo o el pago ya está completado, mostrar seguimiento del pedido
                  if (metodoPago === "efectivo" || estadoPago === "completado" || estadoPago === "Completado") {
                    mostrarSeccion("pantalla-seguimiento-pedido");
                    iniciarSeguimientoPedido();
                    return true;
                  }
                  
                  // Si el pago está pendiente (Yape), mostrar seguimiento de pago
                  if (estadoPago === "pendiente" || estadoPago === "Pendiente") {
                    mostrarSeccion("pantalla-seguimiento-pago");
                    iniciarSeguimientoPago();
                    return true;
                  }
                }
              }
            } catch (err) {
              console.warn('⚠️ Error al verificar estado del pedido, usando sección guardada:', err);
            }
            
            // Si no se pudo verificar, usar la sección guardada
            if (seccionSeguimiento === "pantalla-seguimiento-pedido") {
              mostrarSeccion("pantalla-seguimiento-pedido");
              iniciarSeguimientoPedido();
              return true;
            } else if (seccionSeguimiento === "pantalla-seguimiento-pago") {
              mostrarSeccion("pantalla-seguimiento-pago");
              iniciarSeguimientoPago();
              return true;
            }
          }
          
          // Fallback: Verificar si hay un pedido en seguimiento guardado (formato antiguo)
          const pedidoGuardado = localStorage.getItem("pedido_en_seguimiento");
          if (pedidoGuardado) {
            const pedidoData = JSON.parse(pedidoGuardado);
            const estadoPago = pedidoData.estadoPago || "pendiente";
            
            if (metodoPago === "efectivo" || estadoPago === "completado" || estadoPago === "Completado") {
              mostrarSeccion("pantalla-seguimiento-pedido");
              iniciarSeguimientoPedido();
              return true;
            } else {
              mostrarSeccion("pantalla-seguimiento-pago");
              iniciarSeguimientoPago();
              return true;
            }
          }
        }

        // Si NO hay pedidoId, restaurar la sección donde estaba el usuario en el proceso
        // Restaurar la sección actual según el progreso del proceso
        const seccionActual = estado.seccionActual || "carrito-servicio-section";
        
        // Determinar la sección correcta basándose en los datos disponibles
        let seccionARestaurar = seccionActual;
        
        // Si no hay tipo de servicio, debe estar en carrito
        if (!tipoServicio) {
          seccionARestaurar = "carrito-servicio-section";
        }
        // Si es domicilio y no hay datos del cliente, debe estar en cliente
        else if (tipoServicio === "domicilio" && (!datosCliente.nombre || !datosCliente.telefono)) {
          seccionARestaurar = "cliente-section";
        }
        // Si es domicilio y hay datos del cliente pero no hay dirección, debe estar en dirección
        else if (tipoServicio === "domicilio" && (!datosDireccion.calle)) {
          seccionARestaurar = "direccion-section";
        }
        // Si hay todos los datos pero no método de pago, debe estar en resumen o pago
        else if (!metodoPago) {
          // Si la sección guardada es pago-section, mantenerla, sino ir a resumen
          if (seccionActual === "pago-section") {
            seccionARestaurar = "pago-section";
          } else {
            seccionARestaurar = "resumen-section";
          }
        }
        // Si hay método de pago, debe estar en pago
        else {
          seccionARestaurar = "pago-section";
        }
        
        console.log('📋 Sección a restaurar:', seccionARestaurar);
        
        // Restaurar la sección sin usar mostrarSeccion para evitar guardar de nuevo
        document.querySelectorAll("section").forEach(sec => {
          sec.classList.add("oculto");
        });
        const seccion = document.getElementById(seccionARestaurar);
        if (seccion) {
          seccion.classList.remove("oculto");
          
          // Si es la sección del carrito, cargar el carrito
          if (seccionARestaurar === "carrito-servicio-section") {
            cargarCarrito();
          }
          
          // Si es la sección de resumen, mostrar el resumen
          if (seccionARestaurar === "resumen-section") {
            mostrarResumen();
          }
          
          // Si es la sección de pago, restaurar la selección del método de pago sin hacer click
          if (seccionARestaurar === "pago-section" && metodoPago) {
            const pagoBtn = document.querySelector(`.pago-btn[data-metodo="${metodoPago}"]`);
            if (pagoBtn) {
              document.querySelectorAll(".pago-btn").forEach(b => b.classList.remove("selected"));
              pagoBtn.classList.add("selected");
              // Simular el evento para mostrar la información de pago sin cambiar de sección
              // Pero solo actualizar la UI de pago, no cambiar de sección
              const pagoExtra = document.getElementById("pago-extra");
              const btnEnviar = document.getElementById("btn-enviar-pedido");
              
              if (metodoPago === "yape" && pagoExtra) {
                pagoExtra.innerHTML = `
                  <div style='text-align: center; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; max-width: 400px; margin: 0 auto;'>
                    <h3 style='color: #8b0000; margin-bottom: 1rem;'>Paga con Yape</h3>
                    <div style='margin: 1.5rem 0;'>
                      <img src="../../assets/qr_yape.jpeg" 
                           alt="Código QR de Yape" 
                           style='max-width: 250px; width: 100%; height: auto; border: 2px solid #8b0000; border-radius: 8px; padding: 0.5rem; background: white; display: block; margin: 0 auto;'
                           onerror="console.error('Error al cargar qr_yape.jpeg'); this.style.display='none'; this.nextElementSibling.style.display='block';"
                           onload="console.log('Imagen qr_yape.jpeg cargada correctamente');">
                      <div style='display: none; padding: 2rem; background: #e0e0e0; border-radius: 8px; color: #666;'>
                        <p>⚠️ No se pudo cargar la imagen del código QR</p>
                      </div>
                    </div>
                    <p style='margin-top: 1rem; font-size: 1rem; color: #333;'>Escanea el código QR o envía a:</p>
                    <p style='font-size: 1.3rem; font-weight: bold; color: #8b0000; margin: 0.5rem 0;'>999 999 999</p>
                  </div>
                `;
                if (btnEnviar) btnEnviar.textContent = "Enviar Pago";
              } else if (metodoPago === "efectivo" && pagoExtra) {
                // Obtener el total de forma asíncrona
                obtenerTotalCarrito().then(total => {
                  pagoExtra.innerHTML = `
                    <div style='text-align: center; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; max-width: 400px; margin: 0 auto;'>
                      <h3 style='color: #8b0000; margin-bottom: 1rem;'>Pago en Efectivo</h3>
                      <div style='margin: 1.5rem 0; padding: 1.5rem; background: white; border: 2px solid #8b0000; border-radius: 8px;'>
                        <p style='font-size: 1rem; color: #666; margin-bottom: 0.5rem;'>Total a pagar:</p>
                        <p style='font-size: 2rem; font-weight: bold; color: #28a745; margin: 0.5rem 0;'>S/ ${total.toFixed(2)}</p>
                        <p style='font-size: 0.9rem; color: #666; margin-top: 1rem;'>Pagarás al momento de recibir tu pedido</p>
                      </div>
                    </div>
                  `;
                  if (btnEnviar) btnEnviar.textContent = "Enviar Pedido";
                }).catch(err => {
                  console.error('Error al obtener total:', err);
                  pagoExtra.innerHTML = `
                    <div style='text-align: center; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; max-width: 400px; margin: 0 auto;'>
                      <h3 style='color: #8b0000; margin-bottom: 1rem;'>Pago en Efectivo</h3>
                      <p style='color: #666;'>Pagarás al momento de recibir tu pedido</p>
                    </div>
                  `;
                  if (btnEnviar) btnEnviar.textContent = "Enviar Pedido";
                });
              }
            }
          }
          
          console.log('✅ Sección restaurada:', seccionARestaurar);
          return true;
        }

        return false;
      } catch (err) {
        console.error('❌ Error al restaurar estado del proceso:', err);
        limpiarEstadoProceso();
        return false;
      }
    }

    // ========== LIMPIAR ESTADO DEL PROCESO ==========
    function limpiarEstadoProceso() {
      localStorage.removeItem("estado_proceso_pedido");
      localStorage.removeItem("pedido_en_seguimiento");
      tipoServicio = null;
      datosCliente = {};
      datosDireccion = {};
      metodoPago = null;
      pedidoId = null;
      console.log('🧹 Estado del proceso limpiado');
    }

    // ========== LIMPIAR SEGUIMIENTO ==========
    function limpiarSeguimientoPedido() {
      limpiarEstadoProceso(); // Limpiar todo el estado cuando se limpia el seguimiento
      console.log('🧹 Seguimiento del pedido limpiado');
    }

    // ========== INICIALIZACIÓN ==========
    document.addEventListener("DOMContentLoaded", async () => {
      actualizarCabezalUsuario();
      
      // Intentar restaurar el estado completo del proceso primero
      const estadoRestaurado = await restaurarEstadoProceso();
      
      // Si no se restauró ningún estado (no hay proceso en curso), mostrar el carrito
      if (!estadoRestaurado) {
        cargarCarrito();
      }
      
      // Actualizar cabezal cuando la ventana gana foco (por si el usuario inicia sesión en otra pestaña)
      window.addEventListener("focus", actualizarCabezalUsuario);
      
      // Actualizar periódicamente para mantener sincronizado
      setInterval(actualizarCabezalUsuario, 2000);
    });