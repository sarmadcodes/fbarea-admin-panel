import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUsers, getUserById, approveUser, rejectUser, suspendUser, activateUser, deleteUser } from '../services/api';

export default function Residents() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  
  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setFilter(tab);
  }, [location]);

  useEffect(() => {
    if (abortController.current) {
      abortController.current.abort();
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [filter, search]);

  const fetchUsers = async () => {
    abortController.current = new AbortController();
    
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      
      const res = await getUsers(params);
      setUsers(res.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const res = await getUserById(userId);
      setSelectedUser(res.data.data);
      setViewModal(true);
    } catch (error) {
      toast.error('Failed to fetch user details');
    }
  };

  const handleAction = async (action, userId) => {
    try {
      if (action === 'approve') await approveUser(userId);
      else if (action === 'reject') await rejectUser(userId, { reason: 'Rejected by admin' });
      else if (action === 'suspend') await suspendUser(userId, { reason: 'Suspended by admin' });
      else if (action === 'activate') await activateUser(userId);
      else if (action === 'delete') {
        if (!confirm('Delete this user permanently?')) return;
        await deleteUser(userId);
      }
      
      toast.success(`User ${action}d successfully`);
      fetchUsers();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Residents Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all residents and approvals</p>
        </div>
        <button onClick={fetchUsers} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                filter === tab.value ? 'border-b-2 border-primary text-gray-900' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name, CNIC, email, house number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No residents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => (
            <div key={user._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {/* Profile Picture */}
                  {user.profilePicture?.url && (
                    <img 
                      src={user.profilePicture.url} 
                      alt={user.fullName}
                      className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80"
                      onClick={() => setImageModal(user.profilePicture.url)}
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg text-gray-800">{user.fullName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Email: {user.email}</div>
                      <div>Phone: {user.phoneNumber}</div>
                      <div>CNIC: {user.cnicNumber}</div>
                      <div>House: {user.houseNumber}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(user.accountStatus)}`}>
                        {user.accountStatus}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleViewDetails(user._id)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                    View
                  </button>
                  
                  {user.accountStatus === 'pending' && (
                    <>
                      <button onClick={() => handleAction('approve', user._id)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                        Approve
                      </button>
                      <button onClick={() => handleAction('reject', user._id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                        Reject
                      </button>
                    </>
                  )}
                  
                  {user.accountStatus === 'approved' && (
                    <button onClick={() => handleAction('suspend', user._id)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm">
                      Suspend
                    </button>
                  )}
                  
                  {user.accountStatus === 'suspended' && (
                    <button onClick={() => handleAction('activate', user._id)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm">
                      Activate
                    </button>
                  )}
                  
                  <button onClick={() => handleAction('delete', user._id)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Resident Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Section */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Profile</h3>
                {selectedUser.user.profilePicture?.url && (
                  <img 
                    src={selectedUser.user.profilePicture.url} 
                    alt={selectedUser.user.fullName}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => setImageModal(selectedUser.user.profilePicture.url)}
                  />
                )}
              </div>

              {/* Personal Information */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedUser.user.fullName}</div>
                  <div><span className="font-medium">Email:</span> {selectedUser.user.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedUser.user.phoneNumber}</div>
                  <div><span className="font-medium">CNIC:</span> {selectedUser.user.cnicNumber}</div>
                  <div><span className="font-medium">House:</span> {selectedUser.user.houseNumber}</div>
                  <div><span className="font-medium">Ownership:</span> {selectedUser.user.ownershipStatus}</div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.user.accountStatus)}`}>
                      {selectedUser.user.accountStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CNIC Images */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-lg border-b pb-2">CNIC Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedUser.user.cnicFront?.url && (
                  <div>
                    <p className="text-sm font-medium mb-2">CNIC Front</p>
                    <img 
                      src={selectedUser.user.cnicFront.url} 
                      alt="CNIC Front" 
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 border"
                      onClick={() => setImageModal(selectedUser.user.cnicFront.url)}
                    />
                  </div>
                )}
                {selectedUser.user.cnicBack?.url && (
                  <div>
                    <p className="text-sm font-medium mb-2">CNIC Back</p>
                    <img 
                      src={selectedUser.user.cnicBack.url} 
                      alt="CNIC Back" 
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 border"
                      onClick={() => setImageModal(selectedUser.user.cnicBack.url)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Vehicles */}
            {selectedUser.vehicles && selectedUser.vehicles.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Vehicles ({selectedUser.vehicles.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedUser.vehicles.map((v, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="font-medium text-lg">{v.make} {v.model}</div>
                      <div className="text-sm space-y-1">
                        <div className="text-gray-600">Plate: <span className="font-medium">{v.plateNumber}</span></div>
                        <div className="text-gray-600">Type: <span className="font-medium">{v.type}</span></div>
                        <div className="text-gray-600">Color: <span className="font-medium">{v.color}</span></div>
                      </div>
                      
                      {/* Vehicle Images */}
                      <div className="grid grid-cols-2 gap-2">
                        {v.registrationImage?.url && (
                          <div>
                            <p className="text-xs font-medium mb-1">Registration</p>
                            <img 
                              src={v.registrationImage.url} 
                              alt="Registration" 
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 border"
                              onClick={() => setImageModal(v.registrationImage.url)}
                            />
                          </div>
                        )}
                        {v.vehicleImage?.url && (
                          <div>
                            <p className="text-xs font-medium mb-1">Vehicle</p>
                            <img 
                              src={v.vehicleImage.url} 
                              alt="Vehicle" 
                              className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 border"
                              onClick={() => setImageModal(v.vehicleImage.url)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-2 border-t pt-4">
              {selectedUser.user.accountStatus === 'pending' && (
                <>
                  <button onClick={() => handleAction('approve', selectedUser.user._id)} className="px-4 py-2 bg-green-500 text-white rounded">Approve</button>
                  <button onClick={() => handleAction('reject', selectedUser.user._id)} className="px-4 py-2 bg-red-500 text-white rounded">Reject</button>
                </>
              )}
              <button onClick={() => setViewModal(false)} className="px-4 py-2 bg-gray-200 rounded ml-auto">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Zoomed" className="max-w-full max-h-full" />
        </div>
      )}
    </div>
  );
}