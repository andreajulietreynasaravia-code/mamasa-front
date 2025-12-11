# Frontend Centralizado - La Mamasa

Frontend centralizado que consume las APIs de los microservicios del sistema de restaurante.

## Estructura

```
frontend/
├── pages/           # Páginas HTML organizadas por rol
│   ├── admin/       # Páginas de administrador
│   ├── trabajador/  # Páginas de trabajador
│   └── cliente/     # Páginas de cliente
├── styles/          # Archivos CSS organizados por rol
│   ├── admin/
│   ├── trabajador/
│   └── cliente/
├── scripts/         # Archivos JavaScript
│   ├── admin/
│   ├── trabajador/
│   ├── cliente/
│   └── shared/      # Scripts compartidos (auth, config)
├── assets/          # Imágenes y recursos estáticos
└── server.js        # Servidor Express para servir el frontend
```

## Sistema de Autenticación Unificado

El frontend utiliza un sistema de autenticación centralizado que maneja:
- Login de cliente
- Login de trabajador
- Login de administrador

Todos los usuarios se guardan en `localStorage` con la clave `user` y el rol en `role`.

### Uso del sistema de autenticación

```javascript
// Obtener usuario actual
const user = window.auth.getCurrentUser();

// Obtener rol actual
const role = window.auth.getCurrentRole();

// Verificar autenticación
if (window.auth.isAuthenticated()) {
  // Usuario logueado
}

// Login
const result = await window.auth.loginCliente(correo, contrasena);
const result = await window.auth.loginTrabajador(correo, contrasena);
const result = await window.auth.loginAdmin(correo, contrasena);

// Logout
await window.auth.logout('/pages/cliente/login.html');

// Requerir autenticación
window.auth.requireAuth('cliente'); // Requiere rol específico
```

## Configuración de APIs

Las URLs de los microservicios están configuradas en `scripts/shared/config.js`:

- **Usuarios**: http://localhost:3000/api
- **Menú**: http://localhost:4000/api
- **Pedidos**: http://localhost:4001/api
- **Pagos**: http://localhost:4002
- **Reservas**: http://localhost:4004/api
- **Notificaciones**: http://localhost:4003/api

## Instalación

```bash
cd frontend
npm install
```

## Ejecución

```bash
npm start
```

El frontend estará disponible en http://localhost:5000

## Rutas Principales

### Cliente
- `/` o `/cliente/login` - Login
- `/cliente/menu` - Menú
- `/cliente/pedido` - Pedidos
- `/cliente/reservas` - Reservas

### Administrador
- `/admin/dashboard` - Dashboard
- `/admin/usuarios` - Gestión de usuarios
- `/admin/menu` - Gestión de menú
- `/admin/pedidos` - Gestión de pedidos
- `/admin/pagos` - Gestión de pagos
- `/admin/reservas` - Gestión de reservas

### Trabajador
- `/trabajador/dashboard` - Dashboard
- `/trabajador/menu` - Gestión de menú
- `/trabajador/pedidos` - Gestión de pedidos
- `/trabajador/pagos` - Gestión de pagos
- `/trabajador/reservas` - Gestión de reservas

## Notas

- Todas las páginas deben incluir los scripts de autenticación:
  ```html
  <script src="../../scripts/shared/config.js"></script>
  <script src="../../scripts/shared/auth.js"></script>
  ```

- El sistema de autenticación unificado reemplaza las múltiples implementaciones anteriores
- Los usuarios se guardan en localStorage con una estructura unificada



