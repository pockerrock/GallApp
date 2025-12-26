import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Galpones from './pages/Galpones';
import GalponDetalle from './pages/GalponDetalle';
import Registros from './pages/Registros';
import Inventario from './pages/Inventario';
import Alertas from './pages/Alertas';
import ComparacionGalpones from './pages/ComparacionGalpones';
import Calendario from './pages/Calendario';

import Gas from './pages/Gas';
import Tamo from './pages/Tamo';
import Desacose from './pages/Desacose';

// Layout
import Layout from './components/Layout';

// Componente para rutas protegidas
const RutaProtegida = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return estaAutenticado ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="galpones" element={<Galpones />} />
          <Route path="galpones/:id" element={<GalponDetalle />} />
          <Route path="comparacion" element={<ComparacionGalpones />} />
          <Route path="registros" element={<Registros />} />
          <Route path="inventario" element={<Inventario />} />

          <Route path="gas" element={<Gas />} />
          <Route path="tamo" element={<Tamo />} />
          <Route path="desacose" element={<Desacose />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="calendario" element={<Calendario />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
