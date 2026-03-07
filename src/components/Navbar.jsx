import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ user, userType, onLogout }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (userType === 'admin') return '/admin/dashboard';
    if (userType === 'driver') return '/driver/dashboard';
    return '/police/dashboard';
  };

  const getUserTypeLabel = () => {
    const roleKey = userType || 'user';
    return t(`roles.${roleKey}`);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      <div className="container mx-auto px-6 py-5 relative z-10">
        <div className="flex items-center justify-between">
          <Link 
            to={getDashboardPath()} 
            className="flex items-center gap-3 transform transition-all duration-300 hover:scale-110 group"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:bg-white/30 transition-all duration-300">
              <span className="text-3xl font-bold animate-bounce block">🚦</span>
            </div>
            <div>
              <span className="text-2xl font-extrabold block">{t('navbar.title')}</span>
              <span className="text-blue-200 text-xs font-medium">{t('navbar.subtitle')}</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 hover:scale-105">
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-2 rounded-lg">
                <FaUser className="text-lg" />
              </div>
              <div>
                <span className="font-bold block">{user?.name || t('common.unknown')}</span>
                <span className="text-blue-200 text-xs font-medium">
                  {getUserTypeLabel()}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 px-5 py-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:shadow-red-500/50 font-semibold whitespace-nowrap"
            >
              <FaSignOutAlt />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

