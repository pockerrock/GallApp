const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar modelos para establecer relaciones
require('./models');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const galponesRoutes = require('./routes/galpones.routes');
const registrosRoutes = require('./routes/registros.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const alertasRoutes = require('./routes/alertas.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportesRoutes = require('./routes/reportes.routes');
const actividadesRoutes = require('./routes/actividades.routes');
const bodegasRoutes = require('./routes/bodegas.routes');
const gasRoutes = require('./routes/gas.routes');
const tamoRoutes = require('./routes/tamo.routes');
const desacoseRoutes = require('./routes/desacose.routes');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Seguridad
app.set('trust proxy', 1); // Trust first proxy (Nginx)
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    const msg = 'La política CORS no permite el acceso desde este origen.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Compresión
app.use(compression());

// Parsear JSON con charset UTF-8
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Asegurar UTF-8 en todas las respuestas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Logging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

app.use('/api/', limiter);

// ============================================
// RUTAS
// ============================================

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de API
app.use('/api', authRoutes); // Login, register, profile
app.use('/api/galpones', galponesRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/lotes', inventarioRoutes); // Reutilizar el router de inventario
app.use('/api/alertas', alertasRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/bodegas', bodegasRoutes);
app.use('/api/gas', gasRoutes);
app.use('/api/tamo', tamoRoutes);
app.use('/api/desacose', desacoseRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    mensaje: '🐔 Bienvenido a GallinaApp API',
    version: '1.0.0',
    documentacion: '/api/docs',
    endpoints: {
      auth: '/api/login, /api/register, /api/profile',
      galpones: '/api/galpones',
      registros: '/api/registros',
      inventario: '/api/inventario',
      lotes: '/api/lotes',
      alertas: '/api/alertas',
      dashboard: '/api/dashboard/kpis, /api/dashboard/graficas',
      reportes: '/api/reportes/registros-pdf, /api/reportes/inventario-excel',
      actividades: '/api/actividades'
    }
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use(notFound);

// Manejador de errores global
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const iniciarServidor = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🐔 GallinaApp API                    ║
║   Servidor iniciado correctamente      ║
╠════════════════════════════════════════╣
║   Puerto: ${PORT.toString().padEnd(29)} ║
║   Entorno: ${(process.env.NODE_ENV || 'development').padEnd(27)} ║
║   URL: http://localhost:${PORT.toString().padEnd(16)} ║
╚════════════════════════════════════════╝
      `);

      console.log('📊 Endpoints disponibles:');
      console.log('   POST   /api/login');
      console.log('   POST   /api/register');
      console.log('   GET    /api/profile');
      console.log('   GET    /api/galpones');
      console.log('   GET    /api/registros');
      console.log('   GET    /api/inventario');
      console.log('   GET    /api/alertas');
      console.log('   GET    /api/dashboard/kpis');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar
iniciarServidor();

module.exports = app;
