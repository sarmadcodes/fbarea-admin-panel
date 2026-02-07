import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://api.fbareaadmin.cloud/api';

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
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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

// Guest Requests
export const getGuestRequests = (params) => api.get('/admin/guest-requests', { params });
export const getGuestRequestById = (id) => api.get(`/admin/guest-requests/${id}`);
export const approveGuestRequest = (id) => api.put(`/admin/guest-requests/${id}/approve`);
export const rejectGuestRequest = (id, data) => api.put(`/admin/guest-requests/${id}/reject`, data);
export const deleteGuestRequest = (id) => api.delete(`/admin/guest-requests/${id}`);
export const getGuestRequestStats = () => api.get('/admin/guest-requests/stats');

// ========================================
// DEALS & DISCOUNTS
// ========================================

// Deals
export const getDeals = (params) => api.get('/admin/deals', { params });
export const getDealById = (id) => api.get(`/admin/deals/${id}`);
export const createDeal = (data) => {
  console.log('📤 [API] Creating deal with FormData:', data instanceof FormData);
  return api.post('/admin/deals', data);
};
export const updateDeal = (id, data) => {
  console.log('📤 [API] Updating deal with FormData:', data instanceof FormData);
  return api.put(`/admin/deals/${id}`, data);
};
export const deleteDeal = (id) => api.delete(`/admin/deals/${id}`);
export const toggleDealFeatured = (id) => api.patch(`/admin/deals/${id}/toggle-featured`);
export const toggleDealActive = (id) => api.patch(`/admin/deals/${id}/toggle-active`);
export const getDealStats = () => api.get('/admin/deals/stats');

// Deal Categories
export const getDealCategories = (params) => api.get('/admin/deal-categories', { params });
export const getDealCategoryById = (id) => api.get(`/admin/deal-categories/${id}`);
export const createDealCategory = (data) => api.post('/admin/deal-categories', data);
export const updateDealCategory = (id, data) => api.put(`/admin/deal-categories/${id}`, data);
export const deleteDealCategory = (id) => api.delete(`/admin/deal-categories/${id}`);
export const toggleCategoryActive = (id) => api.patch(`/admin/deal-categories/${id}/toggle-active`);

// Coupons
export const getCouponsByDeal = (dealId) => api.get(`/admin/deals/${dealId}/coupons`);
export const getCouponById = (id) => api.get(`/admin/deals/coupons/${id}`);
export const createCoupon = (dealId, data) => api.post(`/admin/deals/${dealId}/coupons`, data);
export const updateCoupon = (id, data) => api.put(`/admin/deals/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/admin/deals/coupons/${id}`);
export const toggleCouponActive = (id) => api.patch(`/admin/deals/coupons/${id}/toggle-active`);

export default api;