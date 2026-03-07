import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCitizenViolations } from '../../services/api';
import Card from '../../components/Card';
import { FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaBell } from 'react-icons/fa';

const DriverDashboard = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.idNumber) return;
      
      setLoading(true);
      try {
        const driverViolations = await getCitizenViolations(user.idNumber);
        setViolations(driverViolations || []);
      } catch (error) {
        console.error('Error loading violations:', error);
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.idNumber]);

  const totalViolations = violations.length;
  const paidViolations = violations.filter(v => v.status === 'paid').length;
  const unpaidViolations = violations.filter(v => v.status === 'unpaid').length;
  const totalFines = violations.reduce((sum, v) => sum + (v.status === 'unpaid' ? Number(v.fine) : 0), 0);

  const lastViolation = violations.length > 0 
    ? violations.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))[0]
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('dashboard.driverDashboard')}</h1>
        <p className="text-gray-600 text-xl font-medium mb-2">{t('dashboard.welcome')}</p>
        <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <Card
            title={t('dashboard.totalViolations')}
            value={totalViolations}
            icon={FaExclamationTriangle}
            color="red"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <Card
            title={t('dashboard.paid')}
            value={paidViolations}
            icon={FaCheckCircle}
            color="green"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <Card
            title={t('dashboard.unpaid')}
            value={unpaidViolations}
            icon={FaTimesCircle}
            color="yellow"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
          <Card
            title={t('dashboard.totalAmountDue')}
            value={`${Number(totalFines).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en')} ₪`}
            icon={FaExclamationTriangle}
            color="red"
          />
        </div>
      </div>

      {lastViolation && (
        <div className="card mb-6 animate-slideUp hover-lift">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full shadow-lg">
              <FaBell className="text-white text-xl animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">{t('dashboard.lastNotification')}</h2>
          </div>
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-6 rounded-xl border-r-4 border-red-500 shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <p className="text-gray-700 mb-2">
              <strong>{t('dashboard.violationType')}:</strong> {lastViolation.violationType}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>{t('common.date')}:</strong> {lastViolation.date} {t('common.at')} {lastViolation.time}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>{t('violations.location')}:</strong> {lastViolation.location}
            </p>
            <p className="text-gray-700">
              <strong>{t('dashboard.amount')}:</strong> {lastViolation.fine} ₪
            </p>
            <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${
              lastViolation.status === 'paid' 
                ? 'badge-paid' 
                : 'badge-unpaid'
            }`}>
              {lastViolation.status === 'paid' ? t('violations.paid') : t('violations.unpaid')}
            </span>
          </div>
        </div>
      )}

      {violations.length === 0 && (
        <div className="card text-center py-12">
          <FaExclamationTriangle className="text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-xl">{t('driver.noViolationsYet')}</p>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;

