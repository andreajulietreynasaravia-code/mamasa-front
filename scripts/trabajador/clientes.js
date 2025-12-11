// Obtener URL de API de clientes usando variables de entorno
const USUARIOS_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.usuarios) 
  ? window.config.API_CONFIG.usuarios 
  : (typeof process !== 'undefined' && process.env?.USUARIOS_SERVICE_URL) 
    ? `${process.env.USUARIOS_SERVICE_URL}/api` 
    : "http://localhost:3000/api";
const API_CLIENTES = `${USUARIOS_SERVICE_URL}/clientes`;

    async function cargarClientes() {
      const tbody = document.getElementById("tbody-clientes");
      const totalClientes = document.getElementById("total-clientes");
      
      try {
        // Mostrar estado de carga
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Cargando clientes...</td></tr>`;
        
        console.log("🔍 Cargando clientes desde:", API_CLIENTES);
        const response = await fetch(API_CLIENTES);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("✅ Datos recibidos:", data);
        
        let clientes = data.clientes || [];
        console.log(`📊 Total de clientes recibidos: ${clientes.length}`);
        
        // Log detallado de los primeros clientes para debugging
        if (clientes.length > 0) {
          console.log("📋 Primer cliente completo:", JSON.stringify(clientes[0], null, 2));
          console.log("📋 Claves del primer cliente:", Object.keys(clientes[0]));
        }
        
        // Aplicar filtro de búsqueda si existe
        const busquedaInput = document.getElementById("buscar-cliente");
        if (busquedaInput) {
          const busqueda = busquedaInput.value.toLowerCase().trim();
          if (busqueda) {
            clientes = clientes.filter(cliente => 
              (cliente.nombre && cliente.nombre.toLowerCase().includes(busqueda)) ||
              (cliente.correo && cliente.correo.toLowerCase().includes(busqueda)) ||
              (cliente.telefono && cliente.telefono.toLowerCase().includes(busqueda))
            );
            console.log(`🔍 Clientes después del filtro: ${clientes.length}`);
          }
        }

        mostrarClientes(clientes);
        actualizarEstadisticas(clientes);
      } catch (error) {
        console.error("❌ Error cargando clientes:", error);
        const errorMsg = error.message || "Error desconocido";
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error al cargar los clientes: ${errorMsg}</td></tr>`;
        if (totalClientes) totalClientes.textContent = "0";
      }
    }

    function mostrarClientes(clientes) {
      const tbody = document.getElementById("tbody-clientes");
      
      if (!tbody) {
        console.error("❌ No se encontró el elemento tbody-clientes");
        return;
      }
      
      if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay clientes registrados</td></tr>`;
        return;
      }

      tbody.innerHTML = clientes.map(cliente => {
        // Función helper para verificar si un valor es válido
        const esValido = (valor) => {
          return valor !== null && 
                 valor !== undefined && 
                 valor !== 'null' && 
                 valor !== '' && 
                 String(valor).trim() !== '';
        };
        
        // Obtener valores o 'N/A' si no son válidos
        const telefono = esValido(cliente.telefono) ? cliente.telefono : 'N/A';
        const direccion = esValido(cliente.direccion) ? cliente.direccion : 'N/A';
        
        // Log solo si hay valores para debugging
        if (!esValido(cliente.telefono) || !esValido(cliente.direccion)) {
          console.log("⚠️ Cliente con datos faltantes:", {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            todasLasClaves: Object.keys(cliente)
          });
        }
        
        return `
          <tr>
            <td>${cliente.id || '-'}</td>
            <td><strong>${cliente.nombre || '-'}</strong></td>
            <td>${cliente.correo || '-'}</td>
            <td>${telefono}</td>
            <td>${direccion}</td>
          </tr>
        `;
      }).join('');
      
      console.log(`✅ Mostrados ${clientes.length} clientes en la tabla`);
    }

    function actualizarEstadisticas(clientes) {
      const totalClientes = document.getElementById("total-clientes");
      if (totalClientes) {
        totalClientes.textContent = clientes.length;
      }
    }

    function limpiarBusqueda() {
      const busquedaInput = document.getElementById("buscar-cliente");
      if (busquedaInput) {
        busquedaInput.value = '';
        cargarClientes();
      }
    }

    // Cargar clientes al iniciar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log("📄 DOM cargado, iniciando carga de clientes");
        cargarClientes();
        
        // Buscar al presionar Enter
        const busquedaInput = document.getElementById("buscar-cliente");
        if (busquedaInput) {
          busquedaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              cargarClientes();
            }
          });
        }
      });
    } else {
      // Si el DOM ya está cargado
      console.log("📄 DOM ya cargado, iniciando carga de clientes");
      cargarClientes();
      
      // Buscar al presionar Enter
      const busquedaInput = document.getElementById("buscar-cliente");
      if (busquedaInput) {
        busquedaInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            cargarClientes();
          }
        });
      }
    }