# 🐔 Nuevas Funcionalidades - GallinaApp

## Resumen de Implementación

Este documento describe las nuevas funcionalidades implementadas en GallinaApp.

## ✅ Funcionalidades Implementadas

### 1. **Bodegas (Warehouses)**
- Sistema de múltiples bodegas por granja
- Inventario asociado a bodegas específicas
- Cada bodega puede tener su propio inventario de lotes de alimento

**Archivos creados:**
- `database/migrations/005_add_bodegas_and_refactor_inventory.sql`
- `backend/src/models/Bodega.js`
- `backend/src/controllers/bodegasController.js`
- `backend/src/routes/bodegas.routes.js`

**Endpoints:**
- `GET /api/bodegas` - Listar bodegas
- `GET /api/bodegas/:id` - Obtener bodega
- `POST /api/bodegas` - Crear bodega (supervisor/dueno)
- `PUT /api/bodegas/:id` - Actualizar bodega (supervisor/dueno)

### 2. **División de Galpones**
- Botón para dividir un galpón en dos mitades (A y B)
- Galpón 7 → Galpón 7-A y Galpón 7-B
- División automática de aves (50/50)
- Preserva historial y datos del galpón original

**Archivos modificados:**
- `database/migrations/006_add_galpon_division.sql`
- `backend/src/models/Galpon.js` (campos: `galpon_padre_id`, `division_sufijo`, `es_division`)
- `backend/src/controllers/galponesController.js` (función `dividirGalpon`)
- `backend/src/routes/galpones.routes.js` (ruta POST `/api/galpones/:id/dividir`)

**Endpoint:**
- `POST /api/galpones/:id/dividir` - Dividir galpón (supervisor/dueno)

### 3. **Consumo de Gas**
- Registro de consumo de gas por galpón
- Imágenes del medidor en día 1 y día 22
- Seguimiento de lectura del medidor y consumo en m³

**Archivos creados:**
- `database/migrations/007_add_gas_consumption.sql`
- `backend/src/models/ConsumoGas.js`
- `backend/src/controllers/gasController.js`
- `backend/src/routes/gas.routes.js`

**Endpoints:**
- `GET /api/gas` - Listar consumos
- `GET /api/gas/:id` - Obtener consumo
- `POST /api/gas` - Crear registro
- `PUT /api/gas/:id` - Actualizar registro

**Campos:**
- `galpon_id`, `fecha`, `edad_dias`
- `lectura_medidor`, `consumo_m3`
- `imagen_url` (para subir imagen del medidor)
- `observaciones`

### 4. **Tamo (Cama/Bedding)**
- Registro de aplicación de material de cama
- Tipos: viruta, cascarilla, paja, etc.
- Control de calidad y humedad
- Espesor del tamo

**Archivos creados:**
- `database/migrations/008_add_tamo_bedding.sql`
- `backend/src/models/Tamo.js`
- `backend/src/controllers/tamoController.js`
- `backend/src/routes/tamo.routes.js`

**Endpoints:**
- `GET /api/tamo` - Listar registros
- `GET /api/tamo/:id` - Obtener registro
- `POST /api/tamo` - Crear registro
- `PUT /api/tamo/:id` - Actualizar registro

**Campos:**
- `galpon_id`, `fecha`, `tipo_material`
- `cantidad_kg`, `espanol_cm` (espesor)
- `calidad` (excelente, buena, regular, mala)
- `humedad_percent`

### 5. **Desacose (Movimiento de Animales)**
- Registro de movimientos de aves entre galpones
- Actualización automática de saldos
- Historial completo de movimientos

**Archivos creados:**
- `database/migrations/009_add_desacose_movements.sql`
- `backend/src/models/Desacose.js`
- `backend/src/controllers/desacoseController.js`
- `backend/src/routes/desacose.routes.js`

**Endpoints:**
- `GET /api/desacose` - Listar movimientos
- `GET /api/desacose/:id` - Obtener movimiento
- `POST /api/desacose` - Crear movimiento (supervisor/dueno)

**Campos:**
- `galpon_origen_id`, `galpon_destino_id`
- `fecha`, `cantidad_aves`
- `motivo`, `observaciones`

## 📋 Pasos para Completar la Implementación

### 1. Ejecutar Migraciones de Base de Datos

Ejecuta las migraciones en orden:

```bash
# Desde el directorio del proyecto
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/005_add_bodegas_and_refactor_inventory.sql
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/006_add_galpon_division.sql
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/007_add_gas_consumption.sql
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/008_add_tamo_bedding.sql
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/009_add_desacose_movements.sql
```

O usando el script de migración:
```bash
cd backend
node migrate.js
```

### 2. Actualizar Frontend - Servicios API

Agregar servicios en `frontend/src/services/api.js`:

```javascript
// Bodegas
bodegas: {
  listar: (params) => api.get('/bodegas', { params }),
  obtener: (id) => api.get(`/bodegas/${id}`),
  crear: (data) => api.post('/bodegas', data),
  actualizar: (id, data) => api.put(`/bodegas/${id}`, data)
},

// Gas
gas: {
  listar: (params) => api.get('/gas', { params }),
  obtener: (id) => api.get(`/gas/${id}`),
  crear: (data) => api.post('/gas', data),
  actualizar: (id, data) => api.put(`/gas/${id}`, data)
},

// Tamo
tamo: {
  listar: (params) => api.get('/tamo', { params }),
  obtener: (id) => api.get(`/tamo/${id}`),
  crear: (data) => api.post('/tamo', data),
  actualizar: (id, data) => api.put(`/tamo/${id}`, data)
},

// Desacose
desacose: {
  listar: (params) => api.get('/desacose', { params }),
  obtener: (id) => api.get(`/desacose/${id}`),
  crear: (data) => api.post('/desacose', data)
},

// Galpones - División
galpones: {
  // ... existentes ...
  dividir: (id) => api.post(`/galpones/${id}/dividir`)
}
```

### 3. Crear Páginas Frontend

#### **Página: Bodegas** (`frontend/src/pages/Bodegas.jsx`)
- Lista de bodegas por granja
- Crear/editar bodegas
- Ver inventario por bodega
- Asignar lotes a bodegas

#### **Página: Consumo de Gas** (`frontend/src/pages/Gas.jsx`)
- Lista de consumos por galpón
- Formulario con:
  - Selección de galpón
  - Fecha y edad en días
  - Campo para subir imagen (día 1 y 22)
  - Lectura del medidor
  - Consumo en m³
- Validación: requerir imagen en día 1 y día 22
- Visualización de imágenes históricas

#### **Página: Tamo** (`frontend/src/pages/Tamo.jsx`)
- Lista de registros de tamo
- Formulario con:
  - Galpón
  - Fecha
  - Tipo de material (dropdown: viruta, cascarilla, paja, etc.)
  - Cantidad (kg)
  - Espesor (cm)
  - Calidad (dropdown)
  - Humedad (%)
  - Observaciones
- Gráficas de consumo por tipo de material
- Historial por galpón

#### **Página: Desacose** (`frontend/src/pages/Desacose.jsx`)
- Lista de movimientos
- Formulario con:
  - Galpón origen
  - Galpón destino
  - Cantidad de aves
  - Motivo
  - Observaciones
- Validación: verificar saldo disponible
- Historial por galpón (entradas y salidas)

#### **Actualizar: Galpones** (`frontend/src/pages/Galpones.jsx`)
- Agregar botón "Dividir Galpón" en cada galpón
- Modal de confirmación antes de dividir
- Mostrar divisiones existentes (si aplica)
- Indicador visual de galpones divididos

### 4. Actualizar Inventario para Bodegas

Modificar `frontend/src/pages/Inventario.jsx`:
- Agregar selector de bodega
- Filtrar lotes por bodega
- Mostrar bodega en lista de lotes
- Asignar bodega al crear lote

### 5. Actualizar Navegación

Agregar rutas en `frontend/src/App.jsx`:

```javascript
<Route path="/bodegas" element={<Bodegas />} />
<Route path="/gas" element={<Gas />} />
<Route path="/tamo" element={<Tamo />} />
<Route path="/desacose" element={<Desacose />} />
```

Agregar enlaces en el menú de navegación.

## 🔧 Notas Técnicas

### Imágenes de Gas
Para subir imágenes, necesitarás:
1. Configurar almacenamiento (local o cloud como AWS S3, Cloudinary)
2. Endpoint para subir imágenes
3. Guardar URL en `imagen_url` del registro de gas

### Validaciones Especiales
- **Gas**: Requerir imagen en día 1 y día 22
- **Desacose**: Verificar que hay suficientes aves en galpón origen
- **División**: No permitir dividir un galpón ya dividido

### Relaciones de Base de Datos
- `bodegas` → `granjas` (N:1)
- `lotes_alimento` → `bodegas` (N:1)
- `galpones` → `galpones` (self-referential para divisiones)
- `consumo_gas` → `galpones` (N:1)
- `tamo` → `galpones` (N:1)
- `desacose` → `galpones` (origen y destino) (N:1 cada uno)

## 📝 Próximos Pasos

1. ✅ Backend completo
2. ⏳ Ejecutar migraciones
3. ⏳ Crear páginas frontend
4. ⏳ Integrar servicios API
5. ⏳ Agregar validaciones frontend
6. ⏳ Probar todas las funcionalidades

## 🐛 Solución de Problemas

Si encuentras errores:
1. Verifica que las migraciones se ejecutaron correctamente
2. Revisa que los modelos estén exportados en `models/index.js`
3. Verifica que las rutas estén registradas en `index.js`
4. Revisa los logs del servidor para errores de base de datos

