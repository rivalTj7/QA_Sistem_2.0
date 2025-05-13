const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const errorHandler = require('./middlewares/errorHandler');
require('dotenv').config();

// Importación de rutas
const routes = require('./routes');

// Inicialización de la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que existe el directorio de datos
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Directorio de datos creado: ' + dataDir);
  
  // Crear archivos JSON iniciales si no existen
  const files = ['users.json', 'services.json', 'incidents.json'];
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
      console.log(`Archivo creado: ${filePath}`);
    }
  });
}

// Middlewares
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api', routes);
// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📂 Servicio API en http://localhost:${PORT}/api`);
  console.log(`🔧 Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Manejar excepciones no capturadas
process.on('uncaughtException', err => {
  console.error('❌ ERROR NO CAPTURADO:', err);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.error('❌ PROMESA RECHAZADA NO MANEJADA:', err);
  process.exit(1);
});

module.exports = app;