import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  getCitizensByRole, 
  getPendingPoliceRequests, 
  approvePoliceRequest, 
  rejectPoliceRequest,
  getViolations,
  updateViolationStatus,
  exemptViolation,
  promotePoliceOfficer,
  demotePoliceToCitizen
} from '../../services/api';
import { FaShieldAlt, FaUser, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaGavel, FaSearch, FaArrowUp, FaTrash, FaChartBar, FaPlusCircle } from 'react-icons/fa';
import ObjectionsManagement from '../police/ObjectionsManagement';

const TrafficManagement = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allViolations, setAllViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [promoteModal, setPromoteModal] = useState({ show: false, officer: null });
  const [selectedRank, setSelectedRank] = useState('');
  const [statsYear, setStatsYear] = useState('all');
  const [statsMonth, setStatsMonth] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [police, requests, violations] = await Promise.all([
          getCitizensByRole('police'),
          getPendingPoliceRequests(),
          getViolations()
        ]);
        setPoliceOfficers(police);
        setPendingRequests(requests);
        setAllViolations(violations);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleApproveRequest = async (requestId) => {
    if (window.confirm(t('trafficManagement.confirmApproveRequest'))) {
      try {
        await approvePoliceRequest(requestId);
        const [requests, police] = await Promise.all([
          getPendingPoliceRequests(),
          getCitizensByRole('police')
        ]);
        setPendingRequests(requests);
        setPoliceOfficers(police);
      } catch (error) {
        console.error('Error approving request:', error);
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (window.confirm(t('trafficManagement.confirmRejectRequest'))) {
      try {
        await rejectPoliceRequest(requestId);
        const requests = await getPendingPoliceRequests();
        setPendingRequests(requests);
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    }
  };

  const handleViolationStatusChange = async (violationId, status) => {
    if (status === 'exempted') {
      if (window.confirm(t('trafficManagement.confirmExemptViolation'))) {
        try {
          await exemptViolation(violationId);
          const violations = await getViolations();
          setAllViolations(violations);
        } catch (error) {
          console.error('Error exempting violation:', error);
        }
      }
    } else {
      try {
        await updateViolationStatus(violationId, status);
        const violations = await getViolations();
        setAllViolations(violations);
      } catch (error) {
        console.error('Error updating violation status:', error);
      }
    }
  };

  const handlePromoteOfficer = async (idNumber, newRank) => {
    try {
      await promotePoliceOfficer(idNumber, newRank);
      const police = await getCitizensByRole('police');
      setPoliceOfficers(police);
      setPromoteModal({ show: false, officer: null });
      setSelectedRank('');
    } catch (error) {
      console.error('Error promoting officer:', error);
    }
  };

  const openPromoteModal = (officer) => {
    setSelectedRank(officer.rank || 'عريف');
    setPromoteModal({ show: true, officer });
  };

  const handleDemoteToCitizen = async (idNumber) => {
    if (window.confirm(t('trafficManagement.confirmDemoteOfficer'))) {
      try {
        await demotePoliceToCitizen(idNumber);
        const police = await getCitizensByRole('police');
        setPoliceOfficers(police);
      } catch (error) {
        console.error('Error demoting officer:', error);
      }
    }
  };

  const rankOptions = [
    { value: 'عريف', label: t('trafficManagement.ranks.corporal') },
    { value: 'رقيب', label: t('trafficManagement.ranks.sergeant') },
    { value: 'رقيب أول', label: t('trafficManagement.ranks.firstSergeant') },
    { value: 'ملازم', label: t('trafficManagement.ranks.lieutenant') },
    { value: 'ملازم أول', label: t('trafficManagement.ranks.firstLieutenant') },
    { value: 'نقيب', label: t('trafficManagement.ranks.captain') },
    { value: 'رائد', label: t('trafficManagement.ranks.major') },
    { value: 'مقدم', label: t('trafficManagement.ranks.lieutenantColonel') },
    { value: 'عقيد', label: t('trafficManagement.ranks.colonel') }
  ];

  const getRankLabel = (rank) => {
    const match = rankOptions.find((option) => option.value === rank);
    return match ? match.label : rank || t('common.notSpecified');
  };

  const getDepartmentLabel = (department) => {
    if (!department) return t('common.notSpecified');
    if (department === 'مرور عام') return t('trafficManagement.departments.generalTraffic');
    return department;
  };

  const filteredViolations = allViolations.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesPlate = v.plateNumber?.toLowerCase().includes(term);
    const matchesType = v.violationTypes && v.violationTypes.length > 0
      ? v.violationTypes.some((vt) => vt.name?.toLowerCase().includes(term))
      : v.violationType?.toLowerCase().includes(term);
    return matchesPlate || matchesType;
  });

  const availableYears = [...new Set(allViolations.map((v) => (v.date || '').split('-')[0]).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));

  const monthOptions = [
    { value: '01', label: t('trafficManagement.months.jan') },
    { value: '02', label: t('trafficManagement.months.feb') },
    { value: '03', label: t('trafficManagement.months.mar') },
    { value: '04', label: t('trafficManagement.months.apr') },
    { value: '05', label: t('trafficManagement.months.may') },
    { value: '06', label: t('trafficManagement.months.jun') },
    { value: '07', label: t('trafficManagement.months.jul') },
    { value: '08', label: t('trafficManagement.months.aug') },
    { value: '09', label: t('trafficManagement.months.sep') },
    { value: '10', label: t('trafficManagement.months.oct') },
    { value: '11', label: t('trafficManagement.months.nov') },
    { value: '12', label: t('trafficManagement.months.dec') }
  ];

  const filteredStatsViolations = allViolations.filter((v) => {
    if (!v.date) return false;
    const [year, month] = v.date.split('-');
    if (statsYear !== 'all' && year !== statsYear) return false;
    if (statsMonth !== 'all' && month !== statsMonth) return false;
    return true;
  });

  const violationStatsMap = filteredStatsViolations.reduce((acc, violation) => {
    const types = violation.violationTypes && violation.violationTypes.length > 0
      ? violation.violationTypes
      : violation.violationType ? [{ name: violation.violationType }] : [];
    types.forEach((type) => {
      const name = type.name || t('common.notSpecified');
      acc[name] = (acc[name] || 0) + 1;
    });
    return acc;
  }, {});

  const violationStats = Object.entries(violationStatsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxViolationCount = violationStats.length > 0
    ? Math.max(...violationStats.map((item) => item.count))
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">{t('trafficManagement.title')}</h1>
        <p className="text-gray-600 text-lg">{t('trafficManagement.subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex space-x-4 space-x-reverse border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-bold transition-all duration-200 ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaUser className="inline ml-2" />
            {t('trafficManagement.tabs.requests')} ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('police')}
            className={`px-6 py-3 font-bold transition-all duration-200 ${
              activeTab === 'police'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaShieldAlt className="inline ml-2" />
            {t('trafficManagement.tabs.police')} ({policeOfficers.length})
          </button>
          <button
            onClick={() => setActiveTab('violations')}
            className={`px-6 py-3 font-bold transition-all duration-200 ${
              activeTab === 'violations'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaExclamationTriangle className="inline ml-2" />
            {t('trafficManagement.tabs.violations')} ({allViolations.length})
          </button>
          <button
            onClick={() => setActiveTab('objections')}
            className={`px-6 py-3 font-bold transition-all duration-200 ${
              activeTab === 'objections'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaGavel className="inline ml-2" />
            {t('objections.title')}
          </button>
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="card shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('trafficManagement.headings.requests')}</h2>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-xl">{t('trafficManagement.empty.requests')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-bold">{t('citizens.idNumber')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.name')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.phone')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.rank')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.department')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.requestDate')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request, index) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 font-semibold">{request.idNumber}</td>
                      <td className="px-6 py-4">{request.name}</td>
                      <td className="px-6 py-4">{request.phone}</td>
                      <td className="px-6 py-4">{request.rank}</td>
                      <td className="px-6 py-4">{request.department}</td>
                      <td className="px-6 py-4">{request.requestDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110"
                            title={t('common.approve')}
                          >
                            <FaCheckCircle className="text-xl" />
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                            title={t('common.reject')}
                          >
                            <FaTimesCircle className="text-xl" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'police' && (
        <div className="card shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('trafficManagement.headings.police')}</h2>
          {policeOfficers.length === 0 ? (
            <div className="text-center py-12">
              <FaShieldAlt className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-xl">{t('trafficManagement.empty.police')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-bold">{t('citizens.idNumber')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.name')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.phone')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.rank')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.department')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('trafficManagement.tables.badgeNumber')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {policeOfficers.map((officer, index) => (
                    <tr
                      key={officer.id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 font-semibold">{officer.idNumber}</td>
                      <td className="px-6 py-4">{officer.name}</td>
                      <td className="px-6 py-4">{officer.phone}</td>
                      <td className="px-6 py-4">{getRankLabel(officer.rank || 'عريف')}</td>
                      <td className="px-6 py-4">{getDepartmentLabel(officer.department || 'مرور عام')}</td>
                      <td className="px-6 py-4">{officer.badgeNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => openPromoteModal(officer)}
                            className="text-blue-600 hover:text-blue-800 transform transition-all duration-200 hover:scale-110"
                            title={t('trafficManagement.actions.promote')}
                          >
                            <FaArrowUp className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDemoteToCitizen(officer.idNumber)}
                            className="text-red-600 hover:text-red-800 transform transition-all duration-200 hover:scale-110"
                            title={t('trafficManagement.actions.demote')}
                          >
                            <FaTrash className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {promoteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideDown">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('trafficManagement.promote.title')}</h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2"><strong>{t('common.name')}:</strong> {promoteModal.officer?.name}</p>
              <p className="text-gray-600 mb-2"><strong>{t('trafficManagement.promote.currentRank')}:</strong> {getRankLabel(promoteModal.officer?.rank || 'عريف')}</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">{t('trafficManagement.promote.newRank')}</label>
              <select
                className="input-field w-full"
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
              >
                {rankOptions.map((rank) => (
                  <option key={rank.value} value={rank.value}>{rank.label}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-4 space-x-reverse">
              <button
                onClick={() => handlePromoteOfficer(promoteModal.officer.idNumber, selectedRank)}
                className="btn-primary flex-1"
              >
                <FaCheckCircle className="inline ml-2" />
                {t('common.confirm')}
              </button>
              <button
                onClick={() => {
                  setPromoteModal({ show: false, officer: null });
                  setSelectedRank('');
                }}
                className="btn-secondary flex-1"
              >
                <FaTimesCircle className="inline ml-2" />
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'violations' && (
        <>
          <div className="card shadow-2xl mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <FaChartBar className="text-blue-600 text-2xl" />
                <h2 className="text-2xl font-bold text-gray-800">{t('trafficManagement.stats.title')}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={statsYear}
                  onChange={(e) => setStatsYear(e.target.value)}
                  className="input-field"
                >
                  <option value="all">{t('trafficManagement.filters.allYears')}</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={statsMonth}
                  onChange={(e) => setStatsMonth(e.target.value)}
                  className="input-field"
                >
                  <option value="all">{t('trafficManagement.filters.allMonths')}</option>
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {violationStats.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                {t('trafficManagement.stats.noData')}
              </div>
            ) : (
              <div className="space-y-3">
                {violationStats.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-44 text-sm font-semibold text-gray-700 truncate" title={item.name}>{item.name}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-4 bg-gradient-to-r from-blue-500 to-indigo-600"
                        style={{ width: `${(item.count / maxViolationCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-10 text-sm font-bold text-gray-700 text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card shadow-2xl">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('trafficManagement.headings.violations')}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/admin/traffic-add-violation')}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FaPlusCircle />
                    <span>{t('violations.addViolation')}</span>
                  </button>
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pr-10 w-64"
                      placeholder={t('trafficManagement.searchPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-bold">{t('violations.violationNumber')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('violations.plateNumber')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('violations.violationType')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('violations.fine')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.date')}</th>
                    <th className="px-6 py-4 text-right font-bold">{t('common.status')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {t('trafficManagement.empty.violations')}
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((violation, index) => {
                      const violationTypesList = violation.violationTypes && violation.violationTypes.length > 0
                        ? violation.violationTypes.map((vt) => vt.name).join(', ')
                        : violation.violationType || t('common.notSpecified');

                      return (
                        <tr
                          key={violation.id}
                          className="border-b border-gray-200 hover:bg-blue-50 transition-colors duration-200 animate-slideUp"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-4 font-semibold">#{violation.id}</td>
                          <td className="px-6 py-4">{violation.plateNumber}</td>
                          <td className="px-6 py-4">{violationTypesList}</td>
                          <td className="px-6 py-4 font-bold">{violation.fine} ₪</td>
                          <td className="px-6 py-4">{violation.date} {violation.time}</td>
                          <td className="px-6 py-4">
                            <span className={violation.status === 'paid' ? 'badge-paid' : violation.status === 'exempted' ? 'badge-exempted' : 'badge-unpaid'}>
                              {violation.status === 'paid' ? t('violations.paid') : violation.status === 'exempted' ? t('violations.exempted') : t('violations.unpaid')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2 space-x-reverse">
                              {violation.status !== 'paid' && (
                                <button
                                  onClick={() => handleViolationStatusChange(violation.id, 'paid')}
                                  className="text-green-600 hover:text-green-800 transform transition-all duration-200 hover:scale-110"
                                  title={t('trafficManagement.actions.markPaid')}
                                >
                                  <FaCheckCircle className="text-lg" />
                                </button>
                              )}
                              {violation.status !== 'unpaid' && (
                                <button
                                  onClick={() => handleViolationStatusChange(violation.id, 'unpaid')}
                                  className="text-yellow-600 hover:text-yellow-800 transform transition-all duration-200 hover:scale-110"
                                  title={t('trafficManagement.actions.markUnpaid')}
                                >
                                  <FaTimesCircle className="text-lg" />
                                </button>
                              )}
                              {violation.status !== 'exempted' && (
                                <button
                                  onClick={() => handleViolationStatusChange(violation.id, 'exempted')}
                                  className="text-blue-600 hover:text-blue-800 transform transition-all duration-200 hover:scale-110"
                                  title={t('trafficManagement.actions.exempt')}
                                >
                                  <FaGavel className="text-lg" />
                                </button>
                              )}
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
        </>
      )}

      {activeTab === 'objections' && (
        <ObjectionsManagement user={user} embedded />
      )}
    </div>
  );
};

export default TrafficManagement;

