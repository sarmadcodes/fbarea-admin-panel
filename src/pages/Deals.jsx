// admin/src/pages/Deals.jsx - Complete Admin Panel for Deals & Coupons
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getDeals,
  getDealCategories,
  createDeal,
  updateDeal,
  deleteDeal,
  toggleDealFeatured,
  toggleDealActive,
  getCouponsByDeal,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../services/api';

export default function Deals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  const [deals, setDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modals
  const [showDealModal, setShowDealModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected items
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [couponToDelete, setCouponToDelete] = useState(null);
  
  // Form data
  const [dealForm, setDealForm] = useState({
    name: '',
    category: '',
    description: '',
    discount: '',
    phone: '',
    address: '',
    isFeatured: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount: '',
    validFrom: '',
    validTill: '',
    usageType: 'one-time',
    maxUsagePerUser: 1,
    totalUsageLimit: '',
    minPurchase: '',
  });
  
  // Coupons for selected deal
  const [dealCoupons, setDealCoupons] = useState([]);
  const [showCouponsView, setShowCouponsView] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        status: activeTab,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      };
      
      const [dealsRes, categoriesRes] = await Promise.all([
        getDeals(params),
        getDealCategories(),
      ]);
      
      setDeals(dealsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!dealForm.name || !dealForm.category || !dealForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!imageFile && !selectedDeal) {
      toast.error('Please select an image');
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Add all form fields
      formData.append('name', dealForm.name.trim());
      formData.append('category', dealForm.category);
      formData.append('description', dealForm.description.trim());
      
      // Add optional fields only if they have values
      if (dealForm.discount && dealForm.discount.trim()) {
        formData.append('discount', dealForm.discount.trim());
      }
      if (dealForm.phone && dealForm.phone.trim()) {
        formData.append('phone', dealForm.phone.trim());
      }
      if (dealForm.address && dealForm.address.trim()) {
        formData.append('address', dealForm.address.trim());
      }
      
      // Add boolean field
      formData.append('isFeatured', dealForm.isFeatured);
      
      // Add image if present
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Log what we're sending
      console.log('Submitting deal with:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      if (selectedDeal) {
        await updateDeal(selectedDeal._id, formData);
        toast.success('Deal updated successfully');
      } else {
        await createDeal(formData);
        toast.success('Deal created successfully');
      }
      
      setShowDealModal(false);
      resetDealForm();
      fetchData();
    } catch (error) {
      console.error('Error saving deal:', error);
      console.error('Error response:', error.response?.data);
      
      // Show more detailed error message
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save deal';
      toast.error(errorMsg);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    
    try {
      await deleteDeal(dealToDelete._id);
      toast.success('Deal deleted successfully');
      setShowDeleteModal(false);
      setDealToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  };

  const handleToggleFeatured = async (deal) => {
    try {
      await toggleDealFeatured(deal._id);
      toast.success(`Deal ${!deal.isFeatured ? 'featured' : 'unfeatured'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update deal');
    }
  };

  const handleToggleActive = async (deal) => {
    try {
      await toggleDealActive(deal._id);
      toast.success(`Deal ${!deal.isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Failed to update deal');
    }
  };

  const openDealModal = (deal = null) => {
    if (deal) {
      setSelectedDeal(deal);
      setDealForm({
        name: deal.name,
        category: deal.category._id,
        description: deal.description,
        discount: deal.discount || '',
        phone: deal.phone || '',
        address: deal.address || '',
        isFeatured: deal.isFeatured,
      });
      setImagePreview(deal.image);
    } else {
      resetDealForm();
    }
    setShowDealModal(true);
  };

  const resetDealForm = () => {
    setSelectedDeal(null);
    setDealForm({
      name: '',
      category: '',
      description: '',
      discount: '',
      phone: '',
      address: '',
      isFeatured: false,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const fetchDealCoupons = async (deal) => {
    try {
      const res = await getCouponsByDeal(deal._id);
      setDealCoupons(res.data.data || []);
      setSelectedDeal(deal);
      setShowCouponsView(true);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCoupon) {
        await updateCoupon(selectedCoupon._id, couponForm);
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon(selectedDeal._id, couponForm);
        toast.success('Coupon created successfully');
      }
      
      setShowCouponModal(false);
      resetCouponForm();
      fetchDealCoupons(selectedDeal);
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    
    try {
      await deleteCoupon(couponToDelete._id);
      toast.success('Coupon deleted successfully');
      setShowDeleteModal(false);
      setCouponToDelete(null);
      fetchDealCoupons(selectedDeal);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const openCouponModal = (coupon = null) => {
    if (coupon) {
      setSelectedCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        description: coupon.description,
        discount: coupon.discount,
        validFrom: coupon.validFrom.split('T')[0],
        validTill: coupon.validTill.split('T')[0],
        usageType: coupon.usageType,
        maxUsagePerUser: coupon.maxUsagePerUser,
        totalUsageLimit: coupon.totalUsageLimit || '',
        minPurchase: coupon.minPurchase || '',
      });
    } else {
      resetCouponForm();
    }
    setShowCouponModal(true);
  };

  const resetCouponForm = () => {
    setSelectedCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discount: '',
      validFrom: '',
      validTill: '',
      usageType: 'one-time',
      maxUsagePerUser: 1,
      totalUsageLimit: '',
      minPurchase: '',
    });
  };

  const filteredDeals = deals.filter(deal =>
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showCouponsView) {
    return (
      <CouponsView
        deal={selectedDeal}
        coupons={dealCoupons}
        onBack={() => setShowCouponsView(false)}
        onAddCoupon={() => openCouponModal()}
        onEditCoupon={(coupon) => openCouponModal(coupon)}
        onDeleteCoupon={(coupon) => {
          setCouponToDelete(coupon);
          setShowDeleteModal(true);
        }}
        showModal={showCouponModal}
        setShowModal={setShowCouponModal}
        couponForm={couponForm}
        setCouponForm={setCouponForm}
        onSubmit={handleCreateCoupon}
        selectedCoupon={selectedCoupon}
        fetchDealCoupons={fetchDealCoupons}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deals & Discounts</h1>
          <p className="text-sm text-gray-600 mt-1">Manage deals and coupons for residents</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={fetchData}
            className="flex-1 sm:flex-initial px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => openDealModal()}
            className="flex-1 sm:flex-initial px-4 py-2 text-white rounded-lg hover:bg-green-600 transition"
            style={{ backgroundColor: '#90EE90' }}
          >
            + Add Deal
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {['all', 'active', 'inactive'].map(tab => (
            <button
              key={tab}
              onClick={() => setSearchParams({ tab })}
              className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No deals found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map(deal => (
            <DealCard
              key={deal._id}
              deal={deal}
              onEdit={() => openDealModal(deal)}
              onDelete={() => {
                setDealToDelete(deal);
                setShowDeleteModal(true);
              }}
              onToggleFeatured={() => handleToggleFeatured(deal)}
              onToggleActive={() => handleToggleActive(deal)}
              onManageCoupons={() => fetchDealCoupons(deal)}
            />
          ))}
        </div>
      )}

      {/* Deal Modal */}
      {showDealModal && (
        <DealModal
          show={showDealModal}
          onClose={() => {
            setShowDealModal(false);
            resetDealForm();
          }}
          dealForm={dealForm}
          setDealForm={setDealForm}
          categories={categories}
          imagePreview={imagePreview}
          onImageChange={handleImageChange}
          onSubmit={handleCreateDeal}
          isEdit={!!selectedDeal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDealToDelete(null);
            setCouponToDelete(null);
          }}
          onConfirm={dealToDelete ? handleDeleteDeal : handleDeleteCoupon}
          itemName={dealToDelete?.name || couponToDelete?.code}
          type={dealToDelete ? 'deal' : 'coupon'}
        />
      )}
    </div>
  );
}

// Deal Card Component
function DealCard({ deal, onEdit, onDelete, onToggleFeatured, onToggleActive, onManageCoupons }) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="relative h-48">
        <img
          src={deal.image}
          alt={deal.name}
          className="w-full h-full object-cover"
        />
        {deal.isFeatured && (
          <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
            ⭐ Featured
          </span>
        )}
        {!deal.isActive && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold">INACTIVE</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{deal.name}</h3>
            <span className="text-sm text-gray-500">{deal.category.name}</span>
          </div>
          {deal.discount && (
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2">
              {deal.discount}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deal.description}</p>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <span>🏷️ {deal.couponCount || 0} Coupons</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </button>
          <button
            onClick={onManageCoupons}
            className="px-3 py-2 text-white rounded hover:bg-green-600 text-sm"
            style={{ backgroundColor: '#90EE90' }}
          >
            Coupons
          </button>
          <button
            onClick={onToggleFeatured}
            className={`px-3 py-2 rounded text-sm ${
              deal.isFeatured
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {deal.isFeatured ? '⭐ Featured' : 'Feature'}
          </button>
          <button
            onClick={onToggleActive}
            className={`px-3 py-2 rounded text-sm ${
              deal.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {deal.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>

        <button
          onClick={onDelete}
          className="w-full mt-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Deal Modal Component
function DealModal({ show, onClose, dealForm, setDealForm, categories, imagePreview, onImageChange, onSubmit, isEdit }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {isEdit ? 'Edit Deal' : 'Add New Deal'}
          </h2>

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Deal Name *</label>
                <input
                  type="text"
                  value={dealForm.name}
                  onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={dealForm.category}
                  onChange={(e) => setDealForm({ ...dealForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={dealForm.description}
                  onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount (e.g., "20% OFF")</label>
                <input
                  type="text"
                  value={dealForm.discount}
                  onChange={(e) => setDealForm({ ...dealForm, discount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="text"
                    value={dealForm.phone}
                    onChange={(e) => setDealForm({ ...dealForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={dealForm.address}
                    onChange={(e) => setDealForm({ ...dealForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required={!isEdit}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 h-32 object-cover rounded"
                  />
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={dealForm.isFeatured}
                  onChange={(e) => setDealForm({ ...dealForm, isFeatured: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Mark as Featured</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white rounded-lg hover:bg-green-600"
                style={{ backgroundColor: '#90EE90' }}
              >
                {isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Coupons View Component
function CouponsView({ deal, coupons, onBack, onAddCoupon, onEditCoupon, onDeleteCoupon, showModal, setShowModal, couponForm, setCouponForm, onSubmit, selectedCoupon, fetchDealCoupons }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          ← Back to Deals
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{deal.name}</h1>
          <p className="text-sm text-gray-600 mt-1">Manage coupons for this deal</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => fetchDealCoupons(deal)}
            className="flex-1 sm:flex-initial px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition"
          >
            Refresh
          </button>
          <button
            onClick={onAddCoupon}
            className="flex-1 sm:flex-initial px-4 py-2 text-white rounded-lg hover:bg-green-600"
            style={{ backgroundColor: '#90EE90' }}
          >
            + Add Coupon
          </button>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No coupons found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map(coupon => (
            <CouponCard
              key={coupon._id}
              coupon={coupon}
              onEdit={() => onEditCoupon(coupon)}
              onDelete={() => onDeleteCoupon(coupon)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CouponModal
          show={showModal}
          onClose={() => setShowModal(false)}
          couponForm={couponForm}
          setCouponForm={setCouponForm}
          onSubmit={onSubmit}
          isEdit={!!selectedCoupon}
        />
      )}
    </div>
  );
}

// Coupon Card Component
function CouponCard({ coupon, onEdit, onDelete }) {
  const isExpired = new Date(coupon.validTill) < new Date();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-lg font-bold text-green-600">{coupon.code}</span>
            {!coupon.isActive && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">INACTIVE</span>
            )}
            {isExpired && (
              <span className="text-xs bg-red-200 text-red-600 px-2 py-1 rounded">EXPIRED</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Discount:</span> <span className="text-red-500 font-bold">{coupon.discount}</span>
            </div>
            <div>
              <span className="font-medium">Valid From:</span> {new Date(coupon.validFrom).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Valid Till:</span> {new Date(coupon.validTill).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Usage Type:</span> {coupon.usageType}
            </div>
            {coupon.minPurchase && (
              <div>
                <span className="font-medium">Min Purchase:</span> ${coupon.minPurchase}
              </div>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 sm:w-24">
          <button
            onClick={onEdit}
            className="flex-1 sm:flex-initial px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 sm:flex-initial px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Coupon Modal Component
function CouponModal({ show, onClose, couponForm, setCouponForm, onSubmit, isEdit }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {isEdit ? 'Edit Coupon' : 'Add New Coupon'}
          </h2>

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coupon Code *</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                  placeholder="SAVE20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Discount *</label>
                <input
                  type="text"
                  value={couponForm.discount}
                  onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="20% OFF or $10 OFF"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valid From *</label>
                  <input
                    type="date"
                    value={couponForm.validFrom}
                    onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid Till *</label>
                  <input
                    type="date"
                    value={couponForm.validTill}
                    onChange={(e) => setCouponForm({ ...couponForm, validTill: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Usage Type</label>
                <select
                  value={couponForm.usageType}
                  onChange={(e) => setCouponForm({ ...couponForm, usageType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="one-time">One Time Per User</option>
                  <option value="multiple">Multiple Times</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>

              {couponForm.usageType === 'multiple' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Max Usage Per User</label>
                  <input
                    type="number"
                    value={couponForm.maxUsagePerUser}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUsagePerUser: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.totalUsageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, totalUsageLimit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Purchase Amount</label>
                  <input
                    type="number"
                    value={couponForm.minPurchase}
                    onChange={(e) => setCouponForm({ ...couponForm, minPurchase: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white rounded-lg hover:bg-green-600"
                style={{ backgroundColor: '#90EE90' }}
              >
                {isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete Modal Component
function DeleteModal({ show, onClose, onConfirm, itemName, type }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">Delete {type === 'deal' ? 'Deal' : 'Coupon'}</h2>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete "{itemName}"? This action cannot be undone.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}