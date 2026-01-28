import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/formatters';
import NoBusiness from '../components/NoBusiness';

const Reports = () => {
  const { selectedBusinessId } = useBusiness();
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('weekly');
  const [status, setStatus] = useState('');

  const fetchReports = async () => {
    if (!selectedBusinessId) return;
    const { data } = await api.get(`/businesses/${selectedBusinessId}/reports`);
    setReports(data.reports || []);
  };

  useEffect(() => {
    fetchReports();
  }, [selectedBusinessId]);

  const handleGenerateReport = async () => {
    setStatus('Generating report...');
    await api.post(`/businesses/${selectedBusinessId}/reports/generate`, { reportType });
    setStatus('Report generated.');
    await fetchReports();
  };

  const handleExport = async (reportId, format) => {
    const response = await api.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    const mimeType = response.headers['content-type'] || (format === 'csv' ? 'text/csv' : 'application/pdf');
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bizvibe-report-${reportId}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!selectedBusinessId) {
    return (
      <NoBusiness
        title="Generate local SEO reports"
        description="Select a business to generate weekly and monthly reports."
      />
    );
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Reports & exports</h3>
            <p>Download weekly and monthly summaries for stakeholders.</p>
          </div>
        </div>
        <div className="inline-form">
          <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
            <option value="weekly">Weekly report</option>
            <option value="monthly">Monthly report</option>
            <option value="custom">Custom report</option>
          </select>
          <button className="primary-button" type="button" onClick={handleGenerateReport}>
            Generate report
          </button>
        </div>
        {status && <div className="info-banner">{status}</div>}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Available reports</h3>
            <p>Export PDF or CSV for each generated report.</p>
          </div>
        </div>
        <div className="list">
          {reports.length ? (
            reports.map((report) => (
              <div key={report.id} className="list-item">
                <div>
                  <strong>{report.report_type.replace('_', ' ')}</strong>
                  <p>Generated {formatDate(report.created_at)}</p>
                </div>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => handleExport(report.id, 'pdf')}
                  >
                    PDF
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => handleExport(report.id, 'csv')}
                  >
                    CSV
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No reports yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reports;
