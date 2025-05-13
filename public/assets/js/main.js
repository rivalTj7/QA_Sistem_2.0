// Archivo: public/assets/js/main.js - Versión corregida

// Configuración global
const CONFIG = {
  // La URL base para llamadas a la API
  API_URL: '/api', // Apunta al prefijo que definimos en el backend
  REFRESH_INTERVAL: 60000, // 1 minuto en ms
  TOKEN_KEY: 'qa_monitor_token',
  USER_KEY: 'qa_monitor_user'
};

// Utilidades para APIs
const API = {
  /**
   * Realiza una petición HTTP
   * @param {string} url - URL a la que hacer la petición
   * @param {Object} options - Opciones de la petición
   * @returns {Promise<any>} - Promesa con la respuesta
   */
  async request(url, options = {}) {
    try {
      // Agregar token de autenticación si está disponible
      const token = localStorage.getItem(CONFIG.TOKEN_KEY);
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      // Agregar headers por defecto
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      // Realizar petición
      const response = await fetch(url, options);
      
      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Parsear respuesta
      const data = isJson ? await response.json() : await response.text();
      
      // Si la respuesta no es exitosa, lanzar error
      if (!response.ok) {
        const error = new Error(isJson ? data.message || 'Error en la petición' : 'Error en la petición');
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error en la petición:', error);
      
      // Si es un error de autenticación, redirigir al login
      if (error.status === 401) {
        AUTH.logout();
        window.location.href = '/login.html';
      }
      
      throw error;
    }
  },
  
  /**
   * Realiza una petición GET
   * @param {string} endpoint - Endpoint de la API
   * @returns {Promise<any>} - Promesa con la respuesta
   */
  async get(endpoint) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    return this.request(url);
  },
  
  /**
   * Realiza una petición POST
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @returns {Promise<any>} - Promesa con la respuesta
   */
  async post(endpoint, data) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };
    return this.request(url, options);
  },
  
  /**
   * Realiza una petición PATCH
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @returns {Promise<any>} - Promesa con la respuesta
   */
  async patch(endpoint, data) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const options = {
      method: 'PATCH',
      body: JSON.stringify(data)
    };
    return this.request(url, options);
  },
  
  /**
   * Realiza una petición DELETE
   * @param {string} endpoint - Endpoint de la API
   * @returns {Promise<any>} - Promesa con la respuesta
   */
  async delete(endpoint) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const options = {
      method: 'DELETE'
    };
    return this.request(url, options);
  }
};

// Variable global para almacenar el intervalo de actualización
let dashboardUpdateInterval = null;

/**
 * Función para cargar los datos del dashboard
 */
async function loadDashboardData() {
  try {
    // Actualizar la hora de la última actualización
    document.getElementById('last-updated-time').textContent = UI.formatDate(new Date().toISOString());
    
    // Cargar datos de servicios
    await loadServicesData();
    
    // Cargar incidentes activos
    await loadActiveIncidents();
    
    console.log('Dashboard actualizado');
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  }
}

/**
 * Carga los datos de servicios
 */
