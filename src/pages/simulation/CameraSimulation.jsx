import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCamera,
  FaStop,
  FaCheckCircle,
  FaTrafficLight,
  FaExclamationTriangle,
  FaCar,
  FaUser,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import * as api from '../../services/api';

const FALLBACK_GPS = { lat: 31.9073, lng: 35.2045 };

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
  const [gpsLocation, setGpsLocation] = useState(FALLBACK_GPS);
  const [addingViolation, setAddingViolation] = useState(false);
  const [violationSuccess, setViolationSuccess] = useState(false);
  const [violationError, setViolationError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trafficIntervalRef = useRef(null);
  const timeoutRefs = useRef([]);

  const text = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const base64ToFile = (base64String, filename) => {
    const base64Data = base64String.split(',')[1] || base64String;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: 'image/jpeg' });
  };

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

  const findCameraViolationType = async () => {
    const violationTypes = await api.getViolationTypes();

    const preferredType = violationTypes.find((type) => {
      const name = normalizeText(type.name);
      const category = normalizeText(type.category);

      return (
        name.includes('Ø§Ù„Ø§Ø´Ø§Ø±Ø© Ø§Ù„Ø­Ù…Ø±Ø§Ø¡')
        || name.includes('Ø§Ù„Ø¥Ø´Ø§Ø±Ø© Ø§Ù„Ø­Ù…Ø±Ø§Ø¡')
        || name.includes('Ø§Ù„Ø¶ÙˆØ¡ Ø§Ù„Ø£Ø­Ù…Ø±')
        || name.includes('red light')
        || (name.includes('Ø§Ø´Ø§Ø±Ø©') && name.includes('Ø­Ù…Ø±Ø§Ø¡'))
        || (name.includes('Ø¥Ø´Ø§Ø±Ø©') && name.includes('Ø­Ù…Ø±Ø§Ø¡'))
        || category === 'dangerous'
      );
    });

    if (preferredType) return preferredType;

    const fallbackType = violationTypes.find((type) => Number(type.id) === 4);
    return fallbackType || violationTypes[0] || null;
  };

  const extractPlateFromImage = async (imageData) => {
    try {
      const file = base64ToFile(imageData, 'captured-image.jpg');
      const formDataToSend = new FormData();
      formDataToSend.append('upload', file);

      const apiResponse = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
        method: 'POST',
        headers: {
          Authorization: 'Token 82199f004ff0d0da22dc6118e3069a56e0c9d8c3',
        },
        body: formDataToSend,
      });

      if (apiResponse.status !== 200 && apiResponse.status !== 201) {
        console.error('API Error:', await apiResponse.text());
        setNoPlateDetected(true);
        return null;
      }

      const result = await apiResponse.json();
      const extractedPlate = result.results?.[0]?.plate || null;

      if (!extractedPlate) {
        setNoPlateDetected(true);
        return null;
      }

      setNoPlateDetected(false);
      return extractedPlate;
    } catch (error) {
      console.error('Error reading plate:', error);
      setNoPlateDetected(true);
      return null;
    }
  };

  const getGPSLocation = () => (
    new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            resolve(FALLBACK_GPS);
          },
          { timeout: 5000, maximumAge: 60000 }
        );
      } else {
        resolve(FALLBACK_GPS);
      }
    })
  );

  const startCameraStream = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setCameraActive(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error(text('camera.cameraAccessError', 'Error accessing camera:'), error);
      setCameraActive(false);
      setStream(null);
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const cycleTrafficLight = () => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
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
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current = [];

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
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
    setCarInfo(null);
    setOwnerInfo(null);
    setViolationError('');
    setViolationSuccess(false);
    setAddingViolation(false);
    setGpsLocation(FALLBACK_GPS);
  };

  const submitCameraViolation = async ({ imageData, resolvedCar, location }) => {
    setAddingViolation(true);
    setViolationError('');
    setViolationSuccess(false);

    try {
      const violationType = await findCameraViolationType();
      if (!violationType) {
        throw new Error(text('camera.violationTypeNotFound', 'Violation type not found'));
      }

      const uploadResult = await api.uploadViolationImage(base64ToFile(imageData, 'violation-image.jpg'));
      const ownerIdNumber = resolvedCar.ownerIdNumber || resolvedCar.owner_id_number;

      await api.addViolation({
        plateNumber: resolvedCar.plateNumber,
        citizenIdNumber: ownerIdNumber,
        violationTypeIds: [Number(violationType.id)],
        violationTypeId: Number(violationType.id),
        fine: Number(violationType.fine || 0),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        location: text('camera.defaultLocation', 'Ramallah'),
        gps: {
          lat: location.lat,
          lng: location.lng,
        },
        imagePaths: uploadResult?.imagePath ? [uploadResult.imagePath] : [],
        policeIdNumber: user?.idNumber || null,
        status: 'unpaid',
        notes: text('camera.capturedByCameraNote', 'Image captured by traffic police camera'),
        source: 'camera',
      });

      setViolationSuccess(true);
      setTimeout(() => {
        setViolationSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding violation:', error);
      setViolationError(error.message || text('camera.errorAddingViolation', 'An error occurred while adding the violation'));
      setViolationSuccess(false);
    } finally {
      setAddingViolation(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || addingViolation) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const location = await getGPSLocation();

    setCapturedImage(imageData);
    setGpsLocation(location);
    setLoading(true);
    setPlateNumber('');
    setNoPlateDetected(false);
    setCarInfo(null);
    setOwnerInfo(null);
    setViolationSuccess(false);
    setViolationError('');

    try {
      const extractedPlate = await extractPlateFromImage(imageData);
      if (!extractedPlate) {
        setPlateNumber('');
        setNoPlateDetected(true);
        return;
      }

      setPlateNumber(extractedPlate);
      setNoPlateDetected(false);

      const car = await api.getCarByPlate(extractedPlate);
      if (!car) {
        setCarInfo(null);
        return;
      }

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

      await submitCameraViolation({ imageData, resolvedCar: car, location });
    } catch (error) {
      console.error('Error processing image:', error);
      setViolationError(error.message || text('camera.errorAddingViolation', 'An error occurred while adding the violation'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
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
    } else if (stream) {
      stopCameraStream();
    }
  }, [trafficLight, showSidebar]);

  useEffect(() => () => {
    stopCamera();
  }, []);

  const trafficLightMeta = {
    red: {
      label: t('camera.stop'),
      description: t('camera.cameraActive'),
      accent: 'from-red-500 to-rose-500',
      surface: 'border-red-200 bg-red-50 text-red-700',
    },
    yellow: {
      label: t('camera.getReady'),
      description: t('camera.getReadyToGo'),
      accent: 'from-amber-400 to-yellow-500',
      surface: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    green: {
      label: t('camera.go'),
      description: t('camera.youCanGo'),
      accent: 'from-emerald-500 to-green-500',
      surface: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  };

  const activeTrafficMeta = trafficLightMeta[trafficLight];
  const formattedPlateNumber = plateNumber ? plateNumber.toUpperCase() : '';

  return (
    <div className="p-6 relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <h1 className="text-4xl font-extrabold gradient-text mb-6 animate-slideDown">{t('camera.title')}</h1>

      <div className={`grid gap-6 xl:gap-8 items-start ${showSidebar ? 'xl:grid-cols-[minmax(0,1fr)_20rem]' : 'grid-cols-1'}`}>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          <div className="card w-full h-full !p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 bg-white/90">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('camera.cameraTitle')}</h2>
                <p className="text-sm text-slate-500">
                  {showSidebar ? t('camera.cameraWillActivateOnRed') : t('camera.simulationNotStarted')}
                </p>
              </div>
              <div className={`rounded-full px-4 py-2 text-sm font-semibold border ${cameraActive ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                {cameraActive ? t('camera.cameraActive') : t('camera.cameraStopped')}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {!showSidebar ? (
                <div className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,#ffffff_0%,#eff6ff_50%,#e2e8f0_100%)] p-8 text-center shadow-inner min-h-[520px] flex flex-col justify-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-lg ring-1 ring-slate-200">
                    <FaCamera className="text-4xl text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{t('camera.cameraInactive')}</p>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">{t('camera.cameraWillActivateOnRed')}</p>

                  <button
                    onClick={startCamera}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <FaCamera />
                    <span>{t('camera.startCamera')}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('camera.trafficLight')}</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{activeTrafficMeta.label}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('camera.cameraTitle')}</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{cameraActive ? t('camera.cameraActive') : t('camera.cameraStopped')}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('camera.results')}</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">{capturedImage ? t('camera.plateExtracted') : t('camera.noImageCaptured')}</p>
                    </div>
                  </div>

                  <div className="relative min-h-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]">
                    {stream && cameraActive && trafficLight === 'red' ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                          onLoadedMetadata={() => {
                            if (videoRef.current && videoRef.current.paused) {
                              videoRef.current.play().catch(() => {});
                            }
                          }}
                        />

                        <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} rounded-full bg-red-600/90 text-white px-4 py-2 text-sm font-bold tracking-[0.2em] shadow-lg backdrop-blur`}>
                          REC
                        </div>
                        <div className={`absolute bottom-4 ${isRTL ? 'left-4' : 'right-4'} rounded-2xl bg-slate-950/70 px-4 py-3 text-white backdrop-blur`}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('camera.trafficLight')}</p>
                          <p className="mt-1 font-semibold">{t('camera.cameraActive')}</p>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.2),_transparent_35%),linear-gradient(135deg,#020617_0%,#111827_50%,#0f172a_100%)]">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5">
                          <FaCamera className="text-4xl text-slate-200" />
                        </div>
                        <p className="text-2xl font-bold mb-3">
                          {trafficLight === 'red' ? t('camera.activatingCamera') : t('camera.cameraStoppedWaitingRed')}
                        </p>
                        <p className="max-w-sm text-sm text-slate-300">{activeTrafficMeta.description}</p>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={captureImage}
                      disabled={addingViolation || !cameraActive || trafficLight !== 'red'}
                      className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCamera />
                      <span>{addingViolation ? t('camera.processingImage') : t('camera.captureImage')}</span>
                    </button>

                    <button
                      onClick={stopCamera}
                      className="flex-1 btn-secondary flex items-center justify-center gap-2"
                    >
                      <FaStop />
                      <span>{t('camera.stopCamera')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card w-full h-full !p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 bg-white/90">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t('camera.results')}</h2>
                <p className="text-sm text-slate-500">{capturedImage ? t('camera.processingImage') : t('camera.noImageCaptured')}</p>
              </div>
              {capturedImage && (
                <div className={`rounded-full px-4 py-2 text-sm font-semibold border ${plateNumber ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  <span className="text-base font-black tracking-[0.16em]">
                    {formattedPlateNumber || text('camera.plateNotDetected', 'Plate not detected')}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6">
              {loading ? (
                <div className="min-h-[520px] flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-slate-200 border-t-blue-600 mx-auto mb-5"></div>
                  <p className="text-lg font-semibold text-slate-800">{t('camera.processingImage')}</p>
                </div>
              ) : capturedImage ? (
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-inner">
                    <img
                      src={capturedImage}
                      alt="captured"
                      className="w-full h-[260px] sm:h-[320px] object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {plateNumber ? (
                      <div className="rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
                        <div className="flex items-center gap-3 mb-3 text-green-700">
                          <FaCheckCircle className="text-2xl" />
                          <h3 className="text-lg font-bold">{t('camera.plateExtracted')}</h3>
                        </div>
                        <p className="rounded-2xl border border-green-200 bg-white px-4 py-5 text-center text-4xl sm:text-5xl font-black tracking-[0.28em] text-green-700 uppercase">
                          {formattedPlateNumber}
                        </p>
                      </div>
                    ) : noPlateDetected ? (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                        <div className="flex items-center gap-3 mb-2">
                          <FaExclamationTriangle className="text-xl" />
                          <h3 className="text-lg font-bold">{text('camera.plateNotDetected', 'Plate not detected')}</h3>
                        </div>
                        <p className="text-sm">{text('camera.tryAnotherCapture', 'Try capturing another image with a clearer vehicle view.')}</p>
                      </div>
                    ) : null}

                    {carInfo && (
                      <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
                        <div className="flex items-center gap-3 mb-4 text-blue-700">
                          <FaCar className="text-2xl" />
                          <h3 className="text-lg font-bold">{t('camera.carInfo')}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl bg-white border border-blue-100 p-3">
                            <p className="text-slate-400">{t('cars.make')}</p>
                            <p className="font-bold text-slate-800">{carInfo.make}</p>
                          </div>
                          <div className="rounded-2xl bg-white border border-blue-100 p-3">
                            <p className="text-slate-400">{t('cars.model')}</p>
                            <p className="font-bold text-slate-800">{carInfo.model}</p>
                          </div>
                          <div className="rounded-2xl bg-white border border-blue-100 p-3">
                            <p className="text-slate-400">{t('cars.year')}</p>
                            <p className="font-bold text-slate-800">{carInfo.year}</p>
                          </div>
                          <div className="rounded-2xl bg-white border border-blue-100 p-3">
                            <p className="text-slate-400">{t('cars.color')}</p>
                            <p className="font-bold text-slate-800">{carInfo.color}</p>
                          </div>
                        </div>

                        {ownerInfo && (
                          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center gap-3 mb-3 text-slate-700">
                              <FaUser className="text-lg" />
                              <h4 className="font-bold">{text('camera.ownerInfo', 'Owner information')}</h4>
                            </div>
                            <div className="space-y-2 text-sm text-slate-700">
                              <p><b>{t('common.name')}:</b> {ownerInfo.name}</p>
                              <p><b>{t('auth.idNumber')}:</b> {ownerInfo.idNumber}</p>
                              <p><b>{t('common.phone')}:</b> {ownerInfo.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-700">
                          <FaMapMarkerAlt />
                          <h3 className="font-bold">{text('camera.gpsLocation', 'GPS location')}</h3>
                        </div>
                        <p className="text-sm text-slate-500">
                          {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                        </p>
                      </div>

                      <div className={`rounded-3xl border p-4 ${violationSuccess ? 'border-green-200 bg-green-50 text-green-700' : violationError ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        <p className="font-bold mb-2">{text('camera.captureStatus', 'Capture status')}</p>
                        <p className="text-sm">
                          {violationSuccess
                            ? t('camera.violationAddedSuccess')
                            : violationError || activeTrafficMeta.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-[520px] rounded-[28px] border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] p-12 text-center flex flex-col items-center justify-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-md ring-1 ring-slate-200">
                    <FaCamera className="text-3xl text-slate-400" />
                  </div>
                  <p className="text-xl font-bold text-slate-800 mb-2">{t('camera.noImageCaptured')}</p>
                  <p className="max-w-sm text-sm text-slate-500">{text('camera.resultsHint', 'The captured image, plate details, and violation status will appear here.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSidebar && (
          <aside className="xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-[32px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-[0_28px_70px_rgba(15,23,42,0.45)]">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <FaTrafficLight className="text-2xl text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t('camera.trafficLight')}</h2>
                    <p className="text-sm text-slate-300">{activeTrafficMeta.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
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
                  <p className="text-center font-bold text-lg mb-2">{activeTrafficMeta.label}</p>
                  <p className="text-sm text-gray-300 text-center">{activeTrafficMeta.description}</p>
                </div>

                {trafficLight === 'red' && cameraActive && (
                  <div className="bg-red-900/50 backdrop-blur-sm rounded-xl p-4 border-2 border-red-500/50 animate-slideDown">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <p className="font-bold text-red-300">{t('camera.cameraActive')}</p>
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
          </aside>
        )}
      </div>
    </div>
  );
};

export default CameraSimulation;
