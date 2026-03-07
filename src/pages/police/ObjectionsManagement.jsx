import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import { FaGavel, FaCheckCircle, FaTimesCircle, FaSearch, FaEye, FaSpinner } from 'react-icons/fa';

const ObjectionsManagement = ({ user, embedded = false, backTo = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [objections, setObjections] = useState([]);
  const [filteredObjections, setFilteredObjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedObjection, setSelectedObjection] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadObjections();
  }, []);

  useEffect(() => {
    let filtered = [...objections];

    if (searchTerm) {
      filtered = filtered.filter(obj =>
        obj.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.violationType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(obj => obj.status === statusFilter);
    }

    setFilteredObjections(filtered);
  }, [searchTerm, statusFilter, objections]);

  const loadObjections = async () => {
    try {
      setLoading(true);
      const data = await api.getObjections();
      setObjections(data || []);
      setFilteredObjections(data || []);
    } catch (error) {
      console.error('Error loading objections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (objection, action) => {
    setSelectedObjection(objection);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedObjection || !reviewAction) return;

    setProcessing(true);
    try {
      if (reviewAction === 'approve') {
        await api.approveObjection(selectedObjection.violationId, {
          reviewedBy: user.idNumber,
          reviewNotes: reviewNotes
        });
      } else {
        await api.rejectObjection(selectedObjection.violationId, {
          reviewedBy: user.idNumber,
          reviewNotes: reviewNotes
        });
      }

      setShowReviewModal(false);
      setSelectedObjection(null);
      setReviewNotes('');
      setReviewAction(null);
      loadObjections();
      alert(reviewAction === 'approve' ? t('objections.approveSuccess') : t('objections.rejectSuccess'));
    } catch (error) {
      alert(error.message || t('objections.errorProcessing'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">{t('objections.underReview')}</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 space-x-reverse"><FaCheckCircle /> <span>{t('objections.approved')}</span></span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 space-x-reverse"><FaTimesCircle /> <span>{t('objections.rejected')}</span></span>;
      default:
        return null;
    }
  };

  const resolveBackPath = () => {
    if (backTo) return backTo;
    if (user?.role === 'police') return '/police/dashboard';
    if (user?.role === 'traffic' || user?.role === 'interior') return '/admin/traffic-management';
    return '/court/dashboard';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 animate-fadeIn ${embedded ? '' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen'}`}>
      <div className="mb-8">
        {!embedded && (
          <button
            onClick={() => navigate(resolveBackPath())}
            className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-flex items-center space-x-1 space-x-reverse"
          >
            <span>← {t('common.back')}</span>
          </button>
        )}
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          {t('objections.manageObjections')}
        </h1>
        <p className="text-gray-600 text-xl font-medium">{t('objections.manageObjectionsSubtitle')}</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('objections.searchPlaceholder')}
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
            <option value="all">{t('objections.allStatuses')}</option>
            <option value="pending">{t('objections.underReview')}</option>
            <option value="approved">{t('objections.approved')}</option>
            <option value="rejected">{t('objections.rejected')}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <th className="px-6 py-4 text-right font-bold">{t('common.number')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.plateNumber')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('objections.driverName')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('violations.violationType')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('objections.objectionReason')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.date')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.status')}</th>
                <th className="px-6 py-4 text-right font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredObjections.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? t('objections.noResults') : t('objections.noObjections')}
                  </td>
                </tr>
              ) : (
                filteredObjections.map((objection, index) => (
                  <tr key={objection.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 font-semibold">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{objection.plateNumber}</td>
                    <td className="px-6 py-4 text-gray-700">{objection.citizenName || t('common.unknown')}</td>
                    <td className="px-6 py-4 text-gray-700">{objection.violationType}</td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={objection.objectionReason}>
                      {objection.objectionReason}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{objection.created_at?.split(' ')[0] || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(objection.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {objection.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReview(objection, 'approve')}
                              className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title={t('objections.approve')}
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              onClick={() => handleReview(objection, 'reject')}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('objections.reject')}
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedObjection(objection);
                            setShowReviewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('objections.viewDetails')}
                        >
                          <FaEye />
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

      {showReviewModal && selectedObjection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <FaGavel className="ml-3" />
                {selectedObjection.status === 'pending' && reviewAction
                  ? (reviewAction === 'approve' ? t('objections.approveObjection') : t('objections.rejectObjection'))
                  : t('objections.objectionDetails')}
              </h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedObjection(null);
                  setReviewNotes('');
                  setReviewAction(null);
                }}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('violations.plateNumber')}</p>
                  <p className="font-bold text-gray-800">{selectedObjection.plateNumber}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('objections.driverName')}</p>
                  <p className="font-bold text-gray-800">{selectedObjection.citizenName || t('common.unknown')}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('violations.violationType')}</p>
                  <p className="font-bold text-gray-800">{selectedObjection.violationType}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('common.status')}</p>
                  <div>{getStatusBadge(selectedObjection.status)}</div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('objections.objectionReason')}</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-800">{selectedObjection.objectionReason}</p>
                </div>
              </div>

              {selectedObjection.reviewNotes && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('objections.reviewNotes')}</label>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-800">{selectedObjection.reviewNotes}</p>
                  </div>
                </div>
              )}

              {selectedObjection.reviewerName && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('objections.reviewedBy')}</label>
                  <p className="text-gray-800">{selectedObjection.reviewerName}</p>
                </div>
              )}

              {selectedObjection.status === 'pending' && reviewAction && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    {reviewAction === 'approve' ? t('objections.reviewNotesOptional') : t('objections.reviewNotes')}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="input-field w-full"
                    rows="4"
                    placeholder={reviewAction === 'approve' ? t('objections.approveNotesPlaceholder') : t('objections.rejectNotesPlaceholder')}
                  />
                  {reviewAction === 'approve' && (
                    <p className="text-sm text-green-600 mt-2">
                      {t('objections.autoExemptWarning')}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-4 space-x-reverse pt-4">
                {selectedObjection.status === 'pending' && reviewAction && (
                  <button
                    onClick={handleSubmitReview}
                    disabled={processing || (reviewAction === 'reject' && !reviewNotes.trim())}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse`}
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>{t('objections.processing')}</span>
                      </>
                    ) : (
                      <>
                        {reviewAction === 'approve' ? <FaCheckCircle /> : <FaTimesCircle />}
                        <span>{reviewAction === 'approve' ? t('objections.approve') : t('objections.reject')}</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedObjection(null);
                    setReviewNotes('');
                    setReviewAction(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectionsManagement;
