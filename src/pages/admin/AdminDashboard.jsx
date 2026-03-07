import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import { FaUsers, FaIdCard, FaCar, FaShieldAlt, FaExclamationTriangle, FaChartLine, FaPlusCircle, FaList, FaTrafficLight } from 'react-icons/fa';

const AdminDashboard = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalCitizens: 0,
    totalDrivers: 0,
    totalPolice: 0,
    totalViolations: 0,
    totalFines: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [citizensData, violationsData] = await Promise.all([
          api.getCitizens(),
          api.getViolations()
        ]);
        
        const totalFines = violationsData.reduce((sum, v) => sum + (Number(v.fine) || 0), 0);
        const totalDrivers = citizensData.filter(c => c.role === 'driver').length;
        const totalPolice = citizensData.filter(c => c.role === 'police').length;

        setStats({
          totalCitizens: citizensData.length,
          totalDrivers: totalDrivers,
          totalPolice: totalPolice,
          totalViolations: violationsData.length,
          totalFines: totalFines
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.totalCitizens'),
      value: stats.totalCitizens,
      icon: FaUsers,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/citizens'
    },
    {
      title: t('dashboard.totalDrivers'),
      value: stats.totalDrivers,
      icon: FaCar,
      color: 'from-green-500 to-green-600',
      link: null
    },
    {
      title: t('dashboard.totalPolice'),
      value: stats.totalPolice,
      icon: FaShieldAlt,
      color: 'from-purple-500 to-purple-600',
      link: null
    },
    {
      title: t('dashboard.totalViolations'),
      value: stats.totalViolations,
      icon: FaExclamationTriangle,
      color: 'from-red-500 to-red-600',
      link: null
    },
    {
      title: t('dashboard.totalFines'),
      value: `${Number(stats.totalFines).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en')} ₪`,
      icon: FaChartLine,
      color: 'from-orange-500 to-orange-600',
      link: null
    }
  ];

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {t('dashboard.adminDashboard')}
        </h1>
        <p className="text-gray-600 text-xl font-medium mb-2">{t('dashboard.welcome')}</p>
        <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const CardContent = (
            <div
              className={`bg-gradient-to-br ${card.color} rounded-2xl shadow-2xl p-6 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp relative overflow-hidden group`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Icon className="text-3xl" />
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold mb-2">{card.value}</h3>
                <p className="text-white/90 text-sm font-semibold">{card.title}</p>
              </div>
            </div>
          );

          return card.link ? (
            <Link key={index} to={card.link} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={index}>{CardContent}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/add-citizen"
          className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaPlusCircle className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('admin.addNewCitizen')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('admin.addNewCitizenDesc')}</p>
          </div>
        </Link>

        <Link
          to="/admin/citizens"
          className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaList className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('admin.viewAllCitizens')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('admin.viewAllCitizensDesc')}</p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;

