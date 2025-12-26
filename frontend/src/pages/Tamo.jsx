import React, { useState, useEffect } from 'react';
import { tamoService, galponesService } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaLayerGroup } from 'react-icons/fa';

const Tamo = () => {
  const [tamos, setTamos] = useState([]);
  const [galpones, setGalpones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroGalpon, setFiltroGalpon] = useState('');

  const [formulario, setFormulario] = useState({
    galpon_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_material: '',
    cantidad_kg: '',
    espanol_cm: '',
    calidad: 'buena',
    humedad_percent: '',
    observaciones: ''
  });

  const tiposMaterial = ['viruta', 'cascarilla', 'paja', 'aserrín', 'otro'];

  useEffect(() => {
    cargarDatos();
  }, [filtroGalpon]);

  const cargarDatos = async () => {
    try {
      const [tamosRes, galponesRes] = await Promise.all([
        tamoService.listar(filtroGalpon ? { galpon_id: filtroGalpon } : {}),
        galponesService.listar({ activo: true })
      ]);
      setTamos(tamosRes.data.tamos || []);
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
      galpon_id: filtroGalpon || '',
      fecha: new Date().toISOString().split('T')[0],
      tipo_material: '',
      cantidad_kg: '',
      espanol_cm: '',
      calidad: 'buena',
      humedad_percent: '',
      observaciones: ''
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.galpon_id || !formulario.fecha || !formulario.tipo_material || !formulario.cantidad_kg) {
      toast.error('Galpón, fecha, tipo de material y cantidad son requeridos');
      return;
    }

    try {
      await tamoService.crear(formulario);
      toast.success('Registro de tamo creado exitosamente');
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear registro');
    }
  };

  const tamosFiltrados = filtroGalpon
    ? tamos.filter(t => t.galpon_id === parseInt(filtroGalpon))
    : tamos;

  const calidadColor = (calidad) => {
    switch (calidad) {
      case 'excelente': return 'badge-success';
      case 'buena': return 'badge-info';
      case 'regular': return 'badge-warning';
      case 'mala': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1><FaLayerGroup style={{ marginRight: '8px' }} />Tamo (Cama)</h1>
            <p>Registro de aplicación de material de cama</p>
          </div>
          <button onClick={abrirModal} className="btn btn-primary">
            <FaPlus style={{ marginRight: '8px' }} />
            Nuevo Registro
          </button>
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
                <th>Galpón</th>
                <th>Tipo Material</th>
                <th>Cantidad (kg)</th>
                <th>Espesor (cm)</th>
                <th>Calidad</th>
                <th>Humedad (%)</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {tamosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No hay registros de tamo</td>
                </tr>
              ) : (
                tamosFiltrados.map((tamo) => (
                  <tr key={tamo.id}>
                    <td>{new Date(tamo.fecha).toLocaleDateString('es-ES')}</td>
                    <td>Galpón {tamo.galpon?.numero}</td>
                    <td><span className="badge badge-info">{tamo.tipo_material}</span></td>
                    <td>{parseFloat(tamo.cantidad_kg).toFixed(2)}</td>
                    <td>{tamo.espanol_cm ? `${tamo.espanol_cm} cm` : '-'}</td>
                    <td>
                      <span className={`badge ${calidadColor(tamo.calidad)}`}>
                        {tamo.calidad}
                      </span>
                    </td>
                    <td>{tamo.humedad_percent ? `${tamo.humedad_percent}%` : '-'}</td>
                    <td>{tamo.observaciones || '-'}</td>
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
              <h3 className="modal-title">Nuevo Registro de Tamo</h3>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Galpón *</label>
                  <select
                    className="form-control"
                    name="galpon_id"
                    value={formulario.galpon_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un galpón</option>
                    {galpones.map(g => (
                      <option key={g.id} value={g.id}>
                        Galpón {g.numero} - {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

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
                  <label className="form-label">Tipo de Material *</label>
                  <select
                    className="form-control"
                    name="tipo_material"
                    value={formulario.tipo_material}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione tipo</option>
                    {tiposMaterial.map(tipo => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Cantidad (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="cantidad_kg"
                      value={formulario.cantidad_kg}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Espesor (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      name="espanol_cm"
                      value={formulario.espanol_cm}
                      onChange={handleChange}
                      min="0"
                      placeholder="Espesor del tamo"
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Calidad</label>
                    <select
                      className="form-control"
                      name="calidad"
                      value={formulario.calidad}
                      onChange={handleChange}
                    >
                      <option value="excelente">Excelente</option>
                      <option value="buena">Buena</option>
                      <option value="regular">Regular</option>
                      <option value="mala">Mala</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Humedad (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      name="humedad_percent"
                      value={formulario.humedad_percent}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="0-100"
                    />
                  </div>
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tamo;

