import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addCitizen, checkCitizenExists, findCitizenByIdNumber } from '../../services/api';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaFlag,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaUser,
  FaUserShield,
  FaVenusMars,
} from 'react-icons/fa';

const ROLE_OPTIONS = ['driver', 'police', 'interior', 'transport', 'court', 'traffic'];
const DEFAULT_GENDER = 'ذكر';
const DEFAULT_NATIONALITY = 'فلسطيني';

const buildInitialFormData = () => ({
  idNumber: '',
  name: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: DEFAULT_GENDER,
  nationality: DEFAULT_NATIONALITY,
  role: 'driver',
  licenseNumber: '',
  badgeNumber: '',
  rank: '',
  department: '',
});

const mapCitizenToFormData = (citizen) => ({
  idNumber: citizen.idNumber || '',
  name: citizen.name || '',
  phone: citizen.phone || '',
  address: citizen.address || '',
  dateOfBirth: citizen.dateOfBirth || '',
  gender: citizen.gender || DEFAULT_GENDER,
  nationality: citizen.nationality || DEFAULT_NATIONALITY,
  role: citizen.role || 'driver',
  licenseNumber: citizen.licenseNumber || '',
  badgeNumber: citizen.badgeNumber || '',
  rank: citizen.rank || '',
  department: citizen.department || '',
});

const AddCitizen = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { idNumber } = useParams();
  const roleLabel = t('common.role') === 'common.role'
    ? (i18n.language === 'ar' ? 'الدور' : 'Role')
    : t('common.role');
  const [formData, setFormData] = useState(buildInitialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const loadCitizen = async () => {
      if (!idNumber) return;

      try {
        const citizen = await findCitizenByIdNumber(idNumber);
        if (citizen) {
          setFormData(mapCitizenToFormData(citizen));
          setIsEditMode(true);
        }
      } catch (loadError) {
        console.error('Error loading citizen:', loadError);
      }
    };

    loadCitizen();
  }, [idNumber]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'role' && value !== 'driver') {
        next.licenseNumber = '';
      }

      if (name === 'role' && value !== 'police') {
        next.badgeNumber = '';
        next.rank = '';
        next.department = '';
      }

      return next;
    });

    setError('');
    setSuccess('');
  };

  const handleIdNumberChange = async (event) => {
    const value = event.target.value;

    setFormData((prev) => ({ ...prev, idNumber: value }));
    setError('');
    setSuccess('');

    if (value.length < 9) {
      setIsEditMode(false);
      return;
    }

    try {
      const citizen = await findCitizenByIdNumber(value);
      if (citizen) {
        setFormData(mapCitizenToFormData(citizen));
        setIsEditMode(true);
      } else {
        setIsEditMode(false);
      }
    } catch {
      setIsEditMode(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.idNumber || !formData.name || !formData.phone) {
      setError(t('auth.fillAllRequired'));
      return;
    }

    setLoading(true);

    try {
      if (!isEditMode) {
        const exists = await checkCitizenExists(formData.idNumber);
        if (exists) {
          setError(t('auth.idAlreadyRegistered'));
          setLoading(false);
          return;
        }
      }

      const citizenData = {
        ...formData,
        role: formData.role,
        licenseNumber: formData.role === 'driver' ? formData.licenseNumber : '',
        badgeNumber: formData.role === 'police' ? formData.badgeNumber : '',
        rank: formData.role === 'police' ? formData.rank : '',
        department: formData.role === 'police' ? formData.department : '',
      };

      if (!isEditMode) {
        citizenData.password = '00000';
      }

      await addCitizen(citizenData);
      setSuccess(isEditMode ? t('admin.updateCitizenSuccess') : t('admin.addCitizenSuccess'));

      setTimeout(() => {
        if (!isEditMode) {
          setFormData(buildInitialFormData());
          setIsEditMode(false);
        }
        setSuccess('');
      }, 2000);
    } catch (saveError) {
      console.error('Error adding citizen:', saveError);
      setError(saveError.message || t('admin.saveCitizenError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          {isEditMode ? t('admin.editCitizen') : t('admin.addNewCitizen')}
        </h1>
        <p className="text-gray-600">{isEditMode ? t('admin.editCitizenDesc') : t('admin.addNewCitizenDesc')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideUp">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">
                <FaIdCard className="inline ml-2 text-blue-600" />
                {t('auth.idNumber')} *
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleIdNumberChange}
                className={`input-field w-full transform transition-all duration-200 focus:scale-105 ${isEditMode ? 'bg-green-50 border-green-300' : ''}`}
                placeholder={t('auth.enterIdNumber')}
                required
                readOnly={isEditMode}
              />
              {isEditMode && (
                <p className="mt-2 text-green-600 text-sm">{t('admin.citizenFoundEditable')}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">
                <FaUser className="inline ml-2 text-blue-600" />
                {t('auth.fullName')} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('auth.enterFullName')}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaPhone className="inline ml-2 text-blue-600" />
                {t('common.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder="05XXXXXXXX"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaUserShield className="inline ml-2 text-blue-600" />
                {roleLabel} *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                required
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaCalendarAlt className="inline ml-2 text-blue-600" />
                {t('citizens.dateOfBirth')}
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaVenusMars className="inline ml-2 text-blue-600" />
                {t('citizens.gender')}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
              >
                <option value="ذكر">{t('citizens.male')}</option>
                <option value="أنثى">{t('citizens.female')}</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaFlag className="inline ml-2 text-blue-600" />
                {t('citizens.nationality')}
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('citizens.nationality')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">
                <FaMapMarkerAlt className="inline ml-2 text-blue-600" />
                {t('common.address')}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder={t('common.address')}
              />
            </div>

            {formData.role === 'driver' && (
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaIdCard className="inline ml-2 text-blue-600" />
                  {t('auth.licenseNumber')}
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="input-field w-full transform transition-all duration-200 focus:scale-105"
                  placeholder={t('auth.licenseNumber')}
                />
              </div>
            )}

            {formData.role === 'police' && (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaIdCard className="inline ml-2 text-blue-600" />
                    {t('auth.badgeNumber')}
                  </label>
                  <input
                    type="text"
                    name="badgeNumber"
                    value={formData.badgeNumber}
                    onChange={handleInputChange}
                    className="input-field w-full transform transition-all duration-200 focus:scale-105"
                    placeholder={t('auth.badgeNumber')}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaUserShield className="inline ml-2 text-blue-600" />
                    {t('auth.rank')}
                  </label>
                  <input
                    type="text"
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    className="input-field w-full transform transition-all duration-200 focus:scale-105"
                    placeholder={t('auth.rank')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FaUserShield className="inline ml-2 text-blue-600" />
                    {t('auth.department')}
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="input-field w-full transform transition-all duration-200 focus:scale-105"
                    placeholder={t('auth.department')}
                  />
                </div>
              </>
            )}
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
            disabled={loading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <FaSave />
            <span>{loading ? t('common.saving') : t('admin.saveCitizen')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCitizen;
