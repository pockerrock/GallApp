import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Servicios específicos

export const authService = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (datos) => api.post('/register', datos),
  getProfile: () => api.get('/profile')
};

export const galponesService = {
  listar: (params) => api.get('/galpones', { params }),
  obtener: (id) => api.get(`/galpones/${id}`),
  resumen: (id) => api.get(`/galpones/${id}/resumen`),
  crear: (datos) => api.post('/galpones', datos),
  actualizar: (id, datos) => api.put(`/galpones/${id}`, datos),
  eliminar: (id) => api.delete(`/galpones/${id}`),
  dividir: (id, avesA) => api.post(`/galpones/${id}/dividir`, { aves_division_a: avesA })
};

export const registrosService = {
  listar: (params) => api.get('/registros', { params }),
  obtener: (id) => api.get(`/registros/${id}`),
  crear: (datos) => api.post('/registros', datos),
  actualizar: (id, datos) => api.put(`/registros/${id}`, datos),
  eliminar: (id) => api.delete(`/registros/${id}`),
  sincronizar: (registros) => api.post('/registros/sincronizar', { registros })
};

export const inventarioService = {
  obtener: (params) => api.get('/inventario', { params }),
  movimientos: (params) => api.get('/inventario/movimientos', { params }),
  registrarMovimiento: (datos) => api.post('/inventario/movimiento', datos),
  lotes: (params) => api.get('/inventario/lotes', { params }),
  crearLote: (datos) => api.post('/inventario/lotes', datos)
};

export const alertasService = {
  listar: (params) => api.get('/alertas', { params }),
  obtener: (id) => api.get(`/alertas/${id}`),
  crear: (datos) => api.post('/alertas', datos),
  resolver: (id) => api.put(`/alertas/${id}/resolver`),
  eliminar: (id) => api.delete(`/alertas/${id}`)
};

export const dashboardService = {
  kpis: (params) => api.get('/dashboard/kpis', { params }),
  graficas: (params) => api.get('/dashboard/graficas', { params }),
  resumenGranjas: () => api.get('/dashboard/resumen-granjas'),
  comparacionGalpones: (params) => api.get('/dashboard/comparacion-galpones', { params }),
  comparacionPersonalizada: (params) => api.get('/dashboard/comparacion-personalizada', { params })
};

export const actividadesService = {
  listar: (params) => api.get('/actividades', { params }),
  obtener: (id) => api.get(`/actividades/${id}`),
  proximas: () => api.get('/actividades/proximas'),
  crear: (datos) => api.post('/actividades', datos),
  actualizar: (id, datos) => api.put(`/actividades/${id}`, datos),
  completar: (id) => api.put(`/actividades/${id}/completar`),
  eliminar: (id) => api.delete(`/actividades/${id}`)
};

export const bodegasService = {
  listar: (params) => api.get('/bodegas', { params }),
  obtener: (id) => api.get(`/bodegas/${id}`),
  crear: (datos) => api.post('/bodegas', datos),
  actualizar: (id, datos) => api.put(`/bodegas/${id}`, datos)
};

export const gasService = {
  listar: (params) => api.get('/gas', { params }),
  obtener: (id) => api.get(`/gas/${id}`),
  crear: (datos) => api.post('/gas', datos),
  actualizar: (id, datos) => api.put(`/gas/${id}`, datos)
};

export const tamoService = {
  listar: (params) => api.get('/tamo', { params }),
  obtener: (id) => api.get(`/tamo/${id}`),
  crear: (datos) => api.post('/tamo', datos),
  actualizar: (id, datos) => api.put(`/tamo/${id}`, datos)
};

export const desacoseService = {
  listar: (params) => api.get('/desacose', { params }),
  obtener: (id) => api.get(`/desacose/${id}`),
  crear: (datos) => api.post('/desacose', datos)
};
