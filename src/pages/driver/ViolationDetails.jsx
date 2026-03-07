import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getViolation, getCarByPlate, getObjection, createObjection } from '../../services/api';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaCar, FaImage, FaCreditCard, FaExclamationTriangle, FaTimes, FaIdCard, FaUser, FaMap, FaGavel, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ViolationDetails = ({ isPublic = false }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  
  const translateViolationType = (name) => {
    const translationMap = {
      'تجاوز السرعة المسموحة': t('violationTypes.speeding'),
      'عدم ربط حزام الأمان': t('violationTypes.noSeatbelt'),
      'استخدام الهاتف أثناء القيادة': t('violationTypes.phoneUse'),
      'عدم التوقف عند الإشارة الحمراء': t('violationTypes.redLight'),
      'الوقوف في مكان ممنوع': t('violationTypes.illegalParking'),
      'عدم وجود رخصة قيادة': t('violationTypes.noLicense'),
      'عدم وجود تأمين': t('violationTypes.noInsurance'),
      'القيادة في الاتجاه المعاكس': t('violationTypes.wrongDirection')
    };
    return translationMap[name] || name;
  };
  
  
  const translateViolationTypes = (types) => {
    if (!types || types.length === 0) return '';
    return types.map(vt => translateViolationType(vt.name)).join(', ');
  };
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carInfo, setCarInfo] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [hoveredPlate, setHoveredPlate] = useState(false);
  const [user, setUser] = useState(null);
  const [objection, setObjection] = useState(null);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [objectionReason, setObjectionReason] = useState('');
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleBack = () => {
    if (isPublic) {
      navigate(-1);
      return;
    }
    navigate('/driver/violations');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const foundViolation = await getViolation(parseInt(id));
        setViolation(foundViolation);
        if (foundViolation) {
          try {
            const car = await getCarByPlate(foundViolation.plateNumber);
            setCarInfo(car);
          } catch (error) {
            console.error('Error loading car info:', error);
            setCarInfo(null);
          }

          try {
            const objectionData = await getObjection(parseInt(id));
            setObjection(objectionData);
          } catch (error) {
            setObjection(null);
          }
        }
      } catch (error) {
        console.error('Error loading violation:', error);
        setViolation(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [violation?.id]);

  const handleCreateObjection = async () => {
    if (!objectionReason.trim()) {
      alert(t('objections.reasonRequired'));
      return;
    }

    if (!user || !user.idNumber) {
      alert(t('objections.userNotFound'));
      return;
    }

    setObjectionLoading(true);
    try {
      await createObjection(parseInt(id), {
        citizenIdNumber: user.idNumber,
        objectionReason: objectionReason
      });
      setShowObjectionModal(false);
      setObjectionReason('');
      
      const objectionData = await getObjection(parseInt(id));
      setObjection(objectionData);
      
      alert(t('objections.submittedSuccess'));
    } catch (error) {
      alert(error.message || t('objections.submitFailed'));
    } finally {
      setObjectionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  if (!violation) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <p className="text-gray-600 text-xl">{t('violations.violationNotFound')}</p>
          <button
            onClick={handleBack}
            className="mt-4 btn-primary"
          >
            {t('violations.backToViolationsList')}
          </button>
        </div>
      </div>
    );
  }
  
  
  const violationTypesText = violation.violationTypes && violation.violationTypes.length > 0
    ? translateViolationTypes(violation.violationTypes)
    : violation.violationType
      ? translateViolationType(violation.violationType)
      : t('common.notSpecified');

  const violationImages = Array.isArray(violation.images) && violation.images.length > 0
    ? violation.images
    : [violation.image || violation.imagePath].filter(Boolean);

  const normalizeImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;
  };

  const selectedImageSrc = violationImages[selectedImageIndex] || violationImages[0] || null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-flex items-center gap-1"
        >
          <span>← {t('common.back')}</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{t('violations.violationDetails')} #{violation.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card-violation">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('violations.violationInfo')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaCalendar className="text-blue-600 text-xl mt-1" />
                <div>
                  <p className="text-gray-600 text-sm">{t('common.date')}</p>
                  <p className="text-gray-800 font-semibold">{violation.date}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaClock className="text-blue-600 text-xl mt-1" />
                <div>
                  <p className="text-gray-600 text-sm">{t('common.time')}</p>
                  <p className="text-gray-800 font-semibold">{violation.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-blue-600 text-xl mt-1" />
                <div>
                  <p className="text-gray-600 text-sm">{t('violations.violationType')}</p>
                  <p className="text-gray-800 font-semibold">{violationTypesText}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-blue-600 text-xl mt-1" />
                <div>
                  <p className="text-gray-600 text-sm">{t('violations.location')}</p>
                  <p className="text-gray-800 font-semibold">{violation.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-blue-600 text-xl mt-1" />
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-2">{t('violations.gpsCoordinates')}</p>
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${violation.gps.lat},${violation.gps.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <FaMap className="text-lg" />
                    <span className="font-semibold">{t('violations.openOnMap')}</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {violation.gps.lat}, {violation.gps.lng}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaCar className="text-blue-600 text-xl mt-1" />
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-1">{t('violations.plateNumber')}</p>
                  <div className="relative inline-block">
                    <button
                      onClick={() => carInfo && setShowCarModal(true)}
                      onMouseEnter={() => setHoveredPlate(true)}
                      onMouseLeave={() => setHoveredPlate(false)}
                      className="text-gray-800 font-semibold text-2xl hover:text-blue-600 transition-colors duration-200 cursor-pointer relative"
                    >
                      {violation.plateNumber}
                    </button>
                    {hoveredPlate && carInfo && (
                      <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 text-white p-4 rounded-lg shadow-2xl z-50 animate-slideDown border-2 border-blue-400">
                        <div className="flex items-center mb-2">
                          <FaCar className="text-blue-400 ml-2" />
                          <span className="font-bold text-lg">{carInfo.plateNumber}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-400">{t('cars.make')}:</span> {carInfo.make}</p>
                          <p><span className="text-gray-400">{t('cars.model')}:</span> {carInfo.model}</p>
                          <p><span className="text-gray-400">{t('cars.year')}:</span> {carInfo.year}</p>
                          <p><span className="text-gray-400">{t('cars.color')}:</span> {carInfo.color}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                          {t('violations.clickForFullDetails')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">{t('violations.fine')}</p>
                <p className="text-3xl font-bold text-red-600">{violation.fine} ₪</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">{t('common.status')}</p>
                <div className="flex items-center gap-2">
                  <span className={violation.status === 'paid' ? 'badge-paid' : violation.status === 'exempted' ? 'badge-exempted' : 'badge-unpaid'}>
                    {violation.status === 'paid' ? t('violations.paid') : violation.status === 'exempted' ? t('violations.exempted') : t('violations.unpaid')}
                  </span>
                  {violation.objection === 'approved' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <FaCheckCircle />
                      <span>{t('violations.exemptedDueToObjection')}</span>
                    </span>
                  )}
                  {violation.objection === 'rejected' && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <FaTimesCircle />
                      <span>{t('violations.objectionRejected')}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {violation.status === 'unpaid' && !objection && user && user.idNumber === violation.citizenIdNumber && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowObjectionModal(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FaGavel />
                    <span>{t('objections.objectViolation')}</span>
                  </button>
                </div>
              )}
              
              {objection && objection.status === 'pending' && (
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
                  <p className="text-yellow-800 font-semibold flex items-center gap-2">
                    <FaGavel />
                    <span>{t('objections.underReview')}</span>
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">{t('objections.objectionReason')}: {objection.objectionReason}</p>
                </div>
              )}
              {violation.notes && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">{t('violations.notes')}</p>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{violation.notes}</p>
                </div>
              )}
            </div>
          </div>

          {violation.status === 'unpaid' && (
            <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 shadow-lg">
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-red-700 mb-2">{t('violations.amountDue')}</p>
                <p className="text-4xl font-bold text-red-600">{violation.fine} ₪</p>
              </div>
              <button
                disabled
                className="w-full btn-danger py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaCreditCard />
                <span>{t('violations.payNowUnavailable')}</span>
              </button>
              <p className="text-center text-gray-600 text-sm mt-3">
                {t('violations.featureNotAvailable')}
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FaImage className="text-blue-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-800">{t('violations.violationImage')}</h2>
          </div>
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={normalizeImageUrl(selectedImageSrc)}
              alt={t('violations.violationImage')}
              className="w-full h-auto"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
          </div>
          {violationImages.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {violationImages.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-lg border-2 ${selectedImageIndex === index ? 'border-blue-600' : 'border-gray-300'}`}
                >
                  <img
                    src={normalizeImageUrl(img)}
                    alt={`${t('violations.violationImage')} ${index + 1}`}
                    className="w-full h-16 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{t('violations.recordedBy')}:</strong> {violation.policeName || t('violations.cameraMonitoring')}
            </p>
          </div>
        </div>
      </div>

      {showCarModal && carInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaCar />
                {t('camera.carInfo')}
              </h2>
              <button
                onClick={() => setShowCarModal(false)}
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
                  <p className="text-2xl font-bold text-gray-800">{carInfo.plateNumber}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                  <div className="flex items-center mb-2">
                    <FaIdCard className="text-green-600 ml-2" />
                    <span className="text-gray-600 text-sm">{t('violations.ownerIdNumber')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{carInfo.ownerIdNumber}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.make')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{carInfo.make}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.model')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{carInfo.model}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.year')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{carInfo.year}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border-2 border-cyan-200">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-600 text-sm">{t('cars.color')}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{carInfo.color}</p>
                </div>
              </div>
              {carInfo.registrationDate && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center mb-2">
                    <FaCalendar className="text-gray-600 ml-2" />
                    <span className="text-gray-600 text-sm">{t('cars.registrationDate')}</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{carInfo.registrationDate}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setShowCarModal(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showObjectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-scaleIn">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FaGavel />
                {t('objections.objectViolation')}
              </h2>
              <button
                onClick={() => {
                  setShowObjectionModal(false);
                  setObjectionReason('');
                }}
                className="text-white hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-white/20 rounded-lg"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('common.note')}:</strong> {t('objections.objectionNote')}
                </p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t('objections.objectionReason')} <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={objectionReason}
                  onChange={(e) => setObjectionReason(e.target.value)}
                  className="input-field w-full"
                  rows="6"
                  placeholder={t('objections.objectionReasonPlaceholder')}
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateObjection}
                  disabled={objectionLoading || !objectionReason.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {objectionLoading ? t('objections.sending') : t('objections.submitObjection')}
                </button>
                <button
                  onClick={() => {
                    setShowObjectionModal(false);
                    setObjectionReason('');
                  }}
                  className="btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationDetails;

