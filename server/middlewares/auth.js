const jwt = require('jsonwebtoken');
const config = require('../config/config');
const FileHandler = require('../utils/fileHandler');
const userFile = new FileHandler(config.files.usersPath);

/**
 * Middleware para verificar la autenticación del usuario
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) Verificar si el token existe
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith(config.auth.tokenType)) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'No estás autenticado. Por favor inicia sesión para acceder'
      });
    }
    
    // 2) Verificar token
    const decoded = jwt.verify(token, config.auth.jwtSecret);
    
    // 3) Verificar si el usuario aún existe
    const currentUser = await userFile.findById(decoded.id);
    
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'El usuario asociado a este token ya no existe'
      });
    }
    
    // 4) Guardar usuario en la solicitud
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Token inválido. Por favor inicia sesión nuevamente'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente'
      });
    }
    
    next(error);
  }
};

/**
 * Middleware para verificar si el usuario es superusuario
 */
exports.restrictTo = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'No estás autenticado'
    });
  }
  
  if (req.user.role !== 'superuser') {
    return res.status(403).json({
      status: 'fail',
      message: 'No tienes permiso para realizar esta acción'
    });
  }
  
  next();
};