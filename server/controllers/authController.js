const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');
const FileHandler = require('../utils/fileHandler');
const userFile = new FileHandler(config.files.usersPath);

/**
 * Genera un token JWT para un usuario
 * @param {string} id - ID del usuario
 * @returns {string} Token JWT
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn }
  );
};

/**
 * Hashea una contraseña usando SHA-256
 * @param {string} password - Contraseña a hashear
 * @returns {string} Contraseña hasheada
 */
const hashPassword = (password) => {
  return crypto
    .createHash('sha256')
    .update(String(password))
    .digest('hex');
};

/**
 * Controlador de autenticación
 */
const authController = {
  /**
   * Registra un nuevo usuario (solo para superusuarios)
   */
  register: async (req, res, next) => {
    try {
      const { username, password, name, email, role } = req.body;
      
      // Verificar si el usuario ya existe
      const users = await userFile.readFile();
      const existingUser = users.find(u => 
        u.username === username || u.email === email
      );
      
      if (existingUser) {
        return res.status(400).json({
          status: 'fail',
          message: existingUser.username === username 
            ? 'Este nombre de usuario ya está registrado' 
            : 'Este email ya está registrado'
        });
      }
      
      // Crear usuario
      const newUser = {
        username,
        password: hashPassword(password),
        name,
        email,
        role: role || 'user' // Por defecto, rol normal
      };
      
      const createdUser = await userFile.create(newUser);
      
      // Eliminar contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = createdUser;
      
      res.status(201).json({
        status: 'success',
        data: {
          user: userWithoutPassword
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Inicia sesión
   */
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      // Verificar que se proporcionen credenciales
      if (!username || !password) {
        return res.status(400).json({
          status: 'fail',
          message: 'Por favor proporciona nombre de usuario y contraseña'
        });
      }
      
      // Buscar usuario
      const users = await userFile.readFile();
      console.log(users);
      const user = users.find(u => u.username === username);
      
      // Verificar credenciales
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({
          status: 'fail',
          message: 'Credenciales incorrectas'
        });
      }
      
      // Generar token
      const token = generateToken(user.id);
      
      // Eliminar contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        status: 'success',
        token,
        data: {
          user: userWithoutPassword
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene el perfil del usuario actual
   */
  getMe: (req, res) => {
    // Eliminar contraseña de la respuesta
    const { password, ...userWithoutPassword } = req.user;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userWithoutPassword
      }
    });
  },
  
  /**
   * Actualiza el perfil del usuario
   */
  updateMe: async (req, res, next) => {
    try {
      // No permitir actualizar contraseña o rol
      const { password, role, ...updates } = req.body;
      
      // Actualizar usuario
      const updatedUser = await userFile.update(req.user.id, updates);
      
      // Eliminar contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        status: 'success',
        data: {
          user: userWithoutPassword
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Actualiza la contraseña del usuario
   */
  updatePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verificar que se proporcionen contraseñas
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'fail',
          message: 'Por favor proporciona la contraseña actual y la nueva'
        });
      }
      
      // Verificar contraseña actual
      if (req.user.password !== hashPassword(currentPassword)) {
        return res.status(401).json({
          status: 'fail',
          message: 'Contraseña actual incorrecta'
        });
      }
      
      // Actualizar contraseña
      await userFile.update(req.user.id, {
        password: hashPassword(newPassword)
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;