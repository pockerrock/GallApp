import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      cargarUsuario();
    } else {
      setCargando(false);
    }
  }, [token]);

  const cargarUsuario = async () => {
    try {
      const respuesta = await api.get('/profile');
      setUsuario(respuesta.data);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      logout();
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    try {
      const respuesta = await api.post('/login', { email, password });
      const { token, usuario } = respuesta.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUsuario(usuario);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (datos) => {
    try {
      const respuesta = await api.post('/register', datos);
      const { token, usuario } = respuesta.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUsuario(usuario);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrar usuario'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  };

  const value = {
    usuario,
    cargando,
    login,
    register,
    logout,
    estaAutenticado: !!usuario
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
