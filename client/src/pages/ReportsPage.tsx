/**
 * ReportsPage Component
 * Page for generating and exporting reports
 */

import { useState } from "react";

interface ReportsPageProps {
  tenantId: string;
}

export function ReportsPage({ tenantId }: ReportsPageProps) {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const reports = [
    {
      id: "receipts",
      title: "Reporte de Recaudos",
      description: "Exporta todos los recaudos en el período seleccionado",
      icon: "📋",
    },
    {
      id: "payments",
      title: "Reporte de Pagos",
      description: "Exporta todos los pagos realizados",
      icon: "💳",
    },
    {
      id: "dispersions",
      title: "Reporte de Dispersiones",
      description: "Exporta detalles de todas las dispersiones",
      icon: "💸",
    },
    {
      id: "summary",
      title: "Resumen Financiero",
      description: "Reporte consolidado de operaciones",
      icon: "📊",
    },
    {
      id: "reconciliation",
      title: "Conciliación Bancaria",
      description: "Compara transacciones con extractos bancarios",
      icon: "✓",
    },
    {
      id: "audit",
      title: "Auditoría y Trazabilidad",
      description: "Registro completo de cambios y operaciones",
      icon: "🔍",
    },
  ];

  const handleExport = async () => {
    if (!selectedReport) {
      alert("Selecciona un reporte");
      return;
    }

    if (!startDate || !endDate) {
      alert("Selecciona período de fechas");
      return;
    }

    setIsExporting(true);

    try {
      // TODO: Implement API call for report generation and export
      console.log("Generando reporte:", {
        reportId: selectedReport,
        startDate,
        endDate,
        format: "PDF", // or 'EXCEL'
      });

      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("¡Reporte generado exitosamente!");
    } catch (error) {
      alert("Error generando reporte");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          Genera y exporta reportes de tus operaciones
        </p>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedReport === report.id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white hover:border-blue-400"
            }`}
          >
            <div className="text-3xl mb-2">{report.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
            <p className="text-sm text-gray-600">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          Período de Reportes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Formato de Exportación</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="pdf"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">PDF</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="excel"
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Excel (.xlsx)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="format"
                value="csv"
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">CSV</span>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!selectedReport || !startDate || !endDate || isExporting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isExporting ? "Generando..." : "📥 Descargar Reporte"}
        </button>
      </div>

      {/* Report Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Consejo</h3>
          <p className="text-sm text-blue-800">
            Los reportes se generan en tiempo real con datos actualizados hasta el
            momento de la exportación.
          </p>
        </div>

        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-900 mb-2">📌 Nota</h3>
          <p className="text-sm text-amber-800">
            Todos los reportes incluyen información de auditoría y están disponibles
            para cumplimiento normativo.
          </p>
        </div>
      </div>
    </div>
  );
}
