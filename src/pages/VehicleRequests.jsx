import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getVehicleRequests, approveVehicleRequest, rejectVehicleRequest } from '../services/api';

export default function VehicleRequests() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [imageModal, setImageModal] = useState({ open: false, url: '', title: '' });
  const debounceTimer = useRef(null);

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
      fetchRequests();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const res = await getVehicleRequests(params);
      console.log('[VehicleRequests] Fetched:', res.data.data?.length || 0, 'requests');
      setRequests(res.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('[VehicleRequests] Error:', error);
        toast.error('Failed to fetch requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;
    
    try {
      await approveVehicleRequest(id);
      toast.success('Request approved successfully');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('[VehicleRequests] Approve error:', error);
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await rejectVehicleRequest(id, { reason });
      toast.success('Request rejected');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('[VehicleRequests] Reject error:', error);
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const openImageModal = (url, title) => {
    setImageModal({ open: true, url, title });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, url: '', title: '' });
  };

  const tabs = [
    { value: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
    { value: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
    { value: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
    { value: 'all', label: 'All', count: requests.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Change Requests</h1>
          <p className="text-sm text-gray-600 mt-1">Manage vehicle registration requests</p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-80 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                filter === tab.value 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-600">No vehicle requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                        {req.userId?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{req.userId?.fullName || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">House: {req.userId?.houseNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {req.userId?.phoneNumber || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        CNIC: {req.userId?.cnicNumber || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Type Badges */}
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      req.requestType === 'add' ? 'bg-blue-100 text-blue-800' :
                      req.requestType === 'update' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.requestType.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      req.status === 'approved' ? 'bg-green-100 text-green-800' :
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Plate Number</p>
                      <p className="font-semibold text-gray-900">{req.requestedData?.plateNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Make & Model</p>
                      <p className="font-semibold text-gray-900">
                        {req.requestedData?.make || 'N/A'} {req.requestedData?.model || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Color</p>
                      <p className="font-semibold text-gray-900">{req.requestedData?.color || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Type</p>
                      <p className="font-semibold text-gray-900 capitalize">{req.requestedData?.type || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {(req.requestedData?.registrationImage?.url || req.requestedData?.vehicleImage?.url) && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {req.requestedData?.registrationImage?.url && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-2">Registration Document</p>
                          <img 
                            src={req.requestedData.registrationImage.url} 
                            alt="Registration" 
                            className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                            onClick={() => openImageModal(req.requestedData.registrationImage.url, 'Registration Document')}
                            onError={(e) => {
                              console.error('[VehicleRequests] Image load error:', req.requestedData.registrationImage.url);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {req.requestedData?.vehicleImage?.url && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-2">Vehicle Photo</p>
                          <img 
                            src={req.requestedData.vehicleImage.url} 
                            alt="Vehicle" 
                            className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                            onClick={() => openImageModal(req.requestedData.vehicleImage.url, 'Vehicle Photo')}
                            onError={(e) => {
                              console.error('[VehicleRequests] Image load error:', req.requestedData.vehicleImage.url);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* No images message */}
                  {!req.requestedData?.registrationImage?.url && !req.requestedData?.vehicleImage?.url && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">No images available for this request</p>
                    </div>
                  )}
                </div>

                {/* Actions & Info */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Submitted: {new Date(req.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {req.reviewedAt && (
                      <span className="ml-3">
                        Reviewed: {new Date(req.reviewedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(req._id)} 
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleReject(req._id)} 
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Rejection Reason:</strong> {req.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {imageModal.open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="absolute top-0 right-0 p-4 z-10">
              <button
                onClick={closeImageModal}
                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{imageModal.title}</h3>
              <img 
                src={imageModal.url} 
                alt={imageModal.title}
                className="max-w-full max-h-[80vh] mx-auto object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}