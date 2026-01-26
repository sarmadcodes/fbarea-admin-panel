import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      console.log('Dashboard Stats:', data); // Debug log
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  const cards = [
    { 
      label: 'Total Users', 
      value: stats?.users?.data?.totalUsers || 0, 
      color: '',
      icon: '👥'
    },
    { 
      label: 'Pending Approvals', 
      value: stats?.users?.data?.pendingUsers || 0, 
      color: '',
      icon: '⏳'
    },
    { 
      label: 'Pending Complaints', 
      value: stats?.complaints?.data?.pending || 0, 
      color: '',
      icon: '📢'
    },
    { 
      label: 'Pending Payments', 
      value: stats?.payments?.data?.overview?.pending || 0, 
      color: '',
      icon: '💰'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your society management</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className={`${card.color} w-14 h-14 rounded-full mb-4 flex items-center justify-center text-white text-2xl`}>
              {card.icon}
            </div>
            <h3 className="text-gray-600 text-sm mb-1 font-medium">{card.label}</h3>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">User Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="font-bold text-lg">{stats?.users?.data?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-bold text-green-600">{stats?.users?.data?.approvedUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">{stats?.users?.data?.pendingUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Suspended</span>
              <span className="font-bold text-red-600">{stats?.users?.data?.suspendedUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600">Total Vehicles</span>
              <span className="font-bold">{stats?.users?.data?.totalVehicles || 0}</span>
            </div>
          </div>
        </div>

        {/* Complaint Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Complaint Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Complaints</span>
              <span className="font-bold text-lg">{stats?.complaints?.data?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">{stats?.complaints?.data?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Progress</span>
              <span className="font-bold text-blue-600">{stats?.complaints?.data?.inProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Resolved</span>
              <span className="font-bold text-green-600">{stats?.complaints?.data?.resolved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-bold text-red-600">{stats?.complaints?.data?.rejected || 0}</span>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Payment Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Payments</span>
              <span className="font-bold text-lg">{stats?.payments?.data?.overview?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-bold text-yellow-600">{stats?.payments?.data?.overview?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Submitted</span>
              <span className="font-bold text-blue-600">{stats?.payments?.data?.overview?.submitted || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-bold text-green-600">{stats?.payments?.data?.overview?.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rejected</span>
              <span className="font-bold text-red-600">{stats?.payments?.data?.overview?.rejected || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600">Total Collected</span>
              <span className="font-bold text-green-600">Rs. {(stats?.payments?.data?.amounts?.totalCollected || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}