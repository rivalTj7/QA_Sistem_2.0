/**
 * Middlewares de validación
 */

/**
 * Valida campos requeridos en el cuerpo de la solicitud
 * @param {Array} fields - Campos requeridos
 */
exports.validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);
    
    if (missingFields.length) {
      return res.status(400).json({
        status: 'fail',
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Valida que un ID exista y tenga formato válido
 */
exports.validateId = (req, res, next) => {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({
      status: 'fail',
      message: 'Se requiere un ID válido'
    });
  }
  
  next();
};

/**
 * Sanitiza entradas de texto para prevenir XSS
 */
exports.sanitizeInputs = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Eliminar scripts y caracteres peligrosos
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }
  
  next();
};

/**
 * Limita el tamaño de entradas de texto
 * @param {number} maxLength - Longitud máxima permitida
 */
exports.limitTextLength = (maxLength = 500) => {
  return (req, res, next) => {
    if (req.body) {
      const oversizedFields = [];
      
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && req.body[key].length > maxLength) {
          oversizedFields.push(key);
        }
      });
      
      if (oversizedFields.length) {
        return res.status(400).json({
          status: 'fail',
          message: `Los siguientes campos exceden la longitud máxima (${maxLength}): ${oversizedFields.join(', ')}`
        });
      }
    }
    
    next();
  };
};