import React, { useState, useEffect } from 'react';
import { inventarioService, bodegasService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaArrowDown, FaArrowUp, FaTimes, FaFileExcel, FaBoxes, FaEdit, FaWarehouse, FaClipboardList } from 'react-icons/fa';

const Inventario = () => {
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState('inventario'); // 'inventario' | 'bodegas'
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Modales
  const [mostrarModalLote, setMostrarModalLote] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);

  // Estados para Bodegas
  const [mostrarModalBodega, setMostrarModalBodega] = useState(false);
  const [modoEdicionBodega, setModoEdicionBodega] = useState(false);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);
  const [formularioBodega, setFormularioBodega] = useState({
    nombre: '',
    ubicacion: '',
    granja_id: usuario?.granja_id || 1
  });

  // Formulario Lote
  const [formularioLote, setFormularioLote] = useState({
    tipo: 'iniciador',
    codigo_lote: '',
    cantidad_kg: '',
    proveedor: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    bodega_id: ''
  });

  // Estado para bodegas
  const [bodegas, setBodegas] = useState([]);

  // Formulario Movimiento
  const [formularioMovimiento, setFormularioMovimiento] = useState({
    lote_id: '',
    tipo_movimiento: 'entrada',
    cantidad_kg: '',
    descripcion: ''
  });

  // Estado para lotes disponibles
  const [lotes, setLotes] = useState([]);

  useEffect(() => {
    cargarInventario();
    cargarLotes();
    cargarBodegas();
  }, []);

  const cargarBodegas = async () => {
    try {
      const res = await bodegasService.listar();
      setBodegas(res.data.bodegas || []);
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
    }
  };

  const cargarInventario = async () => {
    try {
      const res = await inventarioService.obtener();
      setInventario(res.data.inventario);
    } catch (error) {
      toast.error('Error al cargar inventario');
    } finally {
      setCargando(false);
    }
  };

  const cargarLotes = async () => {
    try {
      const res = await inventarioService.lotes();
      setLotes(res.data.lotes || []);
    } catch (error) {
      console.error('Error al cargar lotes:', error);
    }
  };

  // Verificar si el usuario puede gestionar inventario (supervisor o dueño)
  const puedeGestionar = () => {
    return ['supervisor', 'dueno'].includes(usuario?.rol);
  };

  // Handlers para Lote
  const handleChangeLote = (e) => {
    const { name, value } = e.target;
    setFormularioLote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();

    setGuardando(true);

    try {
      // Parsear y validar datos
      const cantidadKg = parseFloat(formularioLote.cantidad_kg);

      if (!formularioLote.codigo_lote || formularioLote.codigo_lote.trim() === '') {
        toast.error('El código de lote es requerido');
        setGuardando(false);
        return;
      }

      if (isNaN(cantidadKg) || cantidadKg <= 0) {
        toast.error('La cantidad debe ser un número mayor a 0');
        setGuardando(false);
        return;
      }

      const datos = {
        tipo: formularioLote.tipo,
        codigo_lote: formularioLote.codigo_lote.trim(),
        cantidad_inicial: cantidadKg,
        proveedor: formularioLote.proveedor.trim(),
        fecha_ingreso: formularioLote.fecha_ingreso,
        bodega_id: formularioLote.bodega_id || null
      };

      await inventarioService.crearLote(datos);
      toast.success('Lote creado exitosamente');
      setMostrarModalLote(false);

      // Resetear formulario
      setFormularioLote({
        tipo: 'iniciador',
        codigo_lote: '',
        cantidad_kg: '',
        proveedor: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        bodega_id: ''
      });

      // Recargar datos
      cargarInventario();
      cargarLotes();
    } catch (error) {
      console.error('Error al crear lote:', error);
      toast.error(error.response?.data?.error || 'Error al crear lote');
    } finally {
      setGuardando(false);
    }
  };

  // Handlers para Movimiento
  const handleChangeMovimiento = (e) => {
    const { name, value } = e.target;
    setFormularioMovimiento(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();

    setGuardando(true);

    try {
      // Parsear y validar datos
      const loteId = parseInt(formularioMovimiento.lote_id);
      const cantidadKg = parseFloat(formularioMovimiento.cantidad_kg);

      if (isNaN(loteId) || loteId <= 0) {
        toast.error('Debe seleccionar un lote válido');
        setGuardando(false);
        return;
      }

      if (isNaN(cantidadKg) || cantidadKg <= 0) {
        toast.error('La cantidad debe ser un número mayor a 0');
        setGuardando(false);
        return;
      }

      const datos = {
        lote_id: loteId,
        tipo_movimiento: formularioMovimiento.tipo_movimiento,
        cantidad: cantidadKg,
        observaciones: formularioMovimiento.descripcion || ''
      };

      await inventarioService.registrarMovimiento(datos);
      toast.success('Movimiento registrado exitosamente');
      setMostrarModalMovimiento(false);

      // Resetear formulario
      setFormularioMovimiento({
        lote_id: '',
        tipo_movimiento: 'entrada',
        cantidad_kg: '',
        descripcion: ''
      });

      // Recargar inventario
      cargarInventario();
      cargarLotes();
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      toast.error(error.response?.data?.error || 'Error al registrar movimiento');
    } finally {
      setGuardando(false);
    }
  };

  // Handlers para Bodega
  const handleChangeBodega = (e) => {
    const { name, value } = e.target;
    setFormularioBodega(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirModalCrearBodega = () => {
    setModoEdicionBodega(false);
    setBodegaSeleccionada(null);
    setFormularioBodega({
      nombre: '',
      ubicacion: '',
      granja_id: usuario?.granja_id || 1
    });
    setMostrarModalBodega(true);
  };

  const abrirModalEditarBodega = (bodega) => {
    setModoEdicionBodega(true);
    setBodegaSeleccionada(bodega);
    setFormularioBodega({
      nombre: bodega.nombre,
      ubicacion: bodega.ubicacion || '',
      granja_id: bodega.granja_id
    });
    setMostrarModalBodega(true);
  };

  const handleSubmitBodega = async (e) => {
    e.preventDefault();

    if (!formularioBodega.nombre) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (modoEdicionBodega) {
        await bodegasService.actualizar(bodegaSeleccionada.id, formularioBodega);
        toast.success('Bodega actualizada exitosamente');
      } else {
        await bodegasService.crear(formularioBodega);
        toast.success('Bodega creada exitosamente');
      }
      setMostrarModalBodega(false);
      cargarBodegas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar bodega');
    }
  };

  const lotesPorBodega = (bodegaId) => {
    return lotes.filter(l => l.bodega_id === bodegaId);
  };

  const exportarExcel = () => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reportes/inventario-excel`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventario-alimento.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte Excel descargado');
      })
      .catch(error => {
        console.error('Error al descargar Excel:', error);
        toast.error('Error al descargar el reporte Excel');
      });
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Control de Inventario</h1>
            <p>Gestión de alimentos y bodegas</p>
          </div>

          <div className="flex gap-2">
            <button
              className={`btn ${activeTab === 'inventario' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('inventario')}
            >
              <FaClipboardList style={{ marginRight: '8px' }} />
              Inventario
            </button>
            <button
              className={`btn ${activeTab === 'bodegas' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('bodegas')}
            >
              <FaBoxes style={{ marginRight: '8px' }} />
              Bodegas
            </button>
          </div>
        </div>
      </div>

      <div className="toolbar flex-between" style={{ marginBottom: '24px', backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="flex gap-2">
          {/* Filtros podrían ir aquí */}
          <h3 style={{ margin: 0, color: '#374151' }}>
            {activeTab === 'inventario' ? 'Stock de Alimentos' : 'Lista de Bodegas'}
          </h3>
        </div>
        <div className="flex gap-2">
          {activeTab === 'inventario' ? (
            <>
              <button onClick={exportarExcel} className="btn btn-outline btn-sm" title="Exportar a Excel">
                <FaFileExcel style={{ marginRight: '8px', color: '#16a34a' }} />
                Excel
              </button>
              {puedeGestionar() && (
                <button onClick={() => setMostrarModalLote(true)} className="btn btn-secondary btn-sm">
                  <FaPlus style={{ marginRight: '8px' }} />
                  Nuevo Lote
                </button>
              )}
              <button onClick={() => setMostrarModalMovimiento(true)} className="btn btn-primary btn-sm">
                <FaArrowDown style={{ marginRight: '8px' }} />
                Movimiento
              </button>
            </>
          ) : (
            <>
              {puedeGestionar() && (
                <button onClick={abrirModalCrearBodega} className="btn btn-primary btn-sm">
                  <FaPlus style={{ marginRight: '8px' }} />
                  Nueva Bodega
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {activeTab === 'inventario' && (
        <div className="grid grid-2">
          {inventario.length === 0 ? (
            <div className="card">
              <p className="text-center">No hay inventario disponible</p>
            </div>
          ) : (
            inventario.map((item, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ textTransform: 'capitalize' }}>{item.tipo}</h3>
                </div>
                <div className="stats-list">
                  <div className="stat-item">
                    <span className="stat-label">Cantidad Total:</span>
                    <span className="stat-value">{parseFloat(item.cantidad_total).toFixed(2)} kg</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Lotes:</span>
                    <span className="stat-value">{item.lotes.length}</span>
                  </div>
                </div>

                <table className="table" style={{ marginTop: '16px' }}>
                  <thead>
                    <tr>
                      <th>Código Lote</th>
                      <th>Bodega</th>
                      <th>Disponible</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.lotes.map((lote) => (
                      <tr key={lote.id}>
                        <td><strong>{lote.codigo_lote}</strong></td>
                        <td>
                          {lote.bodega ? (
                            <span className="badge badge-info">{lote.bodega.nombre}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Sin asignar</span>
                          )}
                        </td>
                        <td>{parseFloat(lote.cantidad_actual).toFixed(2)} kg</td>
                        <td>
                          <span className={`badge ${lote.porcentaje_disponible < 30 ? 'badge-danger' :
                            lote.porcentaje_disponible < 50 ? 'badge-warning' : 'badge-success'
                            }`}>
                            {lote.porcentaje_disponible}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bodegas' && (
        <>
          <div className="grid grid-3">
            {bodegas.map((bodega) => {
              const lotesBodega = lotesPorBodega(bodega.id);
              const stockTotal = lotesBodega.reduce((sum, l) => sum + parseFloat(l.cantidad_actual || 0), 0);

              return (
                <div key={bodega.id} className="card">
                  <div className="card-header flex-between">
                    <h3 className="card-title">
                      <FaBoxes style={{ marginRight: '8px' }} />
                      {bodega.nombre}
                    </h3>
                    {puedeGestionar() && (
                      <button
                        onClick={() => abrirModalEditarBodega(bodega)}
                        className="btn btn-sm btn-outline"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </div>
                  <div className="card-body">
                    <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                      {bodega.ubicacion || 'Sin ubicación'}
                    </p>
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        Lotes en bodega: <strong>{lotesBodega.length}</strong>
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        Stock total: <strong>{stockTotal.toFixed(2)} kg</strong>
                      </p>
                    </div>
                    {lotesBodega.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                          Lotes:
                        </p>
                        {lotesBodega.slice(0, 3).map(lote => (
                          <div key={lote.id} style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                            {lote.codigo_lote} - {lote.cantidad_actual} kg
                          </div>
                        ))}
                        {lotesBodega.length > 3 && (
                          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            +{lotesBodega.length - 3} más
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {bodegas.length === 0 && (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FaBoxes style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
                <p style={{ color: '#6b7280', marginBottom: '8px' }}>No hay bodegas registradas</p>
                {puedeGestionar() && (
                  <button onClick={abrirModalCrearBodega} className="btn btn-primary">
                    Crear Primera Bodega
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Crear Lote */}
      {mostrarModalLote && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Lote de Alimento</h3>
              <button className="modal-close" onClick={() => setMostrarModalLote(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitLote}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de Alimento *</label>
                  <select
                    name="tipo"
                    className="form-control"
                    value={formularioLote.tipo}
                    onChange={handleChangeLote}
                    required
                  >
                    <option value="iniciador">Iniciador</option>
                    <option value="crecimiento">Crecimiento</option>
                    <option value="engorde">Engorde</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Lote *</label>
                  <input
                    type="text"
                    name="codigo_lote"
                    className="form-control"
                    value={formularioLote.codigo_lote}
                    onChange={handleChangeLote}
                    placeholder="Ej: LOT-2024-001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad (kg) *</label>
                  <input
                    type="number"
                    name="cantidad_kg"
                    className="form-control"
                    value={formularioLote.cantidad_kg}
                    onChange={handleChangeLote}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Proveedor</label>
                  <input
                    type="text"
                    name="proveedor"
                    className="form-control"
                    value={formularioLote.proveedor}
                    onChange={handleChangeLote}
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Ingreso *</label>
                  <input
                    type="date"
                    name="fecha_ingreso"
                    className="form-control"
                    value={formularioLote.fecha_ingreso}
                    onChange={handleChangeLote}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bodega</label>
                  <select
                    name="bodega_id"
                    className="form-control"
                    value={formularioLote.bodega_id}
                    onChange={handleChangeLote}
                  >
                    <option value="">Sin asignar</option>
                    {bodegas.map(bodega => (
                      <option key={bodega.id} value={bodega.id}>
                        {bodega.nombre} {bodega.ubicacion ? `- ${bodega.ubicacion}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalLote(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Crear Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registrar Movimiento */}
      {mostrarModalMovimiento && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Registrar Movimiento de Inventario</h3>
              <button className="modal-close" onClick={() => setMostrarModalMovimiento(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitMovimiento}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lote *</label>
                  <select
                    name="lote_id"
                    className="form-control"
                    value={formularioMovimiento.lote_id}
                    onChange={handleChangeMovimiento}
                    required
                  >
                    <option value="">Seleccione un lote</option>
                    {lotes.map(lote => (
                      <option key={lote.id} value={lote.id}>
                        {lote.codigo_lote} - {lote.tipo} ({parseFloat(lote.cantidad_actual).toFixed(2)} kg disponibles)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Movimiento *</label>
                  <select
                    name="tipo_movimiento"
                    className="form-control"
                    value={formularioMovimiento.tipo_movimiento}
                    onChange={handleChangeMovimiento}
                    required
                  >
                    <option value="entrada">Entrada (Agregar stock)</option>
                    <option value="salida">Salida (Usar alimento)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad (kg) *</label>
                  <input
                    type="number"
                    name="cantidad_kg"
                    className="form-control"
                    value={formularioMovimiento.cantidad_kg}
                    onChange={handleChangeMovimiento}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    value={formularioMovimiento.descripcion}
                    onChange={handleChangeMovimiento}
                    rows="3"
                    placeholder="Ej: Alimentación galpón 1, ajuste de inventario, etc."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalMovimiento(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Crear/Editar Bodega */}
      {mostrarModalBodega && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modoEdicionBodega ? 'Editar Bodega' : 'Nueva Bodega'}
              </h3>
              <button className="modal-close" onClick={() => setMostrarModalBodega(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitBodega}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={formularioBodega.nombre}
                    onChange={handleChangeBodega}
                    required
                    placeholder="Ej: Bodega Principal"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ubicacion"
                    value={formularioBodega.ubicacion}
                    onChange={handleChangeBodega}
                    placeholder="Ej: Zona Norte, Edificio A"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalBodega(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modoEdicionBodega ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
