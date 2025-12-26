import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FaHome,
  FaWarehouse,
  FaClipboardList,
  FaBoxes,
  FaBell,
  FaSignOutAlt,
  FaUser,
  FaChartBar,
  FaCalendarAlt,
  FaFire,
  FaLayerGroup,
  FaExchangeAlt
} from 'react-icons/fa';
import './Layout.css';

const Layout = () => {
  const { usuario, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Dashboard' },
    { path: '/galpones', icon: <FaWarehouse />, label: 'Galpones' },
    { path: '/comparacion', icon: <FaChartBar />, label: 'Comparación' },
    { path: '/calendario', icon: <FaCalendarAlt />, label: 'Calendario' },
    { path: '/registros', icon: <FaClipboardList />, label: 'Registros' },
    { path: '/inventario', icon: <FaBoxes />, label: 'Inventario' },

    { path: '/gas', icon: <FaFire />, label: 'Consumo Gas' },
    { path: '/tamo', icon: <FaLayerGroup />, label: 'Tamo' },
    { path: '/desacose', icon: <FaExchangeAlt />, label: 'Desacose' },
    { path: '/alertas', icon: <FaBell />, label: 'Alertas' }
  ];

  const esRutaActiva = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">🐔 GallinaApp</h1>
          <p className="sidebar-subtitle">Gestión Avícola</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${esRutaActiva(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FaUser className="user-icon" />
            <div className="user-details">
              <p className="user-name">{usuario?.nombre}</p>
              <p className="user-role">{usuario?.rol}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-logout">
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
