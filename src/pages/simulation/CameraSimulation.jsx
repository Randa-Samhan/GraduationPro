import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaStop, FaCheckCircle, FaTrafficLight, FaExclamationTriangle, FaCar, FaUser, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import * as api from '../../services/api';

const CameraSimulation = ({ user }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [noPlateDetected, setNoPlateDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [trafficLight, setTrafficLight] = useState('green');
  const [showSidebar, setShowSidebar] = useState(false);
  const [carInfo, setCarInfo] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [gpsLocation, setGpsLocation] = useState({ lat: null, lng: null });
  const [addingViolation, setAddingViolation] = useState(false);
  const [violationSuccess, setViolationSuccess] = useState(false);
  const [violationError, setViolationError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trafficIntervalRef = useRef(null);
  const timeoutRefs = useRef([]);

  const extractPlateFromImage = async (imageData) => {
    try {
      const base64Data = imageData.split(',')[1] || imageData;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      
      const API_URL = "https://api.platerecognizer.com/v1/plate-reader/";
      const API_TOKEN = "82199f004ff0d0da22dc6118e3069a56e0c9d8c3";
      
      const formDataToSend = new FormData();
      formDataToSend.append('upload', file);
      
      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_TOKEN}`
        },
        body: formDataToSend
      });
      
      if (apiResponse.status === 200 || apiResponse.status === 201) {
        const result = await apiResponse.json();
        
        if (result.results && result.results.length > 0 && result.results[0].plate) {
          const plateNumber = result.results[0].plate;
          setNoPlateDetected(false);
          return plateNumber;
        } else {
          setNoPlateDetected(true);
          return null;
        }
      } else {
        const errorText = await apiResponse.text();
        console.error('API Error:', errorText);
        setNoPlateDetected(true);
        return null;
      }
    } catch (error) {
      console.error('Error reading plate:', error);
      setNoPlateDetected(true);
      return null;
    }
  };

  const startCameraStream = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setCameraActive(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error(t('camera.cameraAccessError'), error);
      setCameraActive(false);
      setStream(null);
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const cycleTrafficLight = () => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    setTrafficLight('red');
    
    const timeout1 = setTimeout(() => {
      setTrafficLight('yellow');
      
      const timeout2 = setTimeout(() => {
        setTrafficLight('green');
        
        const timeout3 = setTimeout(() => {
          cycleTrafficLight();
        }, 10000);
        timeoutRefs.current.push(timeout3);
      }, 3000);
      timeoutRefs.current.push(timeout2);
    }, 20000);
    timeoutRefs.current.push(timeout1);
  };

  const startTrafficLight = async () => {
    setShowSidebar(true);
    cycleTrafficLight();
  };

  const startCamera = async () => {
    startTrafficLight();
  };

  const stopCamera = () => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (trafficIntervalRef.current) {
      clearInterval(trafficIntervalRef.current);
      trafficIntervalRef.current = null;
    }
    setCapturedImage(null);
    setPlateNumber('');
    setNoPlateDetected(false);
    setCameraActive(false);
    setShowSidebar(false);
    setTrafficLight('green');
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);

    setLoading(true);
    setPlateNumber('');
    setNoPlateDetected(false);
    setCarInfo(null);
    setOwnerInfo(null);
    setViolationSuccess(false);
    setViolationError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setGpsLocation({ lat: 31.9073, lng: 35.2045 });
        }
      );
    } else {
      setGpsLocation({ lat: 31.9073, lng: 35.2045 });
    }
    
    const extractedPlate = await extractPlateFromImage(imageData);
    if (extractedPlate) {
      setPlateNumber(extractedPlate);
      setNoPlateDetected(false);
      
      try {
        const car = await api.getCarByPlate(extractedPlate);
        if (car) {
          setCarInfo(car);
          try {
            const ownerIdNumber = car.ownerIdNumber || car.owner_id_number;
            if (ownerIdNumber) {
              const owner = await api.getCitizen(ownerIdNumber);
              if (owner) {
                setOwnerInfo(owner);
              }
            }
          } catch (error) {
            console.error('Error getting owner info:', error);
          }
        } else {
          setCarInfo(null);
        }
      } catch (error) {
        console.error('Error searching for car:', error);
        setCarInfo(null);
      }
    } else {
      setPlateNumber('');
      setNoPlateDetected(true);
    }
    setLoading(false);
  };

  const base64ToFile = (base64String, filename) => {
    const base64Data = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: 'image/jpeg' });
  };

  const getGPSLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            resolve({ lat: 31.9073, lng: 35.2045 });
          },
          { timeout: 5000, maximumAge: 60000 }
        );
      } else {
        resolve({ lat: 31.9073, lng: 35.2045 });
      }
    });
  };

  const handleAddViolation = async () => {
    if (!plateNumber || !carInfo || !capturedImage) {
      setViolationError(t('camera.cannotAddViolationMissingData'));
      return;
    }

    setAddingViolation(true);
    setViolationError('');
    setViolationSuccess(false);

    try {
      const location = await getGPSLocation();
      
      const violationTypeId = 4;
      
      const violationTypes = await api.getViolationTypes();
      const violationType = violationTypes.find(vt => vt.id === violationTypeId);
      
      if (!violationType) {
        throw new Error(t('camera.violationTypeNotFound'));
      }

      const imageFile = base64ToFile(capturedImage, 'violation-image.jpg');
      
      let imagePath = null;
      try {
        const uploadResult = await api.uploadViolationImage(imageFile);
        imagePath = uploadResult.imagePath;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error(t('camera.imageUploadFailed'));
      }

      const violationData = {
        plateNumber: plateNumber,
        citizenIdNumber: carInfo.ownerIdNumber || carInfo.owner_id_number,
        violationTypeId: violationTypeId,
        fine: violationType.fine,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        location: t('camera.defaultLocation'),
        gps: {
          lat: location.lat,
          lng: location.lng
        },
        imagePaths: imagePath ? [imagePath] : [],
        policeIdNumber: user?.idNumber || null,
        status: 'unpaid',
        notes: t('camera.capturedByCameraNote'),
        source: 'camera'
      };

      await api.addViolation(violationData);
      
      setViolationSuccess(true);
      setViolationError('');
      
      setTimeout(() => {
        setViolationSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding violation:', error);
      setViolationError(error.message || t('camera.errorAddingViolation'));
      setViolationSuccess(false);
    } finally {
      setAddingViolation(false);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else if (!stream && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    if (!showSidebar) {
      if (stream) {
        stopCameraStream();
      }
      return;
    }

    if (trafficLight === 'red') {
      startCameraStream();
    } else {
      if (stream) {
        stopCameraStream();
      }
    }
  }, [trafficLight, showSidebar]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="p-6 relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <h1 className="text-4xl font-extrabold gradient-text mb-6 animate-slideDown">{t('camera.title')}</h1>

      {showSidebar && (
        <div className={`fixed top-0 h-full w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl z-40 ${isRTL ? 'left-0 animate-slideInLeft border-l-4' : 'right-0 animate-slideInRight border-r-4'} border-blue-500`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <FaTrafficLight className="text-3xl text-blue-400" />
              <h2 className="text-2xl font-bold">{t('camera.trafficLight')}</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-24 h-24 rounded-full border-4 ${
                    trafficLight === 'red' 
                      ? 'bg-red-500 border-red-600 shadow-lg shadow-red-500/50 animate-pulse' 
                      : 'bg-gray-700 border-gray-600'
                  } transition-all duration-500`}>
                    {trafficLight === 'red' && (
                      <div className="w-full h-full rounded-full bg-red-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div className={`w-20 h-20 rounded-full border-4 ${
                    trafficLight === 'yellow' 
                      ? 'bg-yellow-500 border-yellow-600 shadow-lg shadow-yellow-500/50 animate-pulse' 
                      : 'bg-gray-700 border-gray-600'
                  } transition-all duration-500`}>
                    {trafficLight === 'yellow' && (
                      <div className="w-full h-full rounded-full bg-yellow-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div className={`w-20 h-20 rounded-full border-4 ${
                    trafficLight === 'green' 
                      ? 'bg-green-500 border-green-600 shadow-lg shadow-green-500/50 animate-pulse' 
                      : 'bg-gray-700 border-gray-600'
                  } transition-all duration-500`}>
                    {trafficLight === 'green' && (
                      <div className="w-full h-full rounded-full bg-green-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                <p className="text-center font-bold text-lg mb-2">
                  {trafficLight === 'red' && `🔴 ${t('camera.stop')}`}
                  {trafficLight === 'yellow' && `🟡 ${t('camera.getReady')}`}
                  {trafficLight === 'green' && `🟢 ${t('camera.go')}`}
                </p>
                <p className="text-sm text-gray-300 text-center">
                  {trafficLight === 'red' && t('camera.cameraActive')}
                  {trafficLight === 'yellow' && t('camera.getReadyToGo')}
                  {trafficLight === 'green' && t('camera.youCanGo')}
                </p>
              </div>

              {trafficLight === 'red' && cameraActive && (
                <div className="bg-red-900/50 backdrop-blur-sm rounded-xl p-4 border-2 border-red-500/50 animate-slideDown">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <p className="font-bold text-red-300">🔴 {t('camera.cameraActive')}</p>
                  </div>
                </div>
              )}
              {(trafficLight === 'yellow' || trafficLight === 'green') && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border-2 border-gray-600/50 animate-slideDown">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <p className="font-bold text-gray-300">{t('camera.cameraStopped')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-2' : 'lg:grid-cols-2'} gap-6 transition-all duration-300 ${showSidebar ? `max-w-[calc(100%-20rem)] ${isRTL ? 'mr-auto' : 'ml-auto'}` : ''}`}>
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('camera.cameraTitle')}</h2>
          
          {!stream ? (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-12 text-center border-2 border-gray-300 shadow-xl">
              <FaCamera className="text-6xl text-gray-400 mx-auto mb-4 animate-bounce" />
              <p className="text-gray-700 font-bold text-lg mb-6">{t('camera.cameraInactive')}</p>
              <button 
                onClick={startCamera} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <FaCamera />
                <span>{t('camera.startCamera')}</span>
              </button>
              <p className="text-sm text-gray-600 mt-4">{t('camera.cameraWillActivateOnRed')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden border-4 border-blue-500 shadow-2xl min-h-[400px] flex items-center justify-center">
                {stream && cameraActive && trafficLight === 'red' ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-auto max-h-[600px] object-contain"
                      onLoadedMetadata={() => {
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().catch(err => {
                            console.error('Error playing video on loadedMetadata:', err);
                          });
                        }
                      }}
                      onCanPlay={() => {
                        if (videoRef.current && videoRef.current.paused) {
                          videoRef.current.play().catch(err => {
                            console.error('Error playing video on canPlay:', err);
                          });
                        }
                      }}
                      onPlay={() => {
                        console.log('Video started playing');
                      }}
                    />
                    {trafficLight === 'red' && cameraActive && (
                      <div className={`absolute top-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse flex items-center gap-2 shadow-lg border-2 border-red-400 z-10 ${isRTL ? 'right-4' : 'left-4'}`}>
                        <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        <span>🔴 REC</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-white text-center p-8">
                    <FaCamera className="text-6xl mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      {showSidebar 
                        ? (trafficLight === 'red' ? t('camera.activatingCamera') : t('camera.cameraStoppedWaitingRed'))
                        : t('camera.simulationNotStarted')
                      }
                    </p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <FaCamera />
                  <span>{t('camera.captureImage')}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <FaStop />
                  <span>{t('camera.stopCamera')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('camera.results')}</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('camera.processingImage')}</p>
            </div>
          ) : capturedImage ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('camera.capturedImage')}</h3>
                <img
                  src={capturedImage}
                  alt={t('camera.capturedImageAlt')}
                  className="w-full rounded-lg border border-gray-300"
                />
              </div>
              
              {plateNumber && (
                <div className="space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheckCircle className="text-green-600 text-xl" />
                      <h3 className="text-lg font-semibold text-green-800">{t('camera.plateExtracted')}</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700 text-center mt-2">
                      {plateNumber}
                    </p>
                  </div>
                  
                  {carInfo ? (
                    <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <FaCar className="text-blue-600 text-xl" />
                        <h3 className="text-lg font-semibold text-blue-800">{t('camera.carInfo')}</h3>
                      </div>
                      <div className="space-y-2 text-gray-700">
                        <p><span className="font-semibold">{t('violations.plateNumber')}:</span> {carInfo.plateNumber}</p>
                        <p><span className="font-semibold">{t('cars.make')}:</span> {carInfo.make}</p>
                        <p><span className="font-semibold">{t('cars.model')}:</span> {carInfo.model}</p>
                        <p><span className="font-semibold">{t('cars.year')}:</span> {carInfo.year}</p>
                        <p><span className="font-semibold">{t('cars.color')}:</span> {carInfo.color}</p>
                        
                        {ownerInfo && (
                          <div className="mt-4 pt-4 border-t border-blue-300">
                            <div className="flex items-center gap-2 mb-2">
                              <FaUser className="text-blue-600" />
                              <h4 className="font-semibold text-blue-800">{t('camera.ownerInfo')}</h4>
                            </div>
                            <p><span className="font-semibold">{t('common.name')}:</span> {ownerInfo.name}</p>
                            <p><span className="font-semibold">{t('auth.idNumber')}:</span> {ownerInfo.idNumber}</p>
                            <p><span className="font-semibold">{t('common.phone')}:</span> {ownerInfo.phone}</p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleAddViolation}
                        disabled={addingViolation}
                        className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <FaSave />
                        <span>{addingViolation ? t('camera.addingViolation') : t('camera.addRedLightViolation')}</span>
                      </button>
                      
                      {violationSuccess && (
                        <div className="mt-3 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                          {t('camera.violationAddedSuccess')}
                        </div>
                      )}
                      
                      {violationError && (
                        <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                          {violationError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaExclamationTriangle className="text-yellow-600 text-xl" />
                        <h3 className="text-lg font-semibold text-yellow-800">{t('camera.carNotRegistered')}</h3>
                      </div>
                      <p className="text-center text-yellow-700 mt-2">
                        {t('camera.plateNotFoundInDatabase', { plate: plateNumber })}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {noPlateDetected && !loading && (
                <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                    <h3 className="text-lg font-semibold text-red-800">{t('camera.noPlateDetected')}</h3>
                  </div>
                  <p className="text-center text-red-700 mt-2">
                    {t('camera.noPlateFoundInImage')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-600">{t('camera.noImageCaptured')}</p>
            </div>
          )}
        </div>
      </div>

     
    </div>
  );
};

export default CameraSimulation;

