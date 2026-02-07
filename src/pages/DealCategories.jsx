// admin/src/pages/DealCategories.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getDealCategories,
  createDealCategory,
  updateDealCategory,
  deleteDealCategory,
  toggleCategoryActive,
} from '../services/api';

export default function DealCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: 'pricetag-outline',
    order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getDealCategories();
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedCategory) {
        await updateDealCategory(selectedCategory._id, categoryForm);
        toast.success('Category updated successfully');
      } else {
        await createDealCategory(categoryForm);
        toast.success('Category created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteDealCategory(categoryToDelete._id);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await toggleCategoryActive(category._id);
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (error) {
      console.error('Error toggling active:', error);
      toast.error('Failed to update category');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon || 'pricetag-outline',
        order: category.order || 0,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setCategoryForm({
      name: '',
      icon: 'pricetag-outline',
      order: 0,
    });
  };

  const iconOptions = [
    { value: 'pricetag-outline', label: '🏷️ Price Tag' },
    { value: 'restaurant-outline', label: '🍽️ Restaurant' },
    { value: 'cart-outline', label: '🛒 Shopping Cart' },
    { value: 'medkit-outline', label: '💊 Medical' },
    { value: 'storefront-outline', label: '🏪 Store' },
    { value: 'cafe-outline', label: '☕ Cafe' },
    { value: 'fast-food-outline', label: '🍔 Fast Food' },
    { value: 'shirt-outline', label: '👕 Clothing' },
    { value: 'fitness-outline', label: '💪 Fitness' },
    { value: 'home-outline', label: '🏠 Home' },
    { value: 'car-outline', label: '🚗 Automotive' },
    { value: 'book-outline', label: '📚 Books' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deal Categories</h1>
          <p className="text-sm text-gray-600 mt-1">Manage categories for deals and discounts</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={fetchCategories}
            className="flex-1 sm:flex-initial px-4 py-2 bg-primary rounded-lg hover:opacity-80 transition"
          >
            Refresh
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-initial px-4 py-2 text-white rounded-lg hover:bg-green-600 transition"
            style={{ backgroundColor: '#90EE90' }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">No categories found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{category.icon}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{category.order}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{category.dealCount || 0} deals</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(category)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(category)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        {category.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          setCategoryToDelete(category);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden grid gap-4">
            {categories.map((category) => (
              <div key={category._id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">{category.icon}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-500">Order: {category.order}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    category.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="text-sm text-gray-600">{category.dealCount || 0} deals</span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openModal(category)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(category)}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToDelete(category);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon *
                </label>
                <select
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryForm.order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:bg-green-600"
                  style={{ backgroundColor: '#90EE90' }}
                >
                  {selectedCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Category</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{categoryToDelete?.name}"?
              {categoryToDelete?.dealCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ This category has {categoryToDelete.dealCount} deal(s) and cannot be deleted.
                </span>
              )}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={categoryToDelete?.dealCount > 0}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  categoryToDelete?.dealCount > 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}