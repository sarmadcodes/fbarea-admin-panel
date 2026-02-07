import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getGuestRequests, approveGuestRequest, rejectGuestRequest, deleteGuestRequest } from '../services/api';

export default function GuestRequests() {
  const location = useLocation();
  const [guestRequests, setGuestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  
  const debounceTimer = useRef(null);

  // Read tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setFilter(tab);
  }, [location]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchGuestRequests();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter, search]);

  const fetchGuestRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      
      const res = await getGuestRequests(params);
      setGuestRequests(res.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast.error('Failed to fetch guest requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setAdminResponse(request.adminResponse || '');
    setViewModal(true);
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this guest request?')) return;
    try {
      await approveGuestRequest(id);
      toast.success('Guest request approved successfully');
      fetchGuestRequests();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleOpenRejectModal = (request) => {
    setSelectedRequest(request);
    setAdminResponse('');
    setRejectModal(true);
    if (viewModal) setViewModal(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      await rejectGuestRequest(selectedRequest._id, { adminResponse });
      toast.success('Guest request rejected');
      setRejectModal(false);
      setAdminResponse('');
      fetchGuestRequests();
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this guest request?')) return;
    try {
      await deleteGuestRequest(id);
      toast.success('Guest request deleted');
      fetchGuestRequests();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' },
  ];

  const getStatusColor = (status, isExpired) => {
    if (isExpired) return 'bg-gray-100 text-gray-800';
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const getVisitTypeLabel = (visitType, customVisitType) => {
    if (visitType === 'other' && customVisitType) return customVisitType;
    const types = {
      guest: 'Guest Visitor',
      delivery: 'Delivery',
      cab: 'Cab/Taxi',
      other: 'Other'
    };
    return types[visitType] || visitType;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Guest Requests Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all resident guest requests</p>
        </div>
        <button onClick={fetchGuestRequests} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
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
            placeholder="Search by resident name, CNIC, house, guest name, mobile..."
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
      ) : guestRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No guest requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {guestRequests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-gray-800">{request.guestName}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status, request.isExpired)}`}>
                      {request.isExpired ? 'EXPIRED' : request.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 capitalize bg-gray-50 px-3 py-1 rounded inline-block">
                    {getVisitTypeLabel(request.visitType, request.customVisitType)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Resident:</span> {request.userName}
                    </div>
                    <div>
                      <span className="font-medium">House:</span> {request.userHouseNumber}
                    </div>
                    <div>
                      <span className="font-medium">CNIC:</span> {request.userCnic}
                    </div>
                    {request.guestMobile && (
                      <div>
                        <span className="font-medium">Guest Mobile:</span> {request.guestMobile}
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 rounded p-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Visit Date:</span>{' '}
                        <span className="text-gray-900">{request.visitDate}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Time:</span>{' '}
                        <span className="text-gray-900">{request.expectedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Submitted: {formatDate(request.createdAt)}
                    {request.expiresAt && ` • Expires: ${formatDate(request.expiresAt)}`}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleViewDetails(request)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    View
                  </button>
                  
                  {request.status === 'pending' && !request.isExpired && (
                    <>
                      <button 
                        onClick={() => handleApprove(request._id)} 
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleOpenRejectModal(request)} 
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(request._id)} 
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {viewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Guest Request Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedRequest.isExpired ? 'bg-gray-100' :
                selectedRequest.status === 'approved' ? 'bg-green-50' :
                selectedRequest.status === 'rejected' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">
                    Status: {selectedRequest.isExpired ? 'EXPIRED' : selectedRequest.status.toUpperCase()}
                  </span>
                  {selectedRequest.status === 'pending' && !selectedRequest.isExpired && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(selectedRequest._id)} 
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Approve Now
                      </button>
                      <button 
                        onClick={() => handleOpenRejectModal(selectedRequest)} 
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Guest Name:</span> {selectedRequest.guestName}</div>
                  <div><span className="font-medium">Guest Mobile:</span> {selectedRequest.guestMobile || 'Not provided'}</div>
                  <div><span className="font-medium">Visit Type:</span> {getVisitTypeLabel(selectedRequest.visitType, selectedRequest.customVisitType)}</div>
                </div>
              </div>

              {/* Visit Details */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Visit Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Visit Date:</span> {selectedRequest.visitDate}</div>
                  <div><span className="font-medium">Expected Time:</span> {selectedRequest.expectedTime}</div>
                  <div><span className="font-medium">Expires At:</span> {formatDate(selectedRequest.expiresAt)}</div>
                </div>
              </div>

              {/* Resident Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Resident Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedRequest.userName}</div>
                  <div><span className="font-medium">CNIC:</span> {selectedRequest.userCnic}</div>
                  <div><span className="font-medium">House Number:</span> {selectedRequest.userHouseNumber}</div>
                  <div><span className="font-medium">Phone:</span> {selectedRequest.userId?.phoneNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Admin Response (if any) */}
              {selectedRequest.adminResponse && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg border-b pb-2">Admin Response</h3>
                  <div className="bg-gray-50 p-3 rounded">{selectedRequest.adminResponse}</div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Created:</span> {new Date(selectedRequest.createdAt).toLocaleString()}</div>
                  <div><span className="font-medium">Updated:</span> {new Date(selectedRequest.updatedAt).toLocaleString()}</div>
                  {selectedRequest.approvedAt && (
                    <div><span className="font-medium">Approved At:</span> {new Date(selectedRequest.approvedAt).toLocaleString()}</div>
                  )}
                  {selectedRequest.rejectedAt && (
                    <div><span className="font-medium">Rejected At:</span> {new Date(selectedRequest.rejectedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>

              <button onClick={() => setViewModal(false)} className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Guest Request</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject the guest request for <strong>{selectedRequest.guestName}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                rows="3"
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleReject} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                Reject
              </button>
              <button onClick={() => setRejectModal(false)} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}