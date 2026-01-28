import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { formatDate } from '../utils/formatters';
import NoBusiness from '../components/NoBusiness';

const Keywords = () => {
  const { selectedBusinessId } = useBusiness();
  const [keywords, setKeywords] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [message, setMessage] = useState('');

  const fetchKeywords = async () => {
    if (!selectedBusinessId) return;
    const { data } = await api.get(`/businesses/${selectedBusinessId}/keywords`);
    setKeywords(data.keywords || []);
    if (!selectedKeyword && data.keywords?.length) {
      setSelectedKeyword(data.keywords[0]);
    }
  };

  const fetchRankings = async (keyword) => {
    if (!keyword) return;
    const { data } = await api.get(`/keywords/${keyword.id}/rankings`);
    setRankings(data.rankings || []);
  };

  useEffect(() => {
    fetchKeywords();
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedKeyword) {
      fetchRankings(selectedKeyword);
    }
  }, [selectedKeyword]);

  const handleAddKeyword = async (event) => {
    event.preventDefault();
    if (!newKeyword) return;
    await api.post(`/businesses/${selectedBusinessId}/keywords`, { keyword: newKeyword });
    setNewKeyword('');
    await fetchKeywords();
  };

  const handleRefresh = async () => {
    if (!selectedKeyword) return;
    setMessage('Refreshing rank data...');
    await api.post(
      `/businesses/${selectedBusinessId}/keywords/${selectedKeyword.id}/refresh`
    );
    setTimeout(async () => {
      await fetchRankings(selectedKeyword);
      setMessage('Ranking data refreshed.');
    }, 1500);
  };

  const chartData = useMemo(() => {
    if (!rankings.length) return null;
    return {
      labels: rankings.map((entry) => formatDate(entry.checked_at)),
      datasets: [
        {
          label: 'Rank position',
          data: rankings.map((entry) => entry.rank),
          borderColor: '#4c9a8b',
          backgroundColor: 'rgba(76, 154, 139, 0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  }, [rankings]);

  if (!selectedBusinessId) {
    return (
      <NoBusiness
        title="Track your Nairobi keywords"
        description="Select a business to add and monitor local search terms."
      />
    );
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Keyword tracker</h3>
            <p>Monitor Nairobi search queries and ranking movement.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={handleAddKeyword}>
          <input
            value={newKeyword}
            onChange={(event) => setNewKeyword(event.target.value)}
            placeholder="e.g. best coffee shop westlands"
          />
          <button className="primary-button" type="submit">
            Add keyword
          </button>
        </form>
        <div className="table">
          <div className="table-row table-header">
            <span>Keyword</span>
            <span>Last rank</span>
            <span>Added</span>
          </div>
          {keywords.length ? (
            keywords.map((keyword) => (
              <button
                type="button"
                key={keyword.id}
                className={`table-row ${selectedKeyword?.id === keyword.id ? 'active' : ''}`}
                onClick={() => setSelectedKeyword(keyword)}
              >
                <span>{keyword.keyword}</span>
                <span>{keyword.last_rank || '-'}</span>
                <span>{formatDate(keyword.created_at)}</span>
              </button>
            ))
          ) : (
            <div className="empty-state">Add keywords to start tracking rankings.</div>
          )}
        </div>
      </section>

      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h3>Ranking trend</h3>
            <p>{selectedKeyword ? selectedKeyword.keyword : 'Select a keyword'}</p>
          </div>
          <button className="secondary-button" onClick={handleRefresh} type="button">
            Refresh ranking
          </button>
        </div>
        {message && <div className="info-banner">{message}</div>}
        {chartData ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { reverse: true, title: { display: true, text: 'Rank position' } }
              }
            }}
          />
        ) : (
          <div className="empty-state">No ranking history yet.</div>
        )}
      </section>
    </div>
  );
};

export default Keywords;
