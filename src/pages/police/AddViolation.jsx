import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../../services/api';
import { FaCar, FaExclamationTriangle, FaMapMarkerAlt, FaImage, FaSave, FaTimes, FaSearch } from 'react-icons/fa';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const AddViolation = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const backPath = user?.role === 'traffic' || user?.role === 'interior'
    ? '/admin/traffic-management'
    : '/police/all-violations';
  
  
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
  const [formData, setFormData] = useState({
    plateNumber: '',
    violationTypeIds: [],
    location: '',
    gpsLat: '32.2271',
    gpsLng: '35.2220',
    notes: '',
    images: [],
    imageFiles: []
  });
  const [totalFine, setTotalFine] = useState(0);
  const [mapCenter, setMapCenter] = useState([32.2271, 35.2220]);
  const [markerPosition, setMarkerPosition] = useState([32.2271, 35.2220]);
  const [mapZoom, setMapZoom] = useState(13);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [carInfo, setCarInfo] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [violationTypes, setViolationTypes] = useState([]);
  const [violationTypeSearch, setViolationTypeSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSearchTimeout, setLocationSearchTimeout] = useState(null);

  useEffect(() => {
    const loadViolationTypes = async () => {
      try {
        const types = await api.getViolationTypes();
        setViolationTypes(types);
      } catch (error) {
        console.error('Error loading violation types:', error);
      }
    };
    loadViolationTypes();
    
    return () => {
      if (locationSearchTimeout) {
        clearTimeout(locationSearchTimeout);
      }
    };
  }, []);

  const filteredViolationTypes = violationTypes.filter((type) => {
    if (!violationTypeSearch.trim()) return true;
    const localizedName = translateViolationType(type.name);
    const query = violationTypeSearch.toLowerCase();
    return (
      type.name.toLowerCase().includes(query) ||
      localizedName.toLowerCase().includes(query)
    );
  });

  const handlePlateChange = async (e) => {
    const plate = e.target.value.toUpperCase();
    setFormData({ ...formData, plateNumber: plate });
    
    if (plate.length >= 3) {
      try {
        const car = await api.getCarByPlate(plate);
        setCarInfo(car);
        if (car) {
          const ownerId = car.ownerIdNumber || car.owner_id_number;
          if (ownerId) {
            try {
              const owner = await api.getCitizen(ownerId);
              setOwnerInfo(owner);
            } catch (ownerError) {
              setOwnerInfo(null);
            }
          } else {
            setOwnerInfo(null);
          }
        } else {
          setOwnerInfo(null);
        }
      } catch (error) {
        setCarInfo(null);
        setOwnerInfo(null);
      }
    } else {
      setCarInfo(null);
      setOwnerInfo(null);
    }
  };

  const searchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const lang = document.documentElement.lang || 'ar';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=${lang}&countrycodes=ps,il`
      );
      const data = await response.json();
      setLocationSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, location: value });

    if (locationSearchTimeout) {
      clearTimeout(locationSearchTimeout);
    }

    const timeout = setTimeout(() => {
      searchLocationSuggestions(value);
    }, 300);
    setLocationSearchTimeout(timeout);
  };

  const handleLocationSelect = (suggestion) => {
    const locationName = suggestion.display_name;
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setFormData({
      ...formData,
      location: locationName,
      gpsLat: lat.toFixed(6),
      gpsLng: lng.toFixed(6)
    });

    setMapCenter([lat, lng]);
    setMarkerPosition([lat, lng]);
    setMapZoom(15);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'location') {
      handleLocationInputChange(e);
      return;
    }
    
    if (name === 'violationTypeIds') {
      
      const typeId = value;
      const currentIds = formData.violationTypeIds || [];
      let newIds;
      
      if (currentIds.includes(typeId)) {
        
        newIds = currentIds.filter(id => id !== typeId);
      } else {
        
        newIds = [...currentIds, typeId];
      }
      
      setFormData({ ...formData, violationTypeIds: newIds });
      
      
      const selectedTypes = violationTypes.filter(vt => newIds.includes(vt.id.toString()));
      const total = selectedTypes.reduce((sum, type) => sum + parseFloat(type.fine), 0);
      setTotalFine(total);
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    
    if (name === 'gpsLat' || name === 'gpsLng') {
      const lat = name === 'gpsLat' ? parseFloat(value) || 32.2271 : parseFloat(formData.gpsLat) || 32.2271;
      const lng = name === 'gpsLng' ? parseFloat(value) || 35.2220 : parseFloat(formData.gpsLng) || 35.2220;
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        setMapZoom(15);
      }
    }
  };

  const handleMapClick = (lat, lng) => {
    setFormData({
      ...formData,
      gpsLat: lat.toFixed(6),
      gpsLng: lng.toFixed(6)
    });
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...imageFiles]
    }));

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeImageAtIndex = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imageFiles: prev.imageFiles.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const errors = {};
    if (!formData.plateNumber) errors.plateNumber = t('violations.plateRequired');
    if (!formData.violationTypeIds || formData.violationTypeIds.length === 0) errors.violationTypeIds = t('violations.atLeastOneType');
    if (!formData.location) errors.location = t('violations.locationRequired');

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(t('violations.fillAllFields'));
      setLoading(false);
      return;
    }

    try {
      let car = carInfo;
      if (!car || car.plateNumber !== formData.plateNumber) {
        car = await api.getCarByPlate(formData.plateNumber);
      }
      if (!car) {
        setError(t('violations.plateNotFound'));
        setLoading(false);
        return;
      }
      
      if (!car.ownerIdNumber && !car.owner_id_number) {
        setError(t('violations.carOwnerNotFound'));
        setLoading(false);
        return;
      }

      let imagePaths = [];
      if (formData.imageFiles.length > 0) {
        try {
          const uploadResults = await Promise.all(
            formData.imageFiles.map((file) => api.uploadViolationImage(file))
          );
          imagePaths = uploadResults
            .map((result) => result.imagePath)
            .filter(Boolean);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError(t('violations.imageUploadFailed'));
          setLoading(false);
          return;
        }
      }

      
      const selectedTypes = violationTypes.filter(vt => formData.violationTypeIds.includes(vt.id.toString()));
      if (selectedTypes.length === 0) {
        setError(t('violations.atLeastOneType'));
        setLoading(false);
        return;
      }
      
      const totalFineAmount = selectedTypes.reduce((sum, type) => sum + parseFloat(type.fine), 0);

      const newViolation = {
        plateNumber: formData.plateNumber,
        citizenIdNumber: car.ownerIdNumber || car.owner_id_number,
        violationTypeIds: formData.violationTypeIds.map(id => parseInt(id)),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        location: formData.location,
        gps: {
          lat: parseFloat(formData.gpsLat) || 32.2271,
          lng: parseFloat(formData.gpsLng) || 35.2220
        },
        imagePaths,
        policeIdNumber: user.idNumber,
        status: 'unpaid',
        notes: formData.notes || '',
        source: 'manual'
      };

      await api.addViolation(newViolation);

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        setFormData({
          plateNumber: '',
          violationTypeIds: [],
          location: '',
          gpsLat: '32.2271',
          gpsLng: '35.2220',
          notes: '',
          images: [],
          imageFiles: []
        });
        setTotalFine(0);
        setCarInfo(null);
        setOwnerInfo(null);
        setSuccess(false);
        navigate(backPath);
      }, 2000);
    } catch (error) {
      console.error('Error adding violation:', error);
      setError(error.message || t('violations.errorAddingViolation'));
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('violations.addNewViolation')}</h1>

      <div className="card max-w-3xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {t('violations.violationAddedSuccess')}
          </div>
        )}

        {carInfo && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('violations.carInfo')}:</p>
                <p className="font-semibold text-gray-800">
                  {carInfo.make} {carInfo.model} - {carInfo.color} ({carInfo.year})
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('violations.plateNumber')}: <span className="font-semibold text-gray-800 font-mono" dir="ltr" style={{ unicodeBidi: 'plaintext' }}>{carInfo.plateNumber}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('violations.ownerInfo')}:</p>
                <p className="font-semibold text-gray-800">
                  {ownerInfo?.name || t('common.unknown')}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('violations.ownerIdNumber')}: <span className="font-semibold text-gray-800">{ownerInfo?.idNumber || carInfo.ownerIdNumber || carInfo.owner_id_number || t('common.notSpecified')}</span>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {t('common.phone')}: <span className="font-semibold text-gray-800">{ownerInfo?.phone || t('common.notSpecified')}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block font-semibold mb-2 ${fieldErrors.plateNumber ? 'text-red-600' : 'text-gray-700'}`}>
              <FaCar className="inline ml-2" />
              {t('violations.plateNumber')} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="plateNumber"
              value={formData.plateNumber}
              onChange={handlePlateChange}
              className={`input-field ${fieldErrors.plateNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder={t('violations.plateExample')}
              required
            />
            {fieldErrors.plateNumber && (
              <p className="text-red-600 text-sm mt-1 animate-slideDown">{fieldErrors.plateNumber}</p>
            )}
          </div>

          <div>
            <label className={`block font-semibold mb-3 ${fieldErrors.violationTypeIds ? 'text-red-600' : 'text-gray-700'}`}>
              <FaExclamationTriangle className="inline ml-2" />
              {t('violations.violationTypes')} <span className="text-red-600">*</span>
              <span className="text-sm text-gray-500 font-normal mr-2">({t('violations.selectMultipleTypes')})</span>
            </label>
            
            <div className="mb-3 relative">
              <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={violationTypeSearch}
                onChange={(e) => setViolationTypeSearch(e.target.value)}
                className="input-field pr-10"
                placeholder={t('violationTypes.searchPlaceholder')}
              />
            </div>

            <div className="max-h-96 min-h-48 overflow-y-auto pr-1 border border-gray-200 rounded-xl p-2 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {filteredViolationTypes.map((type) => {
                  const isSelected = formData.violationTypeIds.includes(type.id.toString());
                  return (
                    <label
                      key={type.id}
                      className={`
                        relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 transform hover:scale-105
                        ${isSelected 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-500 shadow-lg shadow-blue-200' 
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        name="violationTypeIds"
                        value={type.id}
                        checked={isSelected}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`
                          flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                          ${isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-white border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                            {translateViolationType(type.name)}
                          </p>
                          <p className={`text-xs mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            {type.fine} ₪
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {filteredViolationTypes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">{t('common.noResultsFound')}</p>
              )}
            </div>
            
            {formData.violationTypeIds.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('violations.selectedTypes')}:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.violationTypeIds.map(id => {
                    const type = violationTypes.find(t => t.id.toString() === id);
                    return type ? (
                      <span 
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium"
                      >
                        {translateViolationType(type.name)}
                        <span className="text-blue-200">({type.fine} ₪)</span>
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xl font-bold text-blue-700 flex items-center gap-2">
                    <FaExclamationTriangle />
                    <span>{t('violations.totalFine')}: {totalFine.toFixed(2)} ₪</span>
                  </p>
                </div>
              </div>
            )}
            
            {fieldErrors.violationTypeIds && (
              <p className="text-red-600 text-sm mt-2 animate-slideDown flex items-center gap-1">
                <FaExclamationTriangle className="text-xs" />
                {fieldErrors.violationTypeIds}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span>💡</span>
              <span>{t('violations.selectMultipleHint')}</span>
            </p>
          </div>

          <div className="relative">
            <label className={`block font-semibold mb-2 ${fieldErrors.location ? 'text-red-600' : 'text-gray-700'}`}>
              <FaMapMarkerAlt className="inline ml-2" />
              {t('violations.location')} <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleLocationInputChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className={`input-field w-full ${fieldErrors.location ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder={t('violations.locationPlaceholder')}
                required
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                      {suggestion.type && (
                        <div className="text-sm text-gray-500 mt-1">{suggestion.type}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {fieldErrors.location && (
              <p className="text-red-600 text-sm mt-1 animate-slideDown">{fieldErrors.location}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              <FaMapMarkerAlt className="inline ml-2" />
              {t('violations.incidentLocation')}
            </label>
            <div className="mb-2 text-sm text-gray-600">
              {t('violations.latitude')}: <span className="font-semibold">{formData.gpsLat}</span> | 
              {t('violations.longitude')}: <span className="font-semibold">{formData.gpsLng}</span>
            </div>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px', zIndex: 0 }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={markerPosition} />
                <LocationPicker onLocationSelect={handleMapClick} />
                <MapController center={mapCenter} zoom={mapZoom} />
              </MapContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">
                  {t('violations.gpsLat')}
                </label>
                <input
                  type="number"
                  step="any"
                  name="gpsLat"
                  value={formData.gpsLat}
                  onChange={handleInputChange}
                  className="input-field text-sm"
                  placeholder="32.2271"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">
                  {t('violations.gpsLng')}
                </label>
                <input
                  type="number"
                  step="any"
                  name="gpsLng"
                  value={formData.gpsLng}
                  onChange={handleInputChange}
                  className="input-field text-sm"
                  placeholder="35.2220"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">{t('violations.notes')}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="input-field"
              rows="3"
              placeholder={t('violations.notesPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              <FaImage className="inline ml-2" />
              {t('violations.violationImage')}
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="input-field"
            />
            {formData.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.images.map((imageSrc, index) => (
                  <div key={`${imageSrc}-${index}`} className="relative">
                    <img
                      src={imageSrc}
                      alt={`${t('violations.preview')} ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageAtIndex(index)}
                      className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      aria-label={t('common.delete')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <FaSave />
              <span>{loading ? t('violations.saving') : t('violations.saveViolation')}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="btn-secondary"
            >
              {t('violations.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddViolation;

