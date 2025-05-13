// Archivo: public/assets/js/services.js (verificación)

/**
 * Carga y muestra todos los servicios
 */
async function loadAllServices() {
  try {
    console.log('Cargando servicios...');
    const response = await API.get('/services');
    const services = response.data.services;
    console.log('Servicios cargados:', services);
    
    renderServicesList(services);
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    showServicesError('Error al cargar la lista de servicios');
  }
}

/**
 * Renderiza la lista de servicios
 * @param {Array} services - Lista de servicios
 */
function renderServicesList(services) {
  const container = document.getElementById('services-container');
  const tableBody = document.getElementById('services-table-body');
  
  // Intentar tanto con el contenedor de tarjetas como con la tabla
  if (!container && !tableBody) {
    console.error('No se encontraron elementos para mostrar servicios');
    return;
  }
  
  if (services.length === 0) {
    if (container) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-server"></i>
          <p>No hay servicios registrados</p>
        </div>
      `;
    }
    
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">
            <div class="no-data">
              <i class="fas fa-server"></i>
              <p>No hay servicios registrados</p>
            </div>
          </td>
        </tr>
      `;
    }
    return;
  }
  
  // Si estamos en la versión de tarjetas
  if (container) {
    let html = '<div class="row g-4">';
    
    services.forEach(service => {
      html += generateServiceCard(service);
    });
    
    html += '</div>';
    container.innerHTML = html;
  }
  
  // Si estamos en la versión de tabla
  if (tableBody) {
    tableBody.innerHTML = '';
    
    services.forEach(service => {
      const uptime30d = service.uptime?.last30d || 0;
      const uptimeClass = UI.getUptimeClass(uptime30d);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="service-name">${service.name}</div>
          <div class="service-description">${service.description || ''}</div>
        </td>
        <td class="text-center">
          ${UI.getStatusBadge(service.status)}
        </td>
        <td>
          <div>${uptime30d.toFixed(2)}%</div>
          <div class="uptime-bar">
            <div class="uptime-value" style="width: ${uptime30d}%"></div>
          </div>
        </td>
        <td>${service.responseTime} ms</td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary view-service-btn" data-service-id="${service.id}">
            <i class="fas fa-eye"></i>
          </button>
          ${AUTH.isSuperUser() ? `
            <button class="btn btn-sm btn-warning edit-service-btn" data-service-id="${service.id}">
              <i class="fas fa-edit"></i>
            </button>
          ` : ''}
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  // Añadir eventos a los botones
  addServiceButtonsEvents();
  
  console.log('Servicios renderizados correctamente');
}

/**
 * Genera el HTML para una tarjeta de servicio
 * @param {Object} service - Servicio
 * @returns {string} - HTML de la tarjeta
 */
function generateServiceCard(service) {
  const uptime30d = service.uptime?.last30d || 0;
  const uptimeClass = UI.getUptimeClass(uptime30d);
  const statusBadge = UI.getStatusBadge(service.status);
  
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card service-card h-100" data-service-id="${service.id}">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${service.name}</h5>
          ${statusBadge}
        </div>
        <div class="card-body">
          <p class="service-description">${service.description || 'Sin descripción'}</p>
          
          <div class="service-metrics">
            <div class="metric-item">
              <div class="metric-label">Disponibilidad 30d</div>
              <div class="metric-value ${uptimeClass}">${uptime30d.toFixed(2)}%</div>
              <div class="uptime-bar">
                <div class="uptime-value" style="width: ${uptime30d}%"></div>
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">Tiempo de respuesta</div>
              <div class="metric-value">${service.responseTime} ms</div>
              <div class="response-time-indicator ${getResponseTimeClass(service)}"></div>
            </div>
          </div>
          
          <div class="service-info">
            <div class="info-item">
              <i class="fas fa-link"></i>
              <span class="text-truncate">${service.endpoint}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-clock"></i>
              <span>Última verificación: ${UI.formatRelativeTime(service.lastChecked)}</span>
            </div>
          </div>
          
          ${service.tags && service.tags.length > 0 ? `
            <div class="service-tags mt-3">
              ${service.tags.map(tag => `<span class="service-tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="card-footer d-flex justify-content-between">
          <button class="btn btn-sm btn-primary view-service-btn" data-service-id="${service.id}">
            <i class="fas fa-eye"></i> Ver detalles
          </button>
          ${AUTH.isSuperUser() ? `
            <div>
              <button class="btn btn-sm btn-warning edit-service-btn" data-service-id="${service.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-service-btn" data-service-id="${service.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Obtiene la clase CSS para el tiempo de respuesta
 * @param {Object} service - Servicio
 * @returns {string} - Clase CSS
 */
function getResponseTimeClass(service) {
  if (!service.responseTimeThreshold) return '';
  
  if (service.responseTime > service.responseTimeThreshold) {
    return 'critical';
  } else if (service.responseTime > service.responseTimeThreshold * 0.8) {
    return 'warning';
  }
  return 'good';
}

/**
 * Añade eventos a los botones de servicios
 */
function addServiceButtonsEvents() {
  // Botones de ver servicio
  document.querySelectorAll('.view-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      showServiceDetails(serviceId);
    });
  });
  
  // Botones de editar servicio (solo superusuarios)
  document.querySelectorAll('.edit-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      showEditServiceModal(serviceId);
    });
  });
  
  // Botones de eliminar servicio (solo superusuarios)
  document.querySelectorAll('.delete-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      if (confirm('¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.')) {
        deleteService(serviceId);
      }
    });
  });
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showServicesError(message) {
  const container = document.getElementById('services-container');
  const tableBody = document.getElementById('services-table-body');
  
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle"></i> ${message}
      </div>
    `;
  }
  
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">
          <i class="fas fa-exclamation-circle"></i> ${message}
        </td>
      </tr>
    `;
  }
}

// Agregar la función al contexto global para que pueda ser llamada desde otras partes
window.loadAllServices = loadAllServices;