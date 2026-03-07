import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import Card from '../../components/Card';
import { FaExclamationTriangle, FaCalendarDay, FaChartLine, FaGavel } from 'react-icons/fa';

const PoliceDashboard = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    todayViolations: 0,
    totalViolations: 0,
    myViolations: 0,
    totalFines: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.idNumber) {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        const allViolations = await api.getViolations();
        
        if (!allViolations || !Array.isArray(allViolations)) {
          console.error('violations is not an array:', allViolations);
          setLoading(false);
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const todayViolations = allViolations.filter(v => v && v.date === today);
        const myViolations = allViolations.filter(v => v && v.policeIdNumber === user.idNumber);
        const totalFines = allViolations.reduce((sum, v) => sum + (Number(v?.fine) || 0), 0);

        setStats({
          todayViolations: todayViolations.length,
          totalViolations: allViolations.length,
          myViolations: myViolations.length,
          totalFines: totalFines
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message || t('common.error'));
        setLoading(false);
      }
    };

    loadData();
  }, [user?.idNumber]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-xl">{t('common.error')}: {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 text-xl">{t('common.error')}: {t('dashboard.userNotLoaded')}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  const locale = i18n.language === 'ar' ? 'ar' : 'en';

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('dashboard.policeDashboard')}</h1>
        <p className="text-gray-600 text-xl font-medium mb-2">{t('dashboard.welcome')}</p>
        <p className="text-2xl font-bold text-gray-800">{user?.name || t('common.unknown')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title={t('dashboard.todayViolations')}
          value={stats.todayViolations}
          icon={FaCalendarDay}
          color="blue"
        />
        <Card
          title={t('dashboard.totalViolations')}
          value={stats.totalViolations}
          icon={FaExclamationTriangle}
          color="red"
        />
        <Card
          title={t('dashboard.myViolations')}
          value={stats.myViolations}
          icon={FaChartLine}
          color="purple"
        />
        <Card
          title={t('dashboard.totalFines')}
          value={`${Number(stats.totalFines).toLocaleString(locale)} ₪`}
          icon={FaExclamationTriangle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('police.policeInfo')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('common.name')}:</span>
              <span className="font-semibold text-gray-800">{user.name || t('common.unknown')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('police.badgeNumber')}:</span>
              <span className="font-semibold text-gray-800">{user.badgeNumber || t('common.notSpecified')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('police.rank')}:</span>
              <span className="font-semibold text-gray-800">{user.rank || t('common.notSpecified')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('police.department')}:</span>
              <span className="font-semibold text-gray-800">{user.department || t('common.notSpecified')}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('police.quickStats')}</h2>
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{t('dashboard.todayViolations')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayViolations}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">{t('police.yourRegisteredViolations')}</p>
              <p className="text-2xl font-bold text-green-600">{stats.myViolations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/police/objections"
          className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group block relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaGavel className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('objections.manageObjections')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('objections.manageObjectionsSubtitle')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default PoliceDashboard;
