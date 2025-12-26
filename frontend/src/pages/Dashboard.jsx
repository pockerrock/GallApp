import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, alertasService } from '../services/api';
import { FaSkullCrossbones, FaDrumstickBite, FaExclamationTriangle } from 'react-icons/fa';
import { GiChicken } from 'react-icons/gi';
import './Dashboard.css';

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [kpisRes, alertasRes] = await Promise.all([
        dashboardService.kpis(),
        alertasService.listar({ atendida: false, limit: 5 })
      ]);
      setKpis(kpisRes.data.kpis);
      setAlertas(alertasRes.data.alertas);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const tarjetasKPI = [
    {
      titulo: 'Galpones Activos',
      valor: kpis?.galpones_activos || 0,
      icon: <GiChicken />,
      color: '#15803d' // Verde granja
    },
    {
      titulo: 'Aves Totales',
      valor: kpis?.saldo_actual_total?.toLocaleString('es-ES') || 0,
      icon: <FaDrumstickBite />,
      color: '#16a34a' // Verde éxito
    },
    {
      titulo: 'Mortalidad Total',
      valor: `${kpis?.porcentaje_mortalidad || 0}%`,
      icon: <FaSkullCrossbones />,
      color: kpis?.porcentaje_mortalidad > 5 ? '#dc2626' : '#ea580c' // Rojo o naranja
    },
    {
      titulo: 'Conversion',
      valor: kpis?.conversion || 0,
      icon: <FaDrumstickBite />,
      color: '#f59e0b' // Amarillo maíz
    }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen general de la granja</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-4">
        {tarjetasKPI.map((tarjeta, index) => (
          <div key={index} className="kpi-card" style={{ borderLeftColor: tarjeta.color }}>
            <div className="kpi-icon" style={{ color: tarjeta.color }}>
              {tarjeta.icon}
            </div>
            <div className="kpi-content">
              <p className="kpi-label">{tarjeta.titulo}</p>
              <h2 className="kpi-value">{tarjeta.valor}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Estadísticas generales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Estadísticas Generales</h3>
          </div>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Aves Iniciales:</span>
              <span className="stat-value">{kpis?.aves_iniciales_totales?.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Consumo Total:</span>
              <span className="stat-value">{kpis?.consumo_total_kg} kg</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peso Promedio:</span>
              <span className="stat-value">{kpis?.peso_promedio_global_g} g</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Inventario Alimento:</span>
              <span className="stat-value">{kpis?.inventario_total_kg} kg</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Stock Bajo:</span>
              <span className="stat-value badge badge-warning">{kpis?.lotes_stock_bajo} lotes</span>
            </div>
          </div>
        </div>

        {/* Alertas recientes */}
        <div className="card">
          <div className="card-header flex-between">
            <h3 className="card-title">Alertas Activas</h3>
            <Link to="/alertas" className="btn btn-sm btn-outline">Ver todas</Link>
          </div>
          {alertas.length === 0 ? (
            <p className="text-center" style={{ padding: '20px', color: '#6b7280' }}>
              No hay alertas activas
            </p>
          ) : (
            <div className="alertas-list">
              {alertas.map((alerta) => (
                <div key={alerta.id} className={`alerta-item alerta-${alerta.severidad}`}>
                  <div className="alerta-icon">
                    <FaExclamationTriangle />
                  </div>
                  <div className="alerta-content">
                    <p className="alerta-tipo">{alerta.tipo}</p>
                    <p className="alerta-mensaje">{alerta.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Accesos Rápidos</h3>
        </div>
        <div className="grid grid-4">
          <Link to="/galpones" className="quick-link">
            <GiChicken />
            <span>Ver Galpones</span>
          </Link>
          <Link to="/registros" className="quick-link">
            <span>📝</span>
            <span>Nuevo Registro</span>
          </Link>
          <Link to="/inventario" className="quick-link">
            <span>📦</span>
            <span>Inventario</span>
          </Link>
          <Link to="/alertas" className="quick-link">
            <FaExclamationTriangle />
            <span>Alertas ({kpis?.alertas_activas || 0})</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
