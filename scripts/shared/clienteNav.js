// Script para controlar la navegación del cliente basada en sesión
// Oculta/deshabilita enlaces de "Pedidos" y "Reservas" cuando no hay sesión

(function() {
  'use strict';

  // Almacenar referencias a los handlers para poder removerlos
  const handlers = new WeakMap();

  // Verificar si hay sesión iniciada
  function tieneSesion() {
    try {
      console.log('🔍 clienteNav - Verificando sesión...');
      
      // Método 1: Usar window.auth.getCurrentUser() si está disponible
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        const user = window.auth.getCurrentUser();
        const role = window.auth.getCurrentRole();
        console.log('🔍 clienteNav - window.auth - User:', user, 'Role:', role);
        
        if (user && (role === 'cliente' || user.rol === 'usuario')) {
          console.log('✅ clienteNav - Sesión encontrada via window.auth');
          return true;
        }
      }
      
      // Método 2: Verificar localStorage directamente
      const userStr = localStorage.getItem("user");
      const roleStr = localStorage.getItem("role");
      console.log('🔍 clienteNav - localStorage - user:', userStr ? 'existe' : 'no existe', 'role:', roleStr);
      
      if (userStr && (roleStr === 'cliente' || roleStr === 'usuario')) {
        try {
          const user = JSON.parse(userStr);
          if (user && (user.rol === "usuario" || roleStr === "cliente")) {
            console.log('✅ clienteNav - Sesión encontrada via localStorage');
            return true;
          }
        } catch (e) {
          console.error('❌ clienteNav - Error parseando user:', e);
        }
      }
      
      // Método 3: Verificar localStorage antiguo
      const usuarioStr = localStorage.getItem("usuario");
      if (usuarioStr) {
        try {
          const usuario = JSON.parse(usuarioStr);
          if (usuario && usuario.rol === "usuario") {
            console.log('✅ clienteNav - Sesión encontrada via localStorage (usuario)');
            return true;
          }
        } catch (e) {
          console.error('❌ clienteNav - Error parseando usuario:', e);
        }
      }
      
      console.log('❌ clienteNav - No hay sesión activa');
      return false;
    } catch (error) {
      console.error('❌ clienteNav - Error al verificar sesión:', error);
      return false;
    }
  }

  // Handler para enlaces de pedidos sin sesión
  function handlerPedidos(e) {
    e.preventDefault();
    // Guardar la URL de destino para redirigir después del login
    localStorage.setItem('redirectAfterLogin', '/pages/cliente/pedido.html');
    const confirmar = confirm('⚠️ Debes iniciar sesión para acceder a tus pedidos.\n\n¿Deseas ir a la página de inicio de sesión?');
    if (confirmar) {
      window.location.href = '/pages/cliente/login.html';
    }
  }

  // Handler para enlaces de reservas sin sesión
  function handlerReservas(e) {
    e.preventDefault();
    // Guardar la URL de destino para redirigir después del login
    localStorage.setItem('redirectAfterLogin', '/pages/cliente/reservas.html');
    const confirmar = confirm('⚠️ Debes iniciar sesión para acceder a tus reservas.\n\n¿Deseas ir a la página de inicio de sesión?');
    if (confirmar) {
      window.location.href = '/pages/cliente/login.html';
    }
  }

  // Configurar navegación basada en sesión
  function configurarNavegacion() {
    const enlacesPedidos = document.querySelectorAll('a[href*="pedido.html"]');
    const enlacesReservas = document.querySelectorAll('a[href*="reservas.html"]');
    
    const sesionActiva = tieneSesion();

    // Configurar enlaces de Pedidos
    enlacesPedidos.forEach(enlace => {
      // Remover handler anterior si existe
      const handlerAnterior = handlers.get(enlace);
      if (handlerAnterior) {
        enlace.removeEventListener('click', handlerAnterior);
        handlers.delete(enlace);
      }

      if (!sesionActiva) {
        // Si no hay sesión, cambiar comportamiento del enlace
        enlace.addEventListener('click', handlerPedidos);
        handlers.set(enlace, handlerPedidos);
        // Cambiar estilo visual para indicar que requiere sesión
        enlace.style.opacity = '0.7';
        enlace.style.cursor = 'pointer';
        enlace.title = 'Requiere inicio de sesión';
      } else {
        // Si hay sesión, restaurar comportamiento normal
        enlace.style.opacity = '1';
        enlace.title = '';
      }
    });

    // Configurar enlaces de Reservas
    enlacesReservas.forEach(enlace => {
      // Remover handler anterior si existe
      const handlerAnterior = handlers.get(enlace);
      if (handlerAnterior) {
        enlace.removeEventListener('click', handlerAnterior);
        handlers.delete(enlace);
      }

      if (!sesionActiva) {
        // Si no hay sesión, cambiar comportamiento del enlace
        enlace.addEventListener('click', handlerReservas);
        handlers.set(enlace, handlerReservas);
        // Cambiar estilo visual para indicar que requiere sesión
        enlace.style.opacity = '0.7';
        enlace.style.cursor = 'pointer';
        enlace.title = 'Requiere inicio de sesión';
      } else {
        // Si hay sesión, restaurar comportamiento normal
        enlace.style.opacity = '1';
        enlace.title = '';
      }
    });
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarNavegacion);
  } else {
    configurarNavegacion();
  }

  // Re-ejecutar cuando la ventana gana foco (por si el usuario inicia sesión en otra pestaña)
  window.addEventListener('focus', configurarNavegacion);
  
  // Re-ejecutar periódicamente para detectar cambios en la sesión
  setInterval(configurarNavegacion, 2000);
})();

