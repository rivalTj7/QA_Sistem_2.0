const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const validationMiddleware = require('../middlewares/validation');

// Ruta pública para login
router.post('/login', 
  validationMiddleware.validateRequired(['username', 'password']),
  validationMiddleware.sanitizeInputs,
  authController.login
);

// ----- RUTAS PROTEGIDAS -----
// Todas las rutas a partir de aquí requieren autenticación
router.use(authMiddleware.protect);

// Obtener perfil propio
router.get('/me', authController.getMe);

// Actualizar perfil
router.patch('/update-me',
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(200),
  authController.updateMe
);

// Actualizar contraseña
router.patch('/update-password',
  validationMiddleware.validateRequired(['currentPassword', 'newPassword']),
  authController.updatePassword
);

// ----- RUTAS PARA SUPERUSUARIOS -----
// Crear nuevo usuario (solo superusuarios)
router.post('/register',
  authMiddleware.restrictTo, // Verificar si es superusuario
  validationMiddleware.validateRequired(['username', 'password', 'name', 'email']),
  validationMiddleware.sanitizeInputs,
  validationMiddleware.limitTextLength(100),
  authController.register
);

module.exports = router;