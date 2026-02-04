// Importar modelos
const Granja = require('./Granja');
const Galpon = require('./Galpon');
const Usuario = require('./Usuario');
const LoteAlimento = require('./LoteAlimento');
const InventarioAlimento = require('./InventarioAlimento');
const RegistroDiario = require('./RegistroDiario');
const Alerta = require('./Alerta');
const ActividadProgramada = require('./ActividadProgramada');
const Bodega = require('./Bodega');
const ConsumoGas = require('./ConsumoGas');
const Tamo = require('./Tamo');
const Desacose = require('./Desacose');
const StockLoteBodega = require('./StockLoteBodega');

// ============================================
// RELACIONES ENTRE MODELOS
// ============================================

// Granja -> Galpones (1:N)
Granja.hasMany(Galpon, {
  foreignKey: 'granja_id',
  as: 'galpones',
  onDelete: 'CASCADE'
});
Galpon.belongsTo(Granja, {
  foreignKey: 'granja_id',
  as: 'granja'
});

// Granja -> Usuarios (1:N)
Granja.hasMany(Usuario, {
  foreignKey: 'granja_id',
  as: 'usuarios',
  onDelete: 'SET NULL'
});
Usuario.belongsTo(Granja, {
  foreignKey: 'granja_id',
  as: 'granja'
});

// Galpon -> Registros Diarios (1:N)
Galpon.hasMany(RegistroDiario, {
  foreignKey: 'galpon_id',
  as: 'registros',
  onDelete: 'CASCADE'
});
RegistroDiario.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});

// Galpon -> Inventario Alimento (1:N)
Galpon.hasMany(InventarioAlimento, {
  foreignKey: 'galpon_id',
  as: 'movimientos_inventario',
  onDelete: 'SET NULL'
});
InventarioAlimento.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});

// Galpon -> Alertas (1:N)
Galpon.hasMany(Alerta, {
  foreignKey: 'galpon_id',
  as: 'alertas',
  onDelete: 'CASCADE'
});
Alerta.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});

// LoteAlimento -> Inventario Alimento (1:N)
LoteAlimento.hasMany(InventarioAlimento, {
  foreignKey: 'lote_id',
  as: 'movimientos',
  onDelete: 'CASCADE'
});
InventarioAlimento.belongsTo(LoteAlimento, {
  foreignKey: 'lote_id',
  as: 'lote'
});

// LoteAlimento -> Alertas (1:N)
LoteAlimento.hasMany(Alerta, {
  foreignKey: 'lote_id',
  as: 'alertas',
  onDelete: 'CASCADE'
});
Alerta.belongsTo(LoteAlimento, {
  foreignKey: 'lote_id',
  as: 'lote'
});

// Usuario -> Alertas (1:N - atendida_por)
Usuario.hasMany(Alerta, {
  foreignKey: 'atendida_por',
  as: 'alertas_atendidas',
  onDelete: 'SET NULL'
});
Alerta.belongsTo(Usuario, {
  foreignKey: 'atendida_por',
  as: 'atendido_por_usuario'
});

// Galpon -> Actividades Programadas (1:N)
Galpon.hasMany(ActividadProgramada, {
  foreignKey: 'galpon_id',
  as: 'actividades',
  onDelete: 'SET NULL'
});
ActividadProgramada.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});

// Galpon -> Galpon (Self-referential for divisions)
Galpon.hasMany(Galpon, {
  foreignKey: 'galpon_padre_id',
  as: 'divisiones',
  onDelete: 'SET NULL'
});
Galpon.belongsTo(Galpon, {
  foreignKey: 'galpon_padre_id',
  as: 'galpon_padre'
});

// Granja -> Bodegas (1:N)
Granja.hasMany(Bodega, {
  foreignKey: 'granja_id',
  as: 'bodegas',
  onDelete: 'CASCADE'
});
Bodega.belongsTo(Granja, {
  foreignKey: 'granja_id',
  as: 'granja'
});

// Bodega -> Lotes Alimento (1:N)
Bodega.hasMany(LoteAlimento, {
  foreignKey: 'bodega_id',
  as: 'lotes',
  onDelete: 'SET NULL'
});
LoteAlimento.belongsTo(Bodega, {
  foreignKey: 'bodega_id',
  as: 'bodega'
});

