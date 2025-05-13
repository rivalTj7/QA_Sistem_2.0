const fs = require('fs').promises;
const path = require('path');

/**
 * Clase para manejar operaciones CRUD en archivos JSON
 */
class FileHandler {
  /**
   * Constructor
   * @param {string} filename - Nombre del archivo JSON
   */
  constructor(filename) {
    this.filePath = path.join(__dirname, '../data', filename);
  }

  /**
   * Lee un archivo JSON
   * @returns {Promise<Array>} Datos del archivo
   */
  async readFile() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, crear uno vacío
      if (error.code === 'ENOENT') {
        await this.writeFile([]);
        return [];
      }
      throw error;
    }
  }

  /**
   * Escribe datos en un archivo JSON
   * @param {Array|Object} data - Datos a escribir
   * @returns {Promise<void>}
   */
  async writeFile(data) {
    const dirPath = path.dirname(this.filePath);
    try {
      // Asegurarse de que el directorio existe
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error al escribir en ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Encuentra un registro por su ID
   * @param {string} id - ID del registro
   * @returns {Promise<Object|null>} Registro encontrado o null
   */
  async findById(id) {
    try {
      const data = await this.readFile();
      return data.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error al buscar ID ${id} en ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Busca registros que coincidan con un criterio
   * @param {Function} filterFn - Función de filtrado
   * @returns {Promise<Array>} Registros que cumplen el criterio
   */
  async find(filterFn) {
    try {
      const data = await this.readFile();
      return data.filter(filterFn);
    } catch (error) {
      console.error(`Error al buscar en ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuevo registro
   * @param {Object} item - Datos del nuevo registro
   * @returns {Promise<Object>} Registro creado
   */
  async create(item) {
    try {
      const data = await this.readFile();
      
      // Generar ID si no existe
      if (!item.id) {
        const lastId = data.length > 0 
          ? Math.max(...data.map(i => parseInt(i.id) || 0))
          : 0;
        item.id = String(lastId + 1);
      }
      
      // Añadir timestamps
      const now = new Date().toISOString();
      item.createdAt = now;
      item.updatedAt = now;
      
      data.push(item);
      await this.writeFile(data);
      return item;
    } catch (error) {
      console.error(`Error al crear en ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un registro existente
   * @param {string} id - ID del registro a actualizar
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object|null>} Registro actualizado o null
   */
  async update(id, updates) {
    try {
      const data = await this.readFile();
      const index = data.findIndex(item => item.id === id);
      
      if (index === -1) return null;
      
      // Actualizar timestamp
      updates.updatedAt = new Date().toISOString();
      
      // Mantener createdAt original
      const createdAt = data[index].createdAt;
      
      // Actualizar registro
      data[index] = { ...data[index], ...updates, createdAt };
      
      await this.writeFile(data);
      return data[index];
    } catch (error) {
      console.error(`Error al actualizar ID ${id} en ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un registro
   * @param {string} id - ID del registro a eliminar
   * @returns {Promise<boolean>} true si se eliminó, false si no
   */
  async delete(id) {
    try {
      const data = await this.readFile();
      const initialLength = data.length;
      
      const filteredData = data.filter(item => item.id !== id);
      
      if (filteredData.length === initialLength) {
        return false;
      }
      
      await this.writeFile(filteredData);
      return true;
    } catch (error) {
      console.error(`Error al eliminar ID ${id} en ${this.filePath}:`, error);
      throw error;
    }
  }
}

module.exports = FileHandler;