import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCarRequest, getCarByPlate, getCitizenCars } from '../../services/api';
import { FaCar, FaPalette, FaCalendarAlt, FaSave, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const RequestCar = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'plateNumber') {
      const plate = value.toUpperCase();
      setFormData({ ...formData, plateNumber: plate });
      setError('');
      setSuccess('');
      
      if (plate.length >= 3) {
        try {
          const existingCar = await getCarByPlate(plate);
          if (existingCar) {
            setError('رقم اللوحة مسجل مسبقاً');
          }
        } catch (error) {
        }
      }
    } else {
      setFormData({ ...formData, [name]: value });
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.plateNumber || !formData.make || !formData.model) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    
    try {
      const existingCar = await getCarByPlate(formData.plateNumber);
      if (existingCar) {
        setError('رقم اللوحة مسجل مسبقاً');
        setLoading(false);
        return;
      }

      const userCars = await getCitizenCars(user.idNumber);
      if (userCars && userCars.some(c => c.plateNumber === formData.plateNumber)) {
        setError('لديك سيارة بهذا الرقم مسبقاً');
        setLoading(false);
        return;
      }
      
      await addCarRequest({
        plateNumber: formData.plateNumber,
        ownerIdNumber: user.idNumber,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        registrationDate: formData.registrationDate
      });
      
      setSuccess('تم إرسال طلب إضافة السيارة بنجاح! سيتم مراجعته من قبل وزارة النقل.');
      
      setTimeout(() => {
        setFormData({
          plateNumber: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          registrationDate: new Date().toISOString().split('T')[0]
        });
        setSuccess('');
        navigate('/driver/cars');
      }, 2000);
    } catch (err) {
      console.error('Error submitting car request:', err);
      setError('حدث خطأ أثناء إرسال الطلب: ' + (err.message || 'خطأ غير معروف'));
      setLoading(false);
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
          <span>العودة إلى سياراتي</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 animate-slideDown">
          طلب إضافة سيارة جديدة
        </h1>
        <p className="text-gray-600">قدم طلباً لإضافة سيارة جديدة - سيتم مراجعته من قبل وزارة النقل</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideUp">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaCar className="inline ml-2 text-blue-600" />
                رقم اللوحة *
              </label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder="مثال: 12345-6"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                الماركة *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder="مثال: تويوتا"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                الموديل *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder="مثال: كامري"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                السنة
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaPalette className="inline ml-2 text-blue-600" />
                اللون
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
                placeholder="مثال: أبيض"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <FaCalendarAlt className="inline ml-2 text-blue-600" />
                تاريخ التسجيل
              </label>
              <input
                type="date"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleInputChange}
                className="input-field w-full transform transition-all duration-200 focus:scale-105"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg animate-slideUp flex items-center">
              <FaCheckCircle className="ml-2" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
          >
            <FaSave />
            <span>{loading ? 'جاري الإرسال...' : 'إرسال الطلب'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestCar;

