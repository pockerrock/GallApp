import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { galponesService, dashboardService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaArrowLeft } from 'react-icons/fa';

const GalponDetalle = () => {
  const { id } = useParams();
  const [resumen, setResumen] = useState(null);
  const [graficas, setGraficas] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const [resumenRes, graficasRes] = await Promise.all([
        galponesService.resumen(id),
        dashboardService.graficas({ galpon_id: id })
      ]);
      setResumen(resumenRes.data);
      setGraficas(graficasRes.data.graficas);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="page">
      <div className="flex-between mb-3">
        <div>
          <Link to="/galpones" className="btn btn-outline btn-sm"><FaArrowLeft /> Volver</Link>
          <h1 style={{ marginTop: '12px' }}>Galpón {resumen?.galpon.numero}</h1>
          <p>{resumen?.galpon.nombre} - Lote {resumen?.galpon.lote}</p>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="kpi-card" style={{ borderLeftColor: '#2563eb' }}>
          <div className="kpi-content">
            <p className="kpi-label">Edad Actual</p>
            <h2 className="kpi-value">{resumen?.estadisticas.edad_actual} días</h2>
          </div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="kpi-content">
            <p className="kpi-label">Saldo Actual</p>
            <h2 className="kpi-value">{resumen?.estadisticas.saldo_actual.toLocaleString()}</h2>
          </div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="kpi-content">
            <p className="kpi-label">Mortalidad</p>
            <h2 className="kpi-value">{resumen?.estadisticas.porcentaje_mortalidad}%</h2>
          </div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="kpi-content">
            <p className="kpi-label">Conversion</p>
            <h2 className="kpi-value">{resumen?.estadisticas.conversion}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Peso vs Edad</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graficas?.peso_vs_edad || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="edad_dias" label={{ value: 'Edad (días)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Peso (g)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="peso_promedio" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consumo Acumulado</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graficas?.consumo_vs_edad || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="edad_dias" label={{ value: 'Edad (días)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Consumo (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="consumo_acumulado" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GalponDetalle;
