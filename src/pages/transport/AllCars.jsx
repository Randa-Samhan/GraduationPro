import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaCar, FaIdCard, FaUser, FaPlusCircle, FaArrowRight, FaSearch, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const AllCars = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [carsList, setCarsList] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [carsData, citizensData] = await Promise.all([
          api.getCars(),
          api.getCitizens()
        ]);
        setCarsList(carsData);
        setCitizens(citizensData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const [editingCar, setEditingCar] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [changingOwner, setChangingOwner] = useState(null);
  const [newOwnerId, setNewOwnerId] = useState('');

  const getOwnerName = (ownerIdNumber) => {
    const owner = citizens.find(c => c.idNumber === ownerIdNumber);
    return owner ? owner.name : t('common.unknown');
  };

  const handleEdit = (car) => {
    setEditingCar(car.id);
    setEditFormData({
      plateNumber: car.plateNumber,
      make: car.make,
      model: car.model,
      year: car.year,
      color: car.color,
      registrationDate: car.registrationDate
    });
  };

  const handleSaveEdit = async (carId) => {
    try {
      await api.updateCar(carId, editFormData);
      setCarsList(carsList.map(c => c.id === carId ? { ...c, ...editFormData } : c));
      setEditingCar(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating car:', error);
      alert(t('cars.updateCarError'));
    }
  };

  const handleCancelEdit = () => {
    setEditingCar(null);
    setEditFormData({});
  };

  const handleDelete = async (carId) => {
    if (window.confirm(t('cars.confirmDeleteCar'))) {
      try {
        await api.deleteCar(carId);
        setCarsList(carsList.filter(c => c.id !== carId));
      } catch (error) {
        console.error('Error deleting car:', error);
        alert(t('cars.deleteCarError'));
      }
    }
  };

  const handleChangeOwner = (car) => {
    setChangingOwner(car.id);
    setNewOwnerId(car.ownerIdNumber);
  };

  const handleSaveOwnerChange = async (carId) => {
    const owner = citizens.find(c => c.idNumber === newOwnerId);
    if (!owner) {
      alert(t('cars.ownerNotFound'));
      return;
    }
    try {
      await api.updateCar(carId, { ownerIdNumber: newOwnerId });
      setCarsList(carsList.map(c => c.id === carId ? { ...c, ownerIdNumber: newOwnerId } : c));
      setChangingOwner(null);
      setNewOwnerId('');
    } catch (error) {
      console.error('Error updating car owner:', error);
      alert(t('cars.updateOwnerError'));
    }
  };

  const handleCancelOwnerChange = () => {
    setChangingOwner(null);
    setNewOwnerId('');
  };

  const filteredCars = searchTerm.length >= 9 && /^\d+$/.test(searchTerm)
    ? carsList.filter(car => car.ownerIdNumber === searchTerm)
    : carsList.filter(car =>
        car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.ownerIdNumber.includes(searchTerm) ||
        getOwnerName(car.ownerIdNumber).toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate('/transport/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
              {t('cars.allCars')}
            </h1>
            <p className="text-gray-600">{t('dashboard.viewAllCarsDesc')}</p>
          </div>
          <button
            onClick={() => navigate('/transport/add-car')}
            className="btn-primary flex items-center space-x-2 space-x-reverse transform transition-all duration-200 hover:scale-105"
          >
            <FaPlusCircle />
            <span>{t('dashboard.addNewCar')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 animate-slideUp">
        <div className="relative">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10 w-full"
            placeholder={t('cars.searchPlaceholder')}
          />
          {searchTerm.length >= 9 && /^\d+$/.test(searchTerm) && (
            <p className="mt-2 text-sm text-blue-600 font-semibold animate-slideDown">
              {t('cars.ownerCarsCount', { idNumber: searchTerm, count: filteredCars.length })}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-right font-bold">{t('violations.plateNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.owner')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.idNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.make')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.model')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.year')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.color')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? t('common.noResultsFound') : t('cars.noCars')}
                  </td>
                </tr>
              ) : (
                filteredCars.map((car, index) => (
                  <tr
                    key={car.id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaCar className="ml-2 text-blue-600" />
                        <span className="font-semibold">{car.plateNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaUser className="ml-2 text-gray-400" />
                        <span>{getOwnerName(car.ownerIdNumber)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {changingOwner === car.id ? (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="text"
                            value={newOwnerId}
                            onChange={(e) => setNewOwnerId(e.target.value)}
                            className="input-field w-32 text-sm"
                            placeholder={t('citizens.idNumber')}
                          />
                          <button
                            onClick={() => handleSaveOwnerChange(car.id)}
                            className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110"
                            title={t('common.save')}
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            onClick={handleCancelOwnerChange}
                            className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                            title={t('common.cancel')}
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <FaIdCard className="ml-2 text-gray-400" />
                          <span>{car.ownerIdNumber}</span>
                          <button
                            onClick={() => handleChangeOwner(car)}
                            className="text-blue-600 hover:text-blue-800 text-xs transform transition-all duration-200 hover:scale-110"
                            title={t('cars.changeOwner')}
                          >
                            <FaEdit className="text-xs" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCar === car.id ? (
                        <input
                          type="text"
                          value={editFormData.make}
                          onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                          className="input-field w-24"
                        />
                      ) : (
                        car.make
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCar === car.id ? (
                        <input
                          type="text"
                          value={editFormData.model}
                          onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                          className="input-field w-24"
                        />
                      ) : (
                        car.model
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCar === car.id ? (
                        <input
                          type="number"
                          value={editFormData.year}
                          onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                          className="input-field w-20"
                        />
                      ) : (
                        car.year
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCar === car.id ? (
                        <input
                          type="text"
                          value={editFormData.color}
                          onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                          className="input-field w-24"
                        />
                      ) : (
                        car.color
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        {editingCar === car.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(car.id)}
                              className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110"
                              title={t('common.save')}
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                              title={t('common.cancel')}
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(car)}
                              className="text-blue-600 hover:text-blue-800 transform transition-all duration-200 hover:scale-110"
                              title={t('common.edit')}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(car.id)}
                              className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                              title={t('common.delete')}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-gray-600 text-center">
        {t('dashboard.totalCars')}: <span className="font-bold text-blue-600">{filteredCars.length}</span>
      </div>
    </div>
  );
};

export default AllCars;

