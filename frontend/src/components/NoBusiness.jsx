import React from 'react';

const NoBusiness = ({ title, description }) => (
  <div className="page-grid">
    <section className="panel">
      <h3>{title || 'Select a business workspace'}</h3>
      <p>{description || 'Choose or create a business profile to unlock this view.'}</p>
    </section>
  </div>
);

export default NoBusiness;
