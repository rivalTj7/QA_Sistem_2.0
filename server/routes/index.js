const express = require('express');
const router = express.Router();

// Importar rutas específicas
const authRoutes = require('./authRoutes');
const serviceRoutes = require('./serviceRoutes');
const incidentRoutes = require('./incidentRoutes');

// Rutas de información de la API
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'API del Monitor de Servicios QA',
    version: '1.0.0',
    endpoints: {
      services: '/services',
      incidents: '/incidents',
      auth: '/auth'
    }
  });
});

// Montar las rutas
router.use('/auth', authRoutes);
router.use('/services', serviceRoutes);
router.use('/incidents', incidentRoutes);

module.exports = router;