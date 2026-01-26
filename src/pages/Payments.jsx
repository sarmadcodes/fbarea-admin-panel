import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPayments, approvePayment, rejectPayment } from '../services/api';

export default function Payments() {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  
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
      fetchPayments();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter, search, monthFilter, yearFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;
      
      const res = await getPayments(params);
      let data = res.data.data || [];
      
      // Sort
      if (sortBy === 'date') data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sortBy === 'amount') data.sort((a, b) => b.amount - a.amount);
      else if (sortBy === 'month') data.sort((a, b) => b.monthNumber - a.monthNumber);
      
      setPayments(data);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast.error('Failed to fetch payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayment(id, {});
      toast.success('Payment approved');
      fetchPayments();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await rejectPayment(rejectModal._id, { rejectionReason });
      toast.success('Payment rejected');
      setRejectModal(null);
      setRejectionReason('');
      fetchPayments();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const downloadScreenshot = (url, paymentId) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-${paymentId}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026];

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      submitted: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all resident payments</p>
        </div>
        <button onClick={fetchPayments} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
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
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                filter === tab.value ? 'border-b-2 border-primary text-gray-900' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name, CNIC, house..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
            <option value="">All Months</option>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none">
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="month">Sort by Month</option>
          </select>
        </div>
      </div>

      {/* Payments Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No payments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map((payment) => (
            <div key={payment._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg text-gray-800">{payment.userId?.fullName}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>CNIC: <span className="text-gray-900">{payment.userId?.cnicNumber}</span></div>
                    <div>House: <span className="text-gray-900">{payment.userId?.houseNumber}</span></div>
                    <div>Month: <span className="text-gray-900">{payment.monthDisplay}</span></div>
                    <div>Amount: <span className="font-medium text-gray-900">Rs. {payment.amount.toLocaleString()}</span></div>
                    <div>Submitted: <span className="text-gray-900">{payment.submittedAt ? new Date(payment.submittedAt).toLocaleDateString() : '-'}</span></div>
                    {payment.transactionId && <div>TXN ID: <span className="text-gray-900">{payment.transactionId}</span></div>}
                  </div>

                  {payment.remarks && (
                    <div className="bg-gray-50 rounded p-2 text-sm text-gray-700">
                      <span className="font-medium">Remarks:</span> {payment.remarks}
                    </div>
                  )}

                  {payment.rejectionReason && (
                    <div className="bg-red-50 rounded p-2 text-sm text-red-700">
                      <span className="font-medium">Rejection Reason:</span> {payment.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setSelectedPayment(payment); setViewModal(true); }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    View Details
                  </button>
                  
                  {payment.paymentProof?.url && (
                    <>
                      <button 
                        onClick={() => setImageModal(payment.paymentProof.url)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
                      >
                        View Proof
                      </button>
                      <button 
                        onClick={() => downloadScreenshot(payment.paymentProof.url, payment._id)}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm"
                      >
                        Download
                      </button>
                    </>
                  )}
                  
                  {payment.status === 'submitted' && (
                    <>
                      <button 
                        onClick={() => handleApprove(payment._id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setRejectModal(payment)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {viewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div className="space-y-6">
              {/* User Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedPayment.userId?.fullName}</div>
                  <div><span className="font-medium">CNIC:</span> {selectedPayment.userId?.cnicNumber}</div>
                  <div><span className="font-medium">House:</span> {selectedPayment.userId?.houseNumber}</div>
                  <div><span className="font-medium">Phone:</span> {selectedPayment.userId?.phoneNumber}</div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Payment Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="font-medium">Month:</span> {selectedPayment.monthDisplay}</div>
                    <div><span className="font-medium">Amount:</span> Rs. {selectedPayment.amount.toLocaleString()}</div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                    <div><span className="font-medium">Transaction ID:</span> {selectedPayment.transactionId || 'N/A'}</div>
                    <div><span className="font-medium">Due Date:</span> {new Date(selectedPayment.dueDate).toLocaleDateString()}</div>
                    {selectedPayment.submittedAt && (
                      <div><span className="font-medium">Submitted:</span> {new Date(selectedPayment.submittedAt).toLocaleString()}</div>
                    )}
                    {selectedPayment.paidDate && (
                      <div><span className="font-medium">Approved:</span> {new Date(selectedPayment.paidDate).toLocaleString()}</div>
                    )}
                  </div>
                  
                  {selectedPayment.remarks && (
                    <div className="bg-gray-50 rounded p-3">
                      <span className="font-medium">User Remarks:</span>
                      <p className="mt-1">{selectedPayment.remarks}</p>
                    </div>
                  )}
                  
                  {selectedPayment.rejectionReason && (
                    <div className="bg-red-50 rounded p-3">
                      <span className="font-medium text-red-800">Rejection Reason:</span>
                      <p className="mt-1 text-red-700">{selectedPayment.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedPayment.paymentProof?.url && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg border-b pb-2">Payment Proof</h3>
                  <img 
                    src={selectedPayment.paymentProof.url} 
                    alt="Payment Proof" 
                    className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 border"
                    onClick={() => setImageModal(selectedPayment.paymentProof.url)}
                  />
                  <button 
                    onClick={() => downloadScreenshot(selectedPayment.paymentProof.url, selectedPayment._id)}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    Download Screenshot
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 border-t pt-4">
                {selectedPayment.status === 'submitted' && (
                  <>
                    <button 
                      onClick={() => handleApprove(selectedPayment._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => { setRejectModal(selectedPayment); setViewModal(false); }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setViewModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  rows="4"
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleReject}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Reject Payment
                </button>
                <button 
                  onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setImageModal(null)}>
          <div className="relative max-w-full max-h-full">
            <button 
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition text-2xl"
            >
              &times;
            </button>
            <img src={imageModal} alt="Zoomed" className="max-w-full max-h-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}