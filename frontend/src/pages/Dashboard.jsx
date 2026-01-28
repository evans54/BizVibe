import React, { useEffect, useMemo, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import StatCard from '../components/StatCard';
import { formatDate, formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const { selectedBusinessId, selectedBusiness, createBusiness } = useBusiness();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    category: '',
    address: '',
    phone: '',
    website: ''
  });

  const fetchDashboard = async () => {
    if (!selectedBusinessId) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/businesses/${selectedBusinessId}/dashboard`);
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedBusinessId]);

  const handleBusinessChange = (event) => {
    setNewBusiness((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateBusiness = async (event) => {
    event.preventDefault();
    await createBusiness(newBusiness);
    setNewBusiness({ name: '', category: '', address: '', phone: '', website: '' });
  };

  const keywordTrend = dashboard?.keywords?.[0];
  const keywordChart = useMemo(() => {
    if (!keywordTrend?.rankings?.length) {
      return null;
    }
    return {
      labels: keywordTrend.rankings.map((entry) => formatDate(entry.checked_at)),
      datasets: [
        {
          label: `${keywordTrend.keyword} rank`,
          data: keywordTrend.rankings.map((entry) => entry.rank),
          fill: true,
          borderColor: '#ff8a4b',
          backgroundColor: 'rgba(255, 138, 75, 0.2)',
          tension: 0.35
        }
      ]
    };
  }, [dashboard]);

  const reviewBreakdown = useMemo(() => {
    const breakdown = dashboard?.reviews?.breakdown || [];
    if (!breakdown.length) {
      return null;
    }
    return {
      labels: breakdown.map((item) => `${item.rating} star`),
      datasets: [
        {
          data: breakdown.map((item) => item.count),
          backgroundColor: ['#ff8a4b', '#f4b266', '#f7d08a', '#d5c7a1', '#97b8a5']
        }
      ]
    };
  }, [dashboard]);

  const profileCompleteness = useMemo(() => {
    if (!dashboard?.business) {
      return 0;
    }
    const fields = ['name', 'category', 'address', 'phone', 'website', 'googleProfileId'];
    const completed = fields.filter((field) => dashboard.business[field]).length;
    return Math.round((completed / fields.length) * 100);
  }, [dashboard]);

  if (!selectedBusinessId) {
    return (
      <div className="page-grid">
        <section className="panel">
          <h3>Create your first business profile</h3>
          <p>Set up a workspace to start tracking SEO and reviews.</p>
          <form className="form-grid" onSubmit={handleCreateBusiness}>
            <input
              name="name"
              placeholder="Business name"
              value={newBusiness.name}
              onChange={handleBusinessChange}
              required
            />
            <input
              name="category"
              placeholder="Category"
              value={newBusiness.category}
              onChange={handleBusinessChange}
            />
            <input
              name="address"
              placeholder="Address"
              value={newBusiness.address}
              onChange={handleBusinessChange}
            />
            <input
              name="phone"
              placeholder="Phone"
              value={newBusiness.phone}
              onChange={handleBusinessChange}
            />
            <input
              name="website"
              placeholder="Website"
              value={newBusiness.website}
              onChange={handleBusinessChange}
            />
            <button className="primary-button" type="submit">
              Create business
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      {error && <div className="banner-error">{error}</div>}
      <div className="stat-grid">
        <StatCard
          title="Average rating"
          value={dashboard ? dashboard.reviews?.averageRating?.toFixed(1) : '--'}
          subtitle={`${dashboard?.reviews?.totalReviews || 0} reviews`}
          accent="accent-warm"
        />
        <StatCard
          title="Keywords tracked"
          value={dashboard?.keywords?.length || 0}
          subtitle="Local ranking visibility"
          accent="accent-forest"
        />
        <StatCard
          title="Profile completeness"
          value={`${profileCompleteness}%`}
          subtitle={dashboard?.business?.googleProfileId ? 'GBP linked' : 'GBP not linked'}
          accent="accent-sand"
        />
        <StatCard
          title="Latest report"
          value={dashboard?.reports?.[0] ? formatDate(dashboard.reports[0].created_at) : 'N/A'}
          subtitle={dashboard?.reports?.[0]?.report_type || 'No reports yet'}
        />
      </div>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h3>Keyword trend spotlight</h3>
            <p>{keywordTrend ? `${keywordTrend.keyword} rankings` : 'Add keywords to see trends'}</p>
          </div>
          <div className="tag">SERP rank</div>
        </div>
        {keywordChart ? (
          <Line
            data={keywordChart}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { reverse: true, title: { display: true, text: 'Rank position' } }
              }
            }}
          />
        ) : (
          <div className="empty-state">No ranking data yet. Add keywords to begin tracking.</div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h3>Review sentiment</h3>
            <p>Customer feedback distribution</p>
          </div>
          <div className="tag">Nairobi reviews</div>
        </div>
        {reviewBreakdown ? (
          <Doughnut data={reviewBreakdown} options={{ plugins: { legend: { position: 'bottom' } } }} />
        ) : (
          <div className="empty-state">No reviews collected yet.</div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>SEO suggestions</h3>
            <p>Actionable next steps to lift visibility</p>
          </div>
          <div className="tag">AI insights</div>
        </div>
        <div className="list">
          {dashboard?.suggestions?.length ? (
            dashboard.suggestions.map((item) => (
              <div key={item.title} className="list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.action}</p>
                </div>
                <span className={`pill ${item.priority}`}>{item.priority}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">No suggestions yet. Complete your profile for insights.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Latest reports</h3>
            <p>Automated insights ready for export</p>
          </div>
          <div className="tag">Reports</div>
        </div>
        <div className="list">
          {dashboard?.reports?.length ? (
            dashboard.reports.map((report) => (
              <div key={report.id} className="list-item">
                <div>
                  <strong>{report.report_type.replace('_', ' ')}</strong>
                  <p>Generated {formatDate(report.created_at)}</p>
                </div>
                <span className="pill neutral">{formatNumber(report.content?.keywords?.length || 0)} keywords</span>
              </div>
            ))
          ) : (
            <div className="empty-state">No reports yet. Generate one from the Reports page.</div>
          )}
        </div>
      </section>

      {loading && <div className="page-loader">Refreshing data...</div>}
    </div>
  );
};

export default Dashboard;
