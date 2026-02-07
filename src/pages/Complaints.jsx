import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getComplaints, updateComplaintStatus, deleteComplaint } from '../services/api';

export default function Complaints() {
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', adminResponse: '' });
  const [imageModal, setImageModal] = useState(false); // ✅ NEW: For full-screen image
  const [fullImageUrl, setFullImageUrl] = useState(''); // ✅ NEW: URL for full image
  
  const debounceTimer = useRef(null);

  // ✅ READ TAB FROM URL
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
      fetchComplaints();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter, search]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      
      const res = await getComplaints(params);
      setComplaints(res.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast.error('Failed to fetch complaints');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setStatusUpdate({ status: complaint.status, adminResponse: complaint.adminResponse || '' });
    setViewModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await updateComplaintStatus(selectedComplaint._id, statusUpdate);
      toast.success('Complaint updated successfully');
      setViewModal(false);
      fetchComplaints();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await deleteComplaint(id);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // ✅ NEW: Handle image view
  const handleViewImage = (imageUrl) => {
    setFullImageUrl(imageUrl);
    setImageModal(true);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      resolved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority] || colors.low;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Complaints Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all resident complaints</p>
        </div>
        <button onClick={fetchComplaints} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
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
            placeholder="Search by name, CNIC, house number, complaint ID..."
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
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No complaints found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-gray-800">#{complaint.complaintNumber}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                    {/* ✅ NEW: Image indicator badge */}
                    {complaint.complaintImage?.url && (
                      <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Image
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 capitalize">{complaint.complaintType}</div>
                  
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{complaint.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>Name: <span className="text-gray-900">{complaint.userName}</span></div>
                    <div>CNIC: <span className="text-gray-900">{complaint.userCnic}</span></div>
                    <div>House: <span className="text-gray-900">{complaint.userId?.houseNumber || 'N/A'}</span></div>
                    <div>Date: <span className="text-gray-900">{new Date(complaint.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleViewDetails(complaint)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleDelete(complaint._id)} 
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View/Update Modal */}
      {viewModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Complaint Details #{selectedComplaint.complaintNumber}</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div className="space-y-6">
              {/* User Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedComplaint.userName}</div>
                  <div><span className="font-medium">CNIC:</span> {selectedComplaint.userCnic}</div>
                  <div><span className="font-medium">House:</span> {selectedComplaint.userId?.houseNumber || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {selectedComplaint.userId?.phoneNumber || 'N/A'}</div>
                </div>
              </div>

              {/* Complaint Details */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Complaint Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <div><span className="font-medium">Type:</span> <span className="capitalize">{selectedComplaint.complaintType}</span></div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                      Priority: {selectedComplaint.priority}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                      Status: {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div><span className="font-medium">Created:</span> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
                  <div><span className="font-medium">Last Updated:</span> {new Date(selectedComplaint.updatedAt).toLocaleString()}</div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <div className="mt-2 bg-gray-50 p-3 rounded">{selectedComplaint.description}</div>
                  </div>

                  {/* ✅ NEW: Display complaint image */}
                  {selectedComplaint.complaintImage?.url && (
                    <div>
                      <span className="font-medium">Complaint Image:</span>
                      <div className="mt-2 relative">
                        <img
                          src={selectedComplaint.complaintImage.url}
                          alt="Complaint"
                          className="w-full max-w-md rounded-lg shadow-md cursor-pointer hover:opacity-90 transition"
                          onClick={() => handleViewImage(selectedComplaint.complaintImage.url)}
                        />
                        <button
                          onClick={() => handleViewImage(selectedComplaint.complaintImage.url)}
                          className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition"
                          title="View full image"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedComplaint.adminResponse && (
                    <div>
                      <span className="font-medium">Previous Admin Response:</span>
                      <div className="mt-2 bg-blue-50 p-3 rounded">{selectedComplaint.adminResponse}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 text-lg">Update Complaint</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={statusUpdate.status}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Admin Response</label>
                    <textarea
                      value={statusUpdate.adminResponse}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, adminResponse: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                      rows="3"
                      placeholder="Enter your response to the user..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUpdateStatus} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition">
                      Update Complaint
                    </button>
                    <button onClick={() => setViewModal(false)} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Full-screen Image Modal */}
      {imageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]"
          onClick={() => setImageModal(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setImageModal(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={fullImageUrl}
              alt="Complaint Full View"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}