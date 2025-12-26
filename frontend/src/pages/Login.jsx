import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // Trim email to avoid whitespace issues
      const resultado = await login(email.trim(), password);

      if (resultado.success) {
        toast.success('¡Bienvenido a GallinaApp!');
        navigate('/');
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-form-container">
        <div className="logo-container">
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 2 C8 2, 6 6, 6 9 C6 12, 8 14, 12 18 C16 14, 18 12, 18 9 C18 6, 16 2, 12 2 Z" />
          </svg>
          <h1>farmi.app</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="login-button"
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default Login;
