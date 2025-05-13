const express = require('express');
const path = require('path');
const fs = require('fs');

// Inicialización de la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear la carpeta de datos si no existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Directorio de datos creado: ' + dataDir);
}

// Ruta simple para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servidor funcionando correctamente'
  });
});

// Ruta de prueba para la API
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API funcionando correctamente'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

module.exports = app;