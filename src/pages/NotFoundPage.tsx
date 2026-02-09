import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>გვერდი არ მოიძებნა</h2>
        <p>გვერდი, რომელსაც ეძებთ, არ არსებობს ან გადატანილია.</p>
        <button onClick={() => navigate('/')} className="btn-home">
          მთავარი გვერდი
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;