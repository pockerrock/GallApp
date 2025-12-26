import React, { useState, useEffect } from 'react';
import { desacoseService, galponesService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaExchangeAlt, FaArrowRight } from 'react-icons/fa';

const Desacose = () => {
  const { usuario } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [galpones, setGalpones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroGalpon, setFiltroGalpon] = useState('');

  const [formulario, setFormulario] = useState({
    galpon_origen_id: '',
    galpon_destino_id: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad_aves: '',
    motivo: '',
    observaciones: ''
  });

  const puedeGestionar = () => {
    return ['supervisor', 'dueno'].includes(usuario?.rol);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroGalpon]);

  const cargarDatos = async () => {
    try {
      const [movimientosRes, galponesRes] = await Promise.all([
        desacoseService.listar(filtroGalpon ? { galpon_id: filtroGalpon } : {}),
        galponesService.listar({ activo: true })
      ]);
      setMovimientos(movimientosRes.data.movimientos || []);
      setGalpones(galponesRes.data.galpones || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirModal = () => {
    setFormulario({
      galpon_origen_id: filtroGalpon || '',
      galpon_destino_id: '',
      fecha: new Date().toISOString().split('T')[0],
      cantidad_aves: '',
      motivo: '',
      observaciones: ''
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.galpon_origen_id || !formulario.galpon_destino_id || !formulario.cantidad_aves) {
      toast.error('Galpón origen, destino y cantidad son requeridos');
      return;
    }

    if (formulario.galpon_origen_id === formulario.galpon_destino_id) {
      toast.error('El galpón origen y destino deben ser diferentes');
      return;
    }

    if (parseInt(formulario.cantidad_aves) <= 0) {
      toast.error('La cantidad de aves debe ser mayor a 0');
      return;
    }

    try {
      await desacoseService.crear(formulario);
      toast.success('Movimiento de desacose registrado exitosamente');
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al registrar movimiento');
    }
  };

  const movimientosFiltrados = filtroGalpon
    ? movimientos.filter(m => 
        m.galpon_origen_id === parseInt(filtroGalpon) || 
        m.galpon_destino_id === parseInt(filtroGalpon)
      )
    : movimientos;

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1><FaExchangeAlt style={{ marginRight: '8px' }} />Desacose</h1>
            <p>Movimiento de aves entre galpones</p>
          </div>
          {puedeGestionar() && (
            <button onClick={abrirModal} className="btn btn-primary">
              <FaPlus style={{ marginRight: '8px' }} />
              Nuevo Movimiento
            </button>
          )}
        </div>
      </div>

      <div className="card mb-2">
        <div className="flex gap-2">
          <select
            className="form-control"
            value={filtroGalpon}
            onChange={(e) => setFiltroGalpon(e.target.value)}
          >
            <option value="">Todos los galpones</option>
            {galpones.map(g => (
              <option key={g.id} value={g.id}>
                Galpón {g.numero} - {g.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Origen</th>
                <th></th>
                <th>Destino</th>
                <th>Cantidad</th>
                <th>Motivo</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No hay movimientos registrados</td>
                </tr>
              ) : (
                movimientosFiltrados.map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td>{new Date(movimiento.fecha).toLocaleDateString('es-ES')}</td>
                    <td>
                      <strong>Galpón {movimiento.galpon_origen?.numero}</strong>
                      {movimiento.galpon_origen?.nombre && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {movimiento.galpon_origen.nombre}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <FaArrowRight style={{ color: '#3b82f6' }} />
                    </td>
                    <td>
                      <strong>Galpón {movimiento.galpon_destino?.numero}</strong>
                      {movimiento.galpon_destino?.nombre && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {movimiento.galpon_destino.nombre}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '14px' }}>
                        {movimiento.cantidad_aves} aves
                      </span>
                    </td>
                    <td>{movimiento.motivo || '-'}</td>
                    <td>{movimiento.observaciones || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nuevo Movimiento de Desacose</h3>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Galpón Origen *</label>
                    <select
                      className="form-control"
                      name="galpon_origen_id"
                      value={formulario.galpon_origen_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione origen</option>
                      {galpones.map(g => (
                        <option key={g.id} value={g.id}>
                          Galpón {g.numero} - {g.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Galpón Destino *</label>
                    <select
                      className="form-control"
                      name="galpon_destino_id"
                      value={formulario.galpon_destino_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione destino</option>
                      {galpones
                        .filter(g => g.id !== parseInt(formulario.galpon_origen_id))
                        .map(g => (
                          <option key={g.id} value={g.id}>
                            Galpón {g.numero} - {g.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha"
                      value={formulario.fecha}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cantidad de Aves *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="cantidad_aves"
                      value={formulario.cantidad_aves}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo</label>
                  <input
                    type="text"
                    className="form-control"
                    name="motivo"
                    value={formulario.motivo}
                    onChange={handleChange}
                    placeholder="Ej: Redistribución, Sobrepoblación"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    name="observaciones"
                    value={formulario.observaciones}
                    onChange={handleChange}
                    rows="3"
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
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Desacose;

