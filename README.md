# 🐔 GallinaApp - Sistema de Gestión Avícola

Sistema completo de gestión para granjas avícolas que digitaliza el proceso de registro manual, permitiendo el seguimiento de galpones, inventario de alimentos, métricas de productividad y generación de reportes automáticos.

## 🌐 Demo en Vivo

- **Backend API**: https://gallinaapp.onrender.com/api
- **Documentación**: Ver endpoints en `/api`
- **Health Check**: https://gallinaapp.onrender.com/health

## 🎯 Características Principales

- ✅ Registro diario de datos de galpones (consumo, mortalidad, peso, etc.)
- ✅ Gestión de inventario de alimentos por lotes
- ✅ Dashboard con KPIs y métricas en tiempo real
- ✅ Sistema de alertas automáticas (mortalidad alta, stock bajo)
- ✅ Reportes y exportación PDF/Excel
- ✅ Sistema de roles (trabajador, supervisor, dueño)
- ✅ Modo offline con sincronización automática
- ✅ Interfaz en español

## 📁 Estructura del Proyecto

```
GallinaApp/
├── backend/          # API REST con Node.js + Express
├── frontend/         # Dashboard web con React
├── database/         # Esquemas y migraciones SQL
├── docs/            # Documentación adicional
└── README.md
```

## 🚀 Instalación y Configuración

### Prerequisitos

- Node.js >= 16.x
- PostgreSQL >= 13.x
- npm o yarn

### 1. Base de Datos

```bash
# Crear la base de datos
createdb gallinaapp

# Ejecutar el schema
psql -d gallinaapp -f database/schema.sql

# Ejecutar datos de prueba (opcional)
psql -d gallinaapp -f database/migrations/seed.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales de base de datos
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

El dashboard web estará disponible en `http://localhost:3001`

## 🔑 Usuarios de Prueba

Después de ejecutar el seed:

- **Dueño**: `dueno@elolimp.com` / `password123`
- **Supervisor**: `supervisor@elolimp.com` / `password123`
- **Trabajador**: `trabajador@elolimp.com` / `password123`

## 📊 Módulos del Sistema

### 1. Gestión de Galpones
- Registro y seguimiento de galpones por granja
- Estado actual: saldo de aves, edad, consumo, mortalidad

### 2. Registro Diario
- Edad del lote
- Consumo de alimento (kg/bultos)
- Tipo y lote de alimento
- Mortalidad y selección
- Peso promedio (gramos)
- Cálculos automáticos (saldo, acumulados)

### 3. Inventario de Alimentos
- Control de entrada/salida por lotes
- Alertas de stock bajo
- Historial de consumo

### 4. Dashboard y Reportes
- KPIs: mortalidad, FCR, peso promedio, consumo
- Gráficas interactivas
- Exportación PDF/Excel

### 5. Sistema de Alertas
- Mortalidad alta (>5%)
- Stock de alimento bajo
- Peso fuera de rango

## 🔐 API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/register` - Registrar usuario
- `GET /api/profile` - Obtener perfil

### Galpones
- `GET /api/galpones` - Listar galpones
- `POST /api/galpones` - Crear galpón
- `PUT /api/galpones/:id` - Actualizar galpón
- `GET /api/galpones/:id/resumen` - Resumen de galpón

### Registros Diarios
- `POST /api/registros` - Crear registro
- `GET /api/registros` - Listar registros (filtrable)
- `PUT /api/registros/:id` - Actualizar registro
- `GET /api/dashboard/kpis` - Obtener KPIs

### Inventario
- `GET /api/inventario` - Estado del inventario
- `POST /api/inventario/movimiento` - Registrar entrada/salida
- `GET /api/lotes` - Listar lotes de alimento

### Alertas
- `GET /api/alertas` - Listar alertas activas
- `PUT /api/alertas/:id/resolver` - Marcar alerta como resuelta

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- PostgreSQL
- JWT para autenticación
- Sequelize ORM

### Frontend
- React 18
- React Router
- Context API para estado global
- Recharts para gráficas
- Axios para API calls

## 📈 Métricas y KPIs

- **Mortalidad (%)** = (Mortalidad acumulada / Aves iniciales) × 100
- **FCR (Conversión Alimenticia)** = Consumo total / Peso total ganado
- **Peso promedio diario**
- **Consumo acumulado**

## 🚀 Despliegue

### ✅ Backend (Render) - YA DESPLEGADO

El backend ya está en producción: **https://gallinaapp.onrender.com**

📖 **Guía completa**: Ver [RENDER_DEPLOY.md](RENDER_DEPLOY.md)

**Configurar CORS**: Agrega la URL de tu frontend a `ALLOWED_ORIGINS`

### 📱 Frontend - Siguiente Paso

Despliega el frontend en Vercel o Netlify:

**Vercel (Recomendado)**:
```bash
cd frontend
vercel
```

**Variables de entorno**:
```bash
VITE_API_URL=https://gallinaapp.onrender.com/api
```

📖 **Guía completa**: Ver [RENDER_DEPLOY.md](RENDER_DEPLOY.md)

### Otras Opciones de Despliegue

- **Railway**: Ver [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
- **AWS/DigitalOcean**: Ver [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)

## 📝 Licencia

MIT License - GallinaApp 2025

## 👥 Soporte

Para preguntas o soporte, contactar a: soporte@gallinaapp.com
