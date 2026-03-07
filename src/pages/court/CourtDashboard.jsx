import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import Card from '../../components/Card';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaDollarSign, FaFileSignature } from 'react-icons/fa';

const CourtDashboard = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    totalViolations: 0,
    paidViolations: 0,
    unpaidViolations: 0,
    totalFines: 0,
    unpaidFines: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const violationsData = await api.getViolations();
        
        const paid = violationsData.filter(v => v.status === 'paid').length;
        const unpaid = violationsData.filter(v => v.status === 'unpaid').length;
        const totalFines = violationsData.reduce((sum, v) => sum + (Number(v.fine) || 0), 0);
        const unpaidFines = violationsData
          .filter(v => v.status === 'unpaid')
          .reduce((sum, v) => sum + (Number(v.fine) || 0), 0);

        setStats({
          totalViolations: violationsData.length,
          paidViolations: paid,
          unpaidViolations: unpaid,
          totalFines: totalFines,
          unpaidFines: unpaidFines
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

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {t('dashboard.courtDashboard')}
        </h1>
        <p className="text-gray-600 text-xl font-medium mb-2">{t('dashboard.welcome')}</p>
        <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <Card
            title={t('dashboard.totalViolations')}
            value={stats.totalViolations}
            icon={FaExclamationTriangle}
            color="red"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <Card
            title={t('dashboard.paidViolations')}
            value={stats.paidViolations}
            icon={FaCheckCircle}
            color="green"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <Card
            title={t('dashboard.unpaidViolations')}
            value={stats.unpaidViolations}
            icon={FaTimesCircle}
            color="yellow"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <Card
            title={t('dashboard.totalFines')}
            value={`${Number(stats.totalFines).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en')} ₪`}
            icon={FaDollarSign}
            color="blue"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
          <Card
            title={t('dashboard.unpaidFines')}
            value={`${Number(stats.unpaidFines).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en')} ₪`}
            icon={FaDollarSign}
            color="red"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white animate-slideUp relative overflow-hidden group hover-lift">
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <FaFileSignature className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('clearance.manageRequests')}</h3>
            <p className="text-white/90 text-lg font-medium mb-6">{t('clearance.manageRequestsSubtitle')}</p>
            <Link
              to="/court/clearance-requests"
              className="inline-block bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold transform transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-xl hover:shadow-2xl"
            >
              {t('clearance.title')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtDashboard;
