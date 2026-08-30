import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('college_rag_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('college_rag_token');
        localStorage.removeItem('college_rag_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, role = 'student') => api.post('/auth/register', { name, email, password, role }),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const chatApi = {
  askQuestion: (message, sessionId = null, category = null, department = null) =>
    api.post('/chat', { message, session_id: sessionId, category, department }),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
  submitFeedback: (messageId, rating, comment = null) =>
    api.post('/chat/feedback', { message_id: messageId, rating, comment }),
  getSuggestions: () => api.get('/chat/suggestions'),
};

export const documentApi = {
  getDocuments: (params) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  reprocessDocument: (id) => api.post(`/documents/${id}/reprocess`),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  getSourceUrl: (id) => `/api/documents/${id}/source`,
};

export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
};

export const healthApi = {
  getHealth: () => api.get('/health'),
};

export default api;
