const API_BASE_URL = 'http://localhost:5000/api';

async function apiCall(endpoint, options = {}) {
  try {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });

    if (!response.ok) {
      let message = 'API request failed';
      try {
        const error = await response.json();
        message = error.error || error.message || message;
      } catch {
        const text = await response.text();
        if (text) message = text;
      }
      throw new Error(message);
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const login = async (idNumber, password) => {
  return apiCall('/citizens/login', {
    method: 'POST',
    body: JSON.stringify({ idNumber, password }),
  });
};

export const getCitizens = async (role = null) => {
  const url = role ? `/citizens?role=${role}` : '/citizens';
  return apiCall(url);
};

export const getCitizen = async (idNumber) => {
  return apiCall(`/citizens/${idNumber}`);
};

export const addCitizen = async (citizenData) => {
  return apiCall('/citizens', {
    method: 'POST',
    body: JSON.stringify(citizenData),
  });
};

export const updateCitizen = async (idNumber, citizenData) => {
  return apiCall(`/citizens/${idNumber}`, {
    method: 'PUT',
    body: JSON.stringify(citizenData),
  });
};

export const sendEmailVerificationCode = async (idNumber, newEmail) => {
  return apiCall('/citizens/send-email-verification-code', {
    method: 'POST',
    body: JSON.stringify({ idNumber, newEmail }),
  });
};

export const verifyEmailCode = async (idNumber, newEmail, verificationCode) => {
  return apiCall('/citizens/verify-email-code', {
    method: 'POST',
    body: JSON.stringify({ idNumber, newEmail, verificationCode }),
  });
};

export const deleteCitizen = async (idNumber) => {
  return apiCall(`/citizens/${idNumber}`, {
    method: 'DELETE',
  });
};

export const promotePoliceOfficer = async (idNumber, rank) => {
  return apiCall(`/citizens/${idNumber}/promote`, {
    method: 'PUT',
    body: JSON.stringify({ rank }),
  });
};

export const demotePoliceToCitizen = async (idNumber) => {
  return apiCall(`/citizens/${idNumber}/demote`, {
    method: 'PUT',
  });
};

export const getCars = async (ownerIdNumber = null) => {
  const url = ownerIdNumber ? `/cars?ownerIdNumber=${ownerIdNumber}` : '/cars';
  return apiCall(url);
};

export const getCar = async (plateNumber) => {
  return apiCall(`/cars/${plateNumber}`);
};

export const addCar = async (carData) => {
  return apiCall('/cars', {
    method: 'POST',
    body: JSON.stringify(carData),
  });
};

export const updateCar = async (carId, carData) => {
  return apiCall(`/cars/${carId}`, {
    method: 'PUT',
    body: JSON.stringify(carData),
  });
};

export const deleteCar = async (carId) => {
  return apiCall(`/cars/${carId}`, {
    method: 'DELETE',
  });
};

export const getViolations = async (citizenIdNumber = null) => {
  const url = citizenIdNumber ? `/violations?citizenIdNumber=${citizenIdNumber}` : '/violations';
  return apiCall(url);
};

export const getViolation = async (violationId) => {
  return apiCall(`/violations/${violationId}`);
};

export const uploadViolationImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  try {
    const response = await fetch(`${API_BASE_URL}/violations/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Image upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Image Upload Error:', error);
    throw error;
  }
};

export const addViolation = async (violationData) => {
  return apiCall('/violations', {
    method: 'POST',
    body: JSON.stringify(violationData),
  });
};

export const updateViolationStatus = async (violationId, status) => {
  return apiCall(`/violations/${violationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const exemptViolation = async (violationId) => {
  return updateViolationStatus(violationId, 'exempted');
};

export const deleteViolation = async (violationId) => {
  return apiCall(`/violations/${violationId}`, {
    method: 'DELETE',
  });
};

export const getViolationTypes = async () => {
  return apiCall('/violation-types');
};

export const getCarRequests = async (status = null) => {
  const url = status ? `/car-requests?status=${status}` : '/car-requests';
  return apiCall(url);
};

export const addCarRequest = async (requestData) => {
  if (requestData instanceof FormData) {
    return apiCall('/car-requests', {
      method: 'POST',
      body: requestData,
    });
  }

  return apiCall('/car-requests', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const approveCarRequest = async (requestId) => {
  return apiCall(`/car-requests/${requestId}/approve`, {
    method: 'PUT',
  });
};

export const rejectCarRequest = async (requestId) => {
  return apiCall(`/car-requests/${requestId}/reject`, {
    method: 'PUT',
  });
};

export const deleteCarRequest = async (requestId) => {
  return apiCall(`/car-requests/${requestId}`, {
    method: 'DELETE',
  });
};

export const getPoliceRequests = async (status = null) => {
  const url = status ? `/police-requests?status=${status}` : '/police-requests';
  return apiCall(url);
};

export const addPoliceRequest = async (requestData) => {
  return apiCall('/police-requests', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const approvePoliceRequest = async (requestId) => {
  return apiCall(`/police-requests/${requestId}/approve`, {
    method: 'PUT',
  });
};

export const rejectPoliceRequest = async (requestId) => {
  return apiCall(`/police-requests/${requestId}/reject`, {
    method: 'PUT',
  });
};

export const deletePoliceRequest = async (requestId) => {
  return apiCall(`/police-requests/${requestId}`, {
    method: 'DELETE',
  });
};

export const findCitizen = async (idNumber, password) => {
  try {
    return await login(idNumber, password);
  } catch (error) {
    return null;
  }
};

export const findCitizenByIdNumber = async (idNumber) => {
  try {
    return await getCitizen(idNumber);
  } catch (error) {
    return null;
  }
};

export const getCitizenViolations = async (citizenIdNumber) => {
  return getViolations(citizenIdNumber);
};

export const getCitizenCars = async (citizenIdNumber) => {
  return getCars(citizenIdNumber);
};

export const getCarByPlate = async (plateNumber) => {
  try {
    return await getCar(plateNumber);
  } catch (error) {
    return null;
  }
};

export const checkCitizenExists = async (idNumber) => {
  try {
    return await getCitizen(idNumber);
  } catch (error) {
    return null;
  }
};

export const checkCitizenAccount = async (idNumber) => {
  return apiCall(`/citizens/${idNumber}/check-account`);
};

export const getCitizensByRole = async (role) => {
  return getCitizens(role);
};

export const getPendingPoliceRequests = async () => {
  return getPoliceRequests('pending');
};

export const addViolationType = async (typeData) => {
  return apiCall('/violation-types', {
    method: 'POST',
    body: JSON.stringify(typeData),
  });
};

export const updateViolationType = async (typeId, typeData) => {
  return apiCall(`/violation-types/${typeId}`, {
    method: 'PUT',
    body: JSON.stringify(typeData),
  });
};

export const deleteViolationType = async (typeId) => {
  return apiCall(`/violation-types/${typeId}`, {
    method: 'DELETE',
  });
};

export const importViolationsExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/violations/import-excel`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Excel import failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Excel Import Error:', error);
    throw error;
  }
};

export const createObjection = async (violationId, objectionData) => {
  return apiCall(`/violations/${violationId}/objection`, {
    method: 'POST',
    body: JSON.stringify(objectionData),
  });
};

export const getObjection = async (violationId) => {
  return apiCall(`/violations/${violationId}/objection`);
};

export const approveObjection = async (violationId, reviewData) => {
  return apiCall(`/violations/${violationId}/objection/approve`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });
};

export const rejectObjection = async (violationId, reviewData) => {
  return apiCall(`/violations/${violationId}/objection/reject`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });
};

export const getObjections = async (status = null) => {
  const url = status ? `/objections?status=${status}` : '/objections';
  return apiCall(url);
};

export const createClearanceRequest = async (requestData) => {
  return apiCall('/clearance-requests', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const getClearanceRequests = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.citizenIdNumber) params.append('citizenIdNumber', filters.citizenIdNumber);
  const query = params.toString();
  return apiCall(query ? `/clearance-requests?${query}` : '/clearance-requests');
};

export const approveClearanceRequest = async (requestId, data = {}) => {
  return apiCall(`/clearance-requests/${requestId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const rejectClearanceRequest = async (requestId, data = {}) => {
  return apiCall(`/clearance-requests/${requestId}/reject`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};
