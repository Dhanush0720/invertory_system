import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const API = axios.create({ baseURL: BASE_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

export const itemsAPI = {
  getAll: (params) => API.get('/items', { params }),
  getOne: (id) => API.get(`/items/${id}`),
  create: (data) => API.post('/items', data),
  update: (id, data) => API.put(`/items/${id}`, data),
  delete: (id) => API.delete(`/items/${id}`),
  bulkImport: (items) => API.post('/items/bulk-import', { items }),
};

export const distributionsAPI = {
  getAll: (params) => API.get('/distributions', { params }),
  create: (data) => API.post('/distributions', data),
  delete: (id) => API.delete(`/distributions/${id}`),
  returnItem: (id, quantityReturned) => API.post(`/distributions/${id}/return`, { quantityReturned }),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats'),
};

export const alertsAPI = {
  getActive: () => API.get('/alerts'),
  resolve: (id) => API.post(`/alerts/${id}/resolve`),
  ask: (question) => API.post('/alerts/ask', { question }),
};

export const masterAPI = {
  getAll: (type) => API.get(`/master/${type}`),
  create: (type, data) => API.post(`/master/${type}`, data),
  update: (type, id, data) => API.put(`/master/${type}/${id}`, data),
  delete: (type, id) => API.delete(`/master/${type}/${id}`),
  getSuggestions: () => API.get('/master/data/suggestions'),
};

export const agentsAPI = {
  vision: (base64Image, mimeType) => API.post('/agents/vision', { base64Image, mimeType }),
  getForecast: () => API.get('/agents/forecast'),
};

export default API;