async function loadServicesData() {
  try {
    const response = await API.get('/services');
    
    // Extraer servicios de la respuesta API
    const services = response.data?.services || [];
    
    if (services.length === 0) {
      // Manejar caso de no hay servicios
      updateServicesStatus('Sin servicios registrados', 'maintenance');
      updateUptimeMetrics(0, 0, 0);
      renderServicesList([]);
      return;
    }
    
    // Calcular estado general
    const statusPriority = {
      'major_outage': 1,
      'partial_outage': 2,
      'degraded_performance': 3,
      'maintenance': 4,
      'operational': 5
    };
    
    // Ordenar servicios por estado (del peor al mejor)
    services.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
    
    // El estado general lo define el peor estado
    const worstStatus = services[0].status;
    
    // Actualizar UI con el estado general
    updateServicesStatus(getGeneralStatusText(worstStatus), worstStatus);
    
    // Calcular métricas de disponibilidad promedio
    const avgUptimes = calculateAverageUptimes(services);
    updateUptimeMetrics(avgUptimes.last24h, avgUptimes.last7d, avgUptimes.last30d);
    
    // Renderizar lista de servicios
    renderServicesList(services);
  } catch (error) {
    console.error('Error al cargar datos de servicios:', error);
    updateServicesStatus('Error al cargar servicios', 'major_outage');
    document.getElementById('services-table-body').innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          <i class="fas fa-exclamation-circle"></i> Error al cargar los servicios
        </td>
      </tr>
    `;
  }
}

/**
 * Actualiza el estado general de los servicios en la UI
 * @param {string} statusText - Texto del estado
 * @param {string} statusCode - Código del estado
 */
function updateServicesStatus(statusText, statusCode) {
  const statusIcon = document.getElementById('status-icon');
  const statusTextElement = document.getElementById('status-text');
  
  // Limpiar clases previas
  statusIcon.className = 'status-circle';
  
  // Agregar clase según estado
  const statusClasses = {
    'operational': 'operational',
    'degraded_performance': 'degraded',
    'partial_outage': 'partial',
    'major_outage': 'major',
    'maintenance': 'maintenance'
  };
  
  statusIcon.classList.add(statusClasses[statusCode] || 'major');
  
  // Actualizar ícono
  const icons = {
    'operational': '<i class="fas fa-check"></i>',
    'degraded_performance': '<i class="fas fa-exclamation"></i>',
    'partial_outage': '<i class="fas fa-exclamation-triangle"></i>',
    'major_outage': '<i class="fas fa-times"></i>',
    'maintenance': '<i class="fas fa-tools"></i>'
  };
  
  statusIcon.innerHTML = icons[statusCode] || '<i class="fas fa-question"></i>';
  
  // Actualizar texto
  statusTextElement.textContent = statusText;
}

/**
 * Obtiene el texto del estado general según el código
 * @param {string} statusCode - Código del estado
 * @returns {string} - Texto del estado
 */
function getGeneralStatusText(statusCode) {
  const statusTexts = {
    'operational': 'Todos los servicios operativos',
    'degraded_performance': 'Degradación de rendimiento',
    'partial_outage': 'Interrupción parcial',
    'major_outage': 'Interrupción mayor',
    'maintenance': 'Mantenimiento programado'
  };
  
  return statusTexts[statusCode] || 'Estado desconocido';
}

/**
 * Calcula el promedio de disponibilidad de los servicios
 * @param {Array} services - Lista de servicios
 * @returns {Object} - Promedios de disponibilidad
 */
function calculateAverageUptimes(services) {
  const sum = {
    last24h: 0,
    last7d: 0,
    last30d: 0
  };
  
  services.forEach(service => {
    sum.last24h += service.uptime?.last24h || 0;
    sum.last7d += service.uptime?.last7d || 0;
    sum.last30d += service.uptime?.last30d || 0;
  });
  
  const count = services.length;
  
  return {
    last24h: count ? (sum.last24h / count).toFixed(2) : 0,
    last7d: count ? (sum.last7d / count).toFixed(2) : 0,
    last30d: count ? (sum.last30d / count).toFixed(2) : 0
  };
}

/**
 * Actualiza las métricas de disponibilidad en la UI
 * @param {number} last24h - Disponibilidad últimas 24h
 * @param {number} last7d - Disponibilidad últimos 7 días
 * @param {number} last30d - Disponibilidad últimos 30 días
 */
function updateUptimeMetrics(last24h, last7d, last30d) {
  // Actualizar valores
  document.getElementById('uptime-24h').textContent = last24h;
  document.getElementById('uptime-7d').textContent = last7d;
  document.getElementById('uptime-30d').textContent = last30d;
  
  // Actualizar clases según valor
  function updateCircleClass(element, value) {
    element.className = 'metric-circle';
    if (value >= 99) {
      element.classList.add('high');
    } else if (value >= 95) {
      element.classList.add('medium');
    } else {
      element.classList.add('low');
    }
  }
  
  updateCircleClass(document.getElementById('uptime-24h-circle'), last24h);
  updateCircleClass(document.getElementById('uptime-7d-circle'), last7d);
  updateCircleClass(document.getElementById('uptime-30d-circle'), last30d);
}

/**
 * Muestra los detalles de un servicio
 * @param {string} serviceId - ID del servicio
 */
async function showServiceDetails(serviceId) {
  try {
    const response = await API.get(`/services/${serviceId}`);
    const { service, incidents } = response.data;
    
    const container = document.getElementById('service-details-container');
    
    if (!container) {
      console.error('Contenedor de detalles no encontrado');
      return;
    }
    
    // Generar HTML para los detalles
    let html = `
      <div class="service-details">
        <div class="row">
          <div class="col-md-8">
            <h4>${service.name}</h4>
            <p>${service.description || 'Sin descripción'}</p>
          </div>
          <div class="col-md-4 text-md-end">
            ${UI.getStatusBadge(service.status)}
          </div>
        </div>
        
        <hr>
        
        <div class="row">
          <div class="col-md-6">
            <div class="service-detail-item">
              <div class="service-detail-label">Endpoint</div>
              <div class="service-detail-value">${service.endpoint}</div>
            </div>
            
            <div class="service-detail-item">
              <div class="service-detail-label">Tiempo de respuesta</div>
              <div class="service-detail-value">${service.responseTime} ms</div>
            </div>
            
            <div class="service-detail-item">
              <div class="service-detail-label">Umbral de tiempo de respuesta</div>
              <div class="service-detail-value">${service.responseTimeThreshold} ms</div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="service-detail-item">
              <div class="service-detail-label">Disponibilidad 24h</div>
              <div class="service-detail-value">${service.uptime?.last24h?.toFixed(2) || 'N/A'}%</div>
            </div>
            
            <div class="service-detail-item">
              <div class="service-detail-label">Disponibilidad 7d</div>
              <div class="service-detail-value">${service.uptime?.last7d?.toFixed(2) || 'N/A'}%</div>
            </div>
            
            <div class="service-detail-item">
              <div class="service-detail-label">Disponibilidad 30d</div>
              <div class="service-detail-value">${service.uptime?.last30d?.toFixed(2) || 'N/A'}%</div>
            </div>
          </div>
        </div>
        
        <div class="service-detail-item">
          <div class="service-detail-label">Última verificación</div>
          <div class="service-detail-value">${UI.formatDate(service.lastChecked)}</div>
        </div>
    `;
    
    // Agregar etiquetas si existen
    if (service.tags && service.tags.length > 0) {
      html += `
        <div class="service-detail-item">
          <div class="service-detail-label">Etiquetas</div>
          <div class="service-tags">
            ${service.tags.map(tag => `<span class="service-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
    
    // Agregar incidentes si existen
    if (incidents && incidents.length > 0) {
      html += `
        <hr>
        <h5>Incidentes recientes</h5>
        <div class="incident-history">
      `;
      
      incidents.slice(0, 5).forEach(incident => {
        html += `
          <div class="history-item">
            <div class="history-time">${UI.formatDate(incident.startTime)}</div>
            <div class="history-content">
              <h6>${incident.title}</h6>
              <p>${incident.description}</p>
              <div class="d-flex justify-content-between">
                ${UI.getSeverityBadge(incident.severity)}
                <span class="badge ${getIncidentStatusClass(incident.status)}">${getIncidentStatusText(incident.status)}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `</div>`;
    } else {
      html += `
        <hr>
        <div class="no-data">
          <i class="fas fa-check-circle"></i>
          <p>No hay incidentes registrados para este servicio</p>
        </div>
      `;
    }
    
    html += `</div>`; // Cierre de service-details
    
    container.innerHTML = html;
    
    // Mostrar modal
    const serviceModal = new bootstrap.Modal(document.getElementById('serviceModal'));
    serviceModal.show();
    
    // Configurar botón de editar
    const editButton = document.getElementById('edit-service-btn');
    if (editButton) {
      if (AUTH.isSuperUser()) {
        editButton.classList.remove('d-none');
        editButton.onclick = () => {
          serviceModal.hide();
          showEditServiceModal(serviceId);
        };
      } else {
        editButton.classList.add('d-none');
      }
    }
  } catch (error) {
    console.error('Error al cargar detalles del servicio:', error);
    alert('Error al cargar los detalles del servicio');
  }
}

/**
 * Muestra el modal para editar un servicio
 * @param {string} serviceId - ID del servicio (si es null, es un nuevo servicio)
 */
async function showEditServiceModal(serviceId = null) {
  try {
    // Si es nuevo servicio, resetear el formulario
    // Si es edición, cargar datos del servicio
    if (serviceId) {
      const response = await API.get(`/services/${serviceId}`);
      const { service } = response.data;
      
      // Llenar formulario
      document.getElementById('edit-service-id').value = service.id;
      document.getElementById('edit-service-name').value = service.name;
      document.getElementById('edit-service-description').value = service.description || '';
      document.getElementById('edit-service-endpoint').value = service.endpoint;
      document.getElementById('edit-service-status').value = service.status;
      document.getElementById('edit-service-threshold').value = service.responseTimeThreshold;
      document.getElementById('edit-service-tags').value = service.tags?.join(', ') || '';
      
      // Actualizar título del modal
      document.getElementById('editServiceModalLabel').textContent = 'Editar Servicio';
      
      // Mostrar botón de eliminar
      document.getElementById('delete-service-btn').classList.remove('d-none');
    } else {
      // Nuevo servicio
      document.getElementById('edit-service-form').reset();
      document.getElementById('edit-service-id').value = '';
      
      // Actualizar título del modal
      document.getElementById('editServiceModalLabel').textContent = 'Nuevo Servicio';
      
      // Valores por defecto
      document.getElementById('edit-service-status').value = 'operational';
      document.getElementById('edit-service-threshold').value = '1000';
      
      // Ocultar botón de eliminar
      document.getElementById('delete-service-btn').classList.add('d-none');
    }
    
    // Ocultar mensajes de error
    document.getElementById('edit-service-error').classList.add('d-none');
    
    // Mostrar modal
    const editModal = new bootstrap.Modal(document.getElementById('editServiceModal'));
    editModal.show();
    
    // Configurar eventos de botones
    document.getElementById('save-service-btn').onclick = () => saveService(serviceId);
    document.getElementById('delete-service-btn').onclick = () => {
      if (confirm('¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.')) {
        deleteService(serviceId);
        editModal.hide();
      }
    };
  } catch (error) {
    console.error('Error al preparar formulario de servicio:', error);
    alert('Error al cargar los datos del servicio');
  }
}

/**
 * Guarda un servicio (nuevo o existente)
 * @param {string} serviceId - ID del servicio (si es null, es un nuevo servicio)
 */
async function saveService(serviceId = null) {
  try {
    // Obtener datos del formulario
    const name = document.getElementById('edit-service-name').value;
    const description = document.getElementById('edit-service-description').value;
    const endpoint = document.getElementById('edit-service-endpoint').value;
    const status = document.getElementById('edit-service-status').value;
    const responseTimeThreshold = document.getElementById('edit-service-threshold').value;
    const tags = document.getElementById('edit-service-tags').value;
    
    // Validar campos requeridos
    if (!name || !endpoint) {
      UI.showError('Nombre y endpoint son campos obligatorios', 'edit-service-error');
      return;
    }
    
    // Preparar datos
    const serviceData = {
      name,
      description,
      endpoint,
      status,
      responseTimeThreshold: parseInt(responseTimeThreshold) || 1000,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    // Enviar petición según sea nuevo o existente
    if (serviceId) {
      await API.patch(`/services/${serviceId}`, serviceData);
    } else {
      await API.post('/services', serviceData);
    }
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('editServiceModal')).hide();
    
    // Recargar datos
    loadServicesData();
    
    // Mostrar notificación
    alert(serviceId ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
  } catch (error) {
    console.error('Error al guardar servicio:', error);
    UI.showError(error.data?.message || 'Error al guardar el servicio', 'edit-service-error');
  }
}

/**
 * Elimina un servicio
 * @param {string} serviceId - ID del servicio a eliminar
 */
async function deleteService(serviceId) {
  try {
    await API.delete(`/services/${serviceId}`);
    
    // Recargar datos
    loadServicesData();
    
    // Mostrar notificación
    alert('Servicio eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    alert('Error al eliminar el servicio');
  }
}

// Exponer funciones al contexto global
window.loadDashboardData = loadDashboardData;
window.showServiceDetails = showServiceDetails;
window.showEditServiceModal = showEditServiceModal;
window.saveService = saveService;
window.deleteService = deleteService;