// Obtener URLs de API usando variables de entorno
const MENU_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.menu) 
  ? window.config.API_CONFIG.menu 
  : (typeof process !== 'undefined' && process.env?.MENU_SERVICE_URL) 
    ? `${process.env.MENU_SERVICE_URL}/api` 
    : "http://localhost:4000/api";
const API_MENU = `${MENU_SERVICE_URL}/menu`;
const API_CARRITO = `${MENU_SERVICE_URL}/menu/carrito`;

    // 🔹 Obtener usuario del localStorage
    function obtenerUsuario() {
      try {
        console.log('🔍 obtenerUsuario() - Iniciando búsqueda de usuario...');
        
        // Método 1: Usar window.auth.getCurrentUser() si está disponible
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
          const usuario = window.auth.getCurrentUser();
          const role = window.auth.getCurrentRole();
          console.log('🔍 Método 1 (window.auth) - Usuario:', usuario, 'Role:', role);
          
          if (usuario) {
            // Verificar que sea un cliente (rol 'usuario' en BD o 'cliente' en localStorage)
            if (role === 'cliente' || usuario.rol === 'usuario') {
              console.log('✅ Usuario encontrado via window.auth.getCurrentUser()');
              return usuario;
            } else {
              console.log('⚠️ Usuario encontrado pero no es cliente. Role:', role, 'Usuario.rol:', usuario.rol);
            }
          } else {
            console.log('⚠️ window.auth.getCurrentUser() retornó null');
          }
        } else {
          console.log('⚠️ window.auth o getCurrentUser no está disponible');
        }
        
        // Método 2: Verificar localStorage directamente
        const userStr = localStorage.getItem("user");
        const roleStr = localStorage.getItem("role");
        console.log('🔍 Método 2 (localStorage) - user:', userStr ? 'existe' : 'no existe', 'role:', roleStr);
        
        if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
          try {
            const usuario = JSON.parse(userStr);
            if (usuario && (usuario.rol === "usuario" || roleStr === "cliente")) {
              console.log('✅ Usuario encontrado via localStorage (user)');
              return usuario;
            }
          } catch (e) {
            console.error("❌ Error parseando user de localStorage:", e);
          }
        }
        
        // Método 3: Verificar localStorage antiguo
        const usuarioStr = localStorage.getItem("usuario");
        console.log('🔍 Método 3 (localStorage antiguo) - usuario:', usuarioStr ? 'existe' : 'no existe');
        
        if (usuarioStr) {
          try {
            const usuario = JSON.parse(usuarioStr);
            if (usuario && usuario.rol === "usuario") {
              console.log('✅ Usuario encontrado via localStorage (usuario) - Migrando...');
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
            console.error("❌ Error parseando usuario de localStorage:", e);
          }
        }
        
        console.log('❌ No se encontró usuario en ningún método');
      } catch (error) {
        console.error("❌ Error al obtener usuario:", error);
      }
      return null;
    }

    // 🔹 Actualizar cabezal de usuario
    function actualizarCabezalUsuario() {
      const usuario = obtenerUsuario();
      const userText = document.getElementById("userText");
      const userLink = document.getElementById("userLink");
      const userTextNav = document.getElementById("userTextNav");
      const userLinkNav = document.getElementById("userLinkNav");
      
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
      }
    }

    // 🔹 Cargar el menú
    async function cargarMenu() {
      try {
        const res = await fetch(API_MENU);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        
        const platos = await res.json();
        const contenedor = document.getElementById("menuContainer");

        if (!platos || platos.length === 0) {
          contenedor.innerHTML = '<div class="empty-state">No hay platos disponibles aún.</div>';
          return;
        }

        // Agrupar por categoría
        const categorias = {};
        platos.forEach(p => {
          const cat = p.categoria || "Sin categoría";
          if (!categorias[cat]) categorias[cat] = [];
          categorias[cat].push(p);
        });

        // Crear botones de categorías
        const categoryButtonsContainer = document.createElement("div");
        categoryButtonsContainer.className = "category-buttons";
        const allCategories = Object.keys(categorias);
        
        // Botón "Todos"
        const btnAll = document.createElement("button");
        btnAll.className = "category-btn active";
        btnAll.textContent = "TODOS";
        btnAll.onclick = () => filtrarPorCategoria(null);
        categoryButtonsContainer.appendChild(btnAll);
        
        // Botones por categoría
        allCategories.forEach(cat => {
          const btn = document.createElement("button");
          btn.className = "category-btn";
          btn.textContent = cat.toUpperCase();
          btn.onclick = () => filtrarPorCategoria(cat);
          categoryButtonsContainer.appendChild(btn);
        });
        
        contenedor.innerHTML = "";
        contenedor.appendChild(categoryButtonsContainer);

        // Crear contenedor de platos
        const platosContainer = document.createElement("div");
        platosContainer.id = "platosContainer";
        platosContainer.className = "platos";
        contenedor.appendChild(platosContainer);

        // Función para filtrar por categoría
        window.filtrarPorCategoria = function(categoria) {
          // Actualizar botones activos
          document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((categoria === null && btn.textContent === 'TODOS') || 
                (categoria !== null && btn.textContent === categoria.toUpperCase())) {
              btn.classList.add('active');
            }
          });
          
          // Filtrar y mostrar platos
          const platosContainer = document.getElementById('platosContainer');
          platosContainer.innerHTML = '';
          
          const platosFiltrados = categoria 
            ? categorias[categoria] 
            : platos;
          
          platosFiltrados.forEach(plato => {
            const card = document.createElement("div");
            card.className = "plato";
            const imagenUrl = plato.imagen ? `http://localhost:4000${plato.imagen}` : 'https://via.placeholder.com/300x220?text=Sin+Imagen';
            card.innerHTML = `
              <div class="plato-img-container">
                <img src="${imagenUrl}" alt="${plato.nombre}" onerror="this.src='https://via.placeholder.com/300x220?text=Sin+Imagen'">
                <button class="btn-agregar" onclick="agregarAlCarrito('${plato._id}')" title="Agregar al carrito">+</button>
              </div>
              <div class="plato-content">
                <h3>${plato.nombre || "Sin nombre"}</h3>
                <p class="descripcion">${plato.descripcion || "Sin descripción"}</p>
                <div class="plato-footer">
                  <span class="precio">S/ ${plato.precio ? plato.precio.toFixed(2) : "0.00"}</span>
                </div>
              </div>
            `;
            platosContainer.appendChild(card);
          });
        };

        // Mostrar todos los platos inicialmente
        for (const [categoria, lista] of Object.entries(categorias)) {
          const seccion = document.createElement("section");
          seccion.style.display = "none"; // Ocultar secciones antiguas
          seccion.innerHTML = `<h2>${categoria}</h2>`;
          const divPlatos = document.createElement("div");
          divPlatos.className = "platos";

          lista.forEach(plato => {
            const card = document.createElement("div");
            card.className = "plato";
            const imagenUrl = plato.imagen ? `http://localhost:4000${plato.imagen}` : 'https://via.placeholder.com/300x220?text=Sin+Imagen';
            card.innerHTML = `
              <div class="plato-img-container">
                <img src="${imagenUrl}" alt="${plato.nombre}" onerror="this.src='https://via.placeholder.com/300x220?text=Sin+Imagen'">
                <button class="btn-agregar" onclick="agregarAlCarrito('${plato._id}')" title="Agregar al carrito">+</button>
              </div>
              <div class="plato-content">
                <h3>${plato.nombre || "Sin nombre"}</h3>
                <p class="descripcion">${plato.descripcion || "Sin descripción"}</p>
                <div class="plato-footer">
                  <span class="precio">S/ ${plato.precio ? plato.precio.toFixed(2) : "0.00"}</span>
                </div>
              </div>
            `;
            divPlatos.appendChild(card);
          });

          seccion.appendChild(divPlatos);
          // No agregar secciones antiguas, ya usamos el nuevo sistema
        }
        
        // Mostrar todos los platos inicialmente
        window.filtrarPorCategoria(null);
      } catch (err) {
        console.error("Error al cargar menú:", err);
        document.getElementById("menuContainer").innerHTML = 
          '<div class="empty-state" style="color: #dc3545;">❌ Error al cargar el menú. Verifica que el servidor esté corriendo.</div>';
      }
    }

    // 🔹 Obtener ID de usuario (real o temporal)
    function obtenerUsuarioId() {
      const usuario = obtenerUsuario();
      if (usuario && usuario._id) {
        return usuario._id;
      }
      if (usuario && usuario.id) {
        return usuario.id;
      }
      // Si no hay usuario, usar ID temporal
      let tempId = localStorage.getItem("usuario_temporal_id");
      if (!tempId) {
        tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("usuario_temporal_id", tempId);
      }
      return tempId;
    }

    // 🔹 Agregar producto al carrito
    async function agregarAlCarrito(idPlato) {
      console.log('🛒 Intentando agregar producto al carrito:', idPlato);
      
      // Verificar si hay sesión iniciada
      const usuario = obtenerUsuario();
      console.log('👤 Usuario obtenido:', usuario);
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        console.log('🔍 Verificación directa - Usuario:', usuarioVerificado, 'Role:', role);
        
        if (usuarioVerificado && (role === 'cliente' || usuarioVerificado.rol === 'usuario')) {
          console.log('✅ Usuario verificado correctamente');
        }
      }
      
      // Si no hay usuario en ninguna verificación, mostrar advertencia
      if (!usuario && !usuarioVerificado) {
        console.log('❌ No hay usuario logueado');
        // Guardar la URL de destino para redirigir después del login
        localStorage.setItem('redirectAfterLogin', '/pages/cliente/pedido.html');
        // Mostrar advertencia y redirigir al login
        const confirmar = confirm("⚠️ Debes iniciar sesión para agregar productos al carrito.\n\n¿Deseas ir a la página de inicio de sesión?");
        if (confirmar) {
          window.location.href = "/pages/cliente/login.html";
        }
        return;
      }
      
      // Usar el usuario verificado si el otro no funcionó
      const usuarioFinal = usuario || usuarioVerificado;
      console.log('✅ Usuario final para agregar al carrito:', usuarioFinal);

      try {
        // Asegurar que tenemos el usuario correcto
        const usuarioParaId = usuarioFinal || obtenerUsuario();
        let usuarioId = null;
        
        if (usuarioParaId) {
          usuarioId = usuarioParaId.id || usuarioParaId._id || null;
        }
        
        if (!usuarioId) {
          usuarioId = obtenerUsuarioId();
        }
        
        // Normalizar el ID a string
        if (usuarioId) {
          usuarioId = String(usuarioId).trim();
        }
        
        if (!usuarioId) {
          console.error('❌ No se pudo obtener el ID del usuario');
          alert("❌ Error: No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.");
          return;
        }
        
        console.log('🆔 ID de usuario para carrito (normalizado):', usuarioId);
        console.log('🆔 Tipo de ID:', typeof usuarioId);
        
        const res = await fetch(`${API_CARRITO}/agregar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            producto_id: idPlato, 
            cantidad: 1,
            usuario_id: usuarioId
          })
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error || "Error al agregar al carrito");
        }

        // Limpiar el estado del proceso de pedido anterior para que empiece de nuevo
        localStorage.removeItem("estado_proceso_pedido");
        localStorage.removeItem("pedido_en_seguimiento");
        console.log('🧹 Estado del proceso anterior limpiado');
        
        alert("✅ Producto agregado al carrito");
      } catch (err) {
        console.error("Error:", err);
        alert("❌ No se pudo agregar el producto al carrito: " + err.message);
      }
    }

    // 🔹 Ver carrito (redirige al módulo pedidos)
    document.getElementById("verCarrito").addEventListener("click", () => {
      console.log('🛒 Ver carrito - Verificando sesión...');
      
      // Verificar si hay sesión iniciada
      const usuario = obtenerUsuario();
      console.log('🛒 Ver carrito - Usuario obtenido:', usuario);
      
      // Verificar también directamente desde window.auth
      let usuarioVerificado = null;
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        usuarioVerificado = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        console.log('🛒 Ver carrito - Verificación directa - Usuario:', usuarioVerificado, 'Role:', role);
        
        if (usuarioVerificado && (role === 'cliente' || usuarioVerificado.rol === 'usuario')) {
          console.log('✅ Ver carrito - Usuario verificado correctamente');
        }
      }
      
      // Si no hay usuario en ninguna verificación, mostrar advertencia
      if (!usuario && !usuarioVerificado) {
        console.log('❌ Ver carrito - No hay usuario logueado');
        // Guardar la URL de destino para redirigir después del login
        localStorage.setItem('redirectAfterLogin', '/pages/cliente/pedido.html');
        const confirmar = confirm("⚠️ Debes iniciar sesión para ver tu pedido.\n\n¿Deseas ir a la página de inicio de sesión?");
        if (confirmar) {
          window.location.href = "/pages/cliente/login.html";
        }
        return;
      }
      
      console.log('✅ Ver carrito - Redirigiendo a pedido.html');
      window.location.href = "/pages/cliente/pedido.html";
    });

    // Inicializar
    actualizarCabezalUsuario();
    cargarMenu();

    // Actualizar cabezal cuando la ventana gana foco (por si el usuario inicia sesión en otra pestaña)
    window.addEventListener("focus", actualizarCabezalUsuario);
    window.addEventListener("DOMContentLoaded", actualizarCabezalUsuario);
    
    // Actualizar periódicamente para mantener sincronizado
    setInterval(actualizarCabezalUsuario, 2000);

    // Exponer función globalmente
    window.agregarAlCarrito = agregarAlCarrito;