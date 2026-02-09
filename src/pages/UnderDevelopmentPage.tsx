import React from 'react';
import './UnderDevelopmentPage.scss';

const UnderDevelopmentPage: React.FC = () => {
  return (
    <div className="under-development-page">
      <div className="under-development-content">
        <div className="icon">🚧</div>
        <h1>Under Development</h1>
        <p>This feature is currently being developed and will be available soon.</p>
      </div>
    </div>
  );
};

export default UnderDevelopmentPage;