# ⚙️ Configuración para Render - URLs Actualizadas

## ✅ URLs Configuradas

He actualizado todos los archivos de configuración con las URLs reales de tus servicios en Render:

### Servicios Desplegados:
- ✅ **Frontend**: https://myapp-web-844r.onrender.com
- ✅ **Usuarios**: https://servicio-usuarios-nstf.onrender.com
- ✅ **Pedidos**: https://servicio-pedidos-nhuu.onrender.com
- ✅ **Pagos**: https://servicio-pagos.onrender.com
- ✅ **Reservas**: https://servicio-reservas.onrender.com

### Servicios Pendientes:
- ⏳ **Menú**: Actualizar cuando esté desplegado
- ⏳ **Notificaciones**: Actualizar cuando esté desplegado

## 📝 Pasos para Configurar en Render

1. **Ve al Dashboard de Render** → Tu servicio frontend

2. **Ve a "Environment"** → "Environment Variables"

3. **Agrega/Actualiza estas variables:**

```
NODE_ENV=production
USUARIOS_SERVICE_URL=https://servicio-usuarios-nstf.onrender.com
PEDIDOS_SERVICE_URL=https://servicio-pedidos-nhuu.onrender.com
PAGOS_SERVICE_URL=https://servicio-pagos.onrender.com
RESERVAS_SERVICE_URL=https://servicio-reservas.onrender.com
MENU_SERVICE_URL=https://servicio-menu.onrender.com
NOTIFICACIONES_SERVICE_URL=https://servicio-notificaciones.onrender.com
```

4. **Guarda los cambios** → Render reiniciará automáticamente el servicio

## 🔧 Configurar CORS en Backends

Asegúrate de que todos tus servicios backend tengan esta configuración de CORS:

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

## ✅ Verificación

Una vez configurado, verifica que:
1. El frontend carga correctamente en https://myapp-web-844r.onrender.com
2. Las llamadas a las APIs funcionan (revisa la consola del navegador)
3. No hay errores de CORS en la consola

## 📄 Archivos Actualizados

- ✅ `render.yaml` - URLs actualizadas
- ✅ `.env.example` - URLs de producción
- ✅ `.env.production` - Variables de entorno para producción
- ✅ `RENDER_DEPLOY.md` - Documentación actualizada
- ✅ `RENDER_URLS.md` - Lista de URLs (nuevo)
- ✅ `CONFIGURACION_RENDER.md` - Esta guía (nuevo)

