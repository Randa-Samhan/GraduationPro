import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCitizenCars, getCarRequests } from '../../services/api';
import { FaCar, FaCalendar, FaPalette, FaPlusCircle, FaTimes, FaIdCard, FaExchangeAlt } from 'react-icons/fa';

const MyCars = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [hoveredPlate, setHoveredPlate] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.idNumber) return;
      
      setLoading(true);
      try {
        const [driverCars, allRequests] = await Promise.all([
          getCitizenCars(user.idNumber),
          getCarRequests()
        ]);
        setCars(driverCars || []);
        const userRequests = (allRequests || []).filter(r => r.ownerIdNumber === user.idNumber && r.status === 'pending');
        setPendingRequests(userRequests);
      } catch (error) {
        console.error('Error loading cars:', error);
        setCars([]);
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.idNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('cars.myCars')}</h1>
          <p className="text-gray-600 text-lg">{t('driver.manageRegisteredCars')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/driver/request-transfer')}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <FaExchangeAlt className="text-xl" />
            <span className="font-bold">{t('driver.requestTransferCar')}</span>
          </button>
          <button
            onClick={() => navigate('/driver/request-car')}
            className="btn-primary flex items-center space-x-2 space-x-reverse sparkle"
          >
            <FaPlusCircle className="text-xl" />
            <span className="font-bold">{t('driver.requestAddCar')}</span>
          </button>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-5 mb-6 shadow-xl animate-slideDown">
          <p className="text-yellow-800 font-bold text-lg flex items-center">
            <span className="text-2xl ml-2 animate-pulse">⚠️</span>
            {t('driver.pendingCarRequests', { count: pendingRequests.length })}
          </p>
        </div>
      )}

      {cars.length === 0 ? (
        <div className="card text-center py-16 hover-lift">
          <FaCar className="text-7xl text-gray-400 mx-auto mb-6 animate-bounce" />
          <p className="text-gray-600 text-2xl font-bold">{t('driver.noRegisteredCars')}</p>
          <p className="text-gray-500 mt-2">{t('driver.requestNewCar')}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {cars.map((car, index) => (
            <div 
              key={car.id} 
              className="relative"
            >
              <button
                onMouseEnter={() => setHoveredPlate(car.id)}
                onMouseLeave={() => setHoveredPlate(null)}
                onClick={() => setSelectedCar(car)}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-110 animate-slideUp font-extrabold text-2xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {car.plateNumber}
              </button>
              {hoveredPlate === car.id && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-50 animate-slideDown border-2 border-blue-400">
                  <div className="flex items-center mb-2">
                    <FaCar className="text-blue-400 ml-2" />
                    <span className="font-bold text-lg">{car.plateNumber}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-400">{t('cars.make')}:</span> {car.make}</p>
                    <p><span className="text-gray-400">{t('cars.model')}:</span> {car.model}</p>
                    <p><span className="text-gray-400">{t('cars.year')}:</span> {car.year}</p>
                    <p><span className="text-gray-400">{t('cars.color')}:</span> {car.color}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                    {t('driver.clickForFullDetails')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <FaCar className="ml-3" />
                {t('driver.carInformation')}
              </h2>
              <button
                onClick={() => setSelectedCar(null)}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center mb-2">
                    <FaCar className="text-blue-600 ml-2" />
                    <span className="text-gray-600 text-sm">{t('violations.plateNumber')}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{selectedCar.plateNumber}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center mb-2">
                    <FaIdCard className="text-green-600 ml-2" />
                    <span className="text-gray-600 text-sm">{t('driver.ownerIdNumber')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{selectedCar.ownerIdNumber}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.make')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{selectedCar.make}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.model')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{selectedCar.model}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.year')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{selectedCar.year}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border-2 border-cyan-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.color')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{selectedCar.color}</p>
                </div>
              </div>
              {selectedCar.registrationDate && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center mb-2">
                    <FaCalendar className="text-gray-600 ml-2" />
                    <span className="text-gray-600 text-sm">{t('cars.registrationDate')}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{selectedCar.registrationDate}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setSelectedCar(null)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCars;
