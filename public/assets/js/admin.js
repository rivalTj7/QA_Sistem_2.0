/**
 * Funcionalidad del panel de administración
 */

// Referencia a las secciones
const userManagementSection = document.getElementById('user-management-section');
const serviceManagementSection = document.getElementById('service-management-section');
const systemConfigSection = document.getElementById('system-config-section');

/**
 * Carga los datos del panel de administración
 */
async function loadAdminData() {
  try {
    // Verificar si el usuario es superusuario
    if (!AUTH.isSuperUser()) {
      // Redirigir al dashboard si no es superusuario
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Cargar estadísticas generales
    await loadSystemStats();
    
    // Cargar lista de usuarios
    await loadUsersList();
    
    // Cargar lista de servicios
    await loadServicesList();
  } catch (error) {
    console.error('Error al cargar datos de administración:', error);
  }
}

/**
 * Carga las estadísticas del sistema
 */
async function loadSystemStats() {
  try {
    // Cargar datos de servicios
    const servicesResponse = await API.get('/services');
    const services = servicesResponse.data.data.services;
    document.getElementById('service-count').textContent = services.length;
    
    // Calcular disponibilidad promedio
    let totalUptime = 0;
    services.forEach(service => {
      totalUptime += service.uptime?.last30d || 0;
    });
    const avgUptime = services.length > 0 ? (totalUptime / services.length).toFixed(2) : '--';
    document.getElementById('uptime').textContent = `${avgUptime}%`;
    
    // Cargar datos de incidentes
    const incidentsResponse = await API.get('/incidents');
    const incidents = incidentsResponse.data.data.incidents;
    document.getElementById('incident-count').textContent = incidents.length;
    
    // Simular cantidad de usuarios (en una implementación real, se obtendría desde el backend)
    document.getElementById('user-count').textContent = '2';
  } catch (error) {
    console.error('Error al cargar estadísticas del sistema:', error);
  }
}

/**
 * Carga la lista de usuarios
 */
async function loadUsersList() {
  // En una implementación real, cargaría datos desde la API
  // Como no tenemos endpoint para listar usuarios, simulamos datos
  
  const users = [
    {
      id: '1',
      username: 'admin',
      name: 'Administrador',
      email: 'admin@example.com',
      role: 'superuser',
      createdAt: '2025-05-01T10:00:00Z'
    },
    {
      id: '2',
      username: 'usuario',
      name: 'Usuario Normal',
      email: 'usuario@example.com',
      role: 'user',
      createdAt: '2025-05-01T10:30:00Z'
    }
  ];
  
  const tableBody = document.getElementById('users-table-body');
  
  // Limpiar tabla
  tableBody.innerHTML = '';
  
  // Generar filas
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role === 'superuser' ? 'Superusuario' : 'Usuario'}</td>
      <td>${UI.formatDate(user.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-warning edit-user-btn" data-user-id="${user.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Agregar eventos a los botones
  document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      showUserModal(userId);
    });
  });
  
  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      if (confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
        deleteUser(userId);
      }
    });
  });
}

/**
 * Carga la lista de servicios
 */
