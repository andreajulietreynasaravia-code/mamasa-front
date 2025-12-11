# Guía de Migración - Frontend Centralizado

## ✅ Tareas Completadas

1. ✅ Estructura de directorios creada
2. ✅ Sistema de autenticación unificado implementado
3. ✅ Archivos migrados desde los microservicios
4. ✅ Archivos CSS y JS organizados en carpetas correspondientes
5. ✅ Servidor Express creado para servir el frontend
6. ✅ Configuración de APIs centralizada

## 📋 Tareas Pendientes

### 1. Actualizar referencias en archivos HTML

Los archivos HTML necesitan actualizar sus referencias a:
- CSS: `../../styles/{rol}/{archivo}.css`
- JS: `../../scripts/{rol}/{archivo}.js`
- Assets: `../../assets/{archivo}`

### 2. Actualizar scripts JS para usar autenticación unificada

Todos los scripts deben usar `window.auth` en lugar de:
- `localStorage.getItem("usuario")` → `window.auth.getCurrentUser()`
- `localStorage.getItem("admin")` → `window.auth.getCurrentUser()` (verificar rol)
- `localStorage.getItem("trabajador")` → `window.auth.getCurrentUser()` (verificar rol)

### 3. Actualizar referencias de API

Reemplazar URLs hardcodeadas con:
```javascript
const { API_CONFIG } = window.config || {};
const apiBase = API_CONFIG?.usuarios || "http://localhost:3000/api";
```

### 4. Agregar scripts de autenticación a todos los HTML

Todos los HTML deben incluir antes del cierre de `</body>`:
```html
<script src="../../scripts/shared/config.js"></script>
<script src="../../scripts/shared/auth.js"></script>
```

### 5. Actualizar rutas de navegación

Reemplazar todas las URLs de localhost con rutas relativas:
- `http://localhost:3000/cliente/user.html` → `/pages/cliente/login.html`
- `http://localhost:4000/cliente/menu.html` → `/pages/cliente/menu.html`
- etc.

## 🔧 Comandos Útiles

### Instalar dependencias del frontend
```bash
cd frontend
npm install
```

### Iniciar servidor del frontend
```bash
cd frontend
npm start
```

### Ejecutar scripts de migración (si es necesario)
```bash
node migrar_frontend.js          # Migrar archivos
node actualizar_referencias.js   # Actualizar referencias
node reorganizar_archivos.js    # Reorganizar archivos
```

## 📝 Notas Importantes

1. **Sistema de Autenticación**: El nuevo sistema usa `localStorage` con claves unificadas:
   - `user`: Objeto del usuario logueado
   - `role`: Rol del usuario ('cliente', 'trabajador', 'administrador')

2. **Rutas**: Todas las rutas son relativas al servidor del frontend (puerto 5000)

3. **APIs**: Las APIs siguen en sus puertos originales (3000, 4000, 4001, etc.)

4. **CORS**: Asegúrate de que los microservicios tengan configurado CORS para aceptar peticiones desde `http://localhost:5000`

## 🚀 Próximos Pasos

1. Probar el login de cada tipo de usuario
2. Verificar que las navegaciones funcionen correctamente
3. Actualizar los scripts que aún usan el sistema antiguo de autenticación
4. Probar todas las funcionalidades de cada módulo
5. Ajustar estilos si es necesario



