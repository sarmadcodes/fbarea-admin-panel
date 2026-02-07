import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getUsers, getComplaints, getPayments, getVehicleRequests, getDigitalCardStats, getGuestRequestStats } from '../services/api';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    pendingUsers: 0,
    approvedUsers: 0,
    suspendedUsers: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    rejectedComplaints: 0,
    pendingPayments: 0,
    submittedPayments: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    pendingVehicles: 0,
    pendingCards: 0,
    approvedCards: 0,
    suspendedCards: 0,
    pendingGuests: 0,
    approvedGuests: 0,
    rejectedGuests: 0,
    expiredGuests: 0,
  });
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Auto-open dropdown based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/residents')) {
      setOpenDropdown('residents');
    } else if (path.includes('/complaints')) {
      setOpenDropdown('complaints');
    } else if (path.includes('/payments')) {
      setOpenDropdown('payments');
    } else if (path.includes('/vehicle-requests')) {
      setOpenDropdown('vehicle-requests');
    } else if (path.includes('/digital-cards')) {
      setOpenDropdown('digital-cards');
    } else if (path.includes('/guest-requests')) {
      setOpenDropdown('guest-requests');
    } else if (path.includes('/deal')) {
      setOpenDropdown('deals');
    }
  }, [location.pathname]);

  const fetchStats = async () => {
    try {
      const [users, complaints, payments, vehicles, cards, guestRequests] = await Promise.all([
        getUsers({ status: 'all' }).catch(() => ({ data: { data: [] } })),
        getComplaints({ status: 'all' }).catch(() => ({ data: { data: [] } })),
        getPayments({ status: 'all' }).catch(() => ({ data: { data: [] } })),
        getVehicleRequests({ status: 'all' }).catch(() => ({ data: { data: [] } })),
        getDigitalCardStats().catch(() => ({ data: { data: { pending: 0, approved: 0, suspended: 0 } } })),
        getGuestRequestStats().catch(() => ({ data: { data: { pending: 0, approved: 0, rejected: 0, expired: 0 } } })),
      ]);

      const allUsers = users.data.data || [];
      const allComplaints = complaints.data.data || [];
      const allPayments = payments.data.data || [];
      const allVehicles = vehicles.data.data || [];
      const cardStats = cards.data.data || {};
      const guestStats = guestRequests.data.data || {};

      setStats({
        pendingUsers: allUsers.filter(u => u.accountStatus === 'pending').length,
        approvedUsers: allUsers.filter(u => u.accountStatus === 'approved').length,
        suspendedUsers: allUsers.filter(u => u.accountStatus === 'suspended').length,
        pendingComplaints: allComplaints.filter(c => c.status === 'pending').length,
        inProgressComplaints: allComplaints.filter(c => c.status === 'in_progress').length,
        resolvedComplaints: allComplaints.filter(c => c.status === 'resolved').length,
        rejectedComplaints: allComplaints.filter(c => c.status === 'rejected').length,
        pendingPayments: allPayments.filter(p => p.status === 'pending').length,
        submittedPayments: allPayments.filter(p => p.status === 'submitted').length,
        approvedPayments: allPayments.filter(p => p.status === 'approved').length,
        rejectedPayments: allPayments.filter(p => p.status === 'rejected').length,
        pendingVehicles: allVehicles.filter(v => v.status === 'pending').length,
        pendingCards: cardStats.pending || 0,
        approvedCards: cardStats.approved || 0,
        suspendedCards: cardStats.suspended || 0,
        pendingGuests: guestStats.pending || 0,
        approvedGuests: guestStats.approved || 0,
        rejectedGuests: guestStats.rejected || 0,
        expiredGuests: guestStats.expired || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/',
    },
    {
      id: 'residents',
      label: 'Residents',
      hasDropdown: true,
      items: [
        { label: 'All Residents', path: '/residents?tab=all', count: 0 },
        { label: 'Pending Approvals', path: '/residents?tab=pending', count: stats.pendingUsers },
        { label: 'Approved Residents', path: '/residents?tab=approved', count: stats.approvedUsers },
        { label: 'Suspended Users', path: '/residents?tab=suspended', count: stats.suspendedUsers },
      ],
    },
    {
      id: 'complaints',
      label: 'Complaints',
      hasDropdown: true,
      items: [
        { label: 'All Complaints', path: '/complaints?tab=all', count: 0 },
        { label: 'Pending', path: '/complaints?tab=pending', count: stats.pendingComplaints },
        { label: 'In Progress', path: '/complaints?tab=in_progress', count: stats.inProgressComplaints },
        { label: 'Resolved', path: '/complaints?tab=resolved', count: stats.resolvedComplaints },
        { label: 'Rejected', path: '/complaints?tab=rejected', count: stats.rejectedComplaints },
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      hasDropdown: true,
      items: [
        { label: 'All Payments', path: '/payments?tab=all', count: 0 },
        { label: 'Pending', path: '/payments?tab=pending', count: stats.pendingPayments },
        { label: 'Submitted', path: '/payments?tab=submitted', count: stats.submittedPayments },
        { label: 'Approved', path: '/payments?tab=approved', count: stats.approvedPayments },
        { label: 'Rejected', path: '/payments?tab=rejected', count: stats.rejectedPayments },
      ],
    },
    {
      id: 'digital-cards',
      label: 'Digital Cards',
      hasDropdown: true,
      items: [
        { label: 'All Cards', path: '/digital-cards?tab=all', count: 0 },
        { label: 'Pending', path: '/digital-cards?tab=pending', count: stats.pendingCards },
        { label: 'Approved', path: '/digital-cards?tab=approved', count: stats.approvedCards },
        { label: 'Suspended', path: '/digital-cards?tab=suspended', count: stats.suspendedCards },
      ],
    },
    {
      id: 'guest-requests',
      label: 'Guest Requests',
      hasDropdown: true,
      items: [
        { label: 'All Requests', path: '/guest-requests?tab=all', count: 0 },
        { label: 'Pending', path: '/guest-requests?tab=pending', count: stats.pendingGuests },
        { label: 'Approved', path: '/guest-requests?tab=approved', count: stats.approvedGuests },
        { label: 'Rejected', path: '/guest-requests?tab=rejected', count: stats.rejectedGuests },
        { label: 'Expired', path: '/guest-requests?tab=expired', count: stats.expiredGuests },
      ],
    },
    {
      id: 'announcements',
      label: 'Announcements',
      path: '/announcements',
    },
    {
      id: 'deals',
      label: 'Deals & Discounts',
      hasDropdown: true,
      items: [
        { label: 'Manage Deals', path: '/deals?tab=all', count: 0 },
        { label: 'Categories', path: '/deal-categories', count: 0 },
      ],
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      path: '/vehicles',
    },
    {
      id: 'vehicle-requests',
      label: 'Vehicle Requests',
      hasDropdown: true,
      items: [
        { label: 'Pending Requests', path: '/vehicle-requests?tab=pending', count: stats.pendingVehicles },
        { label: 'All Requests', path: '/vehicle-requests?tab=all', count: 0 },
      ],
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ backgroundColor: '#90EE90' }}>
          <h1 className="text-xl font-bold text-gray-800">FB Area Block 13</h1>
          <p className="text-sm text-gray-600">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <div key={item.id} className="mb-1">
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded hover:bg-gray-100 transition"
                  >
                    <span className="text-gray-700 font-bold">{item.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        openDropdown === item.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Items */}
                  {openDropdown === item.id && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.items.map((subItem, idx) => (
                        <NavLink
                          key={idx}
                          to={subItem.path}
                          className={({ isActive }) => {
                            const params = new URLSearchParams(location.search);
                            const currentTab = params.get('tab');
                            const linkParams = new URLSearchParams(subItem.path.split('?')[1]);
                            const linkTab = linkParams.get('tab');
                            const isTabActive = currentTab === linkTab && location.pathname === subItem.path.split('?')[0];
                            
                            return `flex items-center justify-between px-4 py-2 text-sm rounded transition ${
                              isTabActive ? 'bg-primary text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
                            }`;
                          }}
                        >
                          <span>{subItem.label}</span>
                          {subItem.count > 0 && (
                            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                              {subItem.count}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded transition font-bold ${
                      isActive ? 'bg-primary text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span>{item.label}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded transition font-bold"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}