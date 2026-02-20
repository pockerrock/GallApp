import React, { useState, useEffect } from 'react';
import { gasService, galponesService } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaImage, FaTimes, FaFire } from 'react-icons/fa';

const Gas = () => {
  const [consumos, setConsumos] = useState([]);
  const [galpones, setGalpones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroGalpon, setFiltroGalpon] = useState('');

  const [formulario, setFormulario] = useState({
    galpon_id: '',
    fecha: new Date().toISOString().split('T')[0],
    edad_dias: '',
    lectura_medidor: '',
    consumo_m3: '',
    imagen_url: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtroGalpon]);

  const cargarDatos = async () => {
    try {
      const [consumosRes, galponesRes] = await Promise.all([
        gasService.listar(filtroGalpon ? { galpon_id: filtroGalpon } : {}),
        galponesService.listar({ activo: true })
      ]);
      setConsumos(consumosRes.data.consumos || []);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // En producción, aquí subirías la imagen a un servidor
      // Por ahora, solo guardamos el nombre del archivo
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormulario(prev => ({
          ...prev,
          imagen_url: reader.result // En producción sería la URL del servidor
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const abrirModal = () => {
    setFormulario({
      galpon_id: filtroGalpon || '',
      fecha: new Date().toISOString().split('T')[0],
      edad_dias: '',
      lectura_medidor: '',
      consumo_m3: '',
      imagen_url: '',
      observaciones: ''
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.galpon_id || !formulario.fecha || formulario.edad_dias === '') {
      toast.error('Galpón, fecha y edad son requeridos');
      return;
    }

    // Validar imagen en día 1 y día 22
    const edad = parseInt(formulario.edad_dias);
    if ((edad === 1 || edad === 22) && !formulario.imagen_url) {
      toast.error(`Se requiere imagen del medidor en el día ${edad}`);
      return;
    }

    try {
      await gasService.crear(formulario);
      toast.success('Registro de consumo creado exitosamente');
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear registro');
    }
  };

  const consumosFiltrados = filtroGalpon
    ? consumos.filter(c => c.galpon_id === parseInt(filtroGalpon))
    : consumos;

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1><FaFire style={{ marginRight: '8px' }} />Consumo de Gas</h1>
            <p>Registro de consumo de gas por galpón</p>
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
                <th>Edad (días)</th>
                <th>Lectura Medidor</th>
                <th>Consumo (m³)</th>
                <th>Imagen</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {consumosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No hay registros de consumo</td>
                </tr>
              ) : (
                consumosFiltrados.map((consumo) => (
                  <tr key={consumo.id}>
                    <td>{new Date(consumo.fecha).toLocaleDateString('es-ES')}</td>
                    <td>Galpón {consumo.galpon?.numero}</td>
                    <td>
                      <span className={`badge ${consumo.edad_dias === 1 || consumo.edad_dias === 22 ? 'badge-warning' : 'badge-info'
                        }`}>
                        {consumo.edad_dias} días
                      </span>
                    </td>
                    <td>{consumo.lectura_medidor || '-'}</td>
                    <td>{consumo.consumo_m3 || '-'}</td>
                    <td>
                      {consumo.imagen_url ? (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                            const baseUrl = apiUrl.replace('/api', '');
                            const fotoUrl = `${baseUrl}${consumo.imagen_url}`;
                            window.open(fotoUrl, '_blank', 'noopener,noreferrer');
                          }}
                          title="Ver Medidor Gas"
                        >
                          📄 Ver Foto
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{consumo.observaciones || '-'}</td>
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
              <h3 className="modal-title">Nuevo Registro de Consumo</h3>
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
                    <label className="form-label">Edad (días) *</label>
                    <input
                      type="number"
                      className="form-control"
                      name="edad_dias"
                      value={formulario.edad_dias}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                    {(formulario.edad_dias === '1' || formulario.edad_dias === '22') && (
                      <small style={{ color: '#f59e0b', display: 'block', marginTop: '4px' }}>
                        ⚠️ Se requiere imagen del medidor en día {formulario.edad_dias}
                      </small>
                    )}
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Lectura del Medidor</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="lectura_medidor"
                      value={formulario.lectura_medidor}
                      onChange={handleChange}
                      placeholder="Ej: 1234.56"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consumo (m³)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="consumo_m3"
                      value={formulario.consumo_m3}
                      onChange={handleChange}
                      placeholder="Ej: 45.2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Imagen del Medidor
                    {(formulario.edad_dias === '1' || formulario.edad_dias === '22') && (
                      <span style={{ color: '#ef4444' }}> *</span>
                    )}
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formulario.imagen_url && (
                    <img
                      src={formulario.imagen_url}
                      alt="Vista previa"
                      style={{ maxWidth: '100%', marginTop: '8px', borderRadius: '4px' }}
                    />
                  )}
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

export default Gas;

