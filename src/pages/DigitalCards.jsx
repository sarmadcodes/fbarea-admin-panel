import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDigitalCards, getDigitalCardById, approveDigitalCard, rejectDigitalCard, suspendDigitalCard, reactivateDigitalCard, deleteDigitalCard } from '../services/api';

export default function DigitalCards() {
  const location = useLocation();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [printCard, setPrintCard] = useState(null);
  
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
      fetchCards();
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filter, search]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      
      const res = await getDigitalCards(params);
      setCards(res.data.data || []);
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        toast.error('Failed to fetch digital cards');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (cardId) => {
    try {
      const res = await getDigitalCardById(cardId);
      setSelectedCard(res.data.data);
      setViewModal(true);
    } catch (error) {
      toast.error('Failed to fetch card details');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDigitalCard(id, {});
      toast.success('Digital card approved');
      fetchCards();
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
      await rejectDigitalCard(rejectModal._id, { rejectionReason });
      toast.success('Digital card rejected');
      setRejectModal(null);
      setRejectionReason('');
      fetchCards();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error('Rejection failed');
    }
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Suspension reason is required');
      return;
    }
    try {
      await suspendDigitalCard(suspendModal._id, { suspensionReason });
      toast.success('Digital card suspended');
      setSuspendModal(null);
      setSuspensionReason('');
      fetchCards();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error('Suspension failed');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await reactivateDigitalCard(id, {});
      toast.success('Digital card reactivated');
      fetchCards();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error('Reactivation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this digital card permanently?')) return;
    try {
      await deleteDigitalCard(id);
      toast.success('Digital card deleted');
      fetchCards();
      if (viewModal) setViewModal(false);
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  const handlePrint = (card) => {
    setPrintCard(card);
    setTimeout(() => {
      window.print();
      setPrintCard(null);
    }, 100);
  };

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-card, .print-card * { visibility: visible; }
          .print-card { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Digital Cards Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage resident digital cards</p>
        </div>
        <button onClick={fetchCards} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm no-print">
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
            placeholder="Search by name, CNIC, house number, card number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="text-center py-20 no-print">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center no-print">
          <p className="text-gray-600">No digital cards found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 no-print">
          {cards.map((card) => (
            <div key={card._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  {card.userId?.profilePicture?.url && (
                    <img 
                      src={card.userId.profilePicture.url} 
                      alt={card.userId.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg text-gray-800">{card.userId?.fullName}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>Card No: <span className="text-gray-900">{card.cardNumber}</span></div>
                      <div>CNIC: <span className="text-gray-900">{card.userId?.cnicNumber}</span></div>
                      <div>House: <span className="text-gray-900">{card.userId?.houseNumber}</span></div>
                      <div>Issued: <span className="text-gray-900">{card.issuedDate ? new Date(card.issuedDate).toLocaleDateString() : 'Not issued'}</span></div>
                      <div>Expires: <span className="text-gray-900">{card.expiryDate ? formatExpiryDate(card.expiryDate) : 'N/A'}</span></div>
                      <div>Prints: <span className="text-gray-900">{card.printCount || 0}</span></div>
                    </div>

                    {card.rejectionReason && (
                      <div className="bg-red-50 rounded p-2 text-sm text-red-700 mt-2">
                        <span className="font-medium">Rejection:</span> {card.rejectionReason}
                      </div>
                    )}

                    {card.suspensionReason && (
                      <div className="bg-gray-100 rounded p-2 text-sm text-gray-700 mt-2">
                        <span className="font-medium">Suspension:</span> {card.suspensionReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleViewDetails(card._id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    View
                  </button>
                  
                  {card.status === 'approved' && (
                    <button 
                      onClick={() => handlePrint(card)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm"
                    >
                      Print
                    </button>
                  )}
                  
                  {card.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(card._id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setRejectModal(card)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {card.status === 'approved' && (
                    <button 
                      onClick={() => setSuspendModal(card)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm"
                    >
                      Suspend
                    </button>
                  )}
                  
                  {card.status === 'suspended' && (
                    <button 
                      onClick={() => handleReactivate(card._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                    >
                      Reactivate
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(card._id)}
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
      {viewModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Digital Card Details</h2>
              <button onClick={() => setViewModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
            </div>

            <div className="space-y-6">
              {/* User Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Cardholder Information</h3>
                <div className="flex gap-4 mb-4">
                  {selectedCard.card.userId?.profilePicture?.url && (
                    <img 
                      src={selectedCard.card.userId.profilePicture.url} 
                      alt={selectedCard.card.userId.fullName}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm flex-1">
                    <div><span className="font-medium">Name:</span> {selectedCard.card.userId?.fullName}</div>
                    <div><span className="font-medium">CNIC:</span> {selectedCard.card.userId?.cnicNumber}</div>
                    <div><span className="font-medium">House:</span> {selectedCard.card.userId?.houseNumber}</div>
                    <div><span className="font-medium">Phone:</span> {selectedCard.card.userId?.phoneNumber}</div>
                  </div>
                </div>
              </div>

              {/* Card Information */}
              <div>
                <h3 className="font-semibold mb-3 text-lg border-b pb-2">Card Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Card Number:</span> {selectedCard.card.cardNumber}</div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCard.card.status)}`}>
                      {selectedCard.card.status}
                    </span>
                  </div>
                  <div><span className="font-medium">Issued:</span> {selectedCard.card.issuedDate ? new Date(selectedCard.card.issuedDate).toLocaleDateString() : 'Not issued'}</div>
                  <div><span className="font-medium">Expires:</span> {selectedCard.card.expiryDate ? formatExpiryDate(selectedCard.card.expiryDate) : 'N/A'}</div>
                  <div><span className="font-medium">Total Prints:</span> {selectedCard.card.printCount || 0}</div>
                  <div><span className="font-medium">Last Printed:</span> {selectedCard.card.lastPrintedAt ? new Date(selectedCard.card.lastPrintedAt).toLocaleString() : 'Never'}</div>
                </div>

                {selectedCard.card.rejectionReason && (
                  <div className="bg-red-50 rounded p-3 mt-4">
                    <span className="font-medium text-red-800">Rejection Reason:</span>
                    <p className="mt-1 text-red-700">{selectedCard.card.rejectionReason}</p>
                  </div>
                )}

                {selectedCard.card.suspensionReason && (
                  <div className="bg-gray-100 rounded p-3 mt-4">
                    <span className="font-medium text-gray-800">Suspension Reason:</span>
                    <p className="mt-1 text-gray-700">{selectedCard.card.suspensionReason}</p>
                  </div>
                )}
              </div>

              {/* Recent Payments */}
              {selectedCard.recentPayments && selectedCard.recentPayments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg border-b pb-2">Recent Payments</h3>
                  <div className="space-y-2">
                    {selectedCard.recentPayments.map((payment, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                        <span>{payment.monthDisplay}</span>
                        <span className="font-medium text-green-600">Rs. {payment.amount.toLocaleString()}</span>
                        <span className="text-gray-600">{new Date(payment.paidDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 border-t pt-4">
                {selectedCard.card.status === 'approved' && (
                  <button 
                    onClick={() => handlePrint(selectedCard.card)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                  >
                    Print Card
                  </button>
                )}
                
                {selectedCard.card.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApprove(selectedCard.card._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => { setRejectModal(selectedCard.card); setViewModal(false); }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {selectedCard.card.status === 'approved' && (
                  <button 
                    onClick={() => { setSuspendModal(selectedCard.card); setViewModal(false); }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  >
                    Suspend
                  </button>
                )}
                
                {selectedCard.card.status === 'suspended' && (
                  <button 
                    onClick={() => handleReactivate(selectedCard.card._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Reactivate
                  </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Digital Card</h2>
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
                  Reject Card
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

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Suspend Digital Card</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Suspension Reason *</label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  rows="4"
                  placeholder="Enter reason for suspension..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSuspend}
                  className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                >
                  Suspend Card
                </button>
                <button 
                  onClick={() => { setSuspendModal(null); setSuspensionReason(''); }}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Card Component */}
      {printCard && (
        <div className="print-card" style={{ padding: '40px' }}>
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            border: '2px solid #000',
            borderRadius: '20px',
            padding: '30px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '20px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0' }}>FB Area Block 13</h1>
              <p style={{ fontSize: '14px', opacity: '0.9', margin: '5px 0 0 0' }}>Digital Resident Card</p>
            </div>

            <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
              <div style={{ flex: '1' }}>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>FULL NAME</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{printCard.userId?.fullName}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>CNIC NUMBER</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{printCard.userId?.cnicNumber}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>HOUSE NO</div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{printCard.userId?.houseNumber}</div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>ADDRESS</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>Block 13, Federal B Area, Karachi</div>
                </div>
              </div>
              {printCard.userId?.profilePicture?.url && (
                <div style={{ width: '150px', height: '150px' }}>
                  <img 
                    src={printCard.userId.profilePicture.url}
                    alt="Profile"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '15px',
                      border: '3px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.3)', 
              paddingTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>VALID UNTIL</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{formatExpiryDate(printCard.expiryDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '3px' }}>CARD NUMBER</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{printCard.cardNumber}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}