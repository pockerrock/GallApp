import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galponesService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaPlus, FaEdit, FaTimes, FaCut } from 'react-icons/fa';

const Galpones = () => {
  const { usuario } = useAuth();
  const [galpones, setGalpones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalDivision, setMostrarModalDivision] = useState(false);
  const [galponParaDividir, setGalponParaDividir] = useState(null);
  const [dividiendo, setDividiendo] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [galponSeleccionado, setGalponSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState({
    numero: '',
    nombre: '',
    lote: '',
    sexo: 'M',
    capacidad: '',
    aves_iniciales: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    granja_id: 1 // Por defecto granja 1
  });

  useEffect(() => {
    cargarGalpones();
  }, []);

  const cargarGalpones = async () => {
    try {
      const res = await galponesService.listar({ activo: true });
      setGalpones(res.data.galpones);
    } catch (error) {
      console.error('Error al cargar galpones:', error);
    } finally {
      setCargando(false);
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
    setGalponSeleccionado(null);
    setFormulario({
      numero: '',
      nombre: '',
      lote: '',
      sexo: 'M',
      capacidad: '',
      aves_iniciales: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      granja_id: 1
    });
    setMostrarModal(true);
  };

  const abrirModalEditar = (galpon) => {
    setModoEdicion(true);
    setGalponSeleccionado(galpon);
    setFormulario({
      numero: galpon.numero,
      nombre: galpon.nombre || '',
      lote: galpon.lote,
      sexo: galpon.sexo,
      capacidad: galpon.capacidad,
      aves_iniciales: galpon.aves_iniciales,
      fecha_inicio: galpon.fecha_inicio.split('T')[0],
      granja_id: galpon.granja_id || 1
    });
    setMostrarModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formulario.numero || !formulario.lote) {
      toast.error('Número y lote son requeridos');
      return;
    }

    if (!formulario.capacidad || formulario.capacidad <= 0) {
      toast.error('Capacidad debe ser mayor a 0');
      return;
    }

    if (!formulario.aves_iniciales || formulario.aves_iniciales <= 0) {
      toast.error('Aves iniciales debe ser mayor a 0');
      return;
    }

    setGuardando(true);

    try {
      const datos = {
        ...formulario,
        numero: parseInt(formulario.numero),
        capacidad: parseInt(formulario.capacidad),
        aves_iniciales: parseInt(formulario.aves_iniciales),
        granja_id: parseInt(formulario.granja_id),
        activo: true
      };

      if (modoEdicion && galponSeleccionado) {
        await galponesService.actualizar(galponSeleccionado.id, datos);
        toast.success('Galpón actualizado exitosamente');
      } else {
        await galponesService.crear(datos);
        toast.success('Galpón creado exitosamente');
      }

      setMostrarModal(false);
      cargarGalpones();
    } catch (error) {
      console.error('Error al guardar galpón:', error);
      toast.error(error.response?.data?.error || 'Error al guardar galpón');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalDivision = (galpon) => {
    setGalponParaDividir(galpon);
    setGalponParaDividir(galpon);
    // Calcular saldo actual estimado (simulado, idealmente vendría del backend)
    setAvesParaA(Math.floor(galpon.aves_iniciales / 2));
    setMostrarModalDivision(true);
  };

  const [avesParaA, setAvesParaA] = useState(0);

  const confirmarDivision = async () => {
    if (!galponParaDividir) return;

    setDividiendo(true);
    try {
      await galponesService.dividir(galponParaDividir.id, avesParaA);
      toast.success('Galpón dividido exitosamente en Galpón ' + galponParaDividir.numero + '-A y ' + galponParaDividir.numero + '-B');
      setMostrarModalDivision(false);
      setGalponParaDividir(null);
      cargarGalpones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al dividir galpón');
    } finally {
      setDividiendo(false);
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
            <h1>Galpones</h1>
            <p>Gestión de galpones activos</p>
          </div>
          {puedeGestionar() && (
            <button onClick={abrirModalCrear} className="btn btn-primary">
              <FaPlus style={{ marginRight: '8px' }} />
              Nuevo Galpón
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Nombre</th>
              <th>Lote</th>
              <th>Sexo</th>
              <th>Capacidad</th>
              <th>Aves Iniciales</th>
              <th>Fecha Inicio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {galpones.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">No hay galpones registrados</td>
              </tr>
            ) : (
              galpones.map((galpon) => (
                <tr key={galpon.id}>
                  <td>
                    <strong>
                      {galpon.numero}
                      {galpon.division_sufijo && `-${galpon.division_sufijo}`}
                    </strong>
                    {galpon.es_division && (
                      <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '10px' }}>
                        División
                      </span>
                    )}
                  </td>
                  <td>{galpon.nombre || '-'}</td>
                  <td><span className="badge badge-info">{galpon.lote}</span></td>
                  <td>{galpon.sexo === 'M' ? '♂ Macho' : '♀ Hembra'}</td>
                  <td>{galpon.capacidad.toLocaleString('es-ES')}</td>
                  <td>{galpon.aves_iniciales.toLocaleString('es-ES')}</td>
                  <td>{new Date(galpon.fecha_inicio).toLocaleDateString('es-ES')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Link to={`/galpones/${galpon.id}`} className="btn btn-sm btn-primary">
                        <FaEye style={{ marginRight: '4px' }} /> Ver
                      </Link>
                      {puedeGestionar() && (
                        <>
                          <button
                            onClick={() => abrirModalEditar(galpon)}
                            className="btn btn-sm btn-secondary"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          {!galpon.es_division && !galpon.divisiones?.length && (
                            <button
                              onClick={() => abrirModalDivision(galpon)}
                              className="btn btn-sm btn-outline"
                              style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                              title="Dividir galpón"
                            >
                              <FaCut />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Galpón */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modoEdicion ? 'Editar Galpón' : 'Nuevo Galpón'}
              </h3>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Número *</label>
                  <input
                    type="number"
                    name="numero"
                    className="form-control"
                    value={formulario.numero}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Galpón Principal"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lote *</label>
                  <input
                    type="text"
                    name="lote"
                    className="form-control"
                    value={formulario.lote}
                    onChange={handleChange}
                    placeholder="Ej: L-2024-01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sexo *</label>
                  <select
                    name="sexo"
                    className="form-control"
                    value={formulario.sexo}
                    onChange={handleChange}
                    required
                  >
                    <option value="M">♂ Macho</option>
                    <option value="H">♀ Hembra</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacidad *</label>
                  <input
                    type="number"
                    name="capacidad"
                    className="form-control"
                    value={formulario.capacidad}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aves Iniciales *</label>
                  <input
                    type="number"
                    name="aves_iniciales"
                    className="form-control"
                    value={formulario.aves_iniciales}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    className="form-control"
                    value={formulario.fecha_inicio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModal(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear Galpón')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación División */}
      {mostrarModalDivision && galponParaDividir && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Dividir Galpón</h3>
              <button className="modal-close" onClick={() => setMostrarModalDivision(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                ¿Estás seguro de que deseas dividir el <strong>Galpón {galponParaDividir.numero}</strong>?
              </p>
              <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ marginBottom: '8px', fontWeight: '600' }}>Esta acción creará:</p>
                <ul style={{ marginLeft: '20px', color: '#374151' }}>
                  <li><strong>Galpón {galponParaDividir.numero}-A</strong>: {avesParaA} aves</li>
                  <li><strong>Galpón {galponParaDividir.numero}-B</strong>: {(galponParaDividir.aves_iniciales - avesParaA)} aves (aprox)</li>
                </ul>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Aves para Galpón A:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={avesParaA}
                    onChange={(e) => setAvesParaA(parseInt(e.target.value) || 0)}
                  />
                </div>
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                  ⚠️ El galpón original se mantendrá como referencia, pero las aves se dividirán entre los dos nuevos galpones.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setMostrarModalDivision(false)}
                disabled={dividiendo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmarDivision}
                disabled={dividiendo}
                style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
              >
                {dividiendo ? 'Dividiendo...' : 'Confirmar División'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Galpones;
