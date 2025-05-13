const express = require('express');
const router = express.Router();

// Ruta de información de la API
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

// Rutas básicas
router.get('/services', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servicio de lista de servicios'
  });
});

router.get('/incidents', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servicio de lista de incidentes'
  });
});

router.get('/auth', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servicio de autenticación'
  });
});

module.exports = router;