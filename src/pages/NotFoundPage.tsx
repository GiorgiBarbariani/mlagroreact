import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <button onClick={() => navigate('/')} className="btn-home">
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;