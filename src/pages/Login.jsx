import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login as apiLogin } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { FaIdCard, FaLock, FaCar, FaShieldAlt, FaUserShield, FaBuilding, FaGavel, FaArrowRight, FaTrafficLight } from 'react-icons/fa';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [detectedRole, setDetectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getDashboardPath = (role) => {
    const roleMap = {
      'driver': '/driver/dashboard',
      'police': '/police/dashboard',
      'interior': '/admin/dashboard',
      'transport': '/transport/dashboard',
      'court': '/court/dashboard',
      'traffic': '/admin/traffic-management'
    };
    return roleMap[role] || '/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetectedRole(null);
    setLoading(true);

    try {
      const user = await apiLogin(idNumber, password);
      
      if (user) {
        setDetectedRole(user.role);
        onLogin(user, user.role);
        navigate(getDashboardPath(user.role));
      } else {
        setError(t('auth.loginError'));
      }
    } catch (error) {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const roleIcons = {
    driver: FaCar,
    police: FaShieldAlt,
    interior: FaUserShield,
    transport: FaBuilding,
    court: FaGavel,
    traffic: FaTrafficLight
  };

  const roleColors = {
    driver: 'from-emerald-500 to-teal-600',
    police: 'from-blue-500 to-indigo-600',
    interior: 'from-purple-500 to-pink-600',
    transport: 'from-orange-500 to-red-600',
    court: 'from-amber-500 to-yellow-600',
    traffic: 'from-red-500 to-orange-600'
  };

  const roleLabels = {
    driver: t('roles.driver'),
    police: t('roles.police'),
    interior: t('roles.interior'),
    transport: t('roles.transport'),
    court: t('roles.court'),
    traffic: t('roles.traffic')
  };

  const Icon = detectedRole ? roleIcons[detectedRole] : FaCar;
  const gradientColor = detectedRole ? roleColors[detectedRole] : 'from-emerald-500 to-teal-600';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-white text-center animate-fadeIn">
          <div className="mb-8">
            <div className="inline-block p-6 bg-white/20 backdrop-blur-md rounded-3xl mb-6 animate-bounce">
              <FaCar className="text-7xl" />
            </div>
            <h2 className="text-5xl font-black mb-4 drop-shadow-2xl">{t('common.welcome')}</h2>
            <p className="text-2xl font-bold text-white/90 drop-shadow-lg">{t('navbar.title')}</p>
            <p className="text-lg font-semibold text-white/80 mt-4">{t('auth.systemRecognizes')}</p>
          </div>
          <div className="space-y-4 text-right">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-lg font-semibold">{t('auth.comprehensiveManagement')}</p>
              <p className="text-white/80 text-sm">{t('auth.allViolations')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-lg font-semibold">{t('auth.easyAccess')}</p>
              <p className="text-white/80 text-sm">{t('auth.governmentServices')}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md animate-slideInLeft">
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10">
            <LanguageSwitcher variant="light" />
          </div>
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-block p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
              <Icon className="text-5xl text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">{t('common.login')}</h1>
            <p className="text-gray-600">{t('navbar.title')}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-gray-800 mb-2 hidden lg:block">{t('common.login')}</h1>
              <p className="text-gray-600 text-sm">{t('auth.enterCredentials')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  {t('auth.idNumber')}
                </label>
                <div className="relative">
                  <FaIdCard className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 font-medium"
                    placeholder={t('auth.enterIdNumber')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 text-sm">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <FaLock className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 font-medium"
                    placeholder={t('auth.enterPassword')}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl animate-shake">
                  <div className="flex items-center">
                    <span className="text-lg ml-2">⚠️</span>
                    <span className="font-semibold text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>{t('auth.loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('common.login')}</span>
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {t('common.noAccount')}{' '}
                <Link 
                  to="/signup" 
                  className="text-emerald-600 font-bold hover:underline"
                >
                  {t('common.createAccount')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
