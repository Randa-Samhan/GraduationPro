import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';

const ViolationTypesManagement = ({ backTo = '/transport/dashboard', pageTitleKey = null, pageSubtitleKey = null }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageTitle = pageTitleKey ? t(pageTitleKey) : t('violationTypes.title');
  const pageSubtitle = pageSubtitleKey ? t(pageSubtitleKey) : t('dashboard.manageViolationTypesDesc');
  const [violationTypes, setViolationTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    fine: '',
    category: 'simple'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categoryOptions = [
    { value: 'simple', label: t('violationTypes.categories.simple') },
    { value: 'medium', label: t('violationTypes.categories.medium') },
    { value: 'dangerous', label: t('violationTypes.categories.dangerous') },
    { value: 'severe', label: t('violationTypes.categories.severe') },
    { value: 'administrative', label: t('violationTypes.categories.administrative') },
    { value: 'vehicle_impound', label: t('violationTypes.categories.vehicle_impound') },
    { value: 'license_suspension', label: t('violationTypes.categories.license_suspension') },
    { value: 'court_case', label: t('violationTypes.categories.court_case') }
  ];

  const getCategoryLabel = (value) => {
    const option = categoryOptions.find((opt) => opt.value === value);
    return option ? option.label : value || t('common.notSpecified');
  };

  useEffect(() => {
    loadViolationTypes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = violationTypes.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTypes(filtered);
    } else {
      setFilteredTypes(violationTypes);
    }
  }, [searchTerm, violationTypes]);

  const loadViolationTypes = async () => {
    try {
      setLoading(true);
      const types = await api.getViolationTypes();
      setViolationTypes(types);
      setFilteredTypes(types);
    } catch (error) {
      console.error('Error loading violation types:', error);
      setError(t('violationTypes.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.fine || !formData.category) {
      setError(t('violationTypes.fillAllFields'));
      return;
    }

    if (parseFloat(formData.fine) <= 0) {
      setError(t('violationTypes.fineGreaterThanZero'));
      return;
    }

    try {
      if (editingType) {
        await api.updateViolationType(editingType.id, {
          name: formData.name,
          fine: parseFloat(formData.fine),
          category: formData.category
        });
        setSuccess(t('violationTypes.updateSuccess'));
      } else {
        await api.addViolationType({
          name: formData.name,
          fine: parseFloat(formData.fine),
          category: formData.category
        });
        setSuccess(t('violationTypes.addSuccess'));
      }
      
      setShowModal(false);
      setFormData({ name: '', fine: '', category: 'simple' });
      setEditingType(null);
      loadViolationTypes();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || t('violationTypes.saveError'));
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      fine: type.fine.toString(),
      category: type.category || 'simple'
    });
    setShowModal(true);
  };

  const handleDelete = async (typeId) => {
    if (!window.confirm(t('violationTypes.confirmDelete'))) {
      return;
    }

    try {
      await api.deleteViolationType(typeId);
      setSuccess(t('violationTypes.deleteSuccess'));
      loadViolationTypes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || t('violationTypes.deleteErrorInUse'));
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddNew = () => {
    setEditingType(null);
    setFormData({ name: '', fine: '', category: 'simple' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => navigate(backTo)}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-flex items-center space-x-1 space-x-reverse"
        >
          <span>←</span>
          <span>{t('common.back')}</span>
        </button>
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {pageTitle}
        </h1>
        <p className="text-gray-600 text-xl font-medium">{pageSubtitle}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 animate-slideDown">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 animate-slideDown">
          {success}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('violationTypes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10 w-full"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center space-x-2 space-x-reverse"
          >
            <FaPlus />
            <span>{t('violationTypes.addNew')}</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="px-6 py-4 text-right font-bold">{t('common.number')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violationTypes.name')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violationTypes.category')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violationTypes.fine')} (₪)</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? t('common.noResultsFound') : t('violationTypes.noTypes')}
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type, index) => (
                  <tr key={type.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{type.name}</td>
                    <td className="px-6 py-4 text-gray-700">{getCategoryLabel(type.category)}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{type.fine} ₪</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold flex items-center">
                <FaExclamationTriangle className="ml-3" />
                {editingType ? t('violationTypes.editTitle') : t('violationTypes.addTitle')}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t('violationTypes.name')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder={t('violationTypes.namePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t('violationTypes.fine')} (₪) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="fine"
                  value={formData.fine}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  placeholder={t('violationTypes.finePlaceholder')}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t('violationTypes.category')} <span className="text-red-600">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field w-full"
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingType ? t('common.update') : t('common.add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', fine: '', category: 'simple' });
                    setEditingType(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationTypesManagement;

