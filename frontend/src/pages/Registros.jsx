import React, { useState, useEffect } from 'react';
import { registrosService, galponesService, inventarioService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
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
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [mostrarModalImagen, setMostrarModalImagen] = useState(false);

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
      const galponesData = galponesRes.data.galpones || [];
      galponesData.sort((a, b) => a.numero - b.numero);

      setRegistros(registrosRes.data.registros);
      setGalpones(galponesData);
      setLotes(lotesRes.data.lotes || []);
    } catch (error) {
      toast.error('Error al cargar registros');
    } finally {
      setCargando(false);
    }
  };

  const { usuario } = useAuth(); // Import useAuth to detect admin
  const puedeEditar = () => ['admin', 'dueno'].includes(usuario?.rol);

  const [registroEditando, setRegistroEditando] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [formularioEdicion, setFormularioEdicion] = useState({
    edad_dias: '',
    consumo_kg: '',
    cantidad_bultos: 0,
    mortalidad: 0,
    seleccion: 0,
    peso_promedio: '',
    observaciones: '',
    foto_factura: null,
    foto_medidor: null
  });

  // Definir los pasos del formulario
  const pasos = [
    { nombre: 'galpon_id', label: 'Seleccione el Galpón', tipo: 'select', requerido: true },
    { nombre: 'fecha', label: 'Ingrese la Fecha', tipo: 'date', requerido: true },
    { nombre: 'edad_dias', label: 'Ingrese la Edad en Días', tipo: 'number', min: 0, requerido: true },
    { nombre: 'consumo_kg', label: 'Ingrese el Consumo de Alimento (kg)', tipo: 'number', min: 0, step: 0.01, requerido: true },
    { nombre: 'lote_id', label: 'Seleccione Lote de Bodega', tipo: 'select', requerido: true },
    { nombre: 'tipo_alimento', label: 'Tipo de Alimento', tipo: 'text', requerido: false },
    { nombre: 'lote_alimento', label: 'Lote de Alimento', tipo: 'text', requerido: false },
    { nombre: 'cantidad_bultos', label: 'Cantidad de Bultos', tipo: 'number', min: 0, requerido: false },
    { nombre: 'mortalidad', label: 'Mortalidad', tipo: 'number', min: 0, requerido: false },
    { nombre: 'seleccion', label: 'Selección / Descarte', tipo: 'number', min: 0, requerido: false },
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
    // Usar valorTemporal si existe, sino el valor del formulario
    const valorActual = valorTemporal !== '' ? valorTemporal : formulario[pasoConfig.nombre];

    const error = validarPaso(pasoActual, valorActual);

    if (error) {
      setErrorValidacion(error);
      return;
    }

    // Calcular el nuevo estado del formulario
    let nuevoFormulario = { ...formulario, [pasoConfig.nombre]: valorActual };

    // Lógica de auto-completado para lote_id
    if (pasoConfig.nombre === 'lote_id' && valorActual) {
      const loteSeleccionado = lotes.find(l => l.id === parseInt(valorActual));
      if (loteSeleccionado) {
        nuevoFormulario = {
          ...nuevoFormulario,
          tipo_alimento: loteSeleccionado.tipo,
          lote_alimento: loteSeleccionado.codigo_lote
        };
      }
    }

    // Actualizar estado
    setFormulario(nuevoFormulario);
    setErrorValidacion('');
    setValorTemporal('');

    if (pasoActual < pasos.length - 1) {
      const siguientePaso = pasoActual + 1;
      setPasoActual(siguientePaso);

      // Pre-cargar valor temporal del siguiente paso
      // IMPORTANTE: Usar nuevoFormulario para obtener el valor, ya que setFormulario es asíncrono
      const nombreSiguienteCampo = pasos[siguientePaso].nombre;
      setValorTemporal(nuevoFormulario[nombreSiguienteCampo] || '');
    } else {
      // Último paso, enviar formulario
      // Asegurarnos de enviar con el estado más reciente
      enviarFormulario(nuevoFormulario);
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

  const enviarFormulario = async (datosExtra = null) => {
    setGuardando(true);

    // Usar datosExtra si vienen, o el estado actual
    const datosFinales = datosExtra || formulario;

    try {
      // Parsear y validar datos
      const galponId = parseInt(datosFinales.galpon_id);
      const edadDias = parseInt(datosFinales.edad_dias);
      const consumoKg = parseFloat(datosFinales.consumo_kg);
      const cantidadBultos = parseInt(datosFinales.cantidad_bultos || 0);
      const mortalidad = parseInt(datosFinales.mortalidad || 0);
      const seleccion = parseInt(datosFinales.seleccion || 0);
      const pesoPromedio = datosFinales.peso_promedio ? parseFloat(datosFinales.peso_promedio) : null;

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
      formData.append('fecha', datosFinales.fecha);
      formData.append('edad_dias', edadDias);
      formData.append('consumo_kg', consumoKg);
      if (datosFinales.lote_id) {
        formData.append('lote_id', datosFinales.lote_id);
      }
      if (datosFinales.tipo_alimento) formData.append('tipo_alimento', datosFinales.tipo_alimento);
      if (datosFinales.lote_alimento) formData.append('lote_alimento', datosFinales.lote_alimento);
      formData.append('cantidad_bultos', cantidadBultos);
      formData.append('mortalidad', mortalidad);
      formData.append('seleccion', seleccion);
      if (pesoPromedio) formData.append('peso_promedio', pesoPromedio);
      formData.append('observaciones', datosFinales.observaciones || '');

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
      console.error('Error al crear/actualizar registro:', error);
      toast.error(error.response?.data?.error || 'Error al guardar registro');
    } finally {
      setGuardando(false);
    }
  };

  const formatearFechaLocal = (fechaISO) => {
    if (!fechaISO) return '-';
    const [año, mes, dia] = fechaISO.split('T')[0].split('-');
    return `${dia}/${mes}/${año}`;
  };

  const abrirEditar = (registro) => {
    setRegistroEditando(registro);
    setFormularioEdicion({
      edad_dias: registro.edad_dias || '',
      consumo_kg: registro.consumo_kg || '',
      cantidad_bultos: registro.cantidad_bultos || 0,
      mortalidad: registro.mortalidad || 0,
      seleccion: registro.seleccion || 0,
      peso_promedio: registro.peso_promedio || '',
      observaciones: registro.observaciones || '',
      foto_factura: null,
      foto_medidor: null
    });
    setMostrarModalEdicion(true);
  };

  const handleChangeEdicion = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormularioEdicion(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormularioEdicion(prev => ({ ...prev, [name]: value }));
    }
  };

  const submitEdicion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const formData = new FormData();
      Object.keys(formularioEdicion).forEach(key => {
        if (formularioEdicion[key] !== null) {
          formData.append(key, formularioEdicion[key]);
        }
      });

      await registrosService.actualizar(registroEditando.id, formData);
      toast.success('Registro actualizado exitosamente');
      setMostrarModalEdicion(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar registro:', error);
      toast.error('Error al actualizar el registro');
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
              <th>Acciones</th>
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
                  <td>{formatearFechaLocal(registro.fecha)}</td>
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
                  <td>
                    {registro.foto_factura || registro.foto_medidor ? (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                          const baseUrl = apiUrl.replace('/api', '');
                          const fotoUrl = registro.foto_factura || registro.foto_medidor;

                          // Convertir a URL completa
                          const fullUrl = fotoUrl.startsWith('http') ? fotoUrl : `${baseUrl}${fotoUrl}`;
                          setImagenSeleccionada(fullUrl);
                          setMostrarModalImagen(true);
                        }}
                        title={registro.foto_factura ? "Ver Factura Gas" : "Ver Medidor Gas"}
                      >
                        📄 Ver Foto
                      </button>
                    ) : null}

                    {puedeEditar() && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ marginLeft: '4px' }}
                        onClick={() => abrirEditar(registro)}
                        title="Editar Registro"
                      >
                        ✏️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Visualización de Imagen */}
      {mostrarModalImagen && (
        <div className="modal-overlay" onClick={() => setMostrarModalImagen(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Factura / Comprobante</h3>
              <button className="modal-close" onClick={() => setMostrarModalImagen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '0', display: 'flex', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
              <img
                src={imagenSeleccionada}
                alt="Comprobante"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      )}

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

                {pasos[pasoActual].tipo === 'select' && pasos[pasoActual].nombre === 'lote_id' && (() => {
                  const galponSeleccionado = galpones.find(g => g.id === parseInt(formulario.galpon_id));
                  const lotesFiltrados = lotes.filter(l =>
                    l.cantidad_actual > 0 &&
                    (!galponSeleccionado || l.bodega_id === galponSeleccionado.bodega_id)
                  );

                  // Agrupar los lotes filtrados para que no salgan duplicados
                  const unicos = {};
                  lotesFiltrados.forEach(l => {
                    if (!unicos[l.id]) {
                      unicos[l.id] = { ...l, cantidad_total: 0 };
                    }
                    unicos[l.id].cantidad_total += parseFloat(l.cantidad_actual || 0);
                  });
                  const lotesUnicos = Object.values(unicos);

                  return (
                    <>
                      <select
                        className="form-control"
                        value={valorTemporal}
                        onChange={(e) => setValorTemporal(e.target.value)}
                        style={{ fontSize: '16px', padding: '12px' }}
                        autoFocus
                      >
                        <option value="">Seleccione el lote</option>
                        {lotesUnicos.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.tipo} - Lote {l.codigo_lote} ({parseFloat(l.cantidad_total).toFixed(2)} kg disponibles)
                          </option>
                        ))}
                      </select>
                    </>
                  );
                })()}

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
                          onChange={(e) => {
                            setArchivos(prev => ({ ...prev, foto_factura: e.target.files[0] }));
                            if (errorValidacion) setErrorValidacion('');
                          }}
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
                          onChange={(e) => {
                            setArchivos(prev => ({ ...prev, foto_medidor: e.target.files[0] }));
                            if (errorValidacion) setErrorValidacion('');
                          }}
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

      {/* Modal de Editar Registro */}
      {mostrarModalEdicion && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Registro (Día {registroEditando?.edad_dias})</h3>
              <button className="modal-close" onClick={() => setMostrarModalEdicion(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={submitEdicion}>
              <div className="modal-body">
                <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Edad (días)</label>
                    <input
                      type="number"
                      name="edad_dias"
                      className="form-control"
                      value={formularioEdicion.edad_dias}
                      onChange={handleChangeEdicion}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Consumo (kg)</label>
                    <input
                      type="number"
                      name="consumo_kg"
                      className="form-control"
                      value={formularioEdicion.consumo_kg}
                      onChange={handleChangeEdicion}
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Mortalidad</label>
                    <input
                      type="number"
                      name="mortalidad"
                      className="form-control"
                      value={formularioEdicion.mortalidad}
                      onChange={handleChangeEdicion}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Selección/Descarte</label>
                    <input
                      type="number"
                      name="seleccion"
                      className="form-control"
                      value={formularioEdicion.seleccion}
                      onChange={handleChangeEdicion}
                    />
                  </div>
                </div>

                <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Peso Promedio (g)</label>
                    <input
                      type="number"
                      name="peso_promedio"
                      className="form-control"
                      value={formularioEdicion.peso_promedio}
                      onChange={handleChangeEdicion}
                      step="0.1"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Cantidad Bultos</label>
                    <input
                      type="number"
                      name="cantidad_bultos"
                      className="form-control"
                      value={formularioEdicion.cantidad_bultos}
                      onChange={handleChangeEdicion}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    name="observaciones"
                    className="form-control"
                    value={formularioEdicion.observaciones}
                    onChange={handleChangeEdicion}
                    rows="3"
                  />
                </div>

                {parseInt(formularioEdicion.edad_dias) === 1 && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Actualizar Foto Factura Gas</label>
                    <input
                      type="file"
                      name="foto_factura"
                      accept="image/*"
                      className="form-control"
                      onChange={handleChangeEdicion}
                    />
                    <small style={{ color: '#6b7280' }}>Si no selecciona ninguna, se conservará la imagen anterior.</small>
                    {formularioEdicion.foto_factura && <small className="text-success" style={{ display: 'block' }}>Archivo nuevo seleccionado: {formularioEdicion.foto_factura.name}</small>}
                  </div>
                )}

                {parseInt(formularioEdicion.edad_dias) === 22 && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Actualizar Foto Medidor Gas</label>
                    <input
                      type="file"
                      name="foto_medidor"
                      accept="image/*"
                      className="form-control"
                      onChange={handleChangeEdicion}
                    />
                    <small style={{ color: '#6b7280' }}>Si no selecciona ninguna, se conservará la imagen anterior.</small>
                    {formularioEdicion.foto_medidor && <small className="text-success" style={{ display: 'block' }}>Archivo nuevo seleccionado: {formularioEdicion.foto_medidor.name}</small>}
                  </div>
                )}

                <small style={{ color: '#059669', display: 'block', marginTop: '16px' }}>
                  Nota: La edición no reversa ni re-aplica el stock en bodega si cambias el consumo, esto es solo para corregir el historial visible.
                </small>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setMostrarModalEdicion(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registros;
