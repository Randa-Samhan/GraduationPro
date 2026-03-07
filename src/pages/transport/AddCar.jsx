import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaCar, FaIdCard, FaPalette, FaCalendarAlt, FaSave, FaArrowRight } from 'react-icons/fa';

const AddCar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    plateNumber: '',
    ownerIdNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setSuccess('');

    if (name === 'ownerIdNumber' && value.length >= 9) {
      const loadOwnerInfo = async () => {
        try {
          const citizen = await api.checkCitizenExists(value);
          if (citizen) {
            setOwnerInfo(citizen);
            setError('');
          } else {
            setOwnerInfo(null);
            setError(t('cars.ownerNotFound'));
          }
        } catch (error) {
          setOwnerInfo(null);
          setError(t('cars.ownerNotFound'));
        }
      };
      loadOwnerInfo();
    }
  };

  const handlePlateChange = async (e) => {
    const plate = e.target.value.toUpperCase();
    setFormData({ ...formData, plateNumber: plate });
    
    if (plate.length >= 3) {
      try {
        const existingCar = await api.getCarByPlate(plate);
        if (existingCar) {
          setError(t('cars.plateExists'));
        } else {
          setError('');
        }
      } catch (error) {
        setError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.plateNumber || !formData.ownerIdNumber || !formData.make || !formData.model) {
      setError(t('auth.fillAllRequired'));
      return;
    }

    if (!ownerInfo) {
      setError(t('cars.ownerNotFound'));
      return;
    }

    try {
      const existingCar = await api.getCarByPlate(formData.plateNumber);
      if (existingCar) {
        setError(t('cars.plateExists'));
        return;
      }
    } catch (error) {
    }

    setLoading(true);
    
    try {
      await api.addCar({
        plateNumber: formData.plateNumber,
        ownerIdNumber: formData.ownerIdNumber,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        registrationDate: formData.registrationDate
      });
      
      setSuccess(t('cars.addCarSuccess'));
      
      setTimeout(() => {
        setFormData({
          plateNumber: '',
          ownerIdNumber: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          registrationDate: new Date().toISOString().split('T')[0]
        });
        setOwnerInfo(null);
        setSuccess('');
        navigate('/transport/all-cars');
      }, 2000);
    } catch (err) {
      setError(err.message || t('cars.addCarError'));
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate('/transport/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          {t('dashboard.addNewCar')}
        </h1>
        <p className="text-gray-600">{t('dashboard.addNewCarDesc')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideUp">
        {ownerInfo && (
          <div className="bg-green-50 border-2 border-green-400 p-4 rounded-lg mb-6 animate-slideDown">
            <p className="text-green-800 font-semibold mb-2">{t('violations.ownerInfo')}:</p>
            <p className="text-green-700">{t('common.name')}: {ownerInfo.name}</p>
            <p className="text-green-700">{t('violations.ownerIdNumber')}: {ownerInfo.idNumber}</p>
            <p className="text-green-700">{t('common.phone')}: {ownerInfo.phone}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaCar className="inline ml-2 text-blue-600" />
                {t('violations.plateNumber')} *
              </label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handlePlateChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('violations.plateExample')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaIdCard className="inline ml-2 text-blue-600" />
                {t('violations.ownerIdNumber')} *
              </label>
              <input
                type="text"
                name="ownerIdNumber"
                value={formData.ownerIdNumber}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('auth.enterIdNumber')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('cars.make')} *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('cars.makePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('cars.model')} *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('cars.modelPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('cars.year')}
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaPalette className="inline ml-2 text-blue-600" />
                {t('cars.color')}
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('cars.colorPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">
                <FaCalendarAlt className="inline ml-2 text-blue-600" />
                {t('cars.registrationDate')}
              </label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg animate-slideUp">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !ownerInfo}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <FaSave />
            <span>{loading ? t('common.saving') : t('cars.saveCar')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCar;

