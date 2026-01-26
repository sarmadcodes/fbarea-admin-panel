import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'https://fbareaapi.systopos.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (credentials) => api.post('/admin/auth/login', credentials);
export const getAdminProfile = () => api.get('/admin/auth/me');

// Dashboard
export const getDashboardStats = async () => {
  try {
    const [users, complaints, payments] = await Promise.all([
      api.get('/admin/users/stats'),
      api.get('/admin/complaints/stats'),
      api.get('/admin/payments/stats/overview')
    ]);
    
    return { 
      users: users.data, 
      complaints: complaints.data, 
      payments: payments.data 
    };
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    throw error;
  }
};

// Users
export const getUsers = (params) => api.get('/admin/users', { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const approveUser = (id) => api.put(`/admin/users/${id}/approve`);
export const rejectUser = (id, data) => api.put(`/admin/users/${id}/reject`, data);
export const suspendUser = (id, data) => api.put(`/admin/users/${id}/suspend`, data);
export const activateUser = (id) => api.put(`/admin/users/${id}/activate`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Complaints
export const getComplaints = (params) => api.get('/admin/complaints', { params });
export const getComplaintById = (id) => api.get(`/admin/complaints/${id}`);
export const updateComplaintStatus = (id, data) => api.put(`/admin/complaints/${id}/status`, data);
export const deleteComplaint = (id) => api.delete(`/admin/complaints/${id}`);

// Payments
export const getPayments = (params) => api.get('/admin/payments', { params });
export const getPaymentById = (id) => api.get(`/admin/payments/${id}`);
export const approvePayment = (id, data) => api.put(`/admin/payments/${id}/approve`, data);
export const rejectPayment = (id, data) => api.put(`/admin/payments/${id}/reject`, data);

// Vehicles
export const getAllVehicles = () => api.get('/admin/vehicles/all');
export const getVehicleRequests = (params) => api.get('/admin/vehicles/change-requests/all', { params });
export const approveVehicleRequest = (id) => api.put(`/admin/vehicles/change-requests/${id}/approve`);
export const rejectVehicleRequest = (id, data) => api.put(`/admin/vehicles/change-requests/${id}/reject`, data);

// Announcements
export const getAnnouncements = (params) => api.get('/admin/announcements', { params });
export const createAnnouncement = (data) => api.post('/admin/announcements', data);
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`);

// Digital Cards
export const getDigitalCards = (params) => api.get('/admin/digital-cards', { params });
export const getDigitalCardById = (id) => api.get(`/admin/digital-cards/${id}`);
export const approveDigitalCard = (id, data) => api.put(`/admin/digital-cards/${id}/approve`, data);
export const rejectDigitalCard = (id, data) => api.put(`/admin/digital-cards/${id}/reject`, data);
export const suspendDigitalCard = (id, data) => api.put(`/admin/digital-cards/${id}/suspend`, data);
export const reactivateDigitalCard = (id, data) => api.put(`/admin/digital-cards/${id}/reactivate`, data);
export const deleteDigitalCard = (id) => api.delete(`/admin/digital-cards/${id}`);
export const getDigitalCardStats = () => api.get('/admin/digital-cards/stats/overview');

export default api;