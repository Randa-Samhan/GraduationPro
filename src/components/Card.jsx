const Card = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorGradients = {
    blue: 'from-blue-500 via-blue-600 to-indigo-600',
    green: 'from-green-500 via-emerald-600 to-teal-600',
    red: 'from-red-500 via-rose-600 to-pink-600',
    yellow: 'from-yellow-400 via-amber-500 to-orange-500',
    purple: 'from-purple-500 via-indigo-600 to-blue-600',
  };

  const iconShadows = {
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
    red: 'shadow-red-500/50',
    yellow: 'shadow-yellow-500/50',
    purple: 'shadow-purple-500/50',
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-2 transform relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-sm mb-2 font-semibold uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1 break-words whitespace-normal">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-2 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`bg-gradient-to-br ${colorGradients[color]} p-5 rounded-2xl text-white shadow-2xl ${iconShadows[color]} transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-2xl`}>
            <Icon className="text-3xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;

