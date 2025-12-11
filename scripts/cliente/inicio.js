// 🔹 Obtener usuario del localStorage
    function obtenerUsuario() {
      try {
        // Método 1: Usar window.auth si está disponible
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
          const usuario = window.auth.getCurrentUser();
          const role = window.auth.getCurrentRole();
          
          if (usuario && (role === 'cliente' || usuario.rol === 'usuario')) {
            if (!usuario.id && usuario._id) {
              usuario.id = usuario._id;
            }
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
              if (!usuario.id && usuario._id) {
                usuario.id = usuario._id;
              }
              return usuario;
            }
          } catch (e) {
            console.error("Error parseando user de localStorage:", e);
          }
        }
        
        // Método 3: Verificar localStorage antiguo
        const usuarioStr = localStorage.getItem("usuario");
        if (usuarioStr) {
          try {
            const usuario = JSON.parse(usuarioStr);
            if (usuario && usuario.rol === "usuario") {
              if (!usuario.id && usuario._id) {
                usuario.id = usuario._id;
              }
              return usuario;
            }
          } catch (e) {
            console.error("Error parseando usuario de localStorage:", e);
          }
        }
        
        return null;
      } catch (err) {
        console.error("Error al obtener usuario:", err);
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

    // Inicializar
    actualizarCabezalUsuario();

    // Actualizar cabezal cuando la ventana gana foco (por si el usuario inicia sesión en otra pestaña)
    window.addEventListener("focus", actualizarCabezalUsuario);
    
    // Actualizar periódicamente para mantener sincronizado
    setInterval(actualizarCabezalUsuario, 2000);

    // Carrusel de fotos
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    // Crear indicadores
    const indicatorsContainer = document.getElementById('carouselIndicators');
    slides.forEach((_, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'carousel-indicator' + (index === 0 ? ' active' : '');
      indicator.onclick = () => goToSlide(index);
      indicatorsContainer.appendChild(indicator);
    });

    function updateCarousel() {
      const slidesContainer = document.getElementById('carouselSlides');
      slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // Actualizar indicadores
      document.querySelectorAll('.carousel-indicator').forEach((ind, index) => {
        ind.classList.toggle('active', index === currentSlide);
      });
    }

    function moveCarousel(direction) {
      currentSlide += direction;
      if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
      } else if (currentSlide >= totalSlides) {
        currentSlide = 0;
      }
      updateCarousel();
    }

    function goToSlide(index) {
      currentSlide = index;
      updateCarousel();
    }

    // Auto-play del carrusel
    setInterval(() => {
      moveCarousel(1);
    }, 5000);

    // Inicializar carrusel
    updateCarousel();