import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../services/api';
import { FaIdCard, FaLock, FaCar, FaShieldAlt, FaUser, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft, FaSpinner, FaEnvelope } from 'react-icons/fa';

const SignUp = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [userType, setUserType] = useState('driver');
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: 'ذكر',
    nationality: 'فلسطيني',
    licenseNumber: '',
    badgeNumber: '',
    rank: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [idNumberValid, setIdNumberValid] = useState(false);
  const [loadingCitizen, setLoadingCitizen] = useState(false);

  useEffect(() => {
    const searchCitizen = async () => {
      if (formData.idNumber.length >= 9) {
        setLoadingCitizen(true);
        try {
          const citizen = await api.findCitizenByIdNumber(formData.idNumber);
          
          if (citizen) {
            setFormData(prev => ({
              ...prev,
              name: citizen.name,
              phone: citizen.phone || '',
              email: citizen.email || '',
              address: citizen.address || '',
              dateOfBirth: citizen.date_of_birth || citizen.dateOfBirth || '',
              gender: citizen.gender || 'ذكر',
              nationality: citizen.nationality || 'فلسطيني'
            }));
            setIdNumberValid(true);
          } else {
            setIdNumberValid(false);
          }
        } catch (error) {
          setIdNumberValid(false);
        }
        setLoadingCitizen(false);
      } else {
        setIdNumberValid(false);
      }
    };

    const timeoutId = setTimeout(searchCitizen, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.idNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'idNumber') {
      setIdNumberValid(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (!formData.name || !formData.idNumber || !formData.password || !formData.phone || !formData.email) {
      setError(t('auth.fillAllRequired'));
      return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    
    try {
      const accountCheck = await api.checkCitizenAccount(formData.idNumber);
      if (accountCheck && accountCheck.hasAccount) {
        
        setError(t('auth.idAlreadyRegistered'));
        return;
      }
    } catch (error) {
      console.error('Error checking account:', error);
      
    }

    if (!idNumberValid) {
      setError(t('auth.idNotInDatabase'));
      return;
    }

    setLoading(true);
    
    try {
      const citizenData = {
        name: formData.name,
        idNumber: formData.idNumber,
        password: formData.password,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || '',
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || 'ذكر',
        nationality: formData.nationality || 'فلسطيني',
        role: userType === 'driver' ? 'driver' : 'police'
      };

      if (userType === 'driver') {
        citizenData.licenseNumber = formData.licenseNumber || 'N/A';
        citizenData.role = 'driver';
        
        
        const existingCitizen = await api.checkCitizenExists(formData.idNumber);
        if (existingCitizen) {
          
          await api.updateCitizen(formData.idNumber, { password: formData.password });
          const updatedUser = await api.checkCitizenExists(formData.idNumber);
          onLogin(updatedUser, updatedUser.role || 'driver');
        } else {
          
          const newUser = await api.addCitizen(citizenData);
          onLogin(newUser, newUser.role);
        }
        navigate('/driver/dashboard');
      } else {
        const requestData = {
          idNumber: formData.idNumber,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address || '',
          dateOfBirth: formData.dateOfBirth || '',
          gender: formData.gender || 'ذكر',
          nationality: formData.nationality || 'فلسطيني',
          password: formData.password,
          badgeNumber: formData.badgeNumber,
          rank: formData.rank || 'عريف',
          department: formData.department || 'مرور عام'
        };
        await api.addPoliceRequest(requestData);
        setLoading(false);
        alert(t('auth.policeRequestSent'));
        navigate('/login');
        return;
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || t('auth.registrationError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-6">
            <Link to="/login" className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 mb-4 group ${isRTL ? '' : 'flex-row-reverse'}`}>
              <FaArrowLeft className={`group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform duration-300`} />
              <span className="font-semibold">{t('auth.backToLogin')}</span>
            </Link>
            <div className={`text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}>
              <h1 className="text-4xl lg:text-5xl font-black text-gray-800 mb-3 animate-slideDown">
                {t('auth.createNewAccount')}
              </h1>
              <p className="text-gray-600 text-lg">{t('auth.startJourney')}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-200">
            <div className="flex flex-wrap gap-3 mb-8 bg-gray-50 p-2 rounded-2xl">
              <button
                type="button"
                onClick={() => setUserType('driver')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  userType === 'driver'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCar />
                <span className="font-bold">{t('roles.driver')}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('police')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  userType === 'police'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaShieldAlt />
                <span className="font-bold">{t('roles.police')}</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2`}>
                  <FaIdCard className="text-emerald-500" />
                  <span>{t('auth.idNumber')} *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className={`w-full ${isRTL ? 'pr-4 pl-12' : 'pl-4 pr-12'} py-3.5 bg-gray-50 border-2 rounded-xl focus:outline-none transition-all duration-300 text-gray-900 font-medium ${
                      idNumberValid 
                        ? 'border-green-500 focus:border-green-500 focus:bg-green-50' 
                        : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
                    } ${loadingCitizen ? 'opacity-50' : ''}`}
                    placeholder={t('auth.enterIdFirst')}
                    required
                    disabled={loadingCitizen}
                  />
                  {loadingCitizen && (
                    <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2`}>
                      <FaSpinner className="animate-spin text-emerald-500" />
                    </div>
                  )}
                  {idNumberValid && !loadingCitizen && (
                    <FaCheckCircle className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-green-500 animate-scaleIn`} />
                  )}
                </div>
                {idNumberValid && (
                  <p className="mt-2 text-green-600 font-semibold text-sm flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <FaCheckCircle className="text-green-500" />
                    <span>{t('auth.citizenFound')}</span>
                  </p>
                )}
                {formData.idNumber.length >= 9 && !idNumberValid && !loadingCitizen && (
                  <p className="mt-2 text-red-600 font-semibold text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {t('auth.idNotInDatabase')}
                  </p>
                )}
              </div>

              {idNumberValid && (
                <>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                      <FaUser className="text-emerald-500" />
                      <span>{t('auth.fullName')} *</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3.5 bg-green-50 border-2 border-green-300 rounded-xl text-gray-900 font-semibold focus:outline-none"
                      placeholder={t('auth.enterFullName')}
                      required
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                        <FaLock className="text-emerald-500" />
                        <span>{t('auth.password')} *</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-gray-900 font-medium"
                        placeholder={t('auth.enterPassword')}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                        <FaLock className="text-emerald-500" />
                        <span>{t('auth.confirmPassword')} *</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-gray-900 font-medium"
                        placeholder={t('auth.reEnterPassword')}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {userType === 'driver' && (
                    <>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                          <FaPhone className="text-emerald-500" />
                          <span>{t('common.phone')} *</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-green-50 border-2 border-green-300 rounded-xl text-gray-900 font-semibold focus:outline-none"
                          placeholder="05XXXXXXXX"
                          required
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                          <FaEnvelope className="text-emerald-500" />
                          <span>{t('common.email')} *</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-gray-900 font-medium"
                          placeholder="example@email.com"
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {idNumberValid && (
                <>
                  {userType === 'driver' ? (
                    <>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm">
                          {t('auth.licenseNumber')}
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-gray-900 font-medium"
                          placeholder="DL123456"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                          <FaMapMarkerAlt className="text-emerald-500" />
                          <span>{t('common.address')}</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-green-50 border-2 border-green-300 rounded-xl text-gray-900 font-semibold focus:outline-none"
                          placeholder={t('common.address')}
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm flex items-center gap-2">
                          <FaEnvelope className="text-blue-500" />
                          <span>{t('common.email')} *</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-medium"
                          placeholder="example@email.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2 text-sm">
                          {t('auth.badgeNumber')} *
                        </label>
                        <input
                          type="text"
                          name="badgeNumber"
                          value={formData.badgeNumber}
                          onChange={handleInputChange}
                          className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-medium"
                          placeholder="P001"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-bold mb-2 text-sm">
                            {t('auth.rank')} *
                          </label>
                          <input
                            type="text"
                            name="rank"
                            value={formData.rank}
                            onChange={handleInputChange}
                            className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-medium"
                            placeholder="عريف"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-bold mb-2 text-sm">
                            {t('auth.department')}
                          </label>
                          <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-medium"
                            placeholder="مرور عام"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl animate-shake">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-bold text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !idNumberValid}
                className={`w-full bg-gradient-to-r ${
                  userType === 'driver' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-600'
                } text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>{t('auth.registering')}</span>
                  </>
                ) : (
                  <span>{t('auth.createAccount')}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className={`${
                  userType === 'driver' ? 'text-emerald-600' : 'text-blue-600'
                } font-bold hover:underline`}>
                  {t('common.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
