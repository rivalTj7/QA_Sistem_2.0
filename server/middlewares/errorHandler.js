/**
 * Middleware para manejo centralizado de errores
 */
module.exports = (err, req, res, next) => {
  // Error por defecto
  const error = {
    status: err.statusCode || 500,
    message: err.message || 'Error interno del servidor'
  };
  
  // Log detallado en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  }
  
  // Manejar errores específicos
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = err.message;
  }
  
  if (err.name === 'CastError') {
    error.status = 400;
    error.message = 'ID inválido';
  }
  
  if (err.code === 11000) {
    error.status = 400;
    error.message = 'Registro duplicado';
  }
  
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    error.status = 400;
    error.message = 'JSON inválido en la solicitud';
  }
  
  // Enviar respuesta
  res.status(error.status).json({
    status: error.status >= 500 ? 'error' : 'fail',
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};