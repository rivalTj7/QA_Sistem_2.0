// Archivo: public/assets/js/ui-utils.js
// Funciones de utilidad para la interfaz de usuario

const UI = {
  /**
   * Formatea una fecha ISO a una cadena legible
   * @param {string} isoDate - Fecha en formato ISO
   * @returns {string} - Fecha formateada
   */
  formatDate(isoDate) {
    if (!isoDate) return 'N/A';
    
    const date = new Date(isoDate);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  /**
   * Formatea un tiempo relativo (ej: "hace 5 minutos")
   * @param {string} isoDate - Fecha en formato ISO
   * @returns {string} - Tiempo relativo
   */
  formatRelativeTime(isoDate) {
    if (!isoDate) return 'N/A';
    
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    
    // Convertir a segundos
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `Hace ${diffSec} segundos`;
    }
    
    // Convertir a minutos
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return `Hace ${diffMin} minutos`;
    }
    
    // Convertir a horas
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return `Hace ${diffHour} horas`;
    }
    
    // Convertir a días
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) {
      return `Hace ${diffDay} días`;
    }
    
    // Para periodos más largos, mostrar la fecha
    return this.formatDate(isoDate);
  },
  
  /**
   * Obtiene la clase CSS según el porcentaje de uptime
   * @param {number} uptime - Porcentaje de uptime
   * @returns {string} - Clase CSS
   */
  getUptimeClass(uptime) {
    if (uptime >= 99) return 'high';
    if (uptime >= 95) return 'medium';
    return 'low';
  },
  
  /**
   * Obtiene el badge HTML para un estado de servicio
   * @param {string} status - Estado del servicio
   * @returns {string} - HTML del badge
   */
  getStatusBadge(status) {
    const statusMap = {
      'operational': {
        text: 'Operativo',
        class: 'status-operational'
      },
      'degraded_performance': {
        text: 'Rendimiento degradado',
        class: 'status-degraded'
      },
      'partial_outage': {
        text: 'Interrupción parcial',
        class: 'status-partial'
      },
      'major_outage': {
        text: 'Interrupción mayor',
        class: 'status-major'
      },
      'maintenance': {
        text: 'Mantenimiento',
        class: 'status-maintenance'
      }
    };
    
    const statusInfo = statusMap[status] || {
      text: 'Desconocido',
      class: ''
    };
    
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
  },
  
  /**
   * Obtiene el badge HTML para un nivel de severidad
   * @param {string} severity - Nivel de severidad
   * @returns {string} - HTML del badge
   */
  getSeverityBadge(severity) {
    const severityMap = {
      'low': {
        text: 'Baja',
        class: 'severity-low'
      },
      'medium': {
        text: 'Media',
        class: 'severity-medium'
      },
      'high': {
        text: 'Alta',
        class: 'severity-high'
      },
      'critical': {
        text: 'Crítica',
        class: 'severity-critical'
      }
    };
    
    const severityInfo = severityMap[severity] || {
      text: 'Desconocida',
      class: ''
    };
    
    return `<span class="severity-badge ${severityInfo.class}">${severityInfo.text}</span>`;
  },
  
  /**
   * Muestra un mensaje de error en un contenedor
   * @param {string} message - Mensaje de error
   * @param {string} containerId - ID del contenedor
   */
  showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.textContent = message;
      container.classList.remove('d-none');
    } else {
      console.error('Contenedor de error no encontrado:', containerId);
      alert(`Error: ${message}`);
    }
  },
  
  /**
   * Oculta un mensaje de error en un contenedor
   * @param {string} containerId - ID del contenedor
   */
  hideError(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.classList.add('d-none');
    }
  },
  
  /**
   * Muestra un modal de login
   */
  showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
  }
};

// Exportar para uso global
window.UI = UI;