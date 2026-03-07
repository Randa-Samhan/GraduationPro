import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../../services/api';
import { FaCar, FaExclamationTriangle, FaMapMarkerAlt, FaImage, FaSave, FaFileExcel, FaUpload, FaLocationArrow, FaTimes, FaSearch } from 'react-icons/fa';

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

const TransportAddViolation = ({ user }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual'); 
  const [formData, setFormData] = useState({
    plateNumber: '',
    violationTypeIds: [],
    location: '',
    locationMode: 'current', 
    gpsLat: '',
    gpsLng: '',
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
  const [success, setSuccess] = useState('');
  const [carInfo, setCarInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [violationTypes, setViolationTypes] = useState([]);
  const [violationTypeSearch, setViolationTypeSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSearchTimeout, setLocationSearchTimeout] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

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

    if (navigator.geolocation && formData.locationMode === 'current') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            gpsLat: lat.toFixed(6),
            gpsLng: lng.toFixed(6)
          }));
          setMapCenter([lat, lng]);
          setMarkerPosition([lat, lng]);
          setMapZoom(15);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    return () => {
      if (locationSearchTimeout) {
        clearTimeout(locationSearchTimeout);
      }
    };
  }, []);

  const filteredViolationTypes = violationTypes.filter((type) => {
    if (!violationTypeSearch.trim()) return true;
    return type.name.toLowerCase().includes(violationTypeSearch.toLowerCase());
  });

  const handlePlateChange = async (e) => {
    const plate = e.target.value.toUpperCase();
    setFormData({ ...formData, plateNumber: plate });
    
    if (plate.length >= 3) {
      try {
        const car = await api.getCarByPlate(plate);
        setCarInfo(car);
      } catch (error) {
        setCarInfo(null);
      }
    } else {
      setCarInfo(null);
    }
  };

  const searchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ar&countrycodes=ps,il`
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

    if (name === 'locationMode') {
      setFormData({ ...formData, locationMode: value });
      if (value === 'current' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setFormData(prev => ({
              ...prev,
              locationMode: value,
              gpsLat: lat.toFixed(6),
              gpsLng: lng.toFixed(6)
            }));
            setMapCenter([lat, lng]);
            setMarkerPosition([lat, lng]);
            setMapZoom(15);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
      return;
    }
    
    if (name === 'violationTypeIds') {
      
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData({ ...formData, violationTypeIds: selectedOptions });
      
      
      const selectedTypes = violationTypes.filter(vt => selectedOptions.includes(vt.id.toString()));
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
    if (!formData.plateNumber) errors.plateNumber = 'رقم اللوحة مطلوب';
    if (!formData.violationTypeIds || formData.violationTypeIds.length === 0) errors.violationTypeIds = 'يجب اختيار نوع مخالفة واحد على الأقل';
    if (!formData.location) errors.location = 'الموقع مطلوب';
    if (!formData.gpsLat || !formData.gpsLng) {
      errors.gps = 'إحداثيات الموقع مطلوبة';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('يرجى ملء جميع الحقول المطلوبة');
      setLoading(false);
      return;
    }

    try {
      let car = carInfo;
      if (!car || car.plateNumber !== formData.plateNumber) {
        car = await api.getCarByPlate(formData.plateNumber);
      }
      if (!car) {
        setError('رقم اللوحة غير موجود في النظام');
        setLoading(false);
        return;
      }
      
      if (!car.ownerIdNumber && !car.owner_id_number) {
        setError('خطأ: لا يمكن العثور على مالك السيارة');
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
          setError('Failed to upload images. Please try again.');
          setLoading(false);
          return;
        }
      }

      
      const selectedTypes = violationTypes.filter(vt => formData.violationTypeIds.includes(vt.id.toString()));
      if (selectedTypes.length === 0) {
        setError('يجب اختيار نوع مخالفة واحد على الأقل');
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
          lat: parseFloat(formData.gpsLat),
          lng: parseFloat(formData.gpsLng)
        },
        imagePaths,
        status: 'unpaid',
        notes: formData.notes || '',
        source: 'manual'
      };

      await api.addViolation(newViolation);

      setSuccess('تم إضافة المخالفة بنجاح!');
      setLoading(false);

      setTimeout(() => {
        setFormData({
          plateNumber: '',
          violationTypeIds: [],
          location: '',
          locationMode: 'current',
          gpsLat: '',
          gpsLng: '',
          notes: '',
          images: [],
          imageFiles: []
        });
        setTotalFine(0);
        setCarInfo(null);
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error adding violation:', error);
      setError(error.message || 'حدث خطأ أثناء إضافة المخالفة');
      setLoading(false);
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setError('يرجى اختيار ملف Excel');
      return;
    }

    setLoading(true);
    setError('');
    setImportResult(null);

    try {
      const result = await api.importViolationsExcel(excelFile);
      setImportResult(result);
      setSuccess(`تم استيراد ${result.imported} مخالفة بنجاح`);
      if (result.errors && result.errors.length > 0) {
        setError(`بعض الصفوف فشلت: ${result.errors.length} خطأ`);
      }
    } catch (error) {
      setError(error.message || 'فشل استيراد الملف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fadeIn bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => navigate('/transport/dashboard')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-flex items-center space-x-1 space-x-reverse"
        >
          <span>← العودة</span>
        </button>
        <h1 className="text-5xl font-extrabold gradient-text mb-3 animate-slideDown">
          إضافة مخالفات جديدة
        </h1>
      </div>

      <div className="card mb-6">
        <div className="flex space-x-4 space-x-reverse border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            إضافة يدوية
          </button>
          <button
            onClick={() => setMode('excel')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'excel'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FaFileExcel className="inline ml-2" />
            استيراد من Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 animate-slideDown">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 animate-slideDown">
          {success}
        </div>
      )}

      {mode === 'manual' ? (
        <div className="card max-w-4xl">
          {carInfo && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">معلومات السيارة:</p>
              <p className="font-semibold text-gray-800">
                {carInfo.make} {carInfo.model} - {carInfo.color} ({carInfo.year})
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block font-semibold mb-2 ${fieldErrors.plateNumber ? 'text-red-600' : 'text-gray-700'}`}>
                <FaCar className="inline ml-2" />
                رقم اللوحة <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handlePlateChange}
                className={`input-field ${fieldErrors.plateNumber ? 'border-red-500' : ''}`}
                placeholder="مثال: 12345-6"
                required
              />
            </div>

            <div>
              <label className={`block font-semibold mb-2 ${fieldErrors.violationTypeIds ? 'text-red-600' : 'text-gray-700'}`}>
                <FaExclamationTriangle className="inline ml-2" />
                أنواع المخالفات <span className="text-red-600">*</span>
                <span className="text-sm text-gray-500 font-normal mr-2">(يمكن اختيار أكثر من نوع)</span>
              </label>
              <div className="relative mb-3">
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={violationTypeSearch}
                  onChange={(e) => setViolationTypeSearch(e.target.value)}
                  placeholder="ابحث عن نوع مخالفة..."
                  className="input-field pr-10"
                />
              </div>
              <div className={`max-h-72 min-h-40 overflow-y-auto border rounded-xl p-2 bg-gray-50 ${fieldErrors.violationTypeIds ? 'border-red-500' : 'border-gray-300'}`}>
                <select
                  name="violationTypeIds"
                  value={formData.violationTypeIds}
                  onChange={handleInputChange}
                  multiple
                  size={Math.min(Math.max(filteredViolationTypes.length, 5), 10)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {filteredViolationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.fine} ₪
                    </option>
                  ))}
                </select>
                {filteredViolationTypes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-3">لا توجد نتائج مطابقة</p>
                )}
              </div>
              {formData.violationTypeIds.length > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">الأنواع المختارة:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mb-2">
                    {formData.violationTypeIds.map(id => {
                      const type = violationTypes.find(t => t.id.toString() === id);
                      return type ? <li key={id}>{type.name} ({type.fine} ₪)</li> : null;
                    })}
                  </ul>
                  <p className="text-lg font-bold text-blue-700">
                    إجمالي الغرامة: {totalFine} ₪
                  </p>
                </div>
              )}
              {fieldErrors.violationTypeIds && (
                <p className="text-red-600 text-sm mt-1 animate-slideDown">{fieldErrors.violationTypeIds}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">اضغط Ctrl (أو Cmd على Mac) لاختيار أنواع متعددة</p>
            </div>

            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                <FaLocationArrow className="inline ml-2" />
                طريقة تحديد الموقع <span className="text-red-600">*</span>
              </label>
              <select
                name="locationMode"
                value={formData.locationMode}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="current">الموقع الحالي (GPS)</option>
                <option value="manual">اختيار موقع يدوياً</option>
              </select>
            </div>

            <div className="relative">
              <label className={`block font-semibold mb-2 ${fieldErrors.location ? 'text-red-600' : 'text-gray-700'}`}>
                <FaMapMarkerAlt className="inline ml-2" />
                الموقع <span className="text-red-600">*</span>
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
                  className={`input-field w-full ${fieldErrors.location ? 'border-red-500' : ''}`}
                  placeholder="اكتب اسم الموقع أو انقر على الخريطة"
                  required
                />
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-800">{suggestion.display_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {formData.locationMode === 'manual' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  <FaMapMarkerAlt className="inline ml-2" />
                  موقع المخالفة (انقر على الخريطة لتحديد الموقع)
                </label>
                <div className="mb-2 text-sm text-gray-600">
                  خط العرض: <span className="font-semibold">{formData.gpsLat || 'غير محدد'}</span> | 
                  خط الطول: <span className="font-semibold">{formData.gpsLng || 'غير محدد'}</span>
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
                      خط العرض (GPS Lat)
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
                      خط الطول (GPS Lng)
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
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="input-field"
                rows="3"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaImage className="inline ml-2" />
                صورة المخالفة
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
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAtIndex(index)}
                        className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        aria-label="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-4 space-x-reverse">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                <FaSave />
                <span>{loading ? 'جاري الحفظ...' : 'حفظ المخالفة'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/transport/dashboard')}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">استيراد مخالفات من ملف Excel</h2>
          <p className="text-gray-600 mb-6">
            يجب أن يحتوي ملف Excel على الأعمدة التالية:
            <br />
            <strong>plate_number, violation_type_id, fine, date, time, location, gps_lat (اختياري), gps_lng (اختياري), notes (اختياري)</strong>
          </p>

          <form onSubmit={handleExcelImport} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaFileExcel className="inline ml-2" />
                ملف Excel
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setExcelFile(e.target.files[0])}
                className="input-field"
                required
              />
            </div>

            {importResult && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="font-semibold text-blue-800">
                  تم استيراد {importResult.imported} مخالفة بنجاح
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-red-600">الأخطاء:</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-4 space-x-reverse">
              <button
                type="submit"
                disabled={loading || !excelFile}
                className="btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                <FaUpload />
                <span>{loading ? 'جاري الاستيراد...' : 'استيراد'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/transport/dashboard')}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TransportAddViolation;




