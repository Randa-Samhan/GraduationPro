import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCarRequests, approveCarRequest, rejectCarRequest, deleteCarRequest, getCitizen } from '../../services/api';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaSearch, FaCar, FaUser, FaIdCard, FaFileAlt } from 'react-icons/fa';

const CarRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requestsList, setRequestsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const requests = await getCarRequests();
      const requestsWithNames = await Promise.all(
        requests.map(async (request) => {
          try {
            const owner = await getCitizen(request.ownerIdNumber);
            let targetOwner = null;
            if (request.targetOwnerIdNumber) {
              targetOwner = await getCitizen(request.targetOwnerIdNumber);
            }
            return {
              ...request,
              ownerName: owner?.name || null,
              targetOwnerName: targetOwner?.name || null
            };
          } catch (error) {
            return {
              ...request,
              ownerName: null,
              targetOwnerName: null
            };
          }
        })
      );
      setRequestsList(requestsWithNames);
    } catch (error) {
      console.error('Error loading car requests:', error);
      setRequestsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId) => {
    if (window.confirm(t('cars.confirmApproveRequest'))) {
      try {
        await approveCarRequest(requestId);
        await loadRequests();
      } catch (error) {
        console.error('Error approving request:', error);
        alert(t('cars.approveRequestError'));
      }
    }
  };

  const handleReject = async (requestId) => {
    if (window.confirm(t('cars.confirmRejectRequest'))) {
      try {
        await rejectCarRequest(requestId);
        await loadRequests();
      } catch (error) {
        console.error('Error rejecting request:', error);
        alert(t('cars.rejectRequestError'));
      }
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm(t('cars.confirmDeleteRequest'))) {
      try {
        await deleteCarRequest(requestId);
        await loadRequests();
      } catch (error) {
        console.error('Error deleting request:', error);
        alert(t('cars.deleteRequestError'));
      }
    }
  };

  const filteredRequests = requestsList.filter(r => {
    const plate = (r.plateNumber || '').toLowerCase();
    const ownerId = r.ownerIdNumber || '';
    const ownerName = (r.ownerName || '').toLowerCase();
    const targetOwnerId = r.targetOwnerIdNumber || '';
    const targetOwnerName = (r.targetOwnerName || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      plate.includes(term) ||
      ownerId.includes(searchTerm) ||
      ownerName.includes(term) ||
      targetOwnerId.includes(searchTerm) ||
      targetOwnerName.includes(term);
    
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    
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
          onClick={() => navigate('/transport/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('common.backToDashboard')}</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          {t('cars.carRequests')}
        </h1>
        <p className="text-gray-600">{t('dashboard.carRequestsDesc')}</p>
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
              placeholder={t('cars.requestsSearchPlaceholder')}
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
            <option value="pending">{t('cars.requestStatusPending')}</option>
            <option value="approved">{t('cars.requestStatusApproved')}</option>
            <option value="rejected">{t('cars.requestStatusRejected')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-right font-bold">{t('cars.requestNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.requestType')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.plateNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.owner')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('citizens.idNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.newOwner')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.documents')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.make')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('cars.model')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.status')}</th>
                <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterStatus !== 'all' ? t('common.noResultsFound') : t('cars.noRequests')}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-4 font-semibold">#{request.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.requestType === 'transfer'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {request.requestType === 'transfer' ? t('cars.requestTypeTransfer') : t('cars.requestTypeAdd')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaCar className="ml-2 text-blue-600" />
                        <span className="font-semibold">{request.plateNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaUser className="ml-2 text-gray-400" />
                        <span>{request.ownerName || t('common.unknown')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaIdCard className="ml-2 text-gray-400" />
                        <span>{request.ownerIdNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {request.requestType === 'transfer' ? (
                        <div>
                          <div className="font-semibold">{request.targetOwnerName || t('common.unknown')}</div>
                          <div className="text-sm text-gray-500">{request.targetOwnerIdNumber}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {request.documents?.length ? (
                        <div className="space-y-1">
                          {request.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={`http://localhost:5000${doc.filePath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                              <FaFileAlt className="ml-1" />
                              <span>{t(`cars.documentType.${doc.documentType}`, { defaultValue: doc.fileName })}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{request.make}</td>
                    <td className="px-6 py-4">{request.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status === 'approved' ? t('cars.requestStatusApproved') : request.status === 'rejected' ? t('cars.requestStatusRejected') : t('cars.requestStatusPending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110 flex items-center space-x-1 space-x-reverse"
                              title={t('common.approve')}
                            >
                              <FaCheckCircle />
                              <span className="text-sm">{t('common.approve')}</span>
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110 flex items-center space-x-1 space-x-reverse"
                              title={t('common.reject')}
                            >
                              <FaTimesCircle />
                              <span className="text-sm">{t('common.reject')}</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="text-gray-600 hover:text-gray-800 transform transition-all duration-200 hover:scale-110"
                          title={t('common.delete')}
                        >
                          <FaTimesCircle />
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
        {t('cars.totalRequests')}: <span className="font-bold text-blue-600">{filteredRequests.length}</span>
      </div>
    </div>
  );
};

export default CarRequests;

