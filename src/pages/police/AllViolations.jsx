import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as api from '../../services/api';
import { FaSearch, FaFilter, FaPrint } from 'react-icons/fa';
import policeHeaderLogo from '../../assets/police-header.jpg';

const AllViolations = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allViolations, setAllViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    plateNumber: '',
    date: '',
    violationType: '',
    policeIdNumber: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const violationsData = await api.getViolations();
        setAllViolations(violationsData);
        setFilteredViolations(violationsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading violations:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...allViolations];

    if (filters.plateNumber) {
      filtered = filtered.filter(v => 
        v.plateNumber.toLowerCase().includes(filters.plateNumber.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter(v => v.date === filters.date);
    }

    if (filters.violationType) {
      filtered = filtered.filter(v => v.violationType === filters.violationType);
    }

    if (filters.policeIdNumber) {
      filtered = filtered.filter(v => v.policeIdNumber === filters.policeIdNumber);
    }

    setFilteredViolations(filtered);
  }, [filters, allViolations]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      plateNumber: '',
      date: '',
      violationType: '',
      policeIdNumber: ''
    });
  };

  const handlePrintViolation = (violation) => {
    const violationTypesList = violation.violationTypes && violation.violationTypes.length > 0
      ? violation.violationTypes.map(vt => vt.name).join(', ')
      : violation.violationType || t('common.notSpecified');

    const statusLabel = violation.status === 'paid'
      ? t('violations.paid')
      : violation.status === 'exempted'
        ? t('violations.exempted')
        : t('violations.unpaid');

    const violationImages = Array.isArray(violation.images) && violation.images.length > 0
      ? violation.images
      : [violation.image || violation.imagePath].filter(Boolean);

    const policeLogoUrl = policeHeaderLogo;
    const printedAt = new Date().toLocaleString();
    const imagesHtml = violationImages
      .map((img, index) => {
        const src = img.startsWith('http') ? img : `http://localhost:5000${img}`;
        return `
          <figure class="image-card">
            <img class="violation-image" src="${src}" alt="Violation image ${index + 1}" />
            <figcaption>Violation image ${index + 1}</figcaption>
          </figure>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;
printWindow.document.write(`
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Traffic Violation Notice #${violation.id}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      font-family: "Tahoma", Arial, sans-serif;
      direction: rtl;
      color: #111827;
      background: #ffffff;
    }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 14px;
      line-height: 1.5;
    }

    .paper { width: 100%; margin: 0 auto; }

    .document {
      width: 100%;
      border: 2px solid #0f4c97;
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
    }

    .header {
      padding: 14px 18px 16px;
      border-bottom: 2px solid #0f4c97;
      background: linear-gradient(135deg, #f6fbff 0%, #ebf3ff 100%);
      text-align: center;
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 3px;
    }

    .header h1 {
      margin: 0;
      font-size: 21px;
      color: #0b3f80;
      font-weight: 700;
    }

    .header h2 {
      margin: 0;
      font-size: 16px;
      color: #1f2937;
      font-weight: 700;
    }

    .header-meta {
      margin-top: 8px;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 700;
    }

    .content { padding: 16px; }

    .info-box {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .field {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #f9fafb;
      padding: 10px;
      min-height: 66px;
    }

    .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .value {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      word-break: break-word;
    }

    .plate {
      direction: ltr;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 17px;
      letter-spacing: 1.2px;
    }

    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }

    .status.unpaid { background: #fee2e2; color: #991b1b; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.exempted { background: #e0f2fe; color: #0c4a6e; }

    .images-section {
      margin-top: 14px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
    }

    .images-title {
      margin: 0 0 10px;
      font-size: 15px;
      color: #1f2937;
      font-weight: 700;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .image-card {
      margin: 0;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
      break-inside: avoid;
    }

    .violation-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
      background: #f3f4f6;
    }

    .image-card figcaption {
      font-size: 11px;
      text-align: center;
      color: #4b5563;
      padding: 4px 6px;
      border-top: 1px solid #e5e7eb;
    }

    .signature {
      margin-top: 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }

    .signature-box {
      border-top: 1px dashed #6b7280;
      padding-top: 8px;
      text-align: center;
      color: #374151;
      font-size: 13px;
      min-height: 56px;
    }

    .footer {
      margin-top: 14px;
      border-top: 1px dashed #9ca3af;
      padding-top: 8px;
      font-size: 11px;
      text-align: center;
      color: #6b7280;
    }

    @media print {
      .paper, .document { box-shadow: none; }
    }
  </style>
</head>

<body>
  <div class="paper">
    <div class="document">
      <div class="header">
        <div class="header-top">
          <img class="logo" src="${policeLogoUrl}" alt="Police logo" />
          <div>
            <h1>Palestinian Police</h1>
            <h2>Traffic Violation Notice</h2>
          </div>
        </div>
        <div class="header-meta">Violation ID: ${violation.id}</div>
      </div>

      <div class="content">
        <div class="info-box">
          <div class="field">
            <div class="label">Plate Number</div>
            <div class="value plate">${violation.plateNumber}</div>
          </div>

          <div class="field">
            <div class="label">Violation List</div>
            <div class="value">${violationTypesList}</div>
          </div>

          <div class="field">
            <div class="label">Date and Time</div>
            <div class="value">${violation.date} ${violation.time || ''}</div>
          </div>

          <div class="field">
            <div class="label">Status</div>
            <div class="value">
              <span class="status ${violation.status}">${statusLabel}</span>
            </div>
          </div>

          <div class="field">
            <div class="label">Location</div>
            <div class="value">${violation.location || '-'}</div>
          </div>

          <div class="field">
            <div class="label">Total Fine</div>
            <div class="value">${violation.fine} ILS</div>
          </div>

          <div class="field">
            <div class="label">Issued By</div>
            <div class="value">${violation.policeName || 'Traffic camera'}</div>
          </div>
        </div>

        ${imagesHtml ? `
          <div class="images-section">
            <h3 class="images-title">Violation Images</h3>
            <div class="images-grid">
              ${imagesHtml}
            </div>
          </div>
        ` : ''}

        <div class="signature">
          <div class="signature-box">Driver Signature</div>
          <div class="signature-box">Officer Signature</div>
        </div>

        <div class="footer">
          This notice was issued electronically by the Traffic Violations Management System<br />
          Printed at: ${printedAt}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const [policeOfficers, setPoliceOfficers] = useState([]);
  const uniqueViolationTypes = [...new Set(allViolations.map(v => v.violationType))];

  useEffect(() => {
    const loadPoliceOfficers = async () => {
      try {
        const officers = await api.getCitizensByRole('police');
        setPoliceOfficers(officers);
      } catch (error) {
        console.error('Error loading police officers:', error);
      }
    };
    loadPoliceOfficers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('violations.registeredViolations')}</h1>

      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-blue-600 text-xl" />
          <h2 className="text-xl font-bold text-gray-800">{t('violations.filterViolations')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              {t('violations.plateNumber')}
            </label>
            <div className="relative">
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="plateNumber"
                value={filters.plateNumber}
                onChange={handleFilterChange}
                className="input-field pr-10"
                placeholder={t('violations.searchByPlate')}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              {t('common.date')}
            </label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              {t('violations.violationType')}
            </label>
            <select
              name="violationType"
              value={filters.violationType}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">{t('common.allStatuses')}</option>
              {uniqueViolationTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              {t('violations.policeName')}
            </label>
            <select
              name="policeIdNumber"
              value={filters.policeIdNumber}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">{t('common.allStatuses')}</option>
              {policeOfficers.map((p) => (
                <option key={p.idNumber} value={p.idNumber}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="mt-4 btn-secondary text-sm"
        >
          {t('violations.clearFilters')}
        </button>
      </div>

      <div className="card overflow-hidden border-2 border-gray-200">
        <div className="mb-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-r-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-800">
            {t('violations.results')}: <span className="text-blue-700">{filteredViolations.length}</span> {t('violations.violation')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.violationNumber')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.plateNumber')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.violationType')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('common.date')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.location')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.fine')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('violations.policeName')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('common.status')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-600">
                    {t('violations.noViolationsMatchFilters')}
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => {
                  
                  const violationTypesList = violation.violationTypes && violation.violationTypes.length > 0
                    ? violation.violationTypes.map(vt => vt.name).join(', ')
                    : violation.violationType || t('common.notSpecified');
                  
                  return (
                    <tr key={violation.id} className="hover:bg-gray-50 transition duration-150">
                      <td 
                        className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline font-semibold"
                        onClick={() => navigate(`/police/violations/${violation.id}`)}
                      >
                        #{violation.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {violation.plateNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{violationTypesList}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {violation.date} {violation.time}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{violation.location}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {violation.fine} ₪
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{violation.policeName || t('violations.cameraMonitoring')}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={violation.status === 'paid' ? 'badge-paid' : violation.status === 'exempted' ? 'badge-exempted' : 'badge-unpaid'}>
                          {violation.status === 'paid' ? t('violations.paid') : violation.status === 'exempted' ? t('violations.exempted') : t('violations.unpaid')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handlePrintViolation(violation)}
                          className="flex items-center space-x-1 space-x-reverse text-gray-700 hover:text-blue-700 font-semibold"
                          title={t('common.print')}
                        >
                          <FaPrint />
                          <span>{t('common.print')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllViolations;

