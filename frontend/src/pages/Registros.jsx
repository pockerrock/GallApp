import React, { useState, useEffect } from 'react';
import { registrosService, galponesService, inventarioService } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTimes, FaFilePdf, FaFileExcel } from 'react-icons/fa';

const Registros = () => {
  const [registros, setRegistros] = useState([]);
  const [galpones, setGalpones] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [filtroGalpon, setFiltroGalpon] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [valorTemporal, setValorTemporal] = useState('');

  const [formulario, setFormulario] = useState({
    galpon_id: '',
    fecha: new Date().toISOString().split('T')[0],
    edad_dias: '',
    consumo_kg: '',
    lote_id: '',
    tipo_alimento: '',
    lote_alimento: '',
    cantidad_bultos: 0,
    mortalidad: 0,
    seleccion: 0,
    peso_promedio: '',
    peso_promedio: '',
    observaciones: '',
    foto_factura: null,
    foto_medidor: null
  });

  const [archivos, setArchivos] = useState({
    foto_factura: null,
    foto_medidor: null
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [registrosRes, galponesRes, lotesRes] = await Promise.all([
        registrosService.listar({ limit: 100 }),
        galponesService.listar(),
        inventarioService.lotes()
      ]);
      setRegistros(registrosRes.data.registros);
      setGalpones(galponesRes.data.galpones);
      setLotes(lotesRes.data.lotes || []);
    } catch (error) {
      toast.error('Error al cargar registros');
    } finally {
      setCargando(false);
    }
  };

  // Definir los pasos del formulario
  const pasos = [
    { nombre: 'galpon_id', label: 'Seleccione el Galpón', tipo: 'select', requerido: true },
    { nombre: 'fecha', label: 'Ingrese la Fecha', tipo: 'date', requerido: true },
    { nombre: 'edad_dias', label: 'Ingrese la Edad en Días', tipo: 'number', min: 0, requerido: true },
    { nombre: 'consumo_kg', label: 'Ingrese el Consumo de Alimento (kg)', tipo: 'number', min: 0, step: 0.01, requerido: true },
    { nombre: 'lote_id', label: 'Seleccione Lote de Bodega (opcional)', tipo: 'select', requerido: false },
    { nombre: 'tipo_alimento', label: 'Tipo de Alimento', tipo: 'text', requerido: false },
    { nombre: 'lote_alimento', label: 'Lote de Alimento', tipo: 'text', requerido: false },
    { nombre: 'cantidad_bultos', label: 'Cantidad de Bultos', tipo: 'number', min: 0, requerido: false },
    { nombre: 'mortalidad', label: 'Mortalidad', tipo: 'number', min: 0, requerido: false },
    { nombre: 'seleccion', label: 'Selección / Descarte', tipo: 'number', min: 0, requerido: false },
    { nombre: 'peso_promedio', label: 'Peso Promedio (gramos)', tipo: 'number', min: 0, step: 0.1, requerido: false },
    { nombre: 'peso_promedio', label: 'Peso Promedio (gramos)', tipo: 'number', min: 0, step: 0.1, requerido: false },
    { nombre: 'observaciones', label: 'Observaciones', tipo: 'textarea', requerido: false },
    { nombre: 'fotos', label: 'Fotos Requeridas', tipo: 'files', requerido: false }
  ];

  const validarPaso = (paso, valor) => {
    const pasoConfig = pasos[paso];

    // Si es requerido y está vacío
    if (pasoConfig.requerido && (valor === '' || valor === null || valor === undefined)) {
      return 'Este campo es requerido';
    }

    // Validaciones específicas por tipo
    if (pasoConfig.tipo === 'number' && valor !== '' && valor !== null) {
      const num = parseFloat(valor);
      if (isNaN(num)) {
        return 'Debe ingresar un número válido';
      }
      if (pasoConfig.min !== undefined && num < pasoConfig.min) {
        return `El valor debe ser mayor o igual a ${pasoConfig.min}`;
      }
    }

    if (pasoConfig.tipo === 'select' && pasoConfig.requerido && (valor === '' || valor === '0')) {
      return 'Debe seleccionar una opción';
    }

    if (pasoConfig.nombre === 'fotos') {
      const edad = parseInt(formulario.edad_dias);
      if (edad === 1 && !archivos.foto_factura) {
        return 'Debe subir la foto de la factura de gas (Día 1)';
      }
      if (edad === 22 && !archivos.foto_medidor) {
        return 'Debe subir la foto del medidor de gas (Día 22)';
      }
    }

    return null;
  };

  const avanzarPaso = () => {
    const pasoConfig = pasos[pasoActual];
    const valorActual = valorTemporal !== '' ? valorTemporal : formulario[pasoConfig.nombre];

    const error = validarPaso(pasoActual, valorActual);

    if (error) {
      setErrorValidacion(error);
      return;
    }

    // Si es lote_id y tiene valor, auto-completar tipo y lote
    if (pasoConfig.nombre === 'lote_id' && valorActual) {
      const loteSeleccionado = lotes.find(l => l.id === parseInt(valorActual));
      if (loteSeleccionado) {
        setFormulario(prev => ({
          ...prev,
          [pasoConfig.nombre]: valorActual,
          tipo_alimento: loteSeleccionado.tipo,
          lote_alimento: loteSeleccionado.codigo_lote
        }));
      } else {
        setFormulario(prev => ({
          ...prev,
          [pasoConfig.nombre]: valorActual
        }));
      }
    } else {
      setFormulario(prev => ({
        ...prev,
        [pasoConfig.nombre]: valorActual
      }));
    }

    setErrorValidacion('');
    setValorTemporal('');

    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1);
      // Pre-cargar valor temporal con el valor guardado
      setValorTemporal(formulario[pasos[pasoActual + 1].nombre] || '');
    } else {
      // Último paso, enviar formulario
      enviarFormulario();
    }
  };

  const retrocederPaso = () => {
    if (pasoActual > 0) {
      setErrorValidacion('');
      setPasoActual(pasoActual - 1);
      setValorTemporal(formulario[pasos[pasoActual - 1].nombre] || '');
    }
  };

  const iniciarFormulario = () => {
    setMostrarModal(true);
    setPasoActual(0);
    setErrorValidacion('');
    setValorTemporal(formulario[pasos[0].nombre] || '');
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPasoActual(0);
    setErrorValidacion('');
    setValorTemporal('');
  };

  const enviarFormulario = async () => {
    setGuardando(true);

    try {
      // Parsear y validar datos
      const galponId = parseInt(formulario.galpon_id);
      const edadDias = parseInt(formulario.edad_dias);
      const consumoKg = parseFloat(formulario.consumo_kg);
      const cantidadBultos = parseInt(formulario.cantidad_bultos || 0);
      const mortalidad = parseInt(formulario.mortalidad || 0);
      const seleccion = parseInt(formulario.seleccion || 0);
      const pesoPromedio = formulario.peso_promedio ? parseFloat(formulario.peso_promedio) : null;

      // Validaciones de lógica de negocio
      if (isNaN(galponId) || galponId <= 0) {
        toast.error('Debe seleccionar un galpón válido');
        setGuardando(false);
        return;
      }

      if (isNaN(edadDias) || edadDias < 0) {
        toast.error('Edad de días debe ser un número válido');
        setGuardando(false);
        return;
      }

      if (isNaN(consumoKg) || consumoKg < 0) {
        toast.error('Consumo debe ser un número válido');
        setGuardando(false);
        return;
      }

      const formData = new FormData();
      formData.append('galpon_id', galponId);
      formData.append('fecha', formulario.fecha);
      formData.append('edad_dias', edadDias);
      formData.append('consumo_kg', consumoKg);
      if (formulario.lote_id) {
        formData.append('lote_id', formulario.lote_id);
      }
      if (formulario.tipo_alimento) formData.append('tipo_alimento', formulario.tipo_alimento);
      if (formulario.lote_alimento) formData.append('lote_alimento', formulario.lote_alimento);
      formData.append('cantidad_bultos', cantidadBultos);
      formData.append('mortalidad', mortalidad);
      formData.append('seleccion', seleccion);
      if (pesoPromedio) formData.append('peso_promedio', pesoPromedio);
      formData.append('observaciones', formulario.observaciones || '');

      if (parseInt(edadDias) === 1 && archivos.foto_factura) {
        formData.append('foto_factura', archivos.foto_factura);
      }
      if (parseInt(edadDias) === 22 && archivos.foto_medidor) {
        formData.append('foto_medidor', archivos.foto_medidor);
      }

      await registrosService.crear(formData);
      toast.success('Registro creado exitosamente');
      setMostrarModal(false);

      // Resetear formulario
      setFormulario({
        galpon_id: '',
        fecha: new Date().toISOString().split('T')[0],
        edad_dias: '',
        consumo_kg: '',
        lote_id: '',
        tipo_alimento: '',
        lote_alimento: '',
        cantidad_bultos: 0,
        mortalidad: 0,
        seleccion: 0,
        peso_promedio: '',
        observaciones: '',
        foto_factura: null,
        foto_medidor: null
      });
      setArchivos({
        foto_factura: null,
        foto_medidor: null
      });

      // Recargar registros
      cargarDatos();
    } catch (error) {
      console.error('Error al crear registro:', error);
      toast.error(error.response?.data?.error || 'Error al crear registro');
    } finally {
      setGuardando(false);
    }
  };

  const registrosFiltrados = filtroGalpon
    ? registros.filter(r => r.galpon_id === parseInt(filtroGalpon))
    : registros;

  const exportarPDF = () => {
    const params = new URLSearchParams();
    if (filtroGalpon) params.append('galpon_id', filtroGalpon);
    params.append('limit', '100');

    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reportes/registros-pdf?${params.toString()}`;

    // Crear un enlace temporal y hacer clic en él
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.setAttribute('Authorization', `Bearer ${token}`);

    // Usar fetch para manejar la descarga con autenticación
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
        a.download = 'registros-diarios.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte PDF descargado');
      })
      .catch(error => {
        console.error('Error al descargar PDF:', error);
        toast.error('Error al descargar el reporte PDF');
      });
  };

  const exportarExcel = () => {
    const params = new URLSearchParams();
    if (filtroGalpon) params.append('galpon_id', filtroGalpon);
    params.append('limit', '1000');

    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reportes/registros-excel?${params.toString()}`;

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
        a.download = 'registros-diarios.xlsx';
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
            <h1>Registros Diarios</h1>
            <p>Historial de registros por galpón</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportarPDF} className="btn btn-outline" title="Exportar a PDF">
              <FaFilePdf style={{ marginRight: '8px', color: '#dc2626' }} />
              PDF
            </button>
            <button onClick={exportarExcel} className="btn btn-outline" title="Exportar a Excel">
              <FaFileExcel style={{ marginRight: '8px', color: '#16a34a' }} />
              Excel
            </button>
            <button onClick={iniciarFormulario} className="btn btn-primary">
              <FaPlus style={{ marginRight: '8px' }} />
              Nuevo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-2">
        <div className="flex gap-2">
          <select className="form-control" value={filtroGalpon} onChange={(e) => setFiltroGalpon(e.target.value)}>
            <option value="">Todos los galpones</option>
            {galpones.map(g => (
              <option key={g.id} value={g.id}>Galpón {g.numero} - {g.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Galpón</th>
              <th>Edad</th>
              <th>Consumo (kg)</th>
              <th>Tipo Alimento</th>
              <th>Lote</th>
              <th>Bultos</th>
              <th>Acumulado (kg)</th>
              <th>Mortalidad</th>
              <th>Selección</th>
              <th>Saldo Aves</th>
              <th>Peso (g)</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center">No hay registros</td>
              </tr>
            ) : (
              registrosFiltrados.map((registro) => (
                <tr key={registro.id}>
                  <td>{new Date(registro.fecha).toLocaleDateString('es-ES')}</td>
                  <td>Galpón {registro.galpon?.numero}</td>
                  <td>{registro.edad_dias}</td>
                  <td>{parseFloat(registro.consumo_kg).toFixed(2)}</td>
                  <td>{registro.tipo_alimento || '-'}</td>
                  <td>{registro.lote_alimento || '-'}</td>
                  <td>{registro.cantidad_bultos || 0}</td>
                  <td>{parseFloat(registro.acumulado_alimento || 0).toFixed(2)}</td>
                  <td>
                    <span className={registro.mortalidad > 10 ? 'badge badge-danger' : 'badge badge-success'}>
                      {registro.mortalidad}
                    </span>
                  </td>
                  <td>{registro.seleccion || 0}</td>
                  <td>{registro.saldo_aves?.toLocaleString('es-ES') || 0}</td>
                  <td>{parseFloat(registro.peso_promedio || 0).toFixed(1)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Crear Registro - Paso a Paso */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Nuevo Registro Diario - Paso {pasoActual + 1} de {pasos.length}
              </h3>
              <button className="modal-close" onClick={cerrarModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {/* Barra de progreso */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${((pasoActual + 1) / pasos.length) * 100}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{
                  marginTop: '8px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  {pasos[pasoActual].label}
                </p>
              </div>

              {/* Campo actual */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '16px', marginBottom: '12px' }}>
                  {pasos[pasoActual].label}
                  {pasos[pasoActual].requerido && <span style={{ color: '#ef4444' }}> *</span>}
                </label>

                {/* Renderizar campo según tipo */}
                {pasos[pasoActual].tipo === 'select' && pasos[pasoActual].nombre === 'galpon_id' && (
                  <select
                    className="form-control"
                    value={valorTemporal}
                    onChange={(e) => setValorTemporal(e.target.value)}
                    style={{ fontSize: '16px', padding: '12px' }}
                    autoFocus
                  >
                    <option value="">Seleccione un galpón</option>
                    {galpones.map(g => (
                      <option key={g.id} value={g.id}>
                        Galpón {g.numero} - {g.nombre}
                      </option>
                    ))}
                  </select>
                )}

                {pasos[pasoActual].tipo === 'select' && pasos[pasoActual].nombre === 'lote_id' && (
                  <>
                    <select
                      className="form-control"
                      value={valorTemporal}
                      onChange={(e) => setValorTemporal(e.target.value)}
                      style={{ fontSize: '16px', padding: '12px' }}
                      autoFocus
                    >
                      <option value="">Ninguno (omitir)</option>
                      {lotes
                        .filter(l => l.cantidad_actual > 0)
                        .map(l => (
                          <option key={l.id} value={l.id}>
                            {l.tipo} - Lote {l.codigo_lote} ({l.cantidad_actual} kg disponibles)
                          </option>
                        ))}
                    </select>
                    <small style={{ display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '13px' }}>
                      Presione "Siguiente" para omitir este campo
                    </small>
                  </>
                )}

                {pasos[pasoActual].tipo === 'date' && (
                  <input
                    type="date"
                    className="form-control"
                    value={valorTemporal}
                    onChange={(e) => setValorTemporal(e.target.value)}
                    style={{ fontSize: '16px', padding: '12px' }}
                    autoFocus
                  />
                )}

                {pasos[pasoActual].tipo === 'number' && (
                  <input
                    type="number"
                    className="form-control"
                    value={valorTemporal}
                    onChange={(e) => setValorTemporal(e.target.value)}
                    min={pasos[pasoActual].min}
                    step={pasos[pasoActual].step || 1}
                    style={{ fontSize: '16px', padding: '12px' }}
                    placeholder={`Ingrese ${pasos[pasoActual].label.toLowerCase()}`}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        avanzarPaso();
                      }
                    }}
                  />
                )}

                {pasos[pasoActual].tipo === 'text' && (
                  <input
                    type="text"
                    className="form-control"
                    value={valorTemporal}
                    onChange={(e) => setValorTemporal(e.target.value)}
                    style={{ fontSize: '16px', padding: '12px' }}
                    placeholder={`Ingrese ${pasos[pasoActual].label.toLowerCase()}`}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        avanzarPaso();
                      }
                    }}
                  />
                )}

                {pasos[pasoActual].tipo === 'textarea' && (
                  <textarea
                    className="form-control"
                    value={valorTemporal}
                    onChange={(e) => setValorTemporal(e.target.value)}
                    rows="4"
                    style={{ fontSize: '16px', padding: '12px' }}
                    placeholder={`Ingrese ${pasos[pasoActual].label.toLowerCase()}`}
                    autoFocus
                  />
                )}

                {pasos[pasoActual].tipo === 'files' && (
                  <div className="file-inputs">
                    {parseInt(formulario.edad_dias) === 1 && (
                      <div className="form-group">
                        <label className="form-label">Foto Factura Gas *</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(e) => setArchivos(prev => ({ ...prev, foto_factura: e.target.files[0] }))}
                        />
                        {archivos.foto_factura && <small className="text-success">Archivo seleccionado: {archivos.foto_factura.name}</small>}
                      </div>
                    )}
                    {parseInt(formulario.edad_dias) === 22 && (
                      <div className="form-group">
                        <label className="form-label">Foto Medidor Gas *</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={(e) => setArchivos(prev => ({ ...prev, foto_medidor: e.target.files[0] }))}
                        />
                        {archivos.foto_medidor && <small className="text-success">Archivo seleccionado: {archivos.foto_medidor.name}</small>}
                      </div>
                    )}
                    {parseInt(formulario.edad_dias) !== 1 && parseInt(formulario.edad_dias) !== 22 && (
                      <p className="text-muted">No se requieren fotos para esta edad.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mensaje de error */}
              {errorValidacion && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '14px'
                }}>
                  <strong>Revisa la información dada:</strong> {errorValidacion}
                </div>
              )}

              {/* Información adicional según el campo */}
              {pasos[pasoActual].nombre === 'tipo_alimento' && formulario.lote_id && (
                <small style={{ display: 'block', marginTop: '12px', color: '#059669', fontSize: '13px' }}>
                  Auto-completado desde bodega. Puede modificarlo si es necesario.
                </small>
              )}

              {pasos[pasoActual].nombre === 'lote_alimento' && formulario.lote_id && (
                <small style={{ display: 'block', marginTop: '12px', color: '#059669', fontSize: '13px' }}>
                  Auto-completado desde bodega. Puede modificarlo si es necesario.
                </small>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={pasoActual === 0 ? cerrarModal : retrocederPaso}
                disabled={guardando}
                style={{ minWidth: '100px' }}
              >
                {pasoActual === 0 ? 'Cancelar' : 'Atrás'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={avanzarPaso}
                disabled={guardando}
                style={{ minWidth: '120px' }}
              >
                {guardando ? 'Guardando...' : pasoActual === pasos.length - 1 ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registros;
