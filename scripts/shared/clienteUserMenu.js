// Script compartido para manejar el menú desplegable del usuario en todas las páginas del cliente

(function() {
  'use strict';

  // Obtener usuario logueado
  function obtenerUsuarioLogueado() {
    try {
      // Método 1: Usar window.auth si está disponible
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        const usuario = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        
        if (usuario && (role === 'cliente' || usuario.rol === 'usuario')) {
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
            return usuario;
          }
        } catch (e) {
          console.error("❌ Error parseando usuario de localStorage:", e);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      return null;
    }
  }

  // Función helper para obtener el valor a mostrar
  function obtenerValorAMostrar(valor) {
    if (valor === null || valor === undefined) {
      return "N/A";
    }
    const str = String(valor).trim();
    if (str === '' || str === 'null' || str === 'undefined') {
      return "N/A";
    }
    return str;
  }

  // Actualizar menú desplegable con datos del usuario
  function actualizarMenuUsuario() {
    const usuario = obtenerUsuarioLogueado();
    const userLinkNav = document.getElementById("userLinkNav");
    const userTextNav = document.getElementById("userTextNav");
    const userDropdown = document.getElementById("userDropdown");
    
    if (usuario && usuario.nombre) {
      const primerNombre = usuario.nombre.split(" ")[0];
      
      // Actualizar nombre en el enlace
      if (userTextNav) {
        userTextNav.textContent = primerNombre;
      }
      
      // Configurar clic para mostrar/ocultar menú
      if (userLinkNav) {
        userLinkNav.href = "#";
        userLinkNav.onclick = (e) => {
          e.preventDefault();
          toggleUserDropdown();
        };
      }
      
      // Llenar datos del menú desplegable
      if (userDropdown) {
        const dropdownNombre = document.getElementById("dropdownNombre");
        const dropdownEmail = document.getElementById("dropdownEmail");
        const dropdownNombreCompleto = document.getElementById("dropdownNombreCompleto");
        const dropdownEmailCompleto = document.getElementById("dropdownEmailCompleto");
        const dropdownTelefono = document.getElementById("dropdownTelefono");
        const dropdownDireccion = document.getElementById("dropdownDireccion");
        
        if (dropdownNombre) dropdownNombre.textContent = primerNombre;
        if (dropdownEmail) dropdownEmail.textContent = obtenerValorAMostrar(usuario.correo || usuario.email);
        if (dropdownNombreCompleto) dropdownNombreCompleto.textContent = obtenerValorAMostrar(usuario.nombre);
        if (dropdownEmailCompleto) dropdownEmailCompleto.textContent = obtenerValorAMostrar(usuario.correo || usuario.email);
        if (dropdownTelefono) dropdownTelefono.textContent = obtenerValorAMostrar(usuario.telefono);
        if (dropdownDireccion) dropdownDireccion.textContent = obtenerValorAMostrar(usuario.direccion);
      }
    } else {
      // Si no hay usuario, ocultar menú y mostrar "Login"
      if (userTextNav) {
        userTextNav.textContent = "Login";
      }
      if (userLinkNav) {
        userLinkNav.href = "/pages/cliente/login.html";
        userLinkNav.onclick = null;
      }
      if (userDropdown) {
        userDropdown.classList.add("oculto");
      }
    }
  }

  // Toggle del menú desplegable
  function toggleUserDropdown() {
    const userDropdown = document.getElementById("userDropdown");
    if (userDropdown) {
      userDropdown.classList.toggle("oculto");
    }
  }

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", (e) => {
    const userDropdown = document.getElementById("userDropdown");
    const userLinkNav = document.getElementById("userLinkNav");
    const userMenuContainer = document.querySelector(".user-menu-container");
    
    if (userDropdown && !userDropdown.contains(e.target) && 
        userLinkNav && !userLinkNav.contains(e.target) &&
        userMenuContainer && !userMenuContainer.contains(e.target)) {
      userDropdown.classList.add("oculto");
    }
  });

  // Función para cerrar sesión
  async function cerrarSesion() {
    const usuario = obtenerUsuarioLogueado();
    
    if (usuario && usuario.id) {
      // Vaciar carrito del usuario
      try {
        const API_CARRITO = "http://localhost:4000/api/menu/carrito";
        const usuarioId = String(usuario.id || usuario._id).trim();
        
        const resGet = await fetch(`${API_CARRITO}?usuario_id=${encodeURIComponent(usuarioId)}`);
        if (resGet.ok) {
          const data = await resGet.json();
          const items = data.items || (Array.isArray(data) ? data : []);
          
          for (const item of items) {
            try {
              await fetch(`${API_CARRITO}/${item._id || item.id}`, {
                method: "DELETE"
              });
            } catch (err) {
              console.warn(`⚠️ Error al eliminar item:`, err);
            }
          }
        }
      } catch (err) {
        console.error("❌ Error al vaciar carrito:", err);
      }
    }

    // Limpiar localStorage
    if (window.auth && typeof window.auth.logout === 'function') {
      window.auth.logout();
    } else {
      localStorage.removeItem("usuario");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
    
    // Cerrar el menú desplegable
    const userDropdown = document.getElementById("userDropdown");
    if (userDropdown) {
      userDropdown.classList.add("oculto");
    }
    
    // Redirigir al login
    window.location.href = "/pages/cliente/login.html";
  }

  // Configurar botón de cerrar sesión
  function configurarBotonCerrarSesion() {
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
      // Remover event listeners anteriores
      const newBtn = btnCerrarSesion.cloneNode(true);
      btnCerrarSesion.parentNode.replaceChild(newBtn, btnCerrarSesion);
      
      // Agregar nuevo event listener
      const updatedBtn = document.getElementById("btnCerrarSesion");
      if (updatedBtn) {
        updatedBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          await cerrarSesion();
        });
      }
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      actualizarMenuUsuario();
      configurarBotonCerrarSesion();
    });
  } else {
    actualizarMenuUsuario();
    configurarBotonCerrarSesion();
  }

  // Actualizar cuando la ventana gana foco
  window.addEventListener('focus', () => {
    actualizarMenuUsuario();
  });

  // Actualizar periódicamente
  setInterval(() => {
    actualizarMenuUsuario();
  }, 2000);

  // Exportar funciones para uso global si es necesario
  window.toggleUserDropdown = toggleUserDropdown;
  window.actualizarMenuUsuario = actualizarMenuUsuario;
})();


