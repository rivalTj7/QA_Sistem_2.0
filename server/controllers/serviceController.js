const config = require('../config/config');
const FileHandler = require('../utils/fileHandler');
const serviceFile = new FileHandler(config.files.servicesPath);
const incidentFile = new FileHandler(config.files.incidentsPath);

/**
 * Controlador de servicios
 */
const serviceController = {
  /**
   * Obtiene todos los servicios
   */
  getAllServices: async (req, res, next) => {
    try {
      const services = await serviceFile.readFile();
      
      res.status(200).json({
        status: 'success',
        results: services.length,
        data: {
          services
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene un servicio por su ID
   */
  getServiceById: async (req, res, next) => {
    try {
      const service = await serviceFile.findById(req.params.id);
      
      if (!service) {
        return res.status(404).json({
          status: 'fail',
          message: 'Servicio no encontrado'
        });
      }
      
      // Obtener incidentes relacionados
      const incidents = await incidentFile.find(incident => 
        incident.serviceId === req.params.id
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          service,
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Crea un nuevo servicio
   */
  createService: async (req, res, next) => {
    try {
      const {
        name,
        description,
        endpoint,
        status = 'operational',
        responseTimeThreshold,
        tags = []
      } = req.body;
      
      // Crear nuevo servicio
      const newService = {
        name,
        description,
        endpoint,
        status,
        responseTimeThreshold: responseTimeThreshold || 1000,
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        uptime: {
          last24h: 100,
          last7d: 100,
          last30d: 100
        },
        responseTime: 0,
        lastChecked: new Date().toISOString()
      };
      
      const createdService = await serviceFile.create(newService);
      
      res.status(201).json({
        status: 'success',
        data: {
          service: createdService
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Actualiza un servicio existente
   */
  updateService: async (req, res, next) => {
    try {
      // Preparar datos de actualización
      const updates = { ...req.body };
      
      // Manejar las etiquetas especialmente si vienen como string
      if (updates.tags && typeof updates.tags === 'string') {
        updates.tags = updates.tags.split(',').map(tag => tag.trim());
      }
      
      // Actualizar servicio
      const updatedService = await serviceFile.update(req.params.id, updates);
      
      if (!updatedService) {
        return res.status(404).json({
          status: 'fail',
          message: 'Servicio no encontrado'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          service: updatedService
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Elimina un servicio
   */
  deleteService: async (req, res, next) => {
    try {
      const deleted = await serviceFile.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          status: 'fail',
          message: 'Servicio no encontrado'
        });
      }
      
      // También eliminar incidentes relacionados
      const incidents = await incidentFile.find(
        incident => incident.serviceId === req.params.id
      );
      
      for (const incident of incidents) {
        await incidentFile.delete(incident.id);
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Actualiza solo el estado de un servicio
   */
  updateServiceStatus: async (req, res, next) => {
    try {
      const { status, responseTime } = req.body;
      
      if (!status) {
        return res.status(400).json({
          status: 'fail',
          message: 'Estado requerido'
        });
      }
      
      // Preparar actualización
      const updates = {
        status,
        lastChecked: new Date().toISOString()
      };
      
      // Agregar tiempo de respuesta si se proporciona
      if (responseTime !== undefined) {
        updates.responseTime = responseTime;
      }
      
      // Actualizar servicio
      const updatedService = await serviceFile.update(req.params.id, updates);
      
      if (!updatedService) {
        return res.status(404).json({
          status: 'fail',
          message: 'Servicio no encontrado'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          service: updatedService
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene resumen de disponibilidad de servicios
   */
  getServicesSummary: async (req, res, next) => {
    try {
      const services = await serviceFile.readFile();
      const incidents = await incidentFile.readFile();
      
      // Calcular disponibilidad promedio
      const calculateAvgUptime = (timeframe) => {
        const sum = services.reduce((total, service) => {
          return total + (service.uptime?.[timeframe] || 0);
        }, 0);
        
        return services.length ? sum / services.length : 0;
      };
      
      // Contar servicios por estado
      const statusCount = {};
      services.forEach(service => {
        statusCount[service.status] = (statusCount[service.status] || 0) + 1;
      });
      
      // Contar incidentes activos
      const activeIncidents = incidents.filter(incident => !incident.endTime);
      
      // Crear resumen
      const summary = {
        totalServices: services.length,
        statusCount,
        uptime: {
          last24h: calculateAvgUptime('last24h'),
          last7d: calculateAvgUptime('last7d'),
          last30d: calculateAvgUptime('last30d')
        },
        incidents: {
          total: incidents.length,
          active: activeIncidents.length
        },
        lastUpdated: new Date().toISOString()
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          summary
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = serviceController;