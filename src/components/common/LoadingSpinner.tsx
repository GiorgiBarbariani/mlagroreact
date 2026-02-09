import React from 'react';
import './LoadingSpinner.scss';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>იტვირთება...</p>
      </div>
    </div>
  );
};