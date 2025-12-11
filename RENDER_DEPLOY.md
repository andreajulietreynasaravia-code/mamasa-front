# 🚀 Guía para Desplegar Frontend en Render

Esta guía te ayudará a desplegar el frontend de La Mamasa en Render.

## 📋 Requisitos Previos

1. Cuenta en [Render](https://render.com)
2. Todos los servicios backend desplegados en Render
3. URLs de los servicios backend

## 🔧 Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git (GitHub, GitLab, o Bitbucket).

### 2. Crear un Nuevo Web Service en Render

1. Ve a tu dashboard de Render
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio
4. Selecciona el repositorio y la rama (generalmente `main` o `master`)

### 3. Configurar el Servicio

**Configuración básica:**
- **Name**: `frontend-mamasa` (o el nombre que prefieras)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `servicios/frontend` (si el frontend está en una subcarpeta)

### 4. Configurar Variables de Entorno

En la sección "Environment Variables", agrega las siguientes variables:

```
NODE_ENV=production
USUARIOS_SERVICE_URL=https://servicio-usuarios-nstf.onrender.com
PEDIDOS_SERVICE_URL=https://servicio-pedidos-nhuu.onrender.com
PAGOS_SERVICE_URL=https://servicio-pagos.onrender.com
RESERVAS_SERVICE_URL=https://servicio-reservas.onrender.com
MENU_SERVICE_URL=https://servicio-menu.onrender.com
NOTIFICACIONES_SERVICE_URL=https://servicio-notificaciones.onrender.com
```

**⚠️ IMPORTANTE**: 
- Las URLs de Usuarios, Pedidos, Pagos y Reservas ya están configuradas con las URLs reales.
- Actualiza `MENU_SERVICE_URL` y `NOTIFICACIONES_SERVICE_URL` cuando despliegues esos servicios.

### 5. Configurar CORS en los Backends

Asegúrate de que todos tus servicios backend tengan configurado CORS para permitir el dominio del frontend:

```javascript
const FRONTEND_SERVICE_URL = process.env.FRONTEND_SERVICE_URL || "https://myapp-web-844r.onrender.com";

app.use(cors({
  origin: [
    FRONTEND_SERVICE_URL,
    // ... otros orígenes
  ],
  credentials: true,
}));
```

### 6. Desplegar

1. Click en "Create Web Service"
2. Render comenzará a construir y desplegar tu aplicación
3. Espera a que el build termine (puede tomar varios minutos la primera vez)

### 7. Verificar el Despliegue

Una vez desplegado, Render te dará una URL como:
`https://frontend-mamasa.onrender.com`

Visita esta URL para verificar que todo funciona correctamente.

## 🔍 Troubleshooting

### Error: "Cannot find module"
- Verifica que el `package.json` esté en la raíz del directorio especificado
- Asegúrate de que todas las dependencias estén listadas en `package.json`

### Error: "Port already in use"
- Render asigna el puerto automáticamente a través de `process.env.PORT`
- No necesitas especificar un puerto manualmente

### Error de CORS
- Verifica que las URLs de los servicios backend estén correctas
- Asegúrate de que los servicios backend tengan configurado CORS para permitir el dominio de Render

### Las páginas no cargan
- Verifica que las rutas en `server.js` estén correctas
- Revisa los logs en Render para ver errores específicos

## 📝 Notas Importantes

1. **Variables de Entorno**: Render permite configurar variables de entorno en el dashboard. Úsalas para las URLs de los servicios.

2. **Build Time**: El primer build puede tardar varios minutos. Los builds subsecuentes serán más rápidos.

3. **Auto-Deploy**: Por defecto, Render despliega automáticamente cuando haces push a la rama principal.

4. **Logs**: Puedes ver los logs en tiempo real desde el dashboard de Render.

5. **Free Tier**: El plan gratuito de Render puede "dormir" el servicio después de 15 minutos de inactividad. La primera petición después de dormir puede tardar ~30 segundos.

## 🔗 URLs de Producción

URLs actuales de los servicios desplegados:
- **Frontend**: `https://myapp-web-844r.onrender.com`
- **Usuarios**: `https://servicio-usuarios-nstf.onrender.com`
- **Pedidos**: `https://servicio-pedidos-nhuu.onrender.com`
- **Pagos**: `https://servicio-pagos.onrender.com`
- **Reservas**: `https://servicio-reservas.onrender.com`
- **Menú**: [Pendiente de desplegar]
- **Notificaciones**: [Pendiente de desplegar]

Ver `RENDER_URLS.md` para más detalles.

