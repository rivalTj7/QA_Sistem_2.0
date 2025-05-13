/**
 * Funcionalidad para gestión de incidentes
 */

/**
 * Carga y muestra el historial de incidentes
 */
async function loadIncidentHistory() {
  try {
    const response = await API.get('/incidents');
    const incidents = response.data.data.incidents;
    
    const container = document.getElementById('incident-history-container');
    if (!container) return;
    
    if (incidents.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-check-circle"></i>
          <p>No hay incidentes registrados en el historial</p>
        </div>
      `;
      return;
    }
    
    // Agrupar incidentes por mes/año
    const incidentsByMonth = groupIncidentsByMonth(incidents);
    
    // Generar HTML
    let html = '';
    
    for (const [monthYear, monthIncidents] of Object.entries(incidentsByMonth)) {
      html += `
        <div class="incident-month-group">
          <h4 class="month-header">${monthYear}</h4>
          <div class="incident-list">
      `;
      
      monthIncidents.forEach(incident => {
        html += generateIncidentCard(incident);
      });
      
      html += `
          </div>
        </div>
      `;
    }
    
    container.innerHTML = html;
    
    // Añadir eventos a las tarjetas
    addIncidentCardEvents();
  } catch (error) {
    console.error('Error al cargar historial de incidentes:', error);
    const container = document.getElementById('incident-history-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i> Error al cargar el historial de incidentes
        </div>
      `;
    }
  }
}

/**
 * Agrupa incidentes por mes y año
 * @param {Array} incidents - Lista de incidentes
 * @returns {Object} - Incidentes agrupados por mes/año
 */
function groupIncidentsByMonth(incidents) {
  const grouped = {};
  
  incidents.forEach(incident => {
    const date = new Date(incident.startTime);
    const monthYear = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    
    if (!grouped[capitalizedMonthYear]) {
      grouped[capitalizedMonthYear] = [];
    }
    
    grouped[capitalizedMonthYear].push(incident);
  });
  
  // Ordenar por fecha más reciente primero
  const ordered = {};
  Object.keys(grouped)
    .sort((a, b) => {
      const dateA = new Date(grouped[a][0].startTime);
      const dateB = new Date(grouped[b][0].startTime);
      return dateB - dateA;
    })
    .forEach(key => {
      ordered[key] = grouped[key].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
      );
    });
  
  return ordered;
}

/**
 * Genera el HTML para una tarjeta de incidente
 * @param {Object} incident - Incidente
 * @returns {string} - HTML de la tarjeta
 */
function generateIncidentCard(incident) {
  const duration = calculateIncidentDuration(incident);
  const statusClass = getIncidentStatusClass(incident.status);
  const statusText = getIncidentStatusText(incident.status);
  const borderColor = getIncidentBorderColor(incident);
  
  return `
    <div class="card incident-card ${borderColor}" data-incident-id="${incident.id}">
      <div class="incident-header">
        <div class="d-flex justify-content-between align-items-start">
          <h5 class="incident-title">${incident.title}</h5>
          <div class="d-flex gap-2">
            ${UI.getSeverityBadge(incident.severity)}
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
      <div class="incident-body">
        <p>${incident.description}</p>
        <div class="incident-meta">
          <span><i class="fas fa-server"></i> ${incident.serviceId}</span>
          <span><i class="fas fa-clock"></i> ${duration}</span>
          <span><i class="fas fa-calendar-alt"></i> ${UI.formatDate(incident.startTime)}</span>
        </div>
        ${incident.resolution ? `
          <div class="incident-resolution mt-3">
            <strong>Resolución:</strong> ${incident.resolution}
          </div>
        ` : ''}
        ${incident.affectedComponents?.length > 0 ? `
          <div class="incident-components mt-2">
            <strong>Componentes afectados:</strong>
            <div class="d-flex flex-wrap gap-1 mt-1">
              ${incident.affectedComponents.map(component => 
                `<span class="badge bg-secondary">${component}</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="incident-footer">
        <div class="d-flex justify-content-between align-items-center">
          <div class="incident-info">
            <span><i class="fas fa-user"></i> Reportado por: Usuario</span>
            ${incident.resolvedBy ? `
              <span><i class="fas fa-user-check"></i> Resuelto por: Usuario #${incident.resolvedBy}</span>
            ` : ''}
          </div>
          <button class="btn btn-sm btn-outline-primary view-incident-btn" data-incident-id="${incident.id}">
            <i class="fas fa-eye"></i> Ver detalles
          </button>
        </div>
      </div>
    </div>
  `;
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
 * Obtiene el texto según el estado del incidente
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
 * Obtiene el color del borde según el estado del incidente
 * @param {Object} incident - Incidente
 * @returns {string} - Clase CSS para el borde
 */
function getIncidentBorderColor(incident) {
  if (incident.status === 'resolved') {
    return 'border-success';
  } else if (incident.severity === 'critical') {
    return 'border-danger';
  } else if (incident.severity === 'high') {
    return 'border-warning';
  } else {
    return 'border-info';
  }
}

/**
 * Añade eventos a las tarjetas de incidentes
 */
function addIncidentCardEvents() {
  document.querySelectorAll('.view-incident-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const incidentId = this.getAttribute('data-incident-id');
      viewIncidentDetails(incidentId);
    });
  });
}

/**
 * Muestra los detalles de un incidente
 * @param {string} incidentId - ID del incidente
 */
async function viewIncidentDetails(incidentId) {
  try {
    const response = await API.get(`/incidents/${incidentId}`);
    const { incident, service } = response.data.data;
    
    // Crear y mostrar modal con detalles
    const modal = new bootstrap.Modal(document.getElementById('incidentDetailModal'));
    const modalBody = document.getElementById('incident-detail-body');
    
    modalBody.innerHTML = `
      <div class="incident-details">
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
            
            ${incident.affectedComponents?.length > 0 ? `
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
    `;
    
    modal.show();
  } catch (error) {
    console.error('Error al cargar detalles del incidente:', error);
    alert('Error al cargar los detalles del incidente');
  }
}

/**
 * Carga los servicios para el formulario de reporte de incidente
 */
async function loadServicesForIncidentForm() {
  try {
    const response = await API.get('/services');
    const services = response.data.data.services;
    
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
 * Envía el reporte de un nuevo incidente
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
    
    // Validar campos requeridos
    if (!serviceId || !title || !description) {
      UI.showError('Servicio, título y descripción son obligatorios', 'report-incident-error');
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
    
    // Recargar datos si estamos en la página correcta
    if (typeof loadDashboardData === 'function') {
      await loadDashboardData();
    }
    
    // Si estamos en la página de historial, recargar
    if (typeof loadIncidentHistory === 'function') {
      await loadIncidentHistory();
    }
    
    // Mostrar notificación
    alert('Incidente reportado correctamente');
  } catch (error) {
    console.error('Error al reportar incidente:', error);
    UI.showError(error.data?.message || 'Error al reportar el incidente', 'report-incident-error');
  }
}