const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const authMiddleware = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');

// ----- RUTAS PÚBLICAS -----
// Obtener todos los incidentes (con filtros opcionales)
router.get('/', incidentController.getAllIncidents);

// Obtener estadísticas de incidentes
router.get('/stats', incidentController.getIncidentStats);

// Obtener incidente por ID
router.get('/:id',
  validationMiddleware.validateId,
  incidentController.getIncidentById
);

// Crear incidente (permitido incluso para usuarios no autenticados)
router.post('/',
  validationMiddleware.validateRequired(['serviceId', 'title', 'description']),
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(1000),
  incidentController.createIncident
);

// ----- RUTAS PROTEGIDAS -----
// Todas las rutas a partir de aquí requieren autenticación
router.use(authMiddleware.protect);

// Actualizar incidente
router.patch('/:id',
  validationMiddleware.validateId,
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(1000),
  incidentController.updateIncident
);

// ----- RUTAS PARA SUPERUSUARIOS -----
// Eliminar incidente
router.delete('/:id',
  authMiddleware.restrictTo, // Verificar si es superusuario
  validationMiddleware.validateId,
  incidentController.deleteIncident
);

module.exports = router;