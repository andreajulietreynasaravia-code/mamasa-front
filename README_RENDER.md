# 🚀 Frontend - Listo para Render

Este frontend está configurado para desplegarse en Render.

## ✅ Configuraciones Aplicadas

- ✅ Servidor configurado para escuchar en `0.0.0.0` (requerido por Render)
- ✅ Puerto configurado desde variable de entorno `PORT`
- ✅ Variables de entorno para URLs de servicios backend
- ✅ Engine de Node especificado en `package.json`
- ✅ Archivo `render.yaml` para configuración rápida
- ✅ Documentación de despliegue en `RENDER_DEPLOY.md`

## 🚀 Despliegue Rápido

1. **Sube tu código a GitHub/GitLab/Bitbucket**

2. **En Render Dashboard:**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio
   - Selecciona la rama principal

3. **Configuración:**
   - **Root Directory**: `servicios/frontend` (si está en subcarpeta)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Variables de Entorno:**
   ```
   NODE_ENV=production
   USUARIOS_SERVICE_URL=https://servicio-usuarios-nstf.onrender.com
   PEDIDOS_SERVICE_URL=https://servicio-pedidos-nhuu.onrender.com
   PAGOS_SERVICE_URL=https://servicio-pagos.onrender.com
   RESERVAS_SERVICE_URL=https://servicio-reservas.onrender.com
   MENU_SERVICE_URL=https://servicio-menu.onrender.com
   NOTIFICACIONES_SERVICE_URL=https://servicio-notificaciones.onrender.com
   ```
   
   **Nota**: Actualiza `MENU_SERVICE_URL` y `NOTIFICACIONES_SERVICE_URL` cuando despliegues esos servicios.

5. **Click en "Create Web Service"**

## 📝 Notas

- El puerto se asigna automáticamente por Render
- Asegúrate de configurar CORS en todos los servicios backend
- Revisa `RENDER_DEPLOY.md` para instrucciones detalladas

