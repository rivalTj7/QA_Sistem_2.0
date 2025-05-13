/**
 * Configuración central de la aplicación
 */
const config = {
  // Configuración general
  app: {
    name: 'QA Monitoring System',
    version: '1.0.0'
  },
  
  // Configuración de autenticación
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'qa_monitoring_jwt_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    tokenType: 'Bearer'
  },
  
  // Configuración de rutas
  api: {
    prefix: '/api'
  },
  
  // Configuración de archivos
  files: {
    usersPath: 'users.json',
    servicesPath: 'services.json',
    incidentsPath: 'incidents.json'
  }
};

module.exports = config;