# 📡 Documentación de API - GallinaApp

Base URL: `http://localhost:3000/api`

## 🔐 Autenticación

Todas las rutas (excepto login y register) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

### POST /login
Iniciar sesión

**Body:**
```json
{
  "email": "dueno@elolimp.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGc...",
  "usuario": {
    "id": 1,
    "nombre": "Carlos Mendoza",
    "email": "dueno@elolimp.com",
    "rol": "dueno"
  }
}
```

### POST /register
Registrar nuevo usuario

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@granja.com",
  "password": "password123",
  "rol": "trabajador",
  "granja_id": 1
}
```

### GET /profile
Obtener perfil del usuario autenticado

## 🏠 Galpones

### GET /galpones
Listar galpones

**Query params:**
- `granja_id`: Filtrar por granja
- `activo`: true/false

**Response:**
```json
{
  "total": 5,
  "galpones": [
    {
      "id": 1,
      "numero": 7,
      "nombre": "Galpón 7",
      "lote": "63",
      "sexo": "M",
      "capacidad": 5000,
      "aves_iniciales": 5000,
      "fecha_inicio": "2024-10-26",
      "activo": true
    }
  ]
}
```

### GET /galpones/:id
Obtener galpón por ID

### GET /galpones/:id/resumen
Obtener resumen con estadísticas del galpón

**Response:**
```json
{
  "galpon": {...},
  "estadisticas": {
    "dias_transcurridos": 17,
    "edad_actual": 17,
    "saldo_actual": 4938,
    "mortalidad_total": 62,
    "porcentaje_mortalidad": 1.24,
    "consumo_total_kg": 3165.00,
    "peso_promedio_actual_g": 329.00,
    "fcr": 1.95
  }
}
```

### POST /galpones
Crear nuevo galpón (requiere rol: supervisor o dueño)

**Body:**
```json
{
  "granja_id": 1,
  "numero": 10,
  "nombre": "Galpón 10",
  "sexo": "M",
  "lote": "66",
  "capacidad": 5000,
  "aves_iniciales": 5000,
  "fecha_inicio": "2024-11-15"
}
```

## 📝 Registros Diarios

### GET /registros
Listar registros

**Query params:**
- `galpon_id`: Filtrar por galpón
- `fecha_inicio`: YYYY-MM-DD
- `fecha_fin`: YYYY-MM-DD
- `limit`: Cantidad de registros (default: 50)
- `offset`: Paginación (default: 0)

### POST /registros
Crear registro diario

**Body:**
```json
{
  "galpon_id": 1,
  "fecha": "2024-11-12",
  "edad_dias": 18,
  "consumo_kg": 360.00,
  "tipo_alimento": "pollito",
  "lote_alimento": "POL-2024-003",
  "mortalidad": 3,
  "seleccion": 0,
  "saldo_aves": 4935,
  "peso_promedio": 355.0,
  "observaciones": "Todo normal"
}
```

### POST /registros/sincronizar
Sincronizar registros offline

**Body:**
```json
{
  "registros": [
    {...},
    {...}
  ]
}
```

## 📦 Inventario

### GET /inventario
Obtener estado del inventario

**Response:**
```json
{
  "total_tipos": 5,
  "inventario": [
    {
      "tipo": "preiniciador",
      "cantidad_total": 1500.00,
      "lotes": [
        {
          "id": 1,
          "codigo_lote": "PRE-2024-001",
          "cantidad_inicial": 2000.00,
          "cantidad_actual": 1500.00,
          "porcentaje_disponible": 75.00
        }
      ]
    }
  ]
}
```

### GET /inventario/movimientos
Listar movimientos de inventario

### POST /inventario/movimiento
Registrar entrada o salida de alimento

**Body:**
```json
{
  "lote_id": 1,
  "tipo_movimiento": "salida",
  "cantidad": 50.00,
  "galpon_id": 1,
  "fecha": "2024-11-12",
  "observaciones": "Consumo diario"
}
```

### GET /lotes
Listar lotes de alimento

### POST /lotes
Crear nuevo lote de alimento

## 🚨 Alertas

### GET /alertas
Listar alertas

**Query params:**
- `atendida`: true/false
- `severidad`: baja/media/alta
- `tipo`: mortalidad_alta, stock_bajo, etc.
- `galpon_id`: Filtrar por galpón

### POST /alertas
Crear nueva alerta (requiere rol: supervisor o dueño)

### PUT /alertas/:id/resolver
Resolver alerta

## 📊 Dashboard

### GET /dashboard/kpis
Obtener KPIs generales

**Query params:**
- `granja_id`: Filtrar por granja
- `galpon_id`: Filtrar por galpón

**Response:**
```json
{
  "kpis": {
    "galpones_activos": 5,
    "aves_iniciales_totales": 21200,
    "saldo_actual_total": 20845,
    "mortalidad_total": 355,
    "porcentaje_mortalidad": 1.67,
    "consumo_total_kg": 12456.50,
    "peso_promedio_global_g": 287.32,
    "fcr": 2.15,
    "alertas_activas": 3,
    "inventario_total_kg": 8745.00,
    "lotes_stock_bajo": 2
  }
}
```

### GET /dashboard/graficas
Obtener datos para gráficas de un galpón

**Query params (required):**
- `galpon_id`: ID del galpón

**Response:**
```json
{
  "galpon": {...},
  "graficas": {
    "mortalidad_vs_edad": [...],
    "peso_vs_edad": [...],
    "consumo_vs_edad": [...],
    "saldo_aves": [...]
  }
}
```

### GET /dashboard/resumen-granjas
Obtener resumen de todas las granjas

## ⚠️ Códigos de Error

- `400` - Bad Request (datos inválidos)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (sin permisos)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (conflicto, ej: registro duplicado)
- `500` - Internal Server Error

**Formato de error:**
```json
{
  "error": "Descripción del error",
  "detalles": [...]
}
```

## 🔑 Roles y Permisos

### Trabajador
- Ver galpones de su granja
- Crear y editar registros diarios
- Ver inventario
- Ver alertas

### Supervisor
- Todo lo del trabajador
- Crear galpones
- Gestionar inventario
- Crear alertas
- Eliminar registros

### Dueño
- Todo lo del supervisor
- Acceso a todas las granjas
- Eliminar galpones
- Gestionar usuarios
- Dashboard completo
