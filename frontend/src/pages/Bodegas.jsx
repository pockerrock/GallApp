import React, { useState, useEffect } from 'react';
import { bodegasService, inventarioService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTimes, FaBoxes } from 'react-icons/fa';

const Bodegas = () => {
  const { usuario } = useAuth();
  const [bodegas, setBodegas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    ubicacion: '',
    granja_id: usuario?.granja_id || 1
  });

  useEffect(() => {
    cargarBodegas();
    cargarLotes();
  }, []);

  const cargarBodegas = async () => {
    try {
      const res = await bodegasService.listar();
      setBodegas(res.data.bodegas);
    } catch (error) {
      console.error('Error al cargar bodegas:', error);
      toast.error('Error al cargar bodegas');
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

  const puedeGestionar = () => {
    return ['supervisor', 'dueno'].includes(usuario?.rol);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setBodegaSeleccionada(null);
    setFormulario({
      nombre: '',
      ubicacion: '',
      granja_id: usuario?.granja_id || 1
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (bodega) => {
    setModoEdicion(true);
    setBodegaSeleccionada(bodega);
    setFormulario({
      nombre: bodega.nombre,
      ubicacion: bodega.ubicacion || '',
      granja_id: bodega.granja_id
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.nombre) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (modoEdicion) {
        await bodegasService.actualizar(bodegaSeleccionada.id, formulario);
        toast.success('Bodega actualizada exitosamente');
      } else {
        await bodegasService.crear(formulario);
        toast.success('Bodega creada exitosamente');
      }
      setMostrarModal(false);
      cargarBodegas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar bodega');
    }
  };

  const lotesPorBodega = (bodegaId) => {
    return lotes.filter(l => l.bodega_id === bodegaId);
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Bodegas</h1>
            <p>Gestión de bodegas e inventario</p>
          </div>
          {puedeGestionar() && (
            <button onClick={abrirModalCrear} className="btn btn-primary">
              <FaPlus style={{ marginRight: '8px' }} />
              Nueva Bodega
            </button>
          )}
        </div>
      </div>

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
                    onClick={() => abrirModalEditar(bodega)}
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
              <button onClick={abrirModalCrear} className="btn btn-primary">
                Crear Primera Bodega
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modoEdicion ? 'Editar Bodega' : 'Nueva Bodega'}
              </h3>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
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
                    value={formulario.ubicacion}
                    onChange={handleChange}
                    placeholder="Ej: Zona Norte, Edificio A"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modoEdicion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bodegas;

