import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import DriverDashboard from '../pages/driver/DriverDashboard';
import MyViolations from '../pages/driver/MyViolations';
import ViolationDetails from '../pages/driver/ViolationDetails';
import MyCars from '../pages/driver/MyCars';
import RequestCar from '../pages/driver/RequestCar';
import TransferCarRequest from '../pages/driver/TransferCarRequest';
import PoliceDashboard from '../pages/police/PoliceDashboard';
import AddViolation from '../pages/police/AddViolation';
import AllViolations from '../pages/police/AllViolations';
import ObjectionsManagement from '../pages/police/ObjectionsManagement';
import CameraSimulation from '../pages/simulation/CameraSimulation';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AddCitizen from '../pages/admin/AddCitizen';
import AllCitizens from '../pages/admin/AllCitizens';
import TransportDashboard from '../pages/transport/TransportDashboard';
import AddCar from '../pages/transport/AddCar';
import AllCars from '../pages/transport/AllCars';
import CarRequests from '../pages/transport/CarRequests';
import ViolationTypesManagement from '../pages/transport/ViolationTypesManagement';
import CourtDashboard from '../pages/court/CourtDashboard';
import CourtClearanceRequests from '../pages/court/ClearanceRequests';
import DriverClearanceRequest from '../pages/driver/ClearanceRequest';
import Profile from '../pages/Profile';
import TrafficManagement from '../pages/admin/TrafficManagement';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const AppRoutes = ({ user, userType, onLogin, onLogout, onUserUpdate }) => {
  const getDashboardPath = (role) => {
    const roleMap = {
      'driver': '/driver/dashboard',
      'police': '/police/dashboard',
      'interior': '/admin/dashboard',
      'transport': '/transport/dashboard',
      'court': '/court/dashboard',
      'traffic': '/admin/traffic-management'
    };
    return roleMap[role] || '/login';
  };

  const ProtectedRoute = ({ children, allowedUserType }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (allowedUserType) {
      const allowedTypes = Array.isArray(allowedUserType) ? allowedUserType : [allowedUserType];
      if (!allowedTypes.includes(userType)) {
        return <Navigate to={getDashboardPath(userType)} replace />;
      }
    }
    return children;
  };

  const ProtectedLayout = ({ children, allowedUserType }) => {
    return (
      <ProtectedRoute allowedUserType={allowedUserType}>
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar userType={userType} />
          <div className="flex-1 flex flex-col transition-all duration-300">
            <Navbar user={user} userType={userType} onLogout={onLogout} />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={getDashboardPath(userType)} replace />
          ) : (
            <Login onLogin={onLogin} />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to={getDashboardPath(userType)} replace />
          ) : (
            <SignUp onLogin={onLogin} />
          )
        }
      />

      <Route
        path="/driver/dashboard"
        element={
          <ProtectedLayout allowedUserType="driver">
            <DriverDashboard user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/violations"
        element={
          <ProtectedLayout allowedUserType="driver">
            <MyViolations user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/violations/:id"
        element={
          <ProtectedLayout allowedUserType="driver">
            <ViolationDetails />
          </ProtectedLayout>
        }
      />
      <Route
        path="/violations/:id"
        element={<ViolationDetails isPublic />}
      />
      <Route
        path="/driver/cars"
        element={
          <ProtectedLayout allowedUserType="driver">
            <MyCars user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/request-car"
        element={
          <ProtectedLayout allowedUserType="driver">
            <RequestCar user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/request-transfer"
        element={
          <ProtectedLayout allowedUserType="driver">
            <TransferCarRequest user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/driver/clearance-request"
        element={
          <ProtectedLayout allowedUserType="driver">
            <DriverClearanceRequest user={user} />
          </ProtectedLayout>
        }
      />

      <Route
        path="/police/dashboard"
        element={
          <ProtectedLayout allowedUserType="police">
            <PoliceDashboard user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/police/add-violation"
        element={
          <ProtectedLayout allowedUserType="police">
            <AddViolation user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/police/all-violations"
        element={
          <ProtectedLayout allowedUserType="police">
            <AllViolations user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/police/violations/:id"
        element={
          <ProtectedLayout allowedUserType="police">
            <ViolationDetails />
          </ProtectedLayout>
        }
      />

      <Route
        path="/simulation/camera"
        element={
          <ProtectedLayout allowedUserType="police">
            <CameraSimulation user={user} />
          </ProtectedLayout>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedLayout allowedUserType="interior">
            <AdminDashboard user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/add-citizen/:idNumber?"
        element={
          <ProtectedLayout allowedUserType="interior">
            <AddCitizen />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/citizens"
        element={
          <ProtectedLayout allowedUserType="interior">
            <AllCitizens />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/traffic-management"
        element={
          <ProtectedLayout allowedUserType={['interior', 'traffic']}>
            <TrafficManagement user={user} userType={userType} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/traffic-add-violation"
        element={
          <ProtectedLayout allowedUserType={['interior', 'traffic']}>
            <AddViolation user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/violation-types"
        element={
          <ProtectedLayout allowedUserType={['interior', 'traffic']}>
            <ViolationTypesManagement
              backTo="/admin/traffic-management"
              pageTitleKey="violationTypes.title"
              pageSubtitleKey="dashboard.manageViolationTypesDesc"
            />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin/objections"
        element={
          <ProtectedLayout allowedUserType="traffic">
            <ObjectionsManagement user={user} />
          </ProtectedLayout>
        }
      />

      <Route
        path="/transport/dashboard"
        element={
          <ProtectedLayout allowedUserType="transport">
            <TransportDashboard user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transport/add-car"
        element={
          <ProtectedLayout allowedUserType="transport">
            <AddCar />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transport/all-cars"
        element={
          <ProtectedLayout allowedUserType="transport">
            <AllCars />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transport/car-requests"
        element={
          <ProtectedLayout allowedUserType="transport">
            <CarRequests />
          </ProtectedLayout>
        }
      />

      <Route
        path="/court/dashboard"
        element={
          <ProtectedLayout allowedUserType="court">
            <CourtDashboard user={user} />
          </ProtectedLayout>
        }
      />
      <Route
        path="/court/clearance-requests"
        element={
          <ProtectedLayout allowedUserType="court">
            <CourtClearanceRequests />
          </ProtectedLayout>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedLayout allowedUserType={userType === 'driver' || userType === 'police' ? userType : null}>
            <Profile user={user} onUserUpdate={onUserUpdate} />
          </ProtectedLayout>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

