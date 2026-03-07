import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaSearch, FaGavel, FaBan, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const AllViolations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [violationsList, setViolationsList] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [violationsData, citizensData] = await Promise.all([
          api.getViolations(),
          api.getCitizens()
        ]);
        setViolationsList(violationsData);
        setCitizens(citizensData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getCitizenName = (citizenIdNumber) => {
    const citizen = citizens.find(c => c.idNumber === citizenIdNumber);
    return citizen ? citizen.name : t('common.unknown');
  };

  const handleStatusChange = async (violationId, newStatus) => {
    const statusText = newStatus === 'paid' ? t('violations.paid') : t('violations.unpaid');
    if (window.confirm(t('violations.confirmStatusChange', { status: statusText }))) {
      try {
        await api.updateViolationStatus(violationId, newStatus);
        setViolationsList(violationsList.map(v => 
          v.id === violationId ? { ...v, status: newStatus } : v
        ));
      } catch (error) {
        console.error('Error updating violation status:', error);
        alert(t('violations.errorUpdatingStatus'));
      }
    }
  };

  const handleExempt = async (violationId) => {
    if (window.confirm(t('violations.confirmExempt'))) {
      try {
        await api.exemptViolation(violationId);
        setViolationsList(violationsList.map(v => 
          v.id === violationId ? { ...v, status: 'exempted', fine: 0 } : v
        ));
      } catch (error) {
        console.error('Error exempting violation:', error);
        alert(t('violations.errorExempting'));
      }
    }
  };

  const handleDelete = async (violationId) => {
    if (window.confirm(t('violations.confirmDelete'))) {
      try {
        await api.deleteViolation(violationId);
        setViolationsList(violationsList.filter(v => v.id !== violationId));
      } catch (error) {
        console.error('Error deleting violation:', error);
        alert(t('violations.errorDeleting'));
      }
    }
  };

  const filteredViolations = violationsList.filter(v => {
      const violationTypesList = v.violationTypes && v.violationTypes.length > 0
        ? v.violationTypes.map(vt => vt.name).join(', ')
        : v.violationType || '';
      const matchesSearch = 
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.citizenIdNumber.includes(searchTerm) ||
      getCitizenName(v.citizenIdNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      violationTypesList.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

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
          onClick={() => navigate('/court/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.back')} {t('common.dashboard')}</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          {t('violations.allViolations')}
        </h1>
        <p className="text-gray-600">{t('violations.updatePaymentStatus')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-4 animate-slideUp">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10 w-full"
              placeholder={t('violations.searchPlaceholder')}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-4 animate-slideUp">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">{t('common.allStatuses')}</option>
              <option value="paid">{t('violations.paid')}</option>
              <option value="unpaid">{t('violations.unpaid')}</option>
              <option value="exempted">{t('violations.exempted')}</option>
            </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <tr>
                <th className="px-6 py-4 text-right font-bold">{t('violations.violationNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.plateNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.title')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.violationType')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.fine')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.date')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.status')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('objections.title')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterStatus !== 'all' ? t('common.noResultsFound') : t('violations.noViolations')}
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation, index) => {
                  const violationTypesList = violation.violationTypes && violation.violationTypes.length > 0
                    ? violation.violationTypes.map(vt => vt.name).join(', ')
                    : violation.violationType || t('common.notSpecified');
                  
                  return (
                    <tr
                      key={violation.id}
                      className="border-b border-gray-200 hover:bg-purple-50 transition-colors duration-200 animate-slideUp"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 font-semibold">#{violation.id}</td>
                      <td className="px-6 py-4">{violation.plateNumber}</td>
                      <td className="px-6 py-4">{getCitizenName(violation.citizenIdNumber)}</td>
                      <td className="px-6 py-4">{violationTypesList}</td>
                      <td className="px-6 py-4 font-semibold">{violation.fine} ₪</td>
                      <td className="px-6 py-4">{violation.date} {violation.time}</td>
                      <td className="px-6 py-4">
                        <span className={
                          violation.status === 'paid' 
                            ? 'badge-paid' 
                            : violation.status === 'exempted'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300 px-3 py-1 rounded-full text-sm font-semibold'
                            : 'badge-unpaid'
                        }>
                          {violation.status === 'paid' ? t('violations.paid') : violation.status === 'exempted' ? t('violations.exempted') : t('violations.unpaid')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {violation.objection ? (
                          <div className="flex items-center gap-2">
                            {violation.objection === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                <FaExclamationTriangle />
                                <span>{t('objections.underReview')}</span>
                              </span>
                            )}
                            {violation.objection === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                                <FaCheckCircle />
                                <span>{t('objections.approved')}</span>
                              </span>
                            )}
                            {violation.objection === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                                <FaTimesCircle />
                                <span>{t('objections.rejected')}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">{t('objections.noObjections')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {violation.status === 'unpaid' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(violation.id, 'paid')}
                                className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110 flex items-center gap-1"
                                title={t('violations.updateToPaid')}
                              >
                                <FaCheckCircle />
                                <span className="text-sm">{t('violations.pay')}</span>
                              </button>
                              <button
                                onClick={() => handleExempt(violation.id)}
                                className="text-purple-600 hover:text-purple-800 transform transition-all duration-200 hover:scale-110 flex items-center gap-1"
                                title={t('violations.exemptFromFine')}
                              >
                                <FaBan />
                                <span className="text-sm">{t('violations.exempt')}</span>
                              </button>
                            </>
                          )}
                          {violation.status === 'paid' && (
                            <button
                              onClick={() => handleStatusChange(violation.id, 'unpaid')}
                              className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110 flex items-center gap-1"
                              title={t('violations.updateToUnpaid')}
                            >
                              <FaTimesCircle />
                              <span className="text-sm">{t('common.cancel')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(violation.id)}
                            className="text-gray-600 hover:text-red-600 transform transition-all duration-200 hover:scale-110 flex items-center gap-1"
                            title={t('violations.deleteViolation')}
                          >
                            <FaTrash />
                            <span className="text-sm">{t('common.delete')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-gray-600 text-center">
        {t('violations.totalViolations')}: <span className="font-bold text-purple-600">{filteredViolations.length}</span>
      </div>
    </div>
  );
};

export default AllViolations;

