import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaIdCard, FaUser, FaPhone, FaMapMarkerAlt, FaTrash, FaPlusCircle, FaArrowRight, FaSearch, FaEdit } from 'react-icons/fa';

const AllCitizens = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [citizensList, setCitizensList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const citizensData = await api.getCitizens();
        setCitizensList(citizensData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading citizens:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (idNumber) => {
    if (window.confirm(t('admin.confirmDeleteCitizen'))) {
      try {
        await api.deleteCitizen(idNumber);
        setCitizensList(citizensList.filter(c => c.idNumber !== idNumber));
      } catch (error) {
        console.error('Error deleting citizen:', error);
        alert(t('admin.deleteCitizenError'));
      }
    }
  };

  const getGenderLabel = (gender) => {
    if (gender === 'ذكر') return t('citizens.male');
    if (gender === 'أنثى') return t('citizens.female');
    return gender || t('common.notSpecified');
  };

  const filteredCitizens = citizensList.filter(citizen =>
    citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.idNumber.includes(searchTerm)
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
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
              {t('citizens.allCitizens')}
            </h1>
            <p className="text-gray-600">{t('admin.viewAllCitizensDesc')}</p>
          </div>
          <button
            onClick={() => navigate('/admin/add-citizen')}
            className="btn-primary flex items-center space-x-2 space-x-reverse transform transition-all duration-200 hover:scale-105"
          >
            <FaPlusCircle />
            <span>{t('admin.addNewCitizen')}</span>
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
            placeholder={t('citizens.searchPlaceholder')}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.idNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.name')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.phone')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.address')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.dateOfBirth')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.gender')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCitizens.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? t('common.noResultsFound') : t('citizens.noCitizens')}
                  </td>
                </tr>
              ) : (
                filteredCitizens.map((citizen, index) => (
                  <tr
                    key={citizen.id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaIdCard className="ml-2 text-blue-600" />
                        <span className="font-semibold">{citizen.idNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaUser className="ml-2 text-gray-400" />
                        <span>{citizen.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaPhone className="ml-2 text-gray-400" />
                        <span>{citizen.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="ml-2 text-gray-400" />
                        <span>{citizen.address || t('common.notSpecified')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{citizen.dateOfBirth || t('common.notSpecified')}</td>
                    <td className="px-6 py-4">{getGenderLabel(citizen.gender)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3 space-x-reverse">
                        <button
                          onClick={() => navigate(`/admin/add-citizen/${citizen.idNumber}`)}
                          className="text-blue-600 hover:text-blue-800 transform transition-all duration-200 hover:scale-110"
                          title={t('common.edit')}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(citizen.idNumber)}
                          className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                          title={t('common.delete')}
                        >
                          <FaTrash />
                        </button>
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
        {t('dashboard.totalCitizens')}: <span className="font-bold text-blue-600">{filteredCitizens.length}</span>
      </div>
    </div>
  );
};

export default AllCitizens;

