// Archivo: public/assets/js/dashboard.js (finalización)

/**
 * Carga los incidentes activos
 */
async function loadActiveIncidents() {
  try {
    console.log('Cargando incidentes activos...');
    const response = await API.get('/incidents?status=investigating,identified,monitoring');
    const incidents = response.data.incidents;
    console.log('Incidentes activos:', incidents);
    
    const container = document.getElementById('active-incidents-container');
    if (!container) {
      console.warn('Contenedor de incidentes activos no encontrado');
      return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    if (!incidents || incidents.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-check-circle"></i>
          <p>No hay incidentes activos</p>
        </div>
      `;
      return;
    }
    
    // Generar tarjetas de incidentes
    incidents.forEach(incident => {
      // Intentar obtener el servicio asociado
      let serviceName = "Servicio ID: " + incident.serviceId;
      const serviceBtn = document.querySelector(`.view-service-btn[data-service-id="${incident.serviceId}"]`);
      if (serviceBtn) {
        const serviceRow = serviceBtn.closest('tr');
        if (serviceRow) {
          const serviceNameElem = serviceRow.querySelector('.service-name');
          if (serviceNameElem) {
            serviceName = serviceNameElem.textContent;
          }
        }
      }
      
      const card = document.createElement('div');
      card.className = `card incident-card ${incident.status || 'investigating'}`;
      card.innerHTML = `
        <div class="incident-header">
          <h5 class="incident-title">${incident.title}</h5>
          ${UI.getSeverityBadge(incident.severity)}
        </div>
        <div class="incident-body">
          <p>${incident.description}</p>
          <div class="incident-meta">
            <span><i class="fas fa-server"></i> ${serviceName}</span>
            <span><i class="fas fa-calendar-alt"></i> ${UI.formatDate(incident.startTime)}</span>
          </div>
        </div>
        <div class="incident-footer">
          <div class="incident-status">
            <strong>Estado:</strong> ${getIncidentStatusText(incident.status)}
          </div>
          <div class="incident-time">
            ${UI.formatRelativeTime(incident.startTime)}
          </div>
        </div>
      `;
      
      // Añadir evento para ver detalles
      card.addEventListener('click', () => {
        viewIncidentDetails(incident.id);
      });
      
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error al cargar incidentes activos:', error);
    
    const container = document.getElementById('active-incidents-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Error al cargar incidentes activos
        </div>
      `;
    }
  }
}

/**
 * Obtiene el texto del estado de un incidente
 * @param {string} status - Estado del incidente
 * @returns {string} - Texto del estado
 */
function getIncidentStatusText(status) {
  const statusTexts = {
    'investigating': 'Investigando',
    'identified': 'Identificado',
    'monitoring': 'Monitoreando',
    'resolved': 'Resuelto'
  };
  
  return statusTexts[status] || status;
}

/**
 * Muestra los detalles de un incidente
 * @param {string} incidentId - ID del incidente
 */
async function viewIncidentDetails(incidentId) {
  try {
    const response = await API.get(`/incidents/${incidentId}`);
    const { incident, service } = response.data.data;
    
    // Crear modal para mostrar detalles
    let modalHtml = `
      <div class="modal fade" id="incidentDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalles del Incidente</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h5>Información General</h5>
                  <dl>
                    <dt>Título</dt>
                    <dd>${incident.title}</dd>
                    
                    <dt>Servicio Afectado</dt>
                    <dd>${service ? service.name : 'Servicio no encontrado'}</dd>
                    
                    <dt>Severidad</dt>
                    <dd>${UI.getSeverityBadge(incident.severity)}</dd>
                    
                    <dt>Estado</dt>
                    <dd><span class="badge ${getIncidentStatusClass(incident.status)}">${getIncidentStatusText(incident.status)}</span></dd>
                  </dl>
                </div>
                <div class="col-md-6">
                  <h5>Fechas y Tiempos</h5>
                  <dl>
                    <dt>Inicio</dt>
                    <dd>${UI.formatDate(incident.startTime)}</dd>
                    
                    <dt>Fin</dt>
                    <dd>${incident.endTime ? UI.formatDate(incident.endTime) : 'En curso'}</dd>
                    
                    <dt>Duración</dt>
                    <dd>${calculateIncidentDuration(incident)}</dd>
                    
                    <dt>Creado</dt>
                    <dd>${UI.formatDate(incident.createdAt)}</dd>
                  </dl>
                </div>
              </div>
              
              <hr>
              
              <div class="row">
                <div class="col-12">
                  <h5>Descripción</h5>
                  <p>${incident.description}</p>
                  
                  ${incident.resolution ? `
                    <h5>Resolución</h5>
                    <p>${incident.resolution}</p>
                  ` : ''}
                  
                  ${incident.affectedComponents && incident.affectedComponents.length > 0 ? `
                    <h5>Componentes Afectados</h5>
                    <div class="d-flex flex-wrap gap-2">
                      ${incident.affectedComponents.map(component => 
                        `<span class="badge bg-secondary">${component}</span>`
                      ).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              ${AUTH.isAuthenticated() ? `
                <button type="button" class="btn btn-primary" id="update-incident-btn" data-incident-id="${incident.id}">
                  Actualizar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Agregar el modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('incidentDetailModal'));
    modal.show();
    
    // Evento para eliminar el modal cuando se cierre
    document.getElementById('incidentDetailModal').addEventListener('hidden.bs.modal', function () {
      document.body.removeChild(modalContainer);
    });
    
    // Evento para actualizar el incidente
    const updateBtn = document.getElementById('update-incident-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', function() {
        modal.hide();
        showUpdateIncidentModal(incident);
      });
    }
  } catch (error) {
    console.error('Error al cargar detalles del incidente:', error);
    alert('Error al cargar los detalles del incidente');
  }
}

/**
 * Obtiene la clase CSS según el estado del incidente
 * @param {string} status - Estado del incidente
 * @returns {string} - Clase CSS
 */
function getIncidentStatusClass(status) {
  const statusClasses = {
    'investigating': 'bg-warning',
    'identified': 'bg-info',
    'monitoring': 'bg-primary',
    'resolved': 'bg-success'
  };
  
  return statusClasses[status] || 'bg-secondary';
}

/**
 * Calcula la duración de un incidente
 * @param {Object} incident - Incidente
 * @returns {string} - Duración formateada
 */
function calculateIncidentDuration(incident) {
  if (!incident.endTime) {
    return 'En curso';
  }
  
  const start = new Date(incident.startTime);
  const end = new Date(incident.endTime);
  const diffMs = end - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Muestra el modal para actualizar un incidente
 * @param {Object} incident - Incidente a actualizar
 */
function showUpdateIncidentModal(incident) {
  // Esta función puede implementarse más adelante
  console.log('Actualizar incidente:', incident);
  alert('Funcionalidad en desarrollo');
}

/**
 * Actualiza la interfaz de usuario según los permisos
 */
function updateUIForPermissions() {
  const isAuthenticated = AUTH.isAuthenticated();
  const isSuperUser = AUTH.isSuperUser();
  
  // Elementos que solo ven usuarios autenticados
  document.querySelectorAll('.authenticated-only').forEach(el => {
    el.style.display = isAuthenticated ? '' : 'none';
  });
  
  // Elementos que solo ven superusuarios
  document.querySelectorAll('.superuser-only').forEach(el => {
    el.style.display = isSuperUser ? '' : 'none';
  });
}

/**
 * Configura los eventos del dashboard
 */
function setupDashboardEvents() {
  // Botón de actualizar servicios
  const refreshServicesBtn = document.getElementById('refresh-services-btn');
  if (refreshServicesBtn) {
    refreshServicesBtn.addEventListener('click', function() {
      loadDashboardData();
    });
  }
  
  // Botón de reportar incidente
  const reportIncidentBtn = document.getElementById('report-incident-btn');
  if (reportIncidentBtn) {
    reportIncidentBtn.addEventListener('click', function() {
      showReportIncidentModal();
    });
  }
  
  // Enlace para reportar incidente
  const reportIncidentLink = document.getElementById('report-incident-link');
  if (reportIncidentLink) {
    reportIncidentLink.addEventListener('click', function(e) {
      e.preventDefault();
      showReportIncidentModal();
    });
  }
  
  // Enlace para ver servicios
  const viewServicesLink = document.getElementById('view-services-link');
  if (viewServicesLink) {
    viewServicesLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Desplazarse a la tabla de servicios
      const servicesTable = document.getElementById('services-table');
      if (servicesTable) {
        servicesTable.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Enlace para ver incidentes
  const viewIncidentsLink = document.getElementById('view-incidents-link');
  if (viewIncidentsLink) {
    viewIncidentsLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Desplazarse a los incidentes activos
      const incidentsContainer = document.getElementById('active-incidents-container');
      if (incidentsContainer) {
        incidentsContainer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Enlace para ir al historial
  const viewHistoryLink = document.getElementById('view-history-link');
  if (viewHistoryLink) {
    viewHistoryLink.addEventListener('click', function(e) {
      // No prevenir el comportamiento por defecto si es un enlace a otra página
    });
  }
  
  // Toggle sidebar
  const sidebarCollapse = document.getElementById('sidebarCollapse');
  if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', function() {
      document.getElementById('sidebar').classList.toggle('active');
      document.getElementById('content').classList.toggle('active');
    });
  }
}

/**
 * Muestra el modal para reportar un incidente
 */
function showReportIncidentModal() {
  // Verificar si existe el modal
  let reportModal = document.getElementById('reportIncidentModal');
  
  // Si no existe, crearlo
  if (!reportModal) {
    const modalHTML = `
      <div class="modal fade" id="reportIncidentModal" tabindex="-1" aria-labelledby="reportIncidentModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="reportIncidentModalLabel">Reportar Incidente</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="report-incident-form">
                <div class="mb-3">
                  <label for="incident-service" class="form-label">Servicio afectado</label>
                  <select class="form-select" id="incident-service" required>
                    <option value="">Seleccione un servicio</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="incident-title" class="form-label">Título</label>
                  <input type="text" class="form-control" id="incident-title" required>
                </div>
                <div class="mb-3">
                  <label for="incident-description" class="form-label">Descripción</label>
                  <textarea class="form-control" id="incident-description" rows="3" required></textarea>
                </div>
                <div class="mb-3">
                  <label for="incident-severity" class="form-label">Severidad</label>
                  <select class="form-select" id="incident-severity" required>
                    <option value="low">Baja</option>
                    <option value="medium" selected>Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="incident-status" class="form-label">Estado</label>
                  <select class="form-select" id="incident-status" required>
                    <option value="investigating" selected>Investigando</option>
                    <option value="identified">Identificado</option>
                    <option value="monitoring">Monitoreando</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="incident-components" class="form-label">Componentes afectados (separados por comas)</label>
                  <input type="text" class="form-control" id="incident-components">
                </div>
                <div id="report-incident-error" class="alert alert-danger d-none"></div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="submit-incident-btn">Reportar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Agregar modal al DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Configurar evento para enviar incidente
    document.getElementById('submit-incident-btn').addEventListener('click', submitIncidentReport);
    
    reportModal = document.getElementById('reportIncidentModal');
  }
  
  // Cargar los servicios
  loadServicesForIncidentForm();
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(reportModal);
  modal.show();
}

/**
 * Carga los servicios para el formulario de reporte de incidente
 */
async function loadServicesForIncidentForm() {
  try {
    const response = await API.get('/services');
    const services = response.data.services;
    
    const selectElement = document.getElementById('incident-service');
    if (!selectElement) return;
    
    // Limpiar opciones actuales (excepto la primera)
    while (selectElement.options.length > 1) {
      selectElement.remove(1);
    }
    
    // Agregar servicios
    services.forEach(service => {
      const option = document.createElement('option');
      option.value = service.id;
      option.textContent = service.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar servicios para el formulario:', error);
  }
}

/**
 * Envía el reporte de un incidente
 */
async function submitIncidentReport() {
  try {
    // Obtener valores del formulario
    const serviceId = document.getElementById('incident-service').value;
    const title = document.getElementById('incident-title').value;
    const description = document.getElementById('incident-description').value;
    const severity = document.getElementById('incident-severity').value;
    const status = document.getElementById('incident-status').value;
    const componentsString = document.getElementById('incident-components').value;
    
    // Validar campos obligatorios
    if (!serviceId || !title || !description) {
      const errorElement = document.getElementById('report-incident-error');
      if (errorElement) {
        errorElement.textContent = 'Por favor complete todos los campos obligatorios';
        errorElement.classList.remove('d-none');
      }
      return;
    }
    
    // Preparar datos
    const incidentData = {
      serviceId,
      title,
      description,
      severity,
      status,
      affectedComponents: componentsString ? componentsString.split(',').map(comp => comp.trim()) : []
    };
    
    // Enviar petición
    await API.post('/incidents', incidentData);
    
    // Cerrar modal
    const reportModal = bootstrap.Modal.getInstance(document.getElementById('reportIncidentModal'));
    reportModal.hide();
    
    // Recargar datos
    await loadDashboardData();
    
    // Mostrar notificación
    alert('Incidente reportado correctamente');
  } catch (error) {
    console.error('Error al reportar incidente:', error);
    
    const errorElement = document.getElementById('report-incident-error');
    if (errorElement) {
      errorElement.textContent = error.data?.message || 'Error al reportar el incidente';
      errorElement.classList.remove('d-none');
    }
  }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación y actualizar UI
  updateUIForPermissions();
  
  // Cargar datos iniciales
  loadDashboardData();
  
  // Configurar intervalo de actualización
  dashboardUpdateInterval = setInterval(loadDashboardData, CONFIG.REFRESH_INTERVAL);
  
  // Configurar eventos
  setupDashboardEvents();
});