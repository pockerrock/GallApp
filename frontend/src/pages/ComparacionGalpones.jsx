import React, { useState, useEffect } from 'react';
import { dashboardService, galponesService } from '../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaTrophy, FaSkullCrossbones, FaWeight, FaDrumstickBite, FaFilePdf, FaArrowUp, FaArrowDown, FaEquals } from 'react-icons/fa';

const ComparacionGalpones = () => {
  const [tabActiva, setTabActiva] = useState('general'); // 'general' o 'personalizada'
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState('mortalidad');

  // Estados para comparación personalizada
  const [galpones, setGalpones] = useState([]);
  const [galpon1, setGalpon1] = useState('');
  const [galpon2, setGalpon2] = useState('');
  const [rango1, setRango1] = useState('ultima_semana');
  const [rango2, setRango2] = useState('ultima_semana');
  const [fechasCustom1, setFechasCustom1] = useState({ inicio: '', fin: '' });
  const [fechasCustom2, setFechasCustom2] = useState({ inicio: '', fin: '' });
  const [comparacionPersonalizada, setComparacionPersonalizada] = useState(null);
  const [cargandoPersonalizada, setCargandoPersonalizada] = useState(false);

  useEffect(() => {
    cargarComparacion();
    cargarGalpones();
  }, []);

  const cargarComparacion = async () => {
    try {
      const res = await dashboardService.comparacionGalpones();
      setDatos(res.data);
    } catch (error) {
      console.error('Error al cargar comparación:', error);
      toast.error('Error al cargar comparación de galpones');
    } finally {
      setCargando(false);
    }
  };

  const cargarGalpones = async () => {
    try {
      const res = await galponesService.listar();
      setGalpones(res.data.galpones || []);
    } catch (error) {
      console.error('Error al cargar galpones:', error);
    }
  };

  const calcularFechas = (rango) => {
    const hoy = new Date();
    let inicio, fin = hoy.toISOString().split('T')[0];

    switch (rango) {
      case 'ultima_semana':
        inicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'ultimo_mes':
        inicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ultimos_3_meses':
        inicio = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return null;
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin
    };
  };

  const realizarComparacionPersonalizada = async () => {
    if (!galpon1) {
      toast.error('Debe seleccionar al menos el primer galpón');
      return;
    }

    setCargandoPersonalizada(true);

    try {
      const fechas1 = rango1 === 'personalizado' ? fechasCustom1 : calcularFechas(rango1);
      const fechas2 = galpon2 ? (rango2 === 'personalizado' ? fechasCustom2 : calcularFechas(rango2)) : null;

      if (!fechas1 || !fechas1.inicio || !fechas1.fin) {
        toast.error('Debe especificar el rango de fechas para el primer período');
        return;
      }

      const params = {
        galpon1_id: galpon1,
        fecha_inicio_1: fechas1.inicio,
        fecha_fin_1: fechas1.fin
      };

      if (galpon2 && fechas2 && fechas2.inicio && fechas2.fin) {
        params.galpon2_id = galpon2;
        params.fecha_inicio_2 = fechas2.inicio;
        params.fecha_fin_2 = fechas2.fin;
      }

      const res = await dashboardService.comparacionPersonalizada(params);
      setComparacionPersonalizada(res.data);
    } catch (error) {
      console.error('Error al realizar comparación personalizada:', error);
      toast.error('Error al realizar la comparación personalizada');
    } finally {
      setCargandoPersonalizada(false);
    }
  };

  const exportarPDF = () => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reportes/comparacion-pdf`;

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
      a.download = 'comparacion-galpones.pdf';
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

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  if (!datos || datos.comparacion.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Comparación de Galpones</h1>
          <p>No hay galpones activos para comparar</p>
        </div>
      </div>
    );
  }

  // Preparar datos para gráficas
  const datosGrafica = datos.comparacion.map(item => ({
    nombre: `Galpón ${item.galpon.numero}`,
    mortalidad: item.metricas.porcentaje_mortalidad,
    supervivencia: item.metricas.tasa_supervivencia,
    conversion: item.metricas.conversion,
    peso: parseFloat(item.metricas.peso_promedio_g),
    consumo: parseFloat(item.metricas.consumo_total_kg)
  }));

  // Encontrar mejor galpón por métrica
  const mejorConversion = datos.comparacion.reduce((mejor, actual) =>
    parseFloat(actual.metricas.conversion) > 0 && (mejor === null || parseFloat(actual.metricas.conversion) < parseFloat(mejor.metricas.conversion))
      ? actual : mejor
  , null);

  const menorMortalidad = datos.comparacion.reduce((mejor, actual) =>
    mejor === null || actual.metricas.porcentaje_mortalidad < mejor.metricas.porcentaje_mortalidad
      ? actual : mejor
  , null);

  const mayorPeso = datos.comparacion.reduce((mejor, actual) =>
    mejor === null || parseFloat(actual.metricas.peso_promedio_g) > parseFloat(mejor.metricas.peso_promedio_g)
      ? actual : mejor
  , null);

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Comparación de Galpones</h1>
            <p>Análisis comparativo de rendimiento entre galpones</p>
          </div>
          <button onClick={exportarPDF} className="btn btn-outline" title="Exportar a PDF">
            <FaFilePdf style={{ marginRight: '8px', color: '#dc2626' }} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-2">
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setTabActiva('general')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: tabActiva === 'general' ? '3px solid #3b82f6' : '3px solid transparent',
              color: tabActiva === 'general' ? '#3b82f6' : '#6b7280',
              fontWeight: tabActiva === 'general' ? '600' : '400',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            Resumen General
          </button>
          <button
            onClick={() => setTabActiva('personalizada')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: tabActiva === 'personalizada' ? '3px solid #3b82f6' : '3px solid transparent',
              color: tabActiva === 'personalizada' ? '#3b82f6' : '#6b7280',
              fontWeight: tabActiva === 'personalizada' ? '600' : '400',
              fontSize: '15px',
              transition: 'all 0.2s'
            }}
          >
            🔹 Comparación Personalizada
          </button>
        </div>
      </div>

      {/* Tab de Resumen General */}
      {tabActiva === 'general' && (
        <div>

      {/* Tarjetas de Mejores Galpones */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        {mejorConversion && (
          <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaTrophy style={{ fontSize: '32px', color: '#16a34a' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#78716c' }}>Mejor Conversion</p>
                <h3 style={{ margin: '4px 0', fontSize: '20px' }}>Galpón {mejorConversion.galpon.numero}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
                  Conversion: {mejorConversion.metricas.conversion}
                </p>
              </div>
            </div>
          </div>
        )}

        {menorMortalidad && (
          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaSkullCrossbones style={{ fontSize: '32px', color: '#f59e0b' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#78716c' }}>Menor Mortalidad</p>
                <h3 style={{ margin: '4px 0', fontSize: '20px' }}>Galpón {menorMortalidad.galpon.numero}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#d97706', fontWeight: '600' }}>
                  {menorMortalidad.metricas.porcentaje_mortalidad}%
                </p>
              </div>
            </div>
          </div>
        )}

        {mayorPeso && (
          <div className="card" style={{ borderLeft: '4px solid #15803d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaWeight style={{ fontSize: '32px', color: '#15803d' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#78716c' }}>Mayor Peso Promedio</p>
                <h3 style={{ margin: '4px 0', fontSize: '20px' }}>Galpón {mayorPeso.galpon.numero}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#15803d', fontWeight: '600' }}>
                  {mayorPeso.metricas.peso_promedio_g} g
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selector de Métrica */}
      <div className="card mb-2">
        <label className="form-label">Seleccionar Métrica para Comparar:</label>
        <select
          className="form-control"
          value={metricaSeleccionada}
          onChange={(e) => setMetricaSeleccionada(e.target.value)}
        >
          <option value="mortalidad">Porcentaje de Mortalidad</option>
          <option value="supervivencia">Tasa de Supervivencia</option>
          <option value="conversion">Conversion (Conversión Alimenticia)</option>
          <option value="peso">Peso Promedio (g)</option>
          <option value="consumo">Consumo Total (kg)</option>
        </select>
      </div>

      {/* Gráfica de Barras */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Comparación: {
              metricaSeleccionada === 'mortalidad' ? 'Porcentaje de Mortalidad' :
              metricaSeleccionada === 'supervivencia' ? 'Tasa de Supervivencia' :
              metricaSeleccionada === 'conversion' ? 'Conversion (Conversión Alimenticia)' :
              metricaSeleccionada === 'peso' ? 'Peso Promedio' :
              'Consumo Total de Alimento'
            }
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosGrafica}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={metricaSeleccionada}
              fill={
                metricaSeleccionada === 'mortalidad' ? '#dc2626' :
                metricaSeleccionada === 'conversion' ? '#15803d' :
                metricaSeleccionada === 'peso' ? '#f59e0b' :
                '#16a34a'
              }
              name={
                metricaSeleccionada === 'mortalidad' ? 'Mortalidad (%)' :
                metricaSeleccionada === 'supervivencia' ? 'Supervivencia (%)' :
                metricaSeleccionada === 'conversion' ? 'Conversion' :
                metricaSeleccionada === 'peso' ? 'Peso (g)' :
                'Consumo (kg)'
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla Detallada */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tabla Comparativa Detallada</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Galpón</th>
                <th>Lote</th>
                <th>Edad (días)</th>
                <th>Aves Actuales</th>
                <th>Mortalidad %</th>
                <th>Supervivencia %</th>
                <th>Peso Prom. (g)</th>
                <th>Conversion</th>
                <th>Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              {datos.comparacion.map((item) => (
                <tr key={item.galpon.id}>
                  <td><strong>Galpón {item.galpon.numero}</strong></td>
                  <td><span className="badge badge-info">{item.galpon.lote}</span></td>
                  <td>{item.metricas.edad_actual_dias}</td>
                  <td>{item.metricas.saldo_actual.toLocaleString('es-ES')}</td>
                  <td>
                    <span className={`badge ${
                      item.metricas.porcentaje_mortalidad < 3 ? 'badge-success' :
                      item.metricas.porcentaje_mortalidad < 5 ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {item.metricas.porcentaje_mortalidad}%
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      {item.metricas.tasa_supervivencia}%
                    </span>
                  </td>
                  <td>{item.metricas.peso_promedio_g} g</td>
                  <td>
                    <span className={`badge ${
                      item.metricas.conversion <= 2.5 ? 'badge-success' :
                      item.metricas.conversion <= 3.0 ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {item.metricas.conversion}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      item.metricas.eficiencia === 'Excelente' ? 'badge-success' :
                      item.metricas.eficiencia === 'Buena' ? 'badge-info' :
                      item.metricas.eficiencia === 'Regular' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {item.metricas.eficiencia}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Consumo */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consumo de Alimento por Galpón</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="consumo" fill="#f59e0b" name="Consumo Total (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Conversion por Galpón</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="conversion" stroke="#15803d" strokeWidth={2} name="Conversion" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
        </div>
      )}

      {/* Tab de Comparación Personalizada */}
      {tabActiva === 'personalizada' && (
        <div>
          {/* Controles de Selección */}
          <div className="card mb-2">
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Configurar Comparación</h3>

            <div className="grid grid-2" style={{ gap: '24px' }}>
              {/* Columna 1 */}
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ marginBottom: '12px', color: '#3b82f6', fontSize: '16px' }}>Primer Galpón / Período</h4>

                <div className="form-group">
                  <label className="form-label">Galpón</label>
                  <select
                    className="form-control"
                    value={galpon1}
                    onChange={(e) => setGalpon1(e.target.value)}
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
                  <label className="form-label">Rango de Tiempo</label>
                  <select
                    className="form-control"
                    value={rango1}
                    onChange={(e) => setRango1(e.target.value)}
                  >
                    <option value="ultima_semana">Última Semana</option>
                    <option value="ultimo_mes">Último Mes</option>
                    <option value="ultimos_3_meses">Últimos 3 Meses</option>
                    <option value="personalizado">Rango Personalizado</option>
                  </select>
                </div>

                {rango1 === 'personalizado' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Fecha Inicio</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechasCustom1.inicio}
                        onChange={(e) => setFechasCustom1({ ...fechasCustom1, inicio: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha Fin</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechasCustom1.fin}
                        onChange={(e) => setFechasCustom1({ ...fechasCustom1, fin: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 2 */}
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ marginBottom: '12px', color: '#10b981', fontSize: '16px' }}>Segundo Galpón / Período (opcional)</h4>

                <div className="form-group">
                  <label className="form-label">Galpón</label>
                  <select
                    className="form-control"
                    value={galpon2}
                    onChange={(e) => setGalpon2(e.target.value)}
                  >
                    <option value="">Ninguno (omitir comparación)</option>
                    {galpones.map(g => (
                      <option key={g.id} value={g.id}>
                        Galpón {g.numero} - {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {galpon2 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Rango de Tiempo</label>
                      <select
                        className="form-control"
                        value={rango2}
                        onChange={(e) => setRango2(e.target.value)}
                      >
                        <option value="ultima_semana">Última Semana</option>
                        <option value="ultimo_mes">Último Mes</option>
                        <option value="ultimos_3_meses">Últimos 3 Meses</option>
                        <option value="personalizado">Rango Personalizado</option>
                      </select>
                    </div>

                    {rango2 === 'personalizado' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Fecha Inicio</label>
                          <input
                            type="date"
                            className="form-control"
                            value={fechasCustom2.inicio}
                            onChange={(e) => setFechasCustom2({ ...fechasCustom2, inicio: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fecha Fin</label>
                          <input
                            type="date"
                            className="form-control"
                            value={fechasCustom2.fin}
                            onChange={(e) => setFechasCustom2({ ...fechasCustom2, fin: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={realizarComparacionPersonalizada}
                disabled={cargandoPersonalizada}
                style={{ padding: '12px 32px', fontSize: '16px' }}
              >
                {cargandoPersonalizada ? 'Cargando...' : 'Comparar'}
              </button>
            </div>
          </div>

          {/* Resultados de la Comparación */}
          {comparacionPersonalizada && comparacionPersonalizada.comparacion_1 && comparacionPersonalizada.comparacion_1.metricas && (
            <>
              {/* Bloques de Información - EN LA PARTE SUPERIOR */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Información Clave</h3>

                <div className="grid grid-3" style={{ gap: '16px', marginBottom: '16px' }}>
                  {/* Mortalidad */}
                  <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#78716c', marginBottom: '8px' }}>MORTALIDAD</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                            {comparacionPersonalizada.comparacion_1.galpon.nombre}
                          </p>
                          <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#ef4444' }}>
                            {comparacionPersonalizada.comparacion_1.metricas.porcentaje_mortalidad}%
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            {comparacionPersonalizada.comparacion_1.metricas.mortalidad_total} aves
                          </p>
                        </div>
                        {comparacionPersonalizada.comparacion_2 && comparacionPersonalizada.comparacion_2.metricas && (
                          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                              {comparacionPersonalizada.comparacion_2.galpon.nombre}
                            </p>
                            <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#ef4444' }}>
                              {comparacionPersonalizada.comparacion_2.metricas.porcentaje_mortalidad}%
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              {comparacionPersonalizada.comparacion_2.metricas.mortalidad_total} aves
                            </p>
                          </div>
                        )}
                      </div>
                      {comparacionPersonalizada.comparacion_2 && comparacionPersonalizada.comparacion_2.metricas && (
                        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                          {comparacionPersonalizada.comparacion_1.metricas.porcentaje_mortalidad < comparacionPersonalizada.comparacion_2.metricas.porcentaje_mortalidad ? (
                            <p style={{ margin: 0, fontSize: '13px', color: '#059669' }}>
                              <FaArrowDown style={{ marginRight: '4px' }} />
                              {(comparacionPersonalizada.comparacion_2.metricas.porcentaje_mortalidad - comparacionPersonalizada.comparacion_1.metricas.porcentaje_mortalidad).toFixed(2)}% menos mortalidad
                            </p>
                          ) : comparacionPersonalizada.comparacion_1.metricas.porcentaje_mortalidad > comparacionPersonalizada.comparacion_2.metricas.porcentaje_mortalidad ? (
                            <p style={{ margin: 0, fontSize: '13px', color: '#dc2626' }}>
                              <FaArrowUp style={{ marginRight: '4px' }} />
                              {(comparacionPersonalizada.comparacion_1.metricas.porcentaje_mortalidad - comparacionPersonalizada.comparacion_2.metricas.porcentaje_mortalidad).toFixed(2)}% más mortalidad
                            </p>
                          ) : (
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                              <FaEquals style={{ marginRight: '4px' }} />
                              Igual mortalidad
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Peso Promedio */}
                  <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#78716c', marginBottom: '8px' }}>PESO PROMEDIO</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                            {comparacionPersonalizada.comparacion_1.galpon.nombre}
                          </p>
                          <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#f59e0b' }}>
                            {comparacionPersonalizada.comparacion_1.metricas.peso_promedio_periodo_g} g
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            Ganancia: {comparacionPersonalizada.comparacion_1.metricas.ganancia_peso_g} g
                          </p>
                        </div>
                        {comparacionPersonalizada.comparacion_2 && comparacionPersonalizada.comparacion_2.metricas && (
                          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                              {comparacionPersonalizada.comparacion_2.galpon.nombre}
                            </p>
                            <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#f59e0b' }}>
                              {comparacionPersonalizada.comparacion_2.metricas.peso_promedio_periodo_g} g
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              Ganancia: {comparacionPersonalizada.comparacion_2.metricas.ganancia_peso_g} g
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consumo */}
                  <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#78716c', marginBottom: '8px' }}>CONSUMO DE ALIMENTO</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                            {comparacionPersonalizada.comparacion_1.galpon.nombre}
                          </p>
                          <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#3b82f6' }}>
                            {comparacionPersonalizada.comparacion_1.metricas.consumo_total_kg} kg
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            {comparacionPersonalizada.comparacion_1.metricas.consumo_promedio_dia} kg/día
                          </p>
                        </div>
                        {comparacionPersonalizada.comparacion_2 && comparacionPersonalizada.comparacion_2.metricas && (
                          <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '12px' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                              {comparacionPersonalizada.comparacion_2.galpon.nombre}
                            </p>
                            <h3 style={{ margin: '4px 0', fontSize: '24px', color: '#3b82f6' }}>
                              {comparacionPersonalizada.comparacion_2.metricas.consumo_total_kg} kg
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              {comparacionPersonalizada.comparacion_2.metricas.consumo_promedio_dia} kg/día
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fila adicional de métricas */}
                <div className="grid grid-4" style={{ gap: '16px' }}>
                  {/* Conversion */}
                  <div className="card">
                    <div style={{ padding: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78716c', marginBottom: '4px' }}>Conversion</p>
                      <h4 style={{ margin: '0', fontSize: '20px' }}>
                        {comparacionPersonalizada.comparacion_1.metricas.conversion}
                      </h4>
                      <span className={`badge ${
                        comparacionPersonalizada.comparacion_1.metricas.conversion <= 2.5 ? 'badge-success' :
                        comparacionPersonalizada.comparacion_1.metricas.conversion <= 3.0 ? 'badge-warning' :
                        'badge-danger'
                      }`} style={{ fontSize: '11px', marginTop: '4px' }}>
                        {comparacionPersonalizada.comparacion_1.metricas.eficiencia}
                      </span>
                    </div>
                  </div>

                  {/* Supervivencia */}
                  <div className="card">
                    <div style={{ padding: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78716c', marginBottom: '4px' }}>Supervivencia</p>
                      <h4 style={{ margin: '0', fontSize: '20px', color: '#059669' }}>
                        {comparacionPersonalizada.comparacion_1.metricas.tasa_supervivencia}%
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                        {comparacionPersonalizada.comparacion_1.metricas.aves_fin_periodo} aves
                      </p>
                    </div>
                  </div>

                  {/* Días con Datos */}
                  <div className="card">
                    <div style={{ padding: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78716c', marginBottom: '4px' }}>Días con Datos</p>
                      <h4 style={{ margin: '0', fontSize: '20px' }}>
                        {comparacionPersonalizada.comparacion_1.dias_con_datos}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                        Edad: {comparacionPersonalizada.comparacion_1.metricas.edad_inicio} - {comparacionPersonalizada.comparacion_1.metricas.edad_fin} días
                      </p>
                    </div>
                  </div>

                  {/* Promedio Mortalidad Diaria */}
                  <div className="card">
                    <div style={{ padding: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78716c', marginBottom: '4px' }}>Mortalidad/Día</p>
                      <h4 style={{ margin: '0', fontSize: '20px' }}>
                        {comparacionPersonalizada.comparacion_1.metricas.mortalidad_promedio_dia}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                        aves por día
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICAS EN LA PARTE INFERIOR */}
              {comparacionPersonalizada.comparacion_2 && comparacionPersonalizada.comparacion_2.metricas && (
                <div className="grid grid-2" style={{ gap: '16px' }}>
                  {/* Gráfica de Mortalidad */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Mortalidad a lo Largo del Tiempo</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        ...comparacionPersonalizada.comparacion_1.registros.map(r => ({
                          fecha: r.fecha,
                          [`${comparacionPersonalizada.comparacion_1.galpon.nombre}`]: r.mortalidad
                        })),
                        ...comparacionPersonalizada.comparacion_2.registros.map(r => ({
                          fecha: r.fecha,
                          [`${comparacionPersonalizada.comparacion_2.galpon.nombre}`]: r.mortalidad
                        }))
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={comparacionPersonalizada.comparacion_1.galpon.nombre}
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey={comparacionPersonalizada.comparacion_2.galpon.nombre}
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfica de Peso */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Peso Promedio a lo Largo del Tiempo</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        ...comparacionPersonalizada.comparacion_1.registros.map(r => ({
                          fecha: r.fecha,
                          [`${comparacionPersonalizada.comparacion_1.galpon.nombre}`]: r.peso_promedio
                        })),
                        ...comparacionPersonalizada.comparacion_2.registros.map(r => ({
                          fecha: r.fecha,
                          [`${comparacionPersonalizada.comparacion_2.galpon.nombre}`]: r.peso_promedio
                        }))
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={comparacionPersonalizada.comparacion_1.galpon.nombre}
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey={comparacionPersonalizada.comparacion_2.galpon.nombre}
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {comparacionPersonalizada && !comparacionPersonalizada.comparacion_1.metricas && (
            <div className="card">
              <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                No hay datos disponibles para el período seleccionado
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparacionGalpones;
