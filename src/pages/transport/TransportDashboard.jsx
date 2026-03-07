import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as api from '../../services/api';
import Card from '../../components/Card';
import { FaCar, FaPlusCircle, FaList, FaUsers } from 'react-icons/fa';

const TransportDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalCars: 0,
    totalCitizens: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [carsData, citizensData] = await Promise.all([
          api.getCars(),
          api.getCitizens()
        ]);
        
        setStats({
          totalCars: carsData.length,
          totalCitizens: citizensData.length
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
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {t('dashboard.transportDashboard')}
        </h1>
        <p className="text-gray-600 text-xl font-medium mb-2">{t('dashboard.welcome')}</p>
        <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <Card
            title={t('cars.allCars')}
            value={stats.totalCars}
            icon={FaCar}
            color="blue"
          />
        </div>
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <Card
            title={t('dashboard.totalCitizens')}
            value={stats.totalCitizens}
            icon={FaUsers}
            color="green"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/transport/add-car"
          className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaPlusCircle className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('dashboard.addNewCar')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('dashboard.addNewCarDesc')}</p>
          </div>
        </Link>

        <Link
          to="/transport/all-cars"
          className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaList className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('dashboard.viewAllCars')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('dashboard.viewAllCarsDesc')}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Link
          to="/transport/car-requests"
          className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:shadow-3xl animate-slideUp group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                <FaList className="text-5xl" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold mb-3">{t('dashboard.carRequests')}</h3>
            <p className="text-white/90 text-lg font-medium">{t('dashboard.carRequestsDesc')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default TransportDashboard;
