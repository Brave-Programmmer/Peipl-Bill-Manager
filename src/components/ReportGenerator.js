import { useState, useEffect } from "react";

export default function ReportGenerator({ files, trackingData, tags, onClose }) {
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [generatedReport, setGeneratedReport] = useState(null);

  useEffect(() => {
    // Generate initial report when component mounts
    generateReport();
  }, [reportType, dateRange]);

  const generateReport = () => {
    const filteredFiles = files.filter(file => {
      if (!dateRange.start || !dateRange.end) return true;
      
      const fileDate = new Date(file.modifiedDate);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      return fileDate >= startDate && fileDate <= endDate;
    });

    if (reportType === "summary") {
      const totalFiles = filteredFiles.length;
      const sentFiles = filteredFiles.filter(file => 
        trackingData.bills?.[file.path]?.sentMonth
      ).length;
      const pendingFiles = totalFiles - sentFiles;
      
      const byType = {};
      const byMonth = {};
      
      filteredFiles.forEach(file => {
        // File type distribution
        const ext = file.extension || "unknown";
        byType[ext] = (byType[ext] || 0) + 1;
        
        // Monthly distribution
        const billMonth = trackingData.bills?.[file.path]?.billMonth || "Unknown";
        byMonth[billMonth] = (byMonth[billMonth] || 0) + 1;
      });
      
      setGeneratedReport({
        total: totalFiles,
        sent: sentFiles,
        pending: pendingFiles,
        percentage: totalFiles > 0 ? Math.round((sentFiles / totalFiles) * 100) : 0,
        byType,
        byMonth
      });
    } else if (reportType === "detailed") {
      const detailedData = filteredFiles.map(file => ({
        name: file.name,
        folder: file.folder,
        size: file.size,
        createdDate: file.createdDate,
        modifiedDate: file.modifiedDate,
        status: trackingData.bills?.[file.path] ? "Sent" : "Pending",
        billMonth: trackingData.bills?.[file.path]?.billMonth || "N/A",
        sentMonth: trackingData.bills?.[file.path]?.sentMonth || "N/A",
        tags: tags[file.path] || []
      }));
      
      setGeneratedReport(detailedData);
    }
  };

  const exportReport = () => {
    const dataStr = JSON.stringify(generatedReport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bill_report_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-auto p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
          >
            Generate Report
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export Report
          </button>
        </div>

        {generatedReport && (
          <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto">
            {reportType === "summary" ? (
              <div>
                <h3 className="text-xl font-bold mb-4">Summary Report</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-700">{generatedReport.total}</p>
                    <p className="text-sm text-gray-600">Total Files</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-700">{generatedReport.sent}</p>
                    <p className="text-sm text-gray-600">Sent Files</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-amber-700">{generatedReport.pending}</p>
                    <p className="text-sm text-gray-600">Pending Files</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-purple-700">{generatedReport.percentage}%</p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">File Types Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(generatedReport.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span>{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Monthly Distribution</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(generatedReport.byMonth).map(([month, count]) => (
                        <div key={month} className="flex justify-between">
                          <span>{month}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">Detailed Report</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folder</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Month</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedReport.map((file, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.folder}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.size)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              file.status === "Sent" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {file.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.billMonth}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.sentMonth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