async function loadServicesList() {
  try {
    const response = await API.get('/services');
    const services = response.data.data.services;
    
    const tableBody = document.getElementById('services-admin-table-body');
    
    // Limpiar tabla
    tableBody.innerHTML = '';
    
    if (services.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="no-data">
              <i class="fas fa-server"></i>
              <p>No hay servicios registrados</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Generar filas
    services.forEach(service => {
      const uptime30d = service.uptime?.last30d || 0;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${service.name}</td>
        <td>${service.endpoint}</td>
        <td class="text-center">${UI.getStatusBadge(service.status)}</td>
        <td>${uptime30d.toFixed(2)}%</td>
        <td>${service.responseTime} ms</td>
        <td>
          <button class="btn btn-sm btn-primary view-service-btn" data-service-id="${service.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning edit-service-btn" data-service-id="${service.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-service-btn" data-service-id="${service.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Agregar eventos a los botones
    addServiceButtonsEvents();
  } catch (error) {
    console.error('Error al cargar lista de servicios:', error);
    
    const tableBody = document.getElementById('services-admin-table-body');
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">
          <i class="fas fa-exclamation-circle"></i> Error al cargar servicios
        </td>
      </tr>
    `;
  }
}

/**
 * Agrega eventos a los botones de servicios
 */
function addServiceButtonsEvents() {
  // Botones de ver servicio
  document.querySelectorAll('.view-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      // Aquí podríamos mostrar un modal de detalles o redirigir a una página de detalles
      alert(`Ver detalles del servicio ${serviceId}`);
    });
  });
  
  // Botones de editar servicio
  document.querySelectorAll('.edit-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      // Reutilizamos la función del dashboard para editar servicios
      if (typeof showEditServiceModal === 'function') {
        showEditServiceModal(serviceId);
      } else {
        alert(`Editar servicio ${serviceId}`);
      }
    });
  });
  
  // Botones de eliminar servicio
  document.querySelectorAll('.delete-service-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const serviceId = this.getAttribute('data-service-id');
      if (confirm('¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.')) {
        // Reutilizamos la función del dashboard para eliminar servicios
        if (typeof deleteService === 'function') {
          deleteService(serviceId).then(() => {
            loadServicesList();
          });
        } else {
          alert(`Eliminar servicio ${serviceId}`);
        }
      }
    });
  });
}

/**
 * Muestra el modal de usuario
 * @param {string} userId - ID del usuario (si es null, es un nuevo usuario)
 */
function showUserModal(userId = null) {
  // Abrir modal
  const userModal = new bootstrap.Modal(document.getElementById('userModal'));
  userModal.show();
  
  // Configurar título
  document.getElementById('userModalLabel').textContent = userId ? 'Editar Usuario' : 'Nuevo Usuario';
  
  // Restablecer formulario
  document.getElementById('user-form').reset();
  document.getElementById('user-error').classList.add('d-none');
  
  // Establecer el ID del usuario (si existe)
  document.getElementById('user-id').value = userId || '';
  
  // Mostrar/ocultar campo de contraseña según sea nuevo o existente
  const passwordField = document.getElementById('user-password');
  const passwordHelp = passwordField.nextElementSibling;
  if (userId) {
    // Usuario existente
    passwordHelp.textContent = 'Dejar en blanco para mantener la contraseña actual.';
    passwordField.required = false;
    
    // Simular carga de datos (en una implementación real, se cargarían desde la API)
    if (userId === '1') {
      document.getElementById('user-name').value = 'Administrador';
      document.getElementById('user-username').value = 'admin';
      document.getElementById('user-email').value = 'admin@example.com';
      document.getElementById('user-role').value = 'superuser';
    } else {
      document.getElementById('user-name').value = 'Usuario Normal';
      document.getElementById('user-username').value = 'usuario';
      document.getElementById('user-email').value = 'usuario@example.com';
      document.getElementById('user-role').value = 'user';
    }
  } else {
    // Nuevo usuario
    passwordHelp.textContent = 'Contraseña para el nuevo usuario.';
    passwordField.required = true;
  }
  
  // Configurar botones
  const saveButton = document.getElementById('save-user-btn');
  const deleteButton = document.getElementById('delete-user-btn');
  
  // Mostrar/ocultar botón de eliminar
  if (userId) {
    deleteButton.classList.remove('d-none');
  } else {
    deleteButton.classList.add('d-none');
  }
  
  // Eventos de botones
  saveButton.onclick = function() {
    saveUser(userId);
  };
  
  deleteButton.onclick = function() {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      deleteUser(userId);
      userModal.hide();
    }
  };
}

/**
 * Guarda un usuario (nuevo o existente)
 * @param {string} userId - ID del usuario (si es null, es un nuevo usuario)
 */
function saveUser(userId = null) {
  // Obtener valores del formulario
  const name = document.getElementById('user-name').value;
  const username = document.getElementById('user-username').value;
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;
  
  // Validar campos requeridos
  if (!name || !username || !email || (!userId && !password)) {
    UI.showError('Todos los campos son obligatorios', 'user-error');
    return;
  }
  
  // En una implementación real, enviaríamos estos datos a la API
  // Como no tenemos endpoint para esto, simulamos una respuesta exitosa
  
  // Cerrar modal
  const userModal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
  userModal.hide();
  
  // Recargar lista de usuarios
  loadUsersList();
  
  // Mostrar notificación
  alert(userId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
}

/**
 * Elimina un usuario
 * @param {string} userId - ID del usuario
 */
function deleteUser(userId) {
  // En una implementación real, enviaríamos una petición DELETE a la API
  // Como no tenemos endpoint para esto, simulamos una respuesta exitosa
  
  // Recargar lista de usuarios
  loadUsersList();
  
  // Mostrar notificación
  alert('Usuario eliminado correctamente');
}

/**
 * Guarda la configuración del sistema
 */
function saveSystemConfig() {
  // Obtener valores del formulario
  const refreshInterval = document.getElementById('refresh-interval').value;
  const uptimeThreshold = document.getElementById('uptime-threshold').value;
  const responseThreshold = document.getElementById('response-threshold').value;
  const retentionDays = document.getElementById('retention-days').value;
  const enableNotifications = document.getElementById('enable-notifications').checked;
  const autoResolveIncidents = document.getElementById('auto-resolve-incidents').checked;
  
  // En una implementación real, enviaríamos estos datos a la API
  // Como no tenemos endpoint para esto, simulamos una respuesta exitosa
  
  // Mostrar notificación
  alert('Configuración guardada correctamente');
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si el usuario está autenticado
  if (!AUTH.isAuthenticated()) {
    // Mostrar modal de login
    showLoginModal();
  } else if (!AUTH.isSuperUser()) {
    // Redirigir si no es superusuario
    window.location.href = 'dashboard.html';
  } else {
    // Cargar datos iniciales
    loadAdminData();
  }
  
  // Toggle del sidebar
  const sidebarCollapse = document.getElementById('sidebarCollapse');
  if (sidebarCollapse) {
    sidebarCollapse.addEventListener('click', function() {
      document.getElementById('sidebar').classList.toggle('active');
      document.getElementById('content').classList.toggle('active');
    });
  }
  
  // Botones de gestión
  const manageUsersBtn = document.getElementById('manage-users-btn');
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', function() {
      // Mostrar sección de usuarios y ocultar las demás
      userManagementSection.classList.remove('d-none');
      serviceManagementSection.classList.add('d-none');
      systemConfigSection.classList.add('d-none');
      
      // Recargar lista de usuarios
      loadUsersList();
    });
  }
  
  const manageServicesBtn = document.getElementById('manage-services-btn');
  if (manageServicesBtn) {
    manageServicesBtn.addEventListener('click', function() {
      // Mostrar sección de servicios y ocultar las demás
      userManagementSection.classList.add('d-none');
      serviceManagementSection.classList.remove('d-none');
      systemConfigSection.classList.add('d-none');
      
      // Recargar lista de servicios
      loadServicesList();
    });
  }
  
  const systemConfigBtn = document.getElementById('system-config-btn');
  if (systemConfigBtn) {
    systemConfigBtn.addEventListener('click', function() {
      // Mostrar sección de configuración y ocultar las demás
      userManagementSection.classList.add('d-none');
      serviceManagementSection.classList.add('d-none');
      systemConfigSection.classList.remove('d-none');
    });
  }
  
  // Botón de añadir usuario
  const addUserBtn = document.getElementById('add-user-btn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', function() {
      showUserModal();
    });
  }
  
  // Botón de añadir servicio (en la sección de servicios)
  const addServiceAdminBtn = document.getElementById('add-service-admin-btn');
  if (addServiceAdminBtn) {
    addServiceAdminBtn.addEventListener('click', function() {
      if (typeof showEditServiceModal === 'function') {
        showEditServiceModal(); // Función del dashboard para crear servicios
      } else {
        alert('Funcionalidad no implementada');
      }
    });
  }
  
  // Formulario de configuración del sistema
  const systemConfigForm = document.getElementById('system-config-form');
  if (systemConfigForm) {
    systemConfigForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveSystemConfig();
    });
  }
});