# 📦 Guía de Instalación - GallinaApp

Esta guía te ayudará a instalar y configurar el sistema completo de GallinaApp en tu servidor local o en producción.

## 📋 Requisitos Previos

- **Node.js**: Versión 16 o superior
- **PostgreSQL**: Versión 13 o superior
- **npm** o **yarn**: Para gestión de paquetes
- **Git**: Para clonar el repositorio

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd GallinaApp
```

### 2. Configurar la Base de Datos

#### 2.1 Crear la base de datos

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear la base de datos
CREATE DATABASE gallinaapp;

# Crear usuario (opcional)
CREATE USER gallinauser WITH PASSWORD 'tu_password_seguro';

# Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE gallinaapp TO gallinauser;

# Salir
\q
```

#### 2.2 Ejecutar el schema

```bash
psql -U postgres -d gallinaapp -f database/schema.sql
```

#### 2.3 Cargar datos de prueba (opcional)

```bash
psql -U postgres -d gallinaapp -f database/migrations/seed.sql
```

### 3. Configurar el Backend

#### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

#### 3.2 Configurar variables de entorno

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gallinaapp
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=cambia_este_secreto_en_produccion
JWT_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3001
```

#### 3.3 Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor debería estar corriendo en `http://localhost:3000`

### 4. Configurar el Frontend

#### 4.1 Instalar dependencias

```bash
cd frontend
npm install
```

#### 4.2 Configurar variables de entorno (opcional)

Crear archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

#### 4.3 Iniciar la aplicación

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

El dashboard web estará disponible en `http://localhost:3001`

## ✅ Verificación de la Instalación

### 1. Verificar el Backend

Abre tu navegador en `http://localhost:3000` y deberías ver:

```json
{
  "mensaje": "🐔 Bienvenido a GallinaApp API",
  "version": "1.0.0",
  ...
}
```

### 2. Verificar la Base de Datos

```bash
psql -U postgres -d gallinaapp -c "SELECT COUNT(*) FROM usuarios;"
```

Deberías ver al menos 4 usuarios de prueba.

### 3. Verificar el Frontend

Abre `http://localhost:3001` y deberías ver la página de login.

## 👤 Usuarios de Prueba

Después de cargar los datos de prueba:

- **Dueño**: `dueno@elolimp.com` / `password123`
- **Supervisor**: `supervisor@elolimp.com` / `password123`
- **Trabajador**: `trabajador@elolimp.com` / `password123`

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql
```

### Puerto en uso

Si el puerto 3000 o 3001 está en uso, cambia el puerto en los archivos `.env`:

```env
# Backend
PORT=3002

# Frontend (vite.config.js)
server: { port: 3003 }
```

### Error de permisos en PostgreSQL

```bash
# Otorgar todos los permisos al usuario
sudo -u postgres psql gallinaapp
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gallinauser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gallinauser;
```

### Módulos no encontrados

```bash
# Limpiar cache e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

## 📚 Próximos Pasos

1. **Personalizar**: Modifica los datos de la granja en la base de datos
2. **Usuarios**: Crea usuarios reales con el endpoint `/api/register`
3. **Galpones**: Registra los galpones de tu granja
4. **Registros**: Comienza a registrar datos diarios
5. **Monitoreo**: Configura alertas y umbrales según tus necesidades

## 🔒 Seguridad en Producción

Antes de desplegar en producción:

1. Cambiar `JWT_SECRET` a un valor aleatorio y seguro
2. Usar HTTPS para todas las conexiones
3. Configurar CORS correctamente
4. Usar contraseñas fuertes para PostgreSQL
5. Habilitar SSL en la conexión a la base de datos
6. Configurar rate limiting adecuado
7. Revisar y limitar los permisos de usuario de la BD

## 📞 Soporte

Para problemas o preguntas:
- Email: soporte@gallinaapp.com
- Documentación: Ver archivos en `/docs`
