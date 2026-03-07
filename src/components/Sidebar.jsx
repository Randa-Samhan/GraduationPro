import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaHome, 
  FaExclamationTriangle, 
  FaCar, 
  FaPlusCircle,
  FaList,
  FaVideo,
  FaUsers,
  FaUserShield,
  FaBuilding,
  FaGavel,
  FaUser,
  FaShieldAlt,
  FaTrafficLight,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Sidebar = ({ userType }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  const driverLinks = [
    { to: '/driver/dashboard', icon: FaHome, label: t('sidebar.driverLinks.dashboard') },
    { to: '/driver/violations', icon: FaExclamationTriangle, label: t('sidebar.driverLinks.violations') },
    { to: '/driver/cars', icon: FaCar, label: t('sidebar.driverLinks.cars') },
    { to: '/driver/request-transfer', icon: FaList, label: t('sidebar.driverLinks.transfer') },
    { to: '/driver/clearance-request', icon: FaGavel, label: t('sidebar.driverLinks.clearance') },
    { to: '/profile', icon: FaUser, label: t('sidebar.driverLinks.profile') },
  ];

  const policeLinks = [
    { to: '/police/dashboard', icon: FaHome, label: t('sidebar.policeLinks.dashboard') },
    { to: '/police/add-violation', icon: FaPlusCircle, label: t('sidebar.policeLinks.addViolation') },
    { to: '/police/all-violations', icon: FaList, label: t('sidebar.policeLinks.allViolations') },
    { to: '/simulation/camera', icon: FaVideo, label: t('sidebar.policeLinks.cameraSimulation') },
    { to: '/profile', icon: FaUser, label: t('sidebar.policeLinks.profile') },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: FaHome, label: t('sidebar.adminLinks.dashboard') },
    { to: '/admin/add-citizen', icon: FaPlusCircle, label: t('sidebar.adminLinks.addCitizen') },
    { to: '/admin/citizens', icon: FaUsers, label: t('sidebar.adminLinks.citizens') },
  ];

  const transportLinks = [
    { to: '/transport/dashboard', icon: FaHome, label: t('sidebar.transportLinks.dashboard') },
    { to: '/transport/add-car', icon: FaPlusCircle, label: t('sidebar.transportLinks.addCar') },
    { to: '/transport/all-cars', icon: FaList, label: t('sidebar.transportLinks.allCars') },
    { to: '/transport/car-requests', icon: FaList, label: t('sidebar.transportLinks.carRequests') },
  ];

  const courtLinks = [
    { to: '/court/dashboard', icon: FaHome, label: t('sidebar.courtLinks.dashboard') },
    { to: '/court/clearance-requests', icon: FaGavel, label: t('sidebar.courtLinks.clearanceRequests') },
  ];

  const trafficLinks = [
    { to: '/admin/traffic-management', icon: FaHome, label: t('sidebar.traffic') },
    { to: '/admin/violation-types', icon: FaExclamationTriangle, label: t('sidebar.trafficLinks.violationTypes') },
    { to: '/admin/objections', icon: FaGavel, label: t('sidebar.trafficLinks.objections') },
  ];

  const getLinks = () => {
    if (userType === 'driver') return driverLinks;
    if (userType === 'police') return policeLinks;
    if (userType === 'interior') return adminLinks;
    if (userType === 'transport') return transportLinks;
    if (userType === 'court') return courtLinks;
    if (userType === 'traffic') return trafficLinks;
    return [];
  };

  const getTitle = () => {
    const titleKey = userType || 'system';
    return t(`sidebar.${titleKey}`);
  };

  const links = getLinks();

  const getIcon = () => {
    if (userType === 'interior') return <FaUserShield className="text-2xl text-blue-400" />;
    if (userType === 'transport') return <FaBuilding className="text-2xl text-blue-400" />;
    if (userType === 'court') return <FaGavel className="text-2xl text-blue-400" />;
    if (userType === 'police') return <FaUserShield className="text-2xl text-blue-400" />;
    if (userType === 'driver') return <FaCar className="text-2xl text-blue-400" />;
    if (userType === 'traffic') return <FaTrafficLight className="text-2xl text-red-400" />;
    return null;
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen shadow-2xl relative overflow-hidden transition-all duration-300 ease-in-out flex flex-col`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10"></div>
      
      <div className="relative z-10 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 flex-1">
                {getIcon()}
                <h2 className="text-lg font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent whitespace-nowrap">
                  {getTitle()}
                </h2>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110 flex-shrink-0"
                title={t('sidebar.hideMenu')}
              >
                <FaTimes className="text-lg" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center w-full gap-3">
              <div className="flex items-center justify-center w-full">
                {getIcon()}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110 w-full"
                title={t('sidebar.showMenu')}
              >
                <FaBars className="text-lg" />
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 relative z-10 p-3 space-y-2 overflow-y-auto">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
              title={isCollapsed ? link.label : ''}
            >
              <Icon className={`text-xl flex-shrink-0 ${link.to === window.location.pathname ? 'animate-pulse' : ''}`} />
              {!isCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                  {link.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
