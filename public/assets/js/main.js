// Archivo: public/assets/js/main.js (actualización)

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