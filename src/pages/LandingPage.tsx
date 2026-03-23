import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <div className="logo">
            <h1>MLAgro</h1>
          </div>
          <nav className="landing-nav">
            <a href="#features">შესაძლებლობები</a>
            <a href="#about">ჩვენ შესახებ</a>
            <a href="#pricing">ფასები</a>
            <a href="#contact">კონტაქტი</a>
          </nav>
          <div className="auth-buttons">
            <button onClick={() => navigate('/login')} className="btn-login">
              შესვლა
            </button>
            <button onClick={() => navigate('/register')} className="btn-register">
              რეგისტრაცია
            </button>
          </div>
        </div>
      </header>



      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2>ჭკვიანი სოფლის მეურნეობის მართვის პლატფორმა</h2>
            <p>
              გარდაქმენით თქვენი ფერმერული ოპერაციები თანამედროვე სატელიტური
              მონიტორინგით, ამინდის ანალიტიკით და მინდვრების მართვის ინსტრუმენტებით.
            </p>
            <div className="hero-actions">
              <button onClick={() => navigate('/register')} className="btn-primary">
                უფასო ვერსიის დაწყება
              </button>
              <button className="btn-secondary">დემო ვერსია</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="placeholder-image">აგრო პანელი</div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h3>ძირითადი შესაძლებლობები</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛰️</div>
              <h4>სატელიტური მონიტორინგი</h4>
              <p>რეალურ დროში სატელიტური სურათები და მცენარეულობის ინდექსები თქვენი მინდვრებისთვის</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌦️</div>
              <h4>ამინდის ანალიტიკა</h4>
              <p>ზუსტი ამინდის პროგნოზი და ისტორიული მონაცემების ანალიზი</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h4>მინდვრების რუკები</h4>
              <p>ციფრული რუკები ზუსტი საზღვრებით და კულტურების ინფორმაციით</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>მონაცემთა ანალიტიკა</h4>
              <p>ყოვლისმომცველი ანგარიშები უკეთესი გადაწყვეტილებების მისაღებად</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h4>გუნდის მართვა</h4>
              <p>ითანამშრომლეთ გუნდთან და მართეთ ამოცანები ეფექტურად</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h4>მობილური წვდომა</h4>
              <p>მიიღეთ წვდომა მონაცემებზე ნებისმიერი ადგილიდან და მოწყობილობიდან</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 MLAgro. ყველა უფლება დაცულია.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;