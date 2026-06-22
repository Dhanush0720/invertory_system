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

import {
  mockAuthAPI,
  mockItemsAPI,
  mockDistributionsAPI,
  mockUsersAPI,
  mockDashboardAPI,
  mockAuditAPI,
  mockAlertsAPI,
  mockMasterAPI,
  mockAgentsAPI
} from './mockData';

const isDemo = () => localStorage.getItem('isDemo') === 'true';

export const authAPI = {
  login: (data) => isDemo() ? mockAuthAPI.login(data) : API.post('/auth/login', data),
  me: () => isDemo() ? mockAuthAPI.me() : API.get('/auth/me'),
};

export const itemsAPI = {
  getAll: (params) => isDemo() ? mockItemsAPI.getAll(params) : API.get('/items', { params }),
  getOne: (id) => isDemo() ? mockItemsAPI.getOne(id) : API.get(`/items/${id}`),
  create: (data) => isDemo() ? mockItemsAPI.create(data) : API.post('/items', data),
  update: (id, data) => isDemo() ? mockItemsAPI.update(id, data) : API.put(`/items/${id}`, data),
  delete: (id) => isDemo() ? mockItemsAPI.delete(id) : API.delete(`/items/${id}`),
  bulkImport: (items) => isDemo() ? mockItemsAPI.bulkImport(items) : API.post('/items/bulk-import', { items }),
};

export const distributionsAPI = {
  getAll: (params) => isDemo() ? mockDistributionsAPI.getAll(params) : API.get('/distributions', { params }),
  create: (data) => isDemo() ? mockDistributionsAPI.create(data) : API.post('/distributions', data),
  delete: (id) => isDemo() ? mockDistributionsAPI.delete(id) : API.delete(`/distributions/${id}`),
  returnItem: (id, quantityReturned) => isDemo() ? mockDistributionsAPI.returnItem(id, quantityReturned) : API.post(`/distributions/${id}/return`, { quantityReturned }),
};

export const usersAPI = {
  getAll: () => isDemo() ? mockUsersAPI.getAll() : API.get('/users'),
  create: (data) => isDemo() ? mockUsersAPI.create(data) : API.post('/users', data),
  update: (id, data) => isDemo() ? mockUsersAPI.update(id, data) : API.put(`/users/${id}`, data),
  delete: (id) => isDemo() ? mockUsersAPI.delete(id) : API.delete(`/users/${id}`),
};

export const dashboardAPI = {
  getStats: () => isDemo() ? mockDashboardAPI.getStats() : API.get('/dashboard/stats'),
};

export const auditAPI = {
  getAll: (params) => isDemo() ? mockAuditAPI.getAll(params) : API.get('/audit', { params }),
};

export const alertsAPI = {
  getActive: () => isDemo() ? mockAlertsAPI.getActive() : API.get('/alerts'),
  resolve: (id) => isDemo() ? mockAlertsAPI.resolve(id) : API.post(`/alerts/${id}/resolve`),
  ask: (question) => isDemo() ? mockAlertsAPI.ask(question) : API.post('/alerts/ask', { question }),
};

export const masterAPI = {
  getAll: (type) => isDemo() ? mockMasterAPI.getAll(type) : API.get(`/master/${type}`),
  create: (type, data) => isDemo() ? mockMasterAPI.create(type, data) : API.post(`/master/${type}`, data),
  update: (type, id, data) => isDemo() ? mockMasterAPI.update(type, id, data) : API.put(`/master/${type}/${id}`, data),
  delete: (type, id) => isDemo() ? mockMasterAPI.delete(type, id) : API.delete(`/master/${type}/${id}`),
  getSuggestions: () => isDemo() ? mockMasterAPI.getSuggestions() : API.get('/master/data/suggestions'),
};

export const agentsAPI = {
  vision: (base64Image, mimeType) => isDemo() ? mockAgentsAPI.vision(base64Image, mimeType) : API.post('/agents/vision', { base64Image, mimeType }),
  getForecast: () => isDemo() ? mockAgentsAPI.getForecast() : API.get('/agents/forecast'),
};

export default API;
