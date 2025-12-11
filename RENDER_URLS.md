# 🔗 URLs de Servicios en Render

## URLs de Producción

### Frontend
- **URL**: https://myapp-web-844r.onrender.com

### Servicios Backend

1. **Servicio de Usuarios**
   - URL: https://servicio-usuarios-nstf.onrender.com
   - Variable: `USUARIOS_SERVICE_URL`

2. **Servicio de Pedidos**
   - URL: https://servicio-pedidos-nhuu.onrender.com
   - Variable: `PEDIDOS_SERVICE_URL`

3. **Servicio de Pagos**
   - URL: https://servicio-pagos.onrender.com
   - Variable: `PAGOS_SERVICE_URL`

4. **Servicio de Reservas**
   - URL: https://servicio-reservas.onrender.com
   - Variable: `RESERVAS_SERVICE_URL`

5. **Servicio de Menú**
   - URL: [Pendiente de desplegar]
   - Variable: `MENU_SERVICE_URL`

6. **Servicio de Notificaciones**
   - URL: [Pendiente de desplegar]
   - Variable: `NOTIFICACIONES_SERVICE_URL`

## 📝 Variables de Entorno para el Frontend

Configura estas variables en el dashboard de Render para el servicio frontend:

```
NODE_ENV=production
USUARIOS_SERVICE_URL=https://servicio-usuarios-nstf.onrender.com
PEDIDOS_SERVICE_URL=https://servicio-pedidos-nhuu.onrender.com
PAGOS_SERVICE_URL=https://servicio-pagos.onrender.com
RESERVAS_SERVICE_URL=https://servicio-reservas.onrender.com
MENU_SERVICE_URL=https://servicio-menu.onrender.com
NOTIFICACIONES_SERVICE_URL=https://servicio-notificaciones.onrender.com
```

## ⚠️ Importante

1. **CORS**: Asegúrate de que todos los servicios backend tengan configurado CORS para permitir el dominio del frontend:
   ```
   https://myapp-web-844r.onrender.com
   ```

2. **Variables Pendientes**: Cuando despliegues los servicios de Menú y Notificaciones, actualiza las variables de entorno en Render.

3. **HTTPS**: Todas las URLs usan HTTPS, asegúrate de que tus servicios backend también estén configurados para HTTPS.

