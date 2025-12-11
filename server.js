// Servidor Express para servir el frontend centralizado
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Render asigna el puerto automáticamente a través de process.env.PORT
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para inyectar variables de entorno en páginas HTML
// Esto permite que el frontend acceda a las URLs de los servicios desde variables de entorno
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const originalSendFile = res.sendFile;
    res.sendFile = function(filePath, options, callback) {
      // Leer el archivo HTML
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return originalSendFile.call(this, filePath, options, callback);
        }
        
        // Inyectar variables de entorno antes del cierre de </head>
        const envScript = `
<script>
  // Variables de entorno inyectadas por el servidor
  window.__ENV__ = {
    USUARIOS_SERVICE_URL: "${process.env.USUARIOS_SERVICE_URL || 'http://localhost:3000'}",
    MENU_SERVICE_URL: "${process.env.MENU_SERVICE_URL || 'http://localhost:4000'}",
    PEDIDOS_SERVICE_URL: "${process.env.PEDIDOS_SERVICE_URL || 'http://localhost:4001'}",
    PAGOS_SERVICE_URL: "${process.env.PAGOS_SERVICE_URL || 'http://localhost:4002'}",
    RESERVAS_SERVICE_URL: "${process.env.RESERVAS_SERVICE_URL || 'http://localhost:4004'}",
    NOTIFICACIONES_SERVICE_URL: "${process.env.NOTIFICACIONES_SERVICE_URL || 'http://localhost:4003'}"
  };
</script>`;
        
        // Insertar antes del cierre de </head> o al inicio si no hay head
        if (data.includes('</head>')) {
          data = data.replace('</head>', envScript + '\n</head>');
        } else if (data.includes('<head>')) {
          data = data.replace('<head>', '<head>' + envScript);
        } else {
          // Si no hay head, insertar al inicio del body o al inicio del documento
          if (data.includes('<body>')) {
            data = data.replace('<body>', envScript + '\n<body>');
          } else {
            data = envScript + '\n' + data;
          }
        }
        
        // Enviar el HTML modificado
        res.setHeader('Content-Type', 'text/html');
        res.send(data);
      });
    };
  }
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Servir assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Rutas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'cliente', 'login.html'));
});

// Rutas de cliente
app.get('/cliente/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'cliente', 'login.html'));
});

app.get('/cliente/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'cliente', 'menu.html'));
});

app.get('/cliente/pedido', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'cliente', 'pedido.html'));
});

app.get('/cliente/reservas', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'cliente', 'reservas.html'));
});

// Rutas de admin
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'admin.html'));
});

app.get('/admin/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'admin.html'));
});

app.get('/admin/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'menu_admin.html'));
});

app.get('/admin/menu_admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'menu_admin.html'));
});

app.get('/admin/trabajadores.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'trabajadores.html'));
});

app.get('/admin/clientes.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'clientes.html'));
});

app.get('/admin/pedidos', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'pedidos.html'));
});

app.get('/admin/pedidos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'pedidos.html'));
});

app.get('/admin/pagos', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'pagos.html'));
});

app.get('/admin/pagos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'pagos.html'));
});

app.get('/admin/reservas', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'reservas.html'));
});

app.get('/admin/reservas.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'reservas.html'));
});

app.get('/admin/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'admin', 'admin.html'));
});

// Rutas directas a archivos HTML en pages (para compatibilidad)
app.get('/pages/admin/:archivo', (req, res) => {
  const archivo = req.params.archivo;
  const rutaArchivo = path.join(__dirname, 'pages', 'admin', archivo);
  if (fs.existsSync(rutaArchivo)) {
    res.sendFile(rutaArchivo);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// Rutas de trabajador
app.get('/trabajador/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'trabajador.html'));
});

app.get('/trabajador/menu', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'menu_trabajador.html'));
});

app.get('/trabajador/pedidos', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'trabajador.html'));
});

app.get('/trabajador/pagos', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'pagos.html'));
});

app.get('/trabajador/reservas', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'reservas.html'));
});

app.get('/trabajador/reservas.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'reservas.html'));
});

app.get('/trabajador/trabajador.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'trabajador.html'));
});

app.get('/trabajador/menu_trabajador.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'menu_trabajador.html'));
});

app.get('/trabajador/pagos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'pagos.html'));
});

app.get('/trabajador/clientes.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'trabajador', 'clientes.html'));
});

// Rutas directas a archivos HTML en pages (para compatibilidad)
app.get('/pages/trabajador/:archivo', (req, res) => {
  const archivo = req.params.archivo;
  const rutaArchivo = path.join(__dirname, 'pages', 'trabajador', archivo);
  if (fs.existsSync(rutaArchivo)) {
    res.sendFile(rutaArchivo);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

app.get('/pages/cliente/:archivo', (req, res) => {
  const archivo = req.params.archivo;
  const rutaArchivo = path.join(__dirname, 'pages', 'cliente', archivo);
  if (fs.existsSync(rutaArchivo)) {
    res.sendFile(rutaArchivo);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'pages', 'cliente', 'login.html'));
});

// Iniciar servidor
// Render requiere que el servidor escuche en 0.0.0.0, no solo en localhost
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`✅ Frontend centralizado corriendo en http://${HOST}:${PORT}`);
  console.log(`📁 Archivos servidos desde: ${__dirname}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

