import React from 'react';
import './UnderDevelopmentPage.scss';

const UnderDevelopmentPage: React.FC = () => {
  return (
    <div className="under-development-page">
      <div className="under-development-content">
        <div className="icon">🚧</div>
        <h1>დამუშავების პროცესში</h1>
        <p>ეს ფუნქცია ამჟამად დამუშავების პროცესშია და მალე ხელმისაწვდომი იქნება.</p>
      </div>
    </div>
  );
};

export default UnderDevelopmentPage;