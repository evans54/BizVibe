import React from 'react';
import { useBusiness } from '../context/BusinessContext';

const TopBar = () => {
  const { businesses, selectedBusinessId, setSelectedBusinessId } = useBusiness();

  return (
    <header className="topbar">
      <div>
        <h2>Welcome back</h2>
        <p>Track Nairobi visibility, reviews, and local momentum in one place.</p>
      </div>
      <div className="topbar-actions">
        <div className="select-wrapper">
          <label htmlFor="business-select">Business</label>
          <select
            id="business-select"
            value={selectedBusinessId || ''}
            onChange={(event) => setSelectedBusinessId(event.target.value)}
          >
            <option value="">Select business</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
