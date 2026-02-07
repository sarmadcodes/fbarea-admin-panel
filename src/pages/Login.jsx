import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminLogin } from '../services/api';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cnicNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Format CNIC with automatic dashes: 42201-1111111-1
  const formatCNIC = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Apply formatting based on length
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
    }
  };

  const handleCNICChange = (e) => {
    const formatted = formatCNIC(e.target.value);
    setFormData({ ...formData, cnicNumber: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cnicNumber || !formData.password) {
      toast.error('Please enter both CNIC and password');
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin(formData);
      
      if (res.data.success) {
        // ✅ FIXED: Store token FIRST
        localStorage.setItem('adminToken', res.data.data.token);
        
        // ✅ FIXED: Show success message
        toast.success('Login successful!');
        
        // ✅ FIXED: Navigate immediately using window.location for hard refresh
        // This ensures App.jsx re-renders with the new auth state
        window.location.href = '/';
      } else {
        toast.error(res.data.message || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img 
              src={logo} 
              alt="FB Area Block 13 Logo" 
              className="h-16 sm:h-20 md:h-24 w-auto object-contain"
            />
          </div>
          <p className="text-gray-600 text-base sm:text-lg font-bold">Admin Panel Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CNIC Number
            </label>
            <input
              type="text"
              placeholder="42201-1111111-1"
              value={formData.cnicNumber}
              onChange={handleCNICChange}
              maxLength={15}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 mt-6"
            style={{ backgroundColor: '#90EE90' }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login to Admin Panel'
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>Secure Admin Access Only</p>
        </div>
      </div>
    </div>
  );
}