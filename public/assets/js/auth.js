// Archivo: public/assets/js/auth.js (corregido)

/**
 * Módulo de autenticación
 */
const AUTH = {
  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} - true si está autenticado, false en caso contrario
   */
  isAuthenticated() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    return !!token;
  },
  
  /**
   * Obtiene el usuario actual
   * @returns {Object|null} - Datos del usuario o null si no está autenticado
   */
  getCurrentUser() {
    const userJson = localStorage.getItem(CONFIG.USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Error al parsear datos de usuario:', error);
      return null;
    }
  },
  
  /**
   * Verifica si el usuario actual es superusuario
   * @returns {boolean} - true si es superusuario, false en caso contrario
   */
  isSuperUser() {
    const user = this.getCurrentUser();
    return user && user.role === 'superuser';
  },
  
  /**
   * Inicia sesión
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} - Promesa con los datos del usuario
   */
  async login(username, password) {
    try {
      const response = await API.post('/auth/login', { username, password });
      
      // Guardar token y datos de usuario
      localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
      
      return response.data.user;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  },
  
  /**
   * Cierra sesión
   */
  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    
    // Redirigir a la página de inicio
    window.location.href = 'index.html';
  },
  
  /**
   * Actualiza los datos del usuario en la UI
   */
  updateUserUI() {
    const user = this.getCurrentUser();
    const usernameElement = document.getElementById('username');
    
    if (user && usernameElement) {
      usernameElement.textContent = user.name || user.username;
    }
    
    // Configurar elementos del menú de usuario
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const adminLink = document.getElementById('admin-link');
    const userDivider = document.getElementById('user-divider');
    
    if (this.isAuthenticated()) {
      // Usuario autenticado
      if (loginLink) loginLink.classList.add('d-none');
      if (logoutLink) logoutLink.classList.remove('d-none');
      if (userDivider) userDivider.classList.remove('d-none');
      
      // Mostrar enlace de admin solo para superusuarios
      if (adminLink) {
        if (this.isSuperUser()) {
          adminLink.classList.remove('d-none');
        } else {
          adminLink.classList.add('d-none');
        }
      }
    } else {
      // Usuario no autenticado
      if (loginLink) loginLink.classList.remove('d-none');
      if (logoutLink) logoutLink.classList.add('d-none');
      if (adminLink) adminLink.classList.add('d-none');
      if (userDivider) userDivider.classList.add('d-none');
    }
    
    // Mostrar/ocultar elementos según el rol
    if (this.isSuperUser()) {
      document.querySelectorAll('.superuser-only').forEach(el => {
        el.classList.remove('d-none');
      });
    } else {
      document.querySelectorAll('.superuser-only').forEach(el => {
        el.classList.add('d-none');
      });
    }
    
    if (this.isAuthenticated()) {
      document.querySelectorAll('.authenticated-only').forEach(el => {
        el.classList.remove('d-none');
      });
      document.querySelectorAll('.unauthenticated-only').forEach(el => {
        el.classList.add('d-none');
      });
    } else {
      document.querySelectorAll('.authenticated-only').forEach(el => {
        el.classList.add('d-none');
      });
      document.querySelectorAll('.unauthenticated-only').forEach(el => {
        el.classList.remove('d-none');
      });
    }
  }
};

/**
 * Muestra el modal de inicio de sesión
 */
function showLoginModal() {
  const modal = new bootstrap.Modal(document.getElementById('loginModal'));
  modal.show();
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Actualizar UI con datos de usuario
  AUTH.updateUserUI();
  
  // Evento de formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const usernameInput = document.getElementById('login-username') || document.getElementById('username');
      const passwordInput = document.getElementById('login-password') || document.getElementById('password');
      const errorContainer = document.getElementById('login-error');
      
      if (!usernameInput || !passwordInput) {
        console.error('Elementos del formulario no encontrados');
        return;
      }
      
      // Ocultar mensaje de error previo si existe
      if (errorContainer) {
        errorContainer.classList.add('d-none');
      }
      
      try {
        // Iniciar sesión
        await AUTH.login(usernameInput.value, passwordInput.value);
        
        // Actualizar UI
        AUTH.updateUserUI();
        
        // Cerrar modal si existe
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
          loginModal.hide();
        }
        
        // Redirigir según el rol
        const user = AUTH.getCurrentUser();
        if (user && user.role === 'superuser') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } catch (error) {
        // Mostrar mensaje de error
        if (errorContainer) {
          errorContainer.textContent = error.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
          errorContainer.classList.remove('d-none');
        } else {
          alert('Error al iniciar sesión: ' + (error.data?.message || 'Verifica tus credenciales'));
        }
      }
    });
  }
  
  // Evento de botón de logout
  const logoutButton = document.getElementById('logout-link');
  if (logoutButton) {
    logoutButton.addEventListener('click', function(e) {
      e.preventDefault();
      AUTH.logout();
    });
  }
  
  // Eventos adicionales de autenticación
  const loginButton = document.getElementById('login-link');
  if (loginButton) {
    loginButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        // Mostrar modal de login
        showLoginModal();
      } else {
        // Redirigir a la página de login
        window.location.href = 'login.html';
      }
    });
  }
});

// Exponer función global
window.showLoginModal = showLoginModal;