import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = ({ variant = 'dark' }) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    changeLanguage(newLanguage);
  };

  const isDark = variant === 'dark';
  const bgClass = isDark 
    ? 'bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/30' 
    : 'bg-gray-800/90 backdrop-blur-md border-gray-700 text-white hover:bg-gray-700';

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 ${bgClass} px-4 py-2 rounded-xl border shadow-lg transition-all duration-300 hover:scale-105 whitespace-nowrap`}
      title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <FaGlobe className="text-lg" />
      <span className="font-semibold">{language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
};

export default LanguageSwitcher;

