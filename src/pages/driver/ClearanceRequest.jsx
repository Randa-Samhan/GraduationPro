import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaFileSignature, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const ClearanceRequest = ({ user }) => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRequests = async () => {
    if (!user?.idNumber) return;
    try {
      setLoading(true);
      const data = await api.getClearanceRequests({ citizenIdNumber: user.idNumber });
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading clearance requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.idNumber]);

  const latestRequest = requests[0];
  const hasPending = latestRequest?.status === 'pending';

  const handleSubmit = async () => {
    if (!user?.idNumber) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.createClearanceRequest({ citizenIdNumber: user.idNumber });
      setSuccess(t('clearance.requestSent'));
      await loadRequests();
    } catch (err) {
      setError(err.message || t('clearance.requestFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusContent = () => {
    if (!latestRequest) {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
          {t('clearance.noRequests')}
        </div>
      );
    }

    if (latestRequest.status === 'approved') {
      return (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center space-x-2 space-x-reverse">
          <FaCheckCircle />
          <span>{t('clearance.approvedMessage')}</span>
        </div>
      );
    }

    if (latestRequest.status === 'rejected') {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center space-x-2 space-x-reverse">
          <FaTimesCircle />
          <span>{t('clearance.rejectedMessage')}</span>
        </div>
      );
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        {t('clearance.pendingMessage')}
      </div>
    );
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
          {t('clearance.title')}
        </h1>
        <p className="text-gray-600 text-xl font-medium">{t('clearance.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="card max-w-2xl">
        <div className="flex items-center space-x-2 space-x-reverse mb-4">
          <div className="bg-emerald-600 text-white p-3 rounded-full">
            <FaFileSignature />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t('clearance.requestStatus')}</h2>
        </div>

        {getStatusContent()}

        {latestRequest?.created_at && (
          <p className="text-sm text-gray-500 mt-3">
            {t('clearance.requestedAt')}: {latestRequest.created_at.split(' ')[0]}
          </p>
        )}

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting || hasPending}
            className="btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaFileSignature />}
            <span>{hasPending ? t('clearance.pendingButton') : t('clearance.requestButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearanceRequest;
