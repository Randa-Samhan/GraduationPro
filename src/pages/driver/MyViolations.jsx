import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCitizenViolations } from '../../services/api';
import { FaEye, FaCheckCircle, FaTimesCircle, FaShieldAlt } from 'react-icons/fa';

const MyViolations = ({ user }) => {
  const { t } = useTranslation();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleViewDetails = (violationId) => {
    navigate(`/driver/violations/${violationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('violations.myViolations')}</h1>
        <p className="text-gray-600 text-lg">{t('driver.viewRegisteredViolations')}</p>
      </div>

      {violations.length === 0 ? (
        <div className="card text-center py-16 hover-lift">
          <FaTimesCircle className="text-7xl text-gray-400 mx-auto mb-6 animate-bounce" />
          <p className="text-gray-600 text-2xl font-bold">{t('driver.noViolations')}</p>
          <p className="text-gray-500 mt-2">{t('driver.cleanRecord')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden border-2 border-gray-200 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('driver.violationNumber')}</th>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('violations.violationType')}</th>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('common.date')}</th>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('dashboard.amount')}</th>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('common.status')}</th>
                  <th className="px-6 py-5 text-right text-sm font-extrabold">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {violations.map((violation, index) => (
                  <tr 
                    key={violation.id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 animate-slideUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">#{violation.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{violation.violationType}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {violation.date} {violation.time}
                    </td>
                    <td className="px-6 py-4 text-sm font-extrabold text-gray-900 text-lg">
                      {violation.status === 'exempted' ? (
                        <span className="text-green-600 line-through">{violation.fine} ₪</span>
                      ) : (
                        <span>{violation.fine} ₪</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {violation.status === 'paid' ? (
                        <span className="badge-paid flex items-center space-x-1 space-x-reverse">
                          <FaCheckCircle />
                          <span>{t('violations.paid')}</span>
                        </span>
                      ) : violation.status === 'exempted' ? (
                        <span className="inline-flex items-center space-x-1 space-x-reverse px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300 shadow-md">
                          <FaShieldAlt />
                          <span>{t('driver.violationExempted')}</span>
                        </span>
                      ) : (
                        <span className="badge-unpaid flex items-center space-x-1 space-x-reverse">
                          <FaTimesCircle />
                          <span>{t('violations.unpaid')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(violation.id)}
                        className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-800 font-bold transform transition-all duration-300 hover:scale-110"
                      >
                        <FaEye />
                        <span>{t('common.viewDetails')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyViolations;

