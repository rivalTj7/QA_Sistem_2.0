const config = require('../config/config');
const FileHandler = require('../utils/fileHandler');
const incidentFile = new FileHandler(config.files.incidentsPath);
const serviceFile = new FileHandler(config.files.servicesPath);

/**
 * Controlador de incidentes
 */
const incidentController = {
  /**
   * Obtiene todos los incidentes
   */
  getAllIncidents: async (req, res, next) => {
    try {
      let incidents = await incidentFile.readFile();
      
      // Filtrar por parámetros de búsqueda
      const { status, serviceId, severity } = req.query;
      
      if (status) {
        incidents = incidents.filter(incident => incident.status === status);
      }
      
      if (serviceId) {
        incidents = incidents.filter(incident => incident.serviceId === serviceId);
      }
      
      if (severity) {
        incidents = incidents.filter(incident => incident.severity === severity);
      }
      
      // Ordenar por fecha (más recientes primero)
      incidents.sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
      
      res.status(200).json({
        status: 'success',
        results: incidents.length,
        data: {
          incidents
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene un incidente por su ID
   */
  getIncidentById: async (req, res, next) => {
    try {
      const incident = await incidentFile.findById(req.params.id);
      
      if (!incident) {
        return res.status(404).json({
          status: 'fail',
          message: 'Incidente no encontrado'
        });
      }
      
      // Obtener servicio asociado
      const service = await serviceFile.findById(incident.serviceId);
      
      res.status(200).json({
        status: 'success',
        data: {
          incident,
          service
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Crea un nuevo incidente
   */
  createIncident: async (req, res, next) => {
    try {
      const {
        serviceId,
        title,
        description,
        severity = 'medium',
        status = 'investigating',
        affectedComponents = []
      } = req.body;
      
      // Verificar que el servicio existe
      const service = await serviceFile.findById(serviceId);
      
      if (!service) {
        return res.status(404).json({
          status: 'fail',
          message: 'El servicio especificado no existe'
        });
      }
      
      // Crear nuevo incidente
      const now = new Date().toISOString();
      const newIncident = {
        serviceId,
        title,
        description,
        severity,
        status,
        startTime: now,
        endTime: null,
        resolvedBy: null,
        resolution: null,
        affectedComponents: Array.isArray(affectedComponents) 
          ? affectedComponents 
          : affectedComponents.split(',').map(comp => comp.trim()),
      };
      
      const createdIncident = await incidentFile.create(newIncident);
      
      // Actualizar estado del servicio si es necesario
      if (status !== 'resolved' && !req.body.keepServiceStatus) {
        let serviceStatus;
        
        switch (severity) {
          case 'critical':
            serviceStatus = 'major_outage';
            break;
          case 'high':
            serviceStatus = 'partial_outage';
            break;
          case 'medium':
            serviceStatus = 'degraded_performance';
            break;
          default:
            serviceStatus = service.status;
        }
        
        if (serviceStatus !== service.status) {
          await serviceFile.update(serviceId, { status: serviceStatus });
        }
      }
      
      res.status(201).json({
        status: 'success',
        data: {
          incident: createdIncident
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Actualiza un incidente existente
   */
  updateIncident: async (req, res, next) => {
    try {
      const incident = await incidentFile.findById(req.params.id);
      
      if (!incident) {
        return res.status(404).json({
          status: 'fail',
          message: 'Incidente no encontrado'
        });
      }
      
      // Preparar datos de actualización
      const updates = { ...req.body };
      
      // Si el estado cambia a resuelto y no estaba resuelto antes
      if (updates.status === 'resolved' && incident.status !== 'resolved') {
        updates.endTime = updates.endTime || new Date().toISOString();
        updates.resolvedBy = updates.resolvedBy || (req.user ? req.user.id : null);
        
        // Restaurar estado del servicio si es necesario
        if (!updates.keepServiceStatus) {
          const service = await serviceFile.findById(incident.serviceId);
          if (service) {
            await serviceFile.update(incident.serviceId, { status: 'operational' });
          }
        }
      }
      
      // Si hay componentes afectados como string, convertirlos a array
      if (updates.affectedComponents && typeof updates.affectedComponents === 'string') {
        updates.affectedComponents = updates.affectedComponents
          .split(',')
          .map(comp => comp.trim());
      }
      
      // Actualizar incidente
      const updatedIncident = await incidentFile.update(req.params.id, updates);
      
      res.status(200).json({
        status: 'success',
        data: {
          incident: updatedIncident
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Elimina un incidente
   */
  deleteIncident: async (req, res, next) => {
    try {
      const deleted = await incidentFile.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          status: 'fail',
          message: 'Incidente no encontrado'
        });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene estadísticas de incidentes
   */
  getIncidentStats: async (req, res, next) => {
    try {
      const incidents = await incidentFile.readFile();
      
      // Contar incidentes por estado
      const byStatus = {};
      incidents.forEach(incident => {
        byStatus[incident.status] = (byStatus[incident.status] || 0) + 1;
      });
      
      // Contar incidentes por severidad
      const bySeverity = {};
      incidents.forEach(incident => {
        bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
      });
      
      // Contar incidentes por servicio
      const byService = {};
      incidents.forEach(incident => {
        byService[incident.serviceId] = (byService[incident.serviceId] || 0) + 1;
      });
      
      // Calcular tiempo promedio de resolución (en minutos)
      const resolvedIncidents = incidents.filter(
        incident => incident.status === 'resolved' && incident.startTime && incident.endTime
      );
      
      let avgResolutionTime = 0;
      if (resolvedIncidents.length > 0) {
        const resolutionTimes = resolvedIncidents.map(incident => {
          const start = new Date(incident.startTime);
          const end = new Date(incident.endTime);
          return (end - start) / (1000 * 60); // Convertir a minutos
        });
        
        avgResolutionTime = Math.round(
          resolutionTimes.reduce((sum, time) => sum + time, 0) / resolvedIncidents.length
        );
      }
      
      // Contar incidentes recientes (última semana)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentIncidents = incidents.filter(
        incident => new Date(incident.startTime) >= oneWeekAgo
      );
      
      // Crear estadísticas
      const stats = {
        total: incidents.length,
        active: incidents.filter(i => i.status !== 'resolved').length,
        resolved: resolvedIncidents.length,
        recent: recentIncidents.length,
        avgResolutionTime,
        byStatus,
        bySeverity,
        byService
      };
      
      res.status(200).json({
        status: 'success',
        data: {
          stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = incidentController;