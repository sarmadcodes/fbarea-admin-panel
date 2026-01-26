import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllVehicles } from '../services/api';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getAllVehicles();
      setVehicles(res.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      v.plateNumber?.toLowerCase().includes(searchLower) ||
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.userId?.fullName?.toLowerCase().includes(searchLower) ||
      v.userId?.cnicNumber?.includes(searchLower) ||
      v.userId?.houseNumber?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Vehicles</h1>
          <p className="text-sm text-gray-600 mt-1">View all registered vehicles and their owners</p>
        </div>
        <button onClick={fetchVehicles} className="px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <input
          type="text"
          placeholder="Search by plate number, make, model, owner name, CNIC, house number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No vehicles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
              {/* Vehicle Info */}
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{vehicle.make} {vehicle.model}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(vehicle.verificationStatus)}`}>
                    {vehicle.verificationStatus}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Plate Number: <span className="font-medium text-gray-800">{vehicle.plateNumber}</span></div>
                  <div>Type: <span className="font-medium">{vehicle.type}</span></div>
                  <div>Color: <span className="font-medium">{vehicle.color}</span></div>
                </div>
              </div>

              {/* Vehicle Images */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-sm">Vehicle Images</h4>
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.registrationImage?.url && (
                    <div>
                      <p className="text-xs font-medium mb-1 text-gray-600">Registration</p>
                      <img 
                        src={vehicle.registrationImage.url} 
                        alt="Registration" 
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 border"
                        onClick={() => setImageModal(vehicle.registrationImage.url)}
                      />
                    </div>
                  )}
                  {vehicle.vehicleImage?.url && (
                    <div>
                      <p className="text-xs font-medium mb-1 text-gray-600">Vehicle Photo</p>
                      <img 
                        src={vehicle.vehicleImage.url} 
                        alt="Vehicle" 
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 border"
                        onClick={() => setImageModal(vehicle.vehicleImage.url)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Information */}
              {vehicle.userId && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm">Owner Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Name: <span className="font-medium text-gray-800">{vehicle.userId.fullName}</span></div>
                    <div>CNIC: <span className="font-medium">{vehicle.userId.cnicNumber}</span></div>
                    <div>House: <span className="font-medium">{vehicle.userId.houseNumber}</span></div>
                    <div>Phone: <span className="font-medium">{vehicle.userId.phoneNumber}</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="Zoomed" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}