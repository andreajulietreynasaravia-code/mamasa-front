// Obtener URL de API de reservas usando variables de entorno
const RESERVAS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.reservas) 
  ? window.config.API_CONFIG.reservas 
  : (typeof process !== 'undefined' && process.env?.RESERVAS_SERVICE_URL) 
    ? `${process.env.RESERVAS_SERVICE_URL}/api` 
    : "http://localhost:4004/api";
const API_BASE = `${RESERVAS_SERVICE_URL}/reservas`;

    let datosReserva = {
      fecha: '',
      hora: '',
      tipoReserva: '',
      personas: 0,
      nombre: '',
      email: '',
      telefono: '',
      notas: ''
    };

    // Inicializar fecha mínima como hoy
    document.addEventListener('DOMContentLoaded', function() {
      const hoy = new Date().toISOString().split('T')[0];
      document.getElementById('fecha').min = hoy;
      document.getElementById('fecha').value = hoy;
      
      // Cargar horarios para hoy
      cargarHorariosDisponibles(hoy);
    });

    // Cambiar fecha
    document.getElementById('fecha').addEventListener('change', function() {
      cargarHorariosDisponibles(this.value);
    });

    // Cambiar tipo de reserva
    document.getElementById('tipoReserva').addEventListener('change', function() {
      verificarPaso1();
    });

    // Cambiar número de personas
    document.getElementById('personas').addEventListener('change', function() {
      verificarPaso1();
    });

    // Cargar horarios disponibles
    async function cargarHorariosDisponibles(fecha) {
      const container = document.getElementById('horariosContainer');
      container.innerHTML = '<div class="loading">Cargando horarios disponibles...</div>';

      if (!fecha) {
        container.innerHTML = '<div class="error">Por favor selecciona una fecha</div>';
        return;
      }

      try {
        console.log('📅 Cargando horarios para fecha:', fecha);
        const response = await fetch(`${API_BASE}/disponibles?fecha=${fecha}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📅 Horarios recibidos:', data);

        container.innerHTML = '';

        if (!data.horarios_disponibles || data.horarios_disponibles.length === 0) {
          container.innerHTML = '<div class="error">No hay horarios disponibles para esta fecha</div>';
          return;
        }

        data.horarios_disponibles.forEach(horario => {
          const btn = document.createElement('button');
          btn.className = 'horario-btn';
          btn.textContent = horario;
          btn.onclick = () => seleccionarHorario(horario, btn);
          container.appendChild(btn);
        });

        datosReserva.fecha = fecha;
        verificarPaso1();
      } catch (error) {
        console.error('❌ Error cargando horarios:', error);
        container.innerHTML = `<div class="error">Error al cargar horarios: ${error.message}</div>`;
      }
    }

    // Seleccionar horario
    function seleccionarHorario(horario, elemento) {
      // Deseleccionar anterior
      document.querySelectorAll('.horario-btn').forEach(btn => {
        btn.classList.remove('selected');
      });

      // Seleccionar nuevo
      elemento.classList.add('selected');
      datosReserva.hora = horario;
      verificarPaso1();
    }

    // Verificar si paso 1 está completo
    function verificarPaso1() {
      const completo = datosReserva.fecha && 
                      datosReserva.hora && 
                      document.getElementById('tipoReserva').value && 
                      document.getElementById('personas').value;
      
      document.getElementById('btnPaso1').disabled = !completo;
    }

    // Navegación entre pasos
    function siguientePaso(paso) {
      // Validar y guardar datos del paso actual
      if (paso === 2) {
        datosReserva.tipoReserva = document.getElementById('tipoReserva').value;
        datosReserva.personas = parseInt(document.getElementById('personas').value);
        
        // Autocompletar datos personales con información del usuario logueado
        llenarDatosPersonales();
      } else if (paso === 3) {
        datosReserva.nombre = document.getElementById('nombre').value;
        datosReserva.email = document.getElementById('email').value;
        datosReserva.telefono = document.getElementById('telefono').value;
        datosReserva.notas = document.getElementById('notas').value;
        mostrarResumen();
      }

      // Ocultar todas las secciones
      document.querySelectorAll('.seccion').forEach(sec => {
        sec.classList.remove('activa');
      });

      // Mostrar siguiente sección
      document.getElementById(`seccion${paso}`).classList.add('activa');

      // Actualizar pasos
      document.querySelectorAll('.paso').forEach((pasoElem, index) => {
        pasoElem.classList.remove('activo', 'completado');
        if (index + 1 === paso) {
          pasoElem.classList.add('activo');
        } else if (index + 1 < paso) {
          pasoElem.classList.add('completado');
        }
      });
    }

    // 🔹 Llenar datos personales automáticamente
    function llenarDatosPersonales() {
      const usuario = obtenerUsuario();
      
      if (usuario) {
        // Llenar nombre si está disponible y el campo está vacío
        const nombreInput = document.getElementById('nombre');
        if (nombreInput && usuario.nombre && !nombreInput.value.trim()) {
          nombreInput.value = usuario.nombre;
          console.log('✅ Nombre autocompletado:', usuario.nombre);
        }
        
        // Llenar email si está disponible y el campo está vacío
        const emailInput = document.getElementById('email');
        if (emailInput && (usuario.correo || usuario.email) && !emailInput.value.trim()) {
          emailInput.value = usuario.correo || usuario.email;
          console.log('✅ Email autocompletado:', usuario.correo || usuario.email);
        }
        
        // Llenar teléfono si está disponible y el campo está vacío
        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput && usuario.telefono && !telefonoInput.value.trim()) {
          telefonoInput.value = usuario.telefono;
          console.log('✅ Teléfono autocompletado:', usuario.telefono);
        }
        
        console.log('✅ Datos personales autocompletados correctamente');
      } else {
        console.log('⚠️ No hay usuario logueado, no se pueden autocompletar los datos');
      }
    }

    function anteriorPaso(paso) {
      siguientePaso(paso);
    }

    // Formatear fecha en zona horaria de Perú
    function formatearFechaPeru(fechaStr) {
      if (!fechaStr) return '';
      const [year, month, day] = fechaStr.split('-');
      const fecha = new Date(`${year}-${month}-${day}T00:00:00-05:00`);
      return fecha.toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Mostrar resumen
    function mostrarResumen() {
      const resumen = document.getElementById('resumenReserva');
      resumen.innerHTML = `
        <div class="resumen-item">
          <span>Fecha:</span>
          <span>${formatearFechaPeru(datosReserva.fecha)}</span>
        </div>
        <div class="resumen-item">
          <span>Hora:</span>
          <span>${datosReserva.hora}</span>
        </div>
        <div class="resumen-item">
          <span>Tipo:</span>
          <span>${datosReserva.tipoReserva}</span>
        </div>
        <div class="resumen-item">
          <span>Personas:</span>
          <span>${datosReserva.personas}</span>
        </div>
        <div class="resumen-item">
          <span>Nombre:</span>
          <span>${datosReserva.nombre}</span>
        </div>
        <div class="resumen-item">
          <span>Email:</span>
          <span>${datosReserva.email}</span>
        </div>
        <div class="resumen-item">
          <span>Teléfono:</span>
          <span>${datosReserva.telefono}</span>
        </div>
        ${datosReserva.notas ? `
        <div class="resumen-item">
          <span>Notas:</span>
          <span>${datosReserva.notas}</span>
        </div>
        ` : ''}
      `;
    }

    // Confirmar reserva
    async function confirmarReserva() {
      const btn = document.getElementById('btnConfirmar');
      btn.disabled = true;
      btn.textContent = 'Procesando...';

      try {
        const response = await fetch(API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cliente_nombre: datosReserva.nombre,
            cliente_email: datosReserva.email,
            cliente_telefono: datosReserva.telefono,
            fecha_reserva: datosReserva.fecha,
            hora_reserva: datosReserva.hora,
            numero_personas: datosReserva.personas,
            tipo_reserva: datosReserva.tipoReserva,
            notas_especiales: datosReserva.notas
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const reserva = await response.json();
        const reservaId = reserva._id || reserva.id || reserva.reserva_id;
        mostrarExito(reservaId);
      } catch (error) {
        mostrarError(error.message);
        btn.disabled = false;
        btn.textContent = 'Confirmar Reserva';
      }
    }

    let idReservaActual = null;
    let intervaloEstado = null;

    // Mostrar pantalla de estado
    function mostrarExito(idReserva) {
      idReservaActual = idReserva;
      document.getElementById('mensajeExito').textContent = 
        `Tu reserva #${idReserva.substring(0, 8)} ha sido enviada para el ${formatearFechaPeru(datosReserva.fecha)} a las ${datosReserva.hora}.`;
      siguientePaso(4);
      
      // Iniciar seguimiento del estado
      iniciarSeguimientoEstado(idReserva);
    }

    // Seguimiento del estado de la reserva
    async function iniciarSeguimientoEstado(idReserva) {
      // Consultar estado inmediatamente
      await consultarEstadoReserva(idReserva);
      
      // Consultar cada 5 segundos
      intervaloEstado = setInterval(async () => {
        await consultarEstadoReserva(idReserva);
      }, 5000);
    }

    // Consultar estado de la reserva
    async function consultarEstadoReserva(idReserva) {
      try {
        const response = await fetch(`${API_BASE}/${idReserva}`);
        if (!response.ok) {
          console.error('Error al consultar estado de reserva');
          return;
        }
        
        const reserva = await response.json();
        actualizarEstadoReserva(reserva.estado || 'pendiente');
      } catch (error) {
        console.error('Error consultando estado:', error);
      }
    }

    // Actualizar visualización del estado
    function actualizarEstadoReserva(estado) {
      const tituloEstado = document.getElementById('tituloEstado');
      const estadoBadge = document.getElementById('estadoBadge');
      const mensajeEstado = document.getElementById('mensajeEstado');
      
      // Remover clases anteriores
      estadoBadge.className = 'estado-badge ' + estado;
      
      switch(estado) {
        case 'pendiente':
          tituloEstado.textContent = 'Reserva Pendiente';
          estadoBadge.innerHTML = '<span>⏳ Pendiente</span>';
          mensajeEstado.textContent = 'Tu reserva está siendo revisada. Te notificaremos cuando sea confirmada o cancelada.';
          break;
        case 'confirmada':
          tituloEstado.textContent = 'Reserva Confirmada';
          estadoBadge.innerHTML = '<span>✓ Confirmada</span>';
          mensajeEstado.textContent = `Tu reserva ha sido confirmada para el ${formatearFechaPeru(datosReserva.fecha)} a las ${datosReserva.hora}. ¡Te esperamos!`;
          // Detener el seguimiento cuando se confirma
          if (intervaloEstado) {
            clearInterval(intervaloEstado);
            intervaloEstado = null;
          }
          break;
        case 'cancelada':
          tituloEstado.textContent = 'Reserva Cancelada';
          estadoBadge.innerHTML = '<span>✕ Cancelada</span>';
          mensajeEstado.textContent = 'Lo sentimos, tu reserva ha sido cancelada. Puedes hacer una nueva reserva.';
          // Detener el seguimiento cuando se cancela
          if (intervaloEstado) {
            clearInterval(intervaloEstado);
            intervaloEstado = null;
          }
          break;
        case 'completada':
          tituloEstado.textContent = 'Reserva Completada';
          estadoBadge.innerHTML = '<span>✓✓ Completada</span>';
          mensajeEstado.textContent = 'Tu reserva ha sido completada. ¡Gracias por visitarnos!';
          // Detener el seguimiento cuando se completa
          if (intervaloEstado) {
            clearInterval(intervaloEstado);
            intervaloEstado = null;
          }
          break;
      }
    }

    // Nueva reserva
    function nuevaReserva() {
      // Detener seguimiento si está activo
      if (intervaloEstado) {
        clearInterval(intervaloEstado);
        intervaloEstado = null;
      }
      idReservaActual = null;
      
      // Resetear datos
      datosReserva = {
        fecha: '',
        hora: '',
        tipoReserva: '',
        personas: 0,
        nombre: '',
        email: '',
        telefono: '',
        notas: ''
      };

      // Resetear formulario
      document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
      document.getElementById('tipoReserva').value = '';
      document.getElementById('personas').value = '';
      document.getElementById('nombre').value = '';
      document.getElementById('email').value = '';
      document.getElementById('telefono').value = '';
      document.getElementById('notas').value = '';

      // Volver al paso 1
      siguientePaso(1);
      cargarHorariosDisponibles(document.getElementById('fecha').value);
    }

    // Mostrar error
    function mostrarError(mensaje) {
      const errorDiv = document.getElementById('error');
      errorDiv.textContent = mensaje;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }

    // 🔹 Obtener usuario del localStorage
    function obtenerUsuario() {
      try {
        // Método 1: Usar window.auth si está disponible
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
          const usuario = window.auth.getCurrentUser();
          const role = window.auth.getCurrentRole();
          
          if (usuario && (role === 'cliente' || usuario.rol === 'usuario')) {
            console.log('✅ Usuario encontrado via window.auth:', usuario);
            return usuario;
          }
        }
        
        // Método 2: Verificar localStorage directamente
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        
        if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
          try {
            const usuario = JSON.parse(userStr);
            if (usuario && (usuario.rol === "usuario" || roleStr === "cliente")) {
              console.log('✅ Usuario encontrado via localStorage:', usuario);
              return usuario;
            }
          } catch (e) {
            console.error("❌ Error parseando user de localStorage:", e);
          }
        }
        
        // Método 3: Verificar localStorage antiguo
        const usuarioStr = localStorage.getItem("usuario");
        if (usuarioStr) {
          try {
            const usuario = JSON.parse(usuarioStr);
            if (usuario && usuario.rol === "usuario") {
              console.log('✅ Usuario encontrado via localStorage (antiguo):', usuario);
              return usuario;
            }
          } catch (e) {
            console.error("❌ Error parseando usuario de localStorage:", e);
          }
        }
        
        console.warn('⚠️ No se encontró usuario');
        return null;
      } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        return null;
      }
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

    // 🔹 Cerrar sesión
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      const usuario = obtenerUsuario();
      const API_CARRITO = "http://localhost:4000/api/menu/carrito";
      
      if (usuario) {
        // Vaciar carrito del usuario
        try {
          await fetch(`${API_CARRITO}/vaciar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario_id: usuario.id })
          });
        } catch (err) {
          console.error("Error al vaciar carrito:", err);
        }
      }

      // Limpiar localStorage
      localStorage.removeItem("usuario");
      
      // Redirigir al login
      window.location.href = "/pages/cliente/login.html";
    });

    // Inicializar
    actualizarCabezalUsuario();

    // Cerrar menú de usuario al hacer click fuera
    document.addEventListener("click", (e) => {
      const userMenu = document.getElementById("userMenu");
      const userLink = document.getElementById("userLink");
      if (userMenu && !userMenu.contains(e.target) && !userLink.contains(e.target)) {
        userMenu.style.display = "none";
      }
    });