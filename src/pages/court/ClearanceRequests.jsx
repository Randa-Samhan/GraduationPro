import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaFileSignature, FaSearch, FaEye, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ClearanceRequests = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [citizenDetails, setCitizenDetails] = useState(null);
  const [citizenViolations, setCitizenViolations] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState({ type: '', text: '' });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getClearanceRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading clearance requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((req) =>
        req.citizenName?.toLowerCase().includes(term) ||
        req.citizenIdNumber?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    return filtered;
  }, [requests, searchTerm, statusFilter]);

  const openDetails = async (request) => {
    setSelectedRequest(request);
    setDetailsLoading(true);
    setCitizenDetails(null);
    setCitizenViolations([]);
    setDecisionMessage({ type: '', text: '' });

    try {
      const [citizen, violations] = await Promise.all([
        api.getCitizen(request.citizenIdNumber),
        api.getViolations(request.citizenIdNumber)
      ]);
      setCitizenDetails(citizen || null);
      setCitizenViolations(violations || []);
    } catch (error) {
      console.error('Error loading clearance request details:', error);
      setCitizenDetails(null);
      setCitizenViolations([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const hasUnpaidViolations = citizenViolations.some((violation) => violation.status === 'unpaid');
  const canApprove = selectedRequest?.status === 'pending' && !hasUnpaidViolations;
  const canReject = selectedRequest?.status === 'pending' && hasUnpaidViolations;

  const handleApproveClearance = async () => {
    if (!selectedRequest) return;
    setDecisionLoading(true);
    setDecisionMessage({ type: '', text: '' });
    try {
      await api.approveClearanceRequest(selectedRequest.id);
      setSelectedRequest((prev) => prev ? { ...prev, status: 'approved' } : prev);
      setDecisionMessage({ type: 'success', text: t('clearance.approveSuccess') });
      await loadRequests();
    } catch (error) {
      console.error('Error approving clearance request:', error);
      setDecisionMessage({ type: 'error', text: error.message || t('clearance.updateFailed') });
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleRejectClearance = async () => {
    if (!selectedRequest) return;
    setDecisionLoading(true);
    setDecisionMessage({ type: '', text: '' });
    try {
      await api.rejectClearanceRequest(selectedRequest.id, { notes: 'unpaid_violations' });
      setSelectedRequest((prev) => prev ? { ...prev, status: 'rejected' } : prev);
      setDecisionMessage({ type: 'success', text: t('clearance.rejectSuccess') });
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting clearance request:', error);
      setDecisionMessage({ type: 'error', text: error.message || t('clearance.updateFailed') });
    } finally {
      setDecisionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">{t('clearance.approved')}</span>;
    }
    if (status === 'rejected') {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">{t('clearance.rejected')}</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">{t('clearance.pending')}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-emerald-50 to-cyan-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {t('clearance.manageRequests')}
        </h1>
        <p className="text-gray-600 text-xl font-medium">{t('clearance.manageRequestsSubtitle')}</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('clearance.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">{t('clearance.allStatuses')}</option>
            <option value="pending">{t('clearance.pending')}</option>
            <option value="approved">{t('clearance.approved')}</option>
            <option value="rejected">{t('clearance.rejected')}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-600 to-cyan-700 text-white">
                <th className="px-6 py-4 text-right font-bold">{t('common.number')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.name')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('auth.idNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.date')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.status')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? t('clearance.noResults') : t('clearance.noRequests')}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request, index) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{request.citizenName || t('common.unknown')}</td>
                    <td className="px-6 py-4 text-gray-700">{request.citizenIdNumber}</td>
                    <td className="px-6 py-4 text-gray-700">{request.created_at?.split(' ')[0] || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetails(request)}
                        className="text-emerald-600 hover:text-emerald-800 p-2 hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                        title={t('common.viewDetails')}
                      >
                        <FaEye />
                        <span className="text-sm font-semibold">{t('common.view')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
                <div className="bg-gradient-to-r from-emerald-600 to-cyan-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center">
                    <FaFileSignature className="ml-3" />
                    {t('clearance.requestDetails')}
                  </h2>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setCitizenDetails(null);
                  setCitizenViolations([]);
                  setDecisionLoading(false);
                  setDecisionMessage({ type: '', text: '' });
                }}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('common.name')}</p>
                      <p className="font-bold text-gray-800">{citizenDetails?.name || selectedRequest.citizenName || t('common.unknown')}</p>
                    </div>
                    <div className="bg-cyan-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('auth.idNumber')}</p>
                      <p className="font-bold text-gray-800">{selectedRequest.citizenIdNumber}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('common.phone')}</p>
                      <p className="font-bold text-gray-800">{citizenDetails?.phone || t('common.notSpecified')}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('common.email')}</p>
                      <p className="font-bold text-gray-800">{citizenDetails?.email || t('common.notSpecified')}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('common.status')}</p>
                      <div>{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{t('common.date')}</p>
                      <p className="font-bold text-gray-800">{selectedRequest.created_at?.split(' ')[0] || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">{t('clearance.violationsOnRecord')}</h3>
                    {citizenViolations.length === 0 ? (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg">
                        {t('clearance.noViolations')}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-right text-sm font-bold">{t('violations.violationNumber')}</th>
                              <th className="px-4 py-3 text-right text-sm font-bold">{t('violations.violationType')}</th>
                              <th className="px-4 py-3 text-right text-sm font-bold">{t('common.date')}</th>
                              <th className="px-4 py-3 text-right text-sm font-bold">{t('common.status')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {citizenViolations.map((violation) => {
                              const violationTypesList = violation.violationTypes && violation.violationTypes.length > 0
                                ? violation.violationTypes.map(vt => vt.name).join(', ')
                                : violation.violationType || t('common.notSpecified');
                              return (
                                <tr key={violation.id}>
                                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">#{violation.id}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{violationTypesList}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{violation.date} {violation.time}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={violation.status === 'paid' ? 'badge-paid' : violation.status === 'exempted' ? 'badge-exempted' : 'badge-unpaid'}>
                                      {violation.status === 'paid' ? t('violations.paid') : violation.status === 'exempted' ? t('violations.exempted') : t('violations.unpaid')}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {selectedRequest.status === 'pending' && (
                    <div className="space-y-4">
                      <div className={`border px-4 py-3 rounded-lg ${hasUnpaidViolations ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {hasUnpaidViolations ? t('clearance.unpaidViolationsHint') : t('clearance.allViolationsPaid')}
                      </div>

                      {decisionMessage.text && (
                        <div className={`${decisionMessage.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded-lg`}>
                          {decisionMessage.text}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleApproveClearance}
                          disabled={!canApprove || decisionLoading}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          {decisionLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                          <span>{t('clearance.issueClearance')}</span>
                        </button>
                        {hasUnpaidViolations && (
                          <button
                            onClick={handleRejectClearance}
                            disabled={!canReject || decisionLoading}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                          >
                            {decisionLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                            <span>{t('clearance.rejectDueUnpaid')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClearanceRequests;
