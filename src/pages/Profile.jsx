import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateCitizen, findCitizenByIdNumber, sendEmailVerificationCode, verifyEmailCode } from '../services/api';
import { FaUser, FaIdCard, FaPhone, FaMapMarkerAlt, FaCalendar, FaLock, FaSave, FaTimes, FaVenusMars, FaGlobe, FaEnvelope } from 'react-icons/fa';

const Profile = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState({
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    verificationCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const currentUser = await findCitizenByIdNumber(user.idNumber);
          if (currentUser) {
            setProfileData({
              phone: currentUser.phone || '',
              address: currentUser.address || ''
            });
            setEmailData({
              newEmail: '',
              verificationCode: ''
            });
            setCodeSent(false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [user]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    setLoading(true);

    try {
      const updateData = {
        phone: profileData.phone,
        address: profileData.address
      };

      await updateCitizen(user.idNumber, updateData);
      const updatedUser = await findCitizenByIdNumber(user.idNumber);

      if (updatedUser) {
        setSuccess(true);
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(t('profile.errorUpdatingData'));
      }
    } catch (error) {
      setError(error.message || t('profile.errorUpdatingData'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordData.password) {
      setPasswordError(t('profile.passwordRequired'));
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError(t('auth.passwordsNotMatch'));
      return;
    }

    if (passwordData.password.length < 6) {
      setPasswordError(t('auth.passwordMinLength'));
      return;
    }

    setPasswordLoading(true);

    try {
      const updateData = {
        password: passwordData.password
      };

      await updateCitizen(user.idNumber, updateData);
      const updatedUser = await findCitizenByIdNumber(user.idNumber);

      if (updatedUser) {
        setPasswordSuccess(true);
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        setPasswordData({ password: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(t('profile.errorUpdatingPassword'));
      }
    } catch (error) {
      setPasswordError(error.message || t('profile.errorUpdatingPassword'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setCodeSent(false);

    if (!emailData.newEmail) {
      setEmailError(t('profile.emailRequired'));
      return;
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.newEmail)) {
      setEmailError(t('auth.invalidEmail'));
      return;
    }

    setSendingCode(true);
    try {
      await sendEmailVerificationCode(user.idNumber, emailData.newEmail);
      setCodeSent(true);
      setEmailError('');
    } catch (error) {
      setEmailError(error.message || t('profile.errorSendingCode'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);

    if (!emailData.newEmail || !emailData.verificationCode) {
      setEmailError(t('profile.emailAndCodeRequired'));
      return;
    }

    if (emailData.verificationCode.length !== 6) {
      setEmailError(t('profile.invalidCodeLength'));
      return;
    }

    setEmailLoading(true);
    try {
      await verifyEmailCode(user.idNumber, emailData.newEmail, emailData.verificationCode);
      setEmailSuccess(true);
      setEmailError('');
      setEmailData({ newEmail: '', verificationCode: '' });
      setCodeSent(false);
      
      
      const updatedUser = await findCitizenByIdNumber(user.idNumber);
      if (updatedUser && onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      setCurrentUser(updatedUser);
      
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (error) {
      setEmailError(error.message || t('profile.errorVerifyingCode'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData({ ...emailData, [name]: value });
    if (name === 'newEmail') {
      setCodeSent(false);
      setEmailData(prev => ({ ...prev, verificationCode: '' }));
    }
  };

  const handleCancel = async () => {
    try {
      const currentUser = await findCitizenByIdNumber(user.idNumber);
      if (currentUser) {
        setProfileData({
          phone: currentUser.phone || '',
          address: currentUser.address || ''
        });
      }
      setError('');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (user) {
        try {
          const userData = await findCitizenByIdNumber(user.idNumber);
          setCurrentUser(userData);
        } catch (error) {
          console.error('Error loading current user:', error);
        }
      }
    };
    loadCurrentUser();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('profile.title')}</h1>
          <p className="text-gray-600 text-lg">{t('profile.subtitle')}</p>
        </div>

        <div className="card shadow-2xl border-2 border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaUser className="text-blue-600" />
            <span>{t('profile.personalInfo')}</span>
          </h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-6 py-4 rounded-xl mb-6 animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-semibold">{t('profile.dataUpdatedSuccess')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaIdCard className="inline ml-2 text-blue-600" />
                  {t('auth.idNumber')}
                </label>
                <input
                  type="text"
                  value={currentUser?.idNumber || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.cannotChangeId')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaUser className="inline ml-2 text-blue-600" />
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  value={currentUser?.name || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.cannotChangeName')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaEnvelope className="inline ml-2 text-blue-600" />
                  {t('common.email')}
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.currentEmail')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaCalendar className="inline ml-2 text-blue-600" />
                  {t('citizens.dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={currentUser?.dateOfBirth || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.cannotChangeDateOfBirth')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaVenusMars className="inline ml-2 text-blue-600" />
                  {t('citizens.gender')}
                </label>
                <input
                  type="text"
                  value={currentUser?.gender || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.cannotChangeGender')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaGlobe className="inline ml-2 text-blue-600" />
                  {t('citizens.nationality')}
                </label>
                <input
                  type="text"
                  value={currentUser?.nationality || ''}
                  className="input-field bg-gray-100 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">{t('profile.cannotChangeNationality')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaPhone className="inline ml-2 text-blue-600" />
                  {t('common.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  <FaMapMarkerAlt className="inline ml-2 text-blue-600" />
                  {t('common.address')} *
                </label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
              >
                <FaSave />
                <span>{loading ? t('profile.saving') : t('profile.saveChanges')}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2 transform transition-all duration-200 hover:scale-105"
              >
                <FaTimes />
                <span>{t('common.cancel')}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="card shadow-2xl border-2 border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaLock className="text-blue-600" />
            <span>{t('profile.changePassword')}</span>
          </h2>

          {passwordError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{passwordError}</span>
              </div>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-6 py-4 rounded-xl mb-6 animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-semibold">{t('profile.passwordUpdatedSuccess')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              {t('profile.passwordHint')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  {t('profile.newPassword')} *
                </label>
                <input
                  type="password"
                  name="password"
                  value={passwordData.password}
                  onChange={handlePasswordInputChange}
                  className="input-field"
                  placeholder={t('profile.newPasswordPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  {t('auth.confirmPassword')} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="input-field"
                  placeholder={t('auth.reEnterPassword')}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
              >
                <FaLock />
                <span>{passwordLoading ? t('profile.updating') : t('profile.updatePassword')}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="card shadow-2xl border-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FaEnvelope className="text-blue-600" />
            <span>{t('profile.changeEmail')}</span>
          </h2>

          {emailError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{emailError}</span>
              </div>
            </div>
          )}

          {emailSuccess && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-6 py-4 rounded-xl mb-6 animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-semibold">{t('profile.emailUpdatedSuccess')}</span>
              </div>
            </div>
          )}

          {codeSent && (
            <div className="bg-blue-50 border-2 border-blue-300 text-blue-700 px-6 py-4 rounded-xl mb-6 animate-slideDown">
              <div className="flex items-center gap-2">
                <span className="text-xl">📧</span>
                <span className="font-semibold">{t('profile.codeSentSuccess')}</span>
              </div>
            </div>
          )}

          <form onSubmit={codeSent ? handleEmailSubmit : handleSendVerificationCode} className="space-y-6">
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              {t('profile.emailChangeHint')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  {t('profile.newEmail')} *
                </label>
                <input
                  type="email"
                  name="newEmail"
                  value={emailData.newEmail}
                  onChange={handleEmailInputChange}
                  className="input-field"
                  placeholder={t('profile.newEmailPlaceholder')}
                  required
                  disabled={codeSent}
                />
              </div>
              {codeSent && (
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">
                    {t('profile.verificationCode')} *
                  </label>
                  <input
                    type="text"
                    name="verificationCode"
                    value={emailData.verificationCode}
                    onChange={handleEmailInputChange}
                    className="input-field"
                    placeholder={t('profile.verificationCodePlaceholder')}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
              {!codeSent ? (
                <button
                  type="submit"
                  disabled={sendingCode}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
                >
                  <FaEnvelope />
                  <span>{sendingCode ? t('profile.sendingCode') : t('profile.sendVerificationCode')}</span>
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 transform transition-all duration-200 hover:scale-105"
                  >
                    <FaSave />
                    <span>{emailLoading ? t('profile.verifying') : t('profile.verifyAndUpdate')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false);
                      setEmailData({ newEmail: emailData.newEmail, verificationCode: '' });
                      setEmailError('');
                    }}
                    className="btn-secondary flex items-center gap-2 transform transition-all duration-200 hover:scale-105"
                  >
                    <FaTimes />
                    <span>{t('common.cancel')}</span>
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

