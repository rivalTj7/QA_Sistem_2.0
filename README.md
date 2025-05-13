# Monitor de Servicios QA

Una aplicación web para monitorear servicios de QA, con un dashboard intuitivo, gestión de servicios, registro de incidentes y panel de administración.

## Características Principales

- **Dashboard en tiempo real**: Visualización del estado de todos los servicios con métricas de disponibilidad.
- **Registro de incidentes**: Reporte y seguimiento de incidentes en los servicios.
- **Gestión de servicios**: Creación, edición y eliminación de servicios monitoreados.
- **Panel de administración**: Gestión de usuarios y configuración del sistema (para superusuarios).
- **Autenticación**: Sistema de login con distintos niveles de permisos.
- **Almacenamiento en archivos JSON**: No requiere configuración de base de datos.

## Tecnologías Utilizadas

- **Frontend**:
  - HTML5, CSS3 y JavaScript (vanilla)
  - Bootstrap 5 para UI
  - Chart.js para gráficos
  - Font Awesome para iconos

- **Backend**:
  - Node.js con Express
  - JWT para autenticación
  - Archivos JSON para almacenamiento

## Estructura del Proyecto

```
proyecto-qa-monitor/
│
├── server/                  # Backend Node.js
│   ├── data/                # Almacenamiento de archivos JSON
│   │   ├── users.json       # Información de usuarios
│   │   ├── services.json    # Información de servicios
│   │   └── incidents.json   # Historial de incidentes
│   │
│   ├── controllers/         # Controladores
│   ├── routes/              # Rutas API
│   ├── middlewares/         # Middlewares
│   ├── utils/               # Utilidades
│   └── server.js            # Punto de entrada del servidor
│
├── public/                  # Frontend
│   ├── assets/
│   │   ├── css/             # Estilos CSS
│   │   ├── js/              # JavaScript cliente
│   │   └── img/             # Imágenes
│   │
│   ├── dashboard.html       # Panel principal
│   ├── admin.html           # Panel de administración
│   └── index.html           # Página de inicio
│
├── .env                     # Variables de entorno
└── package.json
```

## Instalación y Ejecución

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd monitor-qa
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea el archivo `.env` con la siguiente información:
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=tu_clave_secreta_aqui
   JWT_EXPIRES_IN=30d
   ```

4. Inicia el servidor:
   ```bash
   npm start
   ```

5. Abre en tu navegador:
   ```
   http://localhost:3000
   ```

## Uso

### Credenciales por defecto

- **Superusuario**:
  - Usuario: admin
  - Contraseña: admin

- **Usuario normal**:
  - Usuario: usuario
  - Contraseña: 1234

### Panel de Control

El dashboard principal muestra:
- Estado general de todos los servicios
- Métricas de disponibilidad (24h, 7d, 30d)
- Lista de servicios con su estado actual
- Incidentes activos

### Gestión de Servicios

Para gestionar servicios (crear, editar, eliminar):
1. Inicia sesión como superusuario
2. Usa los botones de acción en la lista de servicios o
3. Accede al panel de administración > Gestión de Servicios

### Reporte de Incidentes

Para reportar un incidente:
1. Haz clic en "Reportar Incidente" en el dashboard o
2. Navega a "Incidentes" > "Reportar incidente" en el menú lateral

## Personalización

### Configuración del Sistema

Los superusuarios pueden ajustar parámetros como:
- Intervalo de actualización del dashboard
- Umbrales de disponibilidad
- Tiempo de retención de incidentes
- Comportamiento de notificaciones

### Almacenamiento

Los datos se guardan en archivos JSON en la carpeta `server/data/`. Para implementar una base de datos:

1. Instala el driver de base de datos (MongoDB, MySQL, etc.)
2. Modifica los controladores para usar la base de datos
3. Ajusta las utilidades de almacenamiento

## Licencia

[MIT](LICENSE)

---

Desarrollado por [Tu Nombre] - 2025