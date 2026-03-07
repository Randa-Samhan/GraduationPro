import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addCarRequest, getCitizen, getCitizenCars } from '../../services/api';
import { FaArrowRight, FaCar, FaCheckCircle, FaExchangeAlt, FaIdCard, FaSave, FaUser } from 'react-icons/fa';

const TransferCarRequest = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [targetIdNumber, setTargetIdNumber] = useState('');
  const [targetCitizen, setTargetCitizen] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [documents, setDocuments] = useState({
    drivingLicense: null,
    vehicleLicense: null,
    additionalDocuments: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadCars = async () => {
      if (!user?.idNumber) return;
      try {
        const data = await getCitizenCars(user.idNumber);
        setCars(data || []);
      } catch (loadError) {
        setCars([]);
      }
    };

    loadCars();
  }, [user?.idNumber]);

  const selectedCar = useMemo(
    () => cars.find((car) => car.plateNumber === selectedPlate) || null,
    [cars, selectedPlate]
  );

  const handleTargetIdChange = async (e) => {
    const value = e.target.value.trim();
    setTargetIdNumber(value);
    setTargetCitizen(null);
    setError('');
    setSuccess('');

    if (value.length < 9) return;

    setLookupLoading(true);
    try {
      const citizen = await getCitizen(value);
      if (!citizen) {
        setError(t('cars.transferTargetNotFound'));
      } else if (citizen.idNumber === user?.idNumber) {
        setError(t('cars.transferToSelfNotAllowed'));
      } else {
        setTargetCitizen(citizen);
      }
    } catch (lookupError) {
      setError(t('cars.transferTargetNotFound'));
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCar) {
      setError(t('cars.transferSelectCarRequired'));
      return;
    }
    if (!targetIdNumber || !targetCitizen) {
      setError(t('cars.transferTargetRequired'));
      return;
    }
    if (targetCitizen.idNumber === user?.idNumber) {
      setError(t('cars.transferToSelfNotAllowed'));
      return;
    }
    if (!documents.drivingLicense || !documents.vehicleLicense) {
      setError(t('cars.transferDocumentsRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('requestType', 'transfer');
      formData.append('ownerIdNumber', user.idNumber);
      formData.append('targetOwnerIdNumber', targetCitizen.idNumber);
      formData.append('plateNumber', selectedCar.plateNumber);
      formData.append('make', selectedCar.make || '');
      formData.append('model', selectedCar.model || '');
      formData.append('year', `${selectedCar.year || ''}`);
      formData.append('color', selectedCar.color || '');
      formData.append('registrationDate', selectedCar.registrationDate || '');

      formData.append('documents', documents.drivingLicense);
      formData.append('documentTypes', 'driving_license');
      formData.append('documents', documents.vehicleLicense);
      formData.append('documentTypes', 'vehicle_license');

      documents.additionalDocuments.forEach((file) => {
        formData.append('documents', file);
        formData.append('documentTypes', 'other');
      });

      await addCarRequest(formData);

      setSuccess(t('cars.transferRequestSuccess'));
      setSelectedPlate('');
      setTargetIdNumber('');
      setTargetCitizen(null);
      setDocuments({
        drivingLicense: null,
        vehicleLicense: null,
        additionalDocuments: []
      });
    } catch (submitError) {
      setError(submitError?.message || t('cars.transferRequestError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate('/driver/cars')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200 group"
        >
          <FaArrowRight className="ml-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>{t('driver.backToCars')}</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          {t('cars.transferRequestTitle')}
        </h1>
        <p className="text-gray-600">{t('cars.transferRequestSubtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideUp">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              <FaCar className="inline ml-2 text-blue-600" />
              {t('cars.transferSelectCar')}
            </label>
            <select
              className="input-field w-full"
              value={selectedPlate}
              onChange={(e) => {
                setSelectedPlate(e.target.value);
                setError('');
                setSuccess('');
              }}
              required
            >
              <option value="">{t('cars.transferChoosePlate')}</option>
              {cars.map((car) => (
                <option key={car.id} value={car.plateNumber}>
                  {car.plateNumber} - {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              <FaIdCard className="inline ml-2 text-blue-600" />
              {t('cars.transferTargetId')}
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={targetIdNumber}
              onChange={handleTargetIdChange}
              placeholder={t('cars.transferTargetIdPlaceholder')}
              required
            />
            {lookupLoading && <p className="text-sm text-gray-500 mt-2">{t('common.loading')}</p>}
          </div>

          {targetCitizen && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="font-bold text-gray-800 mb-2 flex items-center">
                <FaUser className="ml-2 text-blue-600" />
                {t('cars.transferTargetData')}
              </p>
              <p className="text-gray-700">
                {t('common.name')}: <span className="font-semibold">{targetCitizen.name}</span>
              </p>
              <p className="text-gray-700">
                {t('citizens.idNumber')}: <span className="font-semibold">{targetCitizen.idNumber}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('cars.transferDrivingLicense')}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="input-field w-full"
                onChange={(e) => {
                  setDocuments((prev) => ({ ...prev, drivingLicense: e.target.files?.[0] || null }));
                  setError('');
                  setSuccess('');
                }}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {t('cars.transferVehicleLicense')}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="input-field w-full"
                onChange={(e) => {
                  setDocuments((prev) => ({ ...prev, vehicleLicense: e.target.files?.[0] || null }));
                  setError('');
                  setSuccess('');
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t('cars.transferAdditionalDocs')}
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              className="input-field w-full"
              onChange={(e) => {
                setDocuments((prev) => ({ ...prev, additionalDocuments: Array.from(e.target.files || []) }));
                setError('');
                setSuccess('');
              }}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <FaCheckCircle className="ml-2" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <FaSave />
            <FaExchangeAlt />
            <span>{submitting ? t('common.processing') : t('cars.transferSubmit')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferCarRequest;
