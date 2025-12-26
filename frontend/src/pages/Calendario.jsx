import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { actividadesService, galponesService } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaCheck, FaTrash, FaEdit } from 'react-icons/fa';
import './Calendario.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay actividades en este rango',
  showMore: (total) => `+ Ver más (${total})`
};

const Calendario = () => {
  const [actividades, setActividades] = useState([]);
  const [galpones, setGalpones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'otro',
    fecha_inicio: '',
    hora_inicio: '09:00',
    fecha_fin: '',
    hora_fin: '10:00',
    todo_el_dia: false,
    galpon_id: '',
    prioridad: 'media',
    recordatorio: false,
    minutos_antes: 60,
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [actividadesRes, galponesRes] = await Promise.all([
        actividadesService.listar(),
        galponesService.listar()
      ]);
      setActividades(actividadesRes.data.actividades);
      setGalpones(galponesRes.data.galpones);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar calendario');
    } finally {
      setCargando(false);
    }
  };

  // Convertir actividades al formato de react-big-calendar
  const eventos = actividades.map(act => {
    const start = new Date(act.fecha_inicio);
    const end = act.fecha_fin ? new Date(act.fecha_fin) : new Date(start.getTime() + 60 * 60 * 1000);

    return {
      id: act.id,
      title: `${act.titulo}${act.galpon ? ` - Galpón ${act.galpon.numero}` : ''}`,
      start,
      end,
      allDay: act.todo_el_dia,
      resource: act
    };
  });

  const handleSelectSlot = ({ start, end }) => {
    const fechaInicio = moment(start).format('YYYY-MM-DD');
    const horaInicio = moment(start).format('HH:mm');
    const fechaFin = moment(end).format('YYYY-MM-DD');
    const horaFin = moment(end).format('HH:mm');

    setFormulario({
      ...formulario,
      fecha_inicio: fechaInicio,
      hora_inicio: horaInicio,
      fecha_fin: fechaFin,
      hora_fin: horaFin
    });
    setActividadSeleccionada(null);
    setMostrarModal(true);
  };

  const handleSelectEvent = (event) => {
    setActividadSeleccionada(event.resource);
    setMostrarModalDetalle(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const datos = {
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        tipo: formulario.tipo,
        fecha_inicio: formulario.todo_el_dia
          ? `${formulario.fecha_inicio}T00:00:00`
          : `${formulario.fecha_inicio}T${formulario.hora_inicio}:00`,
        fecha_fin: formulario.fecha_fin && !formulario.todo_el_dia
          ? `${formulario.fecha_fin}T${formulario.hora_fin}:00`
          : null,
        todo_el_dia: formulario.todo_el_dia,
        galpon_id: formulario.galpon_id || null,
        prioridad: formulario.prioridad,
        recordatorio: formulario.recordatorio,
        minutos_antes: formulario.recordatorio ? parseInt(formulario.minutos_antes) : null,
        notas: formulario.notas
      };

      if (actividadSeleccionada) {
        await actividadesService.actualizar(actividadSeleccionada.id, datos);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await actividadesService.crear(datos);
        toast.success('Actividad creada exitosamente');
      }

      setMostrarModal(false);
      setFormulario({
        titulo: '',
        descripcion: '',
        tipo: 'otro',
        fecha_inicio: '',
        hora_inicio: '09:00',
        fecha_fin: '',
        hora_fin: '10:00',
        todo_el_dia: false,
        galpon_id: '',
        prioridad: 'media',
        recordatorio: false,
        minutos_antes: 60,
        notas: ''
      });
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      toast.error(error.response?.data?.error || 'Error al guardar actividad');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = () => {
    setFormulario({
      titulo: actividadSeleccionada.titulo,
      descripcion: actividadSeleccionada.descripcion || '',
      tipo: actividadSeleccionada.tipo,
      fecha_inicio: moment(actividadSeleccionada.fecha_inicio).format('YYYY-MM-DD'),
      hora_inicio: moment(actividadSeleccionada.fecha_inicio).format('HH:mm'),
      fecha_fin: actividadSeleccionada.fecha_fin
        ? moment(actividadSeleccionada.fecha_fin).format('YYYY-MM-DD')
        : '',
      hora_fin: actividadSeleccionada.fecha_fin
        ? moment(actividadSeleccionada.fecha_fin).format('HH:mm')
        : '10:00',
      todo_el_dia: actividadSeleccionada.todo_el_dia,
      galpon_id: actividadSeleccionada.galpon_id || '',
      prioridad: actividadSeleccionada.prioridad,
      recordatorio: actividadSeleccionada.recordatorio,
      minutos_antes: actividadSeleccionada.minutos_antes || 60,
      notas: actividadSeleccionada.notas || ''
    });
    setMostrarModalDetalle(false);
    setMostrarModal(true);
  };

  const handleCompletar = async () => {
    try {
      await actividadesService.completar(actividadSeleccionada.id);
      toast.success('Actividad marcada como completada');
      setMostrarModalDetalle(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al completar actividad:', error);
      toast.error('Error al completar actividad');
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Está seguro de eliminar esta actividad?')) return;

    try {
      await actividadesService.eliminar(actividadSeleccionada.id);
      toast.success('Actividad eliminada exitosamente');
      setMostrarModalDetalle(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  const eventStyleGetter = (event) => {
    const actividad = event.resource;
    let backgroundColor = '#16a34a'; // verde por defecto

    if (actividad.completada) {
      backgroundColor = '#78716c'; // gris para completadas
    } else {
      switch (actividad.prioridad) {
        case 'urgente':
          backgroundColor = '#dc2626'; // rojo
          break;
        case 'alta':
          backgroundColor = '#f59e0b'; // naranja
          break;
        case 'media':
          backgroundColor = '#16a34a'; // verde
          break;
        case 'baja':
          backgroundColor = '#3b82f6'; // azul
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: actividad.completada ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Calendario de Actividades</h1>
            <p>Planificación y seguimiento de tareas</p>
          </div>
          <button
            onClick={() => {
              setActividadSeleccionada(null);
              setFormulario({
                titulo: '',
                descripcion: '',
                tipo: 'otro',
                fecha_inicio: moment().format('YYYY-MM-DD'),
                hora_inicio: '09:00',
                fecha_fin: '',
                hora_fin: '10:00',
                todo_el_dia: false,
                galpon_id: '',
                prioridad: 'media',
                recordatorio: false,
                minutos_antes: 60,
                notas: ''
              });
              setMostrarModal(true);
            }}
            className="btn btn-primary"
          >
            <FaPlus style={{ marginRight: '8px' }} />
            Nueva Actividad
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="card mb-2">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#dc2626', borderRadius: '3px' }}></div>
            <span>Urgente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f59e0b', borderRadius: '3px' }}></div>
            <span>Alta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#16a34a', borderRadius: '3px' }}></div>
            <span>Media</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
            <span>Baja</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#78716c', borderRadius: '3px', opacity: 0.6 }}></div>
            <span>Completada</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="card" style={{ height: '700px', padding: '20px' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={messages}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
        />
      </div>

      {/* Modal de Crear/Editar Actividad */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {actividadSeleccionada ? 'Editar Actividad' : 'Nueva Actividad'}
              </h3>
              <button className="modal-close" onClick={() => setMostrarModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    className="form-control"
                    value={formulario.titulo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select
                    name="tipo"
                    className="form-control"
                    value={formulario.tipo}
                    onChange={handleChange}
                    required
                  >
                    <option value="vacunacion">Vacunación</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="revision_veterinaria">Revisión Veterinaria</option>
                    <option value="pesaje">Pesaje</option>
                    <option value="cambio_alimento">Cambio de Alimento</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Galpón (opcional)</label>
                  <select
                    name="galpon_id"
                    className="form-control"
                    value={formulario.galpon_id}
                    onChange={handleChange}
                  >
                    <option value="">Todos los galpones / General</option>
                    {galpones.map(g => (
                      <option key={g.id} value={g.id}>
                        Galpón {g.numero} - {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      name="todo_el_dia"
                      checked={formulario.todo_el_dia}
                      onChange={handleChange}
                      style={{ marginRight: '8px' }}
                    />
                    Todo el día
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Fecha Inicio *</label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      className="form-control"
                      value={formulario.fecha_inicio}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {!formulario.todo_el_dia && (
                    <div className="form-group">
                      <label className="form-label">Hora Inicio</label>
                      <input
                        type="time"
                        name="hora_inicio"
                        className="form-control"
                        value={formulario.hora_inicio}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>

                {!formulario.todo_el_dia && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Fecha Fin (opcional)</label>
                      <input
                        type="date"
                        name="fecha_fin"
                        className="form-control"
                        value={formulario.fecha_fin}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hora Fin</label>
                      <input
                        type="time"
                        name="hora_fin"
                        className="form-control"
                        value={formulario.hora_fin}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select
                    name="prioridad"
                    className="form-control"
                    value={formulario.prioridad}
                    onChange={handleChange}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    value={formulario.descripcion}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    name="notas"
                    className="form-control"
                    value={formulario.notas}
                    onChange={handleChange}
                    rows="2"
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
                  {guardando ? 'Guardando...' : 'Guardar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Actividad */}
      {mostrarModalDetalle && actividadSeleccionada && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{actividadSeleccionada.titulo}</h3>
              <button className="modal-close" onClick={() => setMostrarModalDetalle(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Tipo:</span>
                  <span className="stat-value" style={{ textTransform: 'capitalize' }}>
                    {actividadSeleccionada.tipo.replace('_', ' ')}
                  </span>
                </div>

                {actividadSeleccionada.galpon && (
                  <div className="stat-item">
                    <span className="stat-label">Galpón:</span>
                    <span className="stat-value">
                      {actividadSeleccionada.galpon.numero} - {actividadSeleccionada.galpon.nombre}
                    </span>
                  </div>
                )}

                <div className="stat-item">
                  <span className="stat-label">Fecha Inicio:</span>
                  <span className="stat-value">
                    {moment(actividadSeleccionada.fecha_inicio).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>

                {actividadSeleccionada.fecha_fin && (
                  <div className="stat-item">
                    <span className="stat-label">Fecha Fin:</span>
                    <span className="stat-value">
                      {moment(actividadSeleccionada.fecha_fin).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                )}

                <div className="stat-item">
                  <span className="stat-label">Prioridad:</span>
                  <span className={`badge ${
                    actividadSeleccionada.prioridad === 'urgente' ? 'badge-danger' :
                    actividadSeleccionada.prioridad === 'alta' ? 'badge-warning' :
                    actividadSeleccionada.prioridad === 'media' ? 'badge-success' :
                    'badge-info'
                  }`}>
                    {actividadSeleccionada.prioridad.toUpperCase()}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-label">Estado:</span>
                  <span className={`badge ${actividadSeleccionada.completada ? 'badge-success' : 'badge-warning'}`}>
                    {actividadSeleccionada.completada ? 'Completada' : 'Pendiente'}
                  </span>
                </div>

                {actividadSeleccionada.descripcion && (
                  <div className="stat-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="stat-label">Descripción:</span>
                    <span className="stat-value">{actividadSeleccionada.descripcion}</span>
                  </div>
                )}

                {actividadSeleccionada.notas && (
                  <div className="stat-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="stat-label">Notas:</span>
                    <span className="stat-value">{actividadSeleccionada.notas}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={handleEliminar}
                style={{ marginRight: 'auto', color: '#dc2626' }}
              >
                <FaTrash style={{ marginRight: '8px' }} />
                Eliminar
              </button>

              <button className="btn btn-outline" onClick={handleEditar}>
                <FaEdit style={{ marginRight: '8px' }} />
                Editar
              </button>

              {!actividadSeleccionada.completada && (
                <button className="btn btn-primary" onClick={handleCompletar}>
                  <FaCheck style={{ marginRight: '8px' }} />
                  Completar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;