// Bodega -> Inventario Alimento (1:N) (bodega simple)
Bodega.hasMany(InventarioAlimento, {
  foreignKey: 'bodega_id',
  as: 'movimientos',
  onDelete: 'SET NULL'
});
InventarioAlimento.belongsTo(Bodega, {
  foreignKey: 'bodega_id',
  as: 'bodega'
});

// Bodega -> Inventario Alimento (origen/destino para traslados)
Bodega.hasMany(InventarioAlimento, {
  foreignKey: 'bodega_origen_id',
  as: 'movimientos_salida_bodega',
  onDelete: 'SET NULL'
});
InventarioAlimento.belongsTo(Bodega, {
  foreignKey: 'bodega_origen_id',
  as: 'bodega_origen'
});

Bodega.hasMany(InventarioAlimento, {
  foreignKey: 'bodega_destino_id',
  as: 'movimientos_entrada_bodega',
  onDelete: 'SET NULL'
});
InventarioAlimento.belongsTo(Bodega, {
  foreignKey: 'bodega_destino_id',
  as: 'bodega_destino'
});

// Lote <-> StockLoteBodega (1:N)
LoteAlimento.hasMany(StockLoteBodega, {
  foreignKey: 'lote_id',
  as: 'stocks',
  onDelete: 'CASCADE'
});
StockLoteBodega.belongsTo(LoteAlimento, {
  foreignKey: 'lote_id',
  as: 'lote'
});

// Bodega <-> StockLoteBodega (1:N)
Bodega.hasMany(StockLoteBodega, {
  foreignKey: 'bodega_id',
  as: 'stocks',
  onDelete: 'CASCADE'
});
StockLoteBodega.belongsTo(Bodega, {
  foreignKey: 'bodega_id',
  as: 'bodega'
});

// Bodega <-> Galpon (1:N) para consumo de alimento
Bodega.hasMany(Galpon, {
  foreignKey: 'bodega_id',
  as: 'galpones',
  onDelete: 'SET NULL'
});
Galpon.belongsTo(Bodega, {
  foreignKey: 'bodega_id',
  as: 'bodega'
});

// Galpon -> Consumo Gas (1:N)
Galpon.hasMany(ConsumoGas, {
  foreignKey: 'galpon_id',
  as: 'consumos_gas',
  onDelete: 'CASCADE'
});
ConsumoGas.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});
ConsumoGas.belongsTo(Usuario, {
  foreignKey: 'creado_por',
  as: 'creado_por_usuario'
});

// Galpon -> Tamo (1:N)
Galpon.hasMany(Tamo, {
  foreignKey: 'galpon_id',
  as: 'tamos',
  onDelete: 'CASCADE'
});
Tamo.belongsTo(Galpon, {
  foreignKey: 'galpon_id',
  as: 'galpon'
});
Tamo.belongsTo(Usuario, {
  foreignKey: 'aplicado_por',
  as: 'aplicado_por_usuario'
});

// Galpon -> Desacose (origen) (1:N)
Galpon.hasMany(Desacose, {
  foreignKey: 'galpon_origen_id',
  as: 'movimientos_salida',
  onDelete: 'CASCADE'
});
Desacose.belongsTo(Galpon, {
  foreignKey: 'galpon_origen_id',
  as: 'galpon_origen'
});

// Galpon -> Desacose (destino) (1:N)
Galpon.hasMany(Desacose, {
  foreignKey: 'galpon_destino_id',
  as: 'movimientos_entrada',
  onDelete: 'CASCADE'
});
Desacose.belongsTo(Galpon, {
  foreignKey: 'galpon_destino_id',
  as: 'galpon_destino'
});
Desacose.belongsTo(Usuario, {
  foreignKey: 'realizado_por',
  as: 'realizado_por_usuario'
});

// Exportar todos los modelos
module.exports = {
  Granja,
  Galpon,
  Usuario,
  LoteAlimento,
  InventarioAlimento,
  RegistroDiario,
  Alerta,
  ActividadProgramada,
  Bodega,
  ConsumoGas,
  Tamo,
  Desacose,
  StockLoteBodega
};
