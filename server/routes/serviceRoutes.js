const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');

// ----- RUTAS PÚBLICAS -----
// Obtener todos los servicios
router.get('/', serviceController.getAllServices);

// Obtener resumen de servicios
router.get('/summary', serviceController.getServicesSummary);

// Obtener servicio por ID
router.get('/:id', 
  validationMiddleware.validateId,
  serviceController.getServiceById
);

// ----- RUTAS PROTEGIDAS -----
// Todas las rutas a partir de aquí requieren autenticación
router.use(authMiddleware.protect);

// Actualizar estado de servicio (todos los usuarios autenticados)
router.patch('/:id/status',
  validationMiddleware.validateId,
  validationMiddleware.validateRequired(['status']),
  validationMiddleware.sanitizeInputs,
  serviceController.updateServiceStatus
);

// ----- RUTAS PARA SUPERUSUARIOS -----
// Crear nuevo servicio
router.post('/',
  authMiddleware.restrictTo, // Verificar si es superusuario
  validationMiddleware.validateRequired(['name', 'endpoint']),
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(500),
  serviceController.createService
);

// Actualizar servicio
router.patch('/:id',
  authMiddleware.restrictTo, // Verificar si es superusuario
  validationMiddleware.validateId,
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(500),
  serviceController.updateService
);

// Eliminar servicio
router.delete('/:id',
  authMiddleware.restrictTo, // Verificar si es superusuario
  validationMiddleware.validateId,
  serviceController.deleteService
);

module.exports = router;