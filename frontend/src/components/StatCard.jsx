import React from 'react';

const StatCard = ({ title, value, subtitle, accent }) => (
  <div className={`stat-card ${accent || ''}`}>
    <div>
      <h4>{title}</h4>
      <p className="stat-value">{value}</p>
    </div>
    {subtitle && <span>{subtitle}</span>}
  </div>
);

export default StatCard;
