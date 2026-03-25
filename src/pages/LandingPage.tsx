import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import './LandingPage.scss';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="logo">
            <Leaf size={28} color="#4CAF50" />
            <span className="logo-text">MLAgro</span>
          </div>
          <nav className={`landing-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#hero" onClick={(e) => handleNavClick(e, 'hero')}>მთავარი</a>
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>შესაძლებლობები</a>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')}>ჩვენ შესახებ</a>
            <a href="#partners" onClick={(e) => handleNavClick(e, 'partners')}>პარტნიორები</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')}>კონტაქტი</a>
          </nav>
          <div className="auth-buttons">
            <button onClick={() => navigate('/login')} className="btn-login">შესვლა</button>
            <button onClick={() => navigate('/register')} className="btn-register">რეგისტრაცია</button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>





      {/* Hero */}
      <section id="hero" className="hero">
        <div className="hero-bg">
          <div className="hero-overlay"></div>
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">სოფლის მეურნეობის მომავალი</div>
            <h1>ჭკვიანი აგრო მართვის პლატფორმა</h1>
            <p>
              სატელიტური მონიტორინგი, ამინდის ანალიტიკა, მინდვრების მართვა
              და გუნდური კომუნიკაცია — ერთ სივრცეში.
            </p>
            <div className="hero-actions">
              <button onClick={() => navigate('/register')} className="btn-primary">
                უფასოდ დაწყება
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button onClick={() => navigate('/login')} className="btn-ghost">დემო ვერსია</button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">მინდორი</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">ფერმერი</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">ჰექტარი</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">შესაძლებლობები</span>
            <h2>ყველაფერი რაც გჭირდებათ თქვენი ფერმის მართვისთვის</h2>
            <p>თანამედროვე ტექნოლოგიები ქართული სოფლის მეურნეობისთვის</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3>სატელიტური მონიტორინგი</h3>
              <p>Sentinel-2 სატელიტური გამოსახულებები და NDVI, MSAVI, NDMI ინდექსები რეალურ დროში</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.05-6.95L16.24 7.76m-8.49 8.49-1.41 1.41M7.76 7.76 6.34 6.34m8.49 8.49 1.42 1.42"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              </div>
              <h3>ამინდის ანალიტიკა</h3>
              <p>FieldClimate მეტეოსადგურების ინტეგრაცია, 7-დღიანი პროგნოზი და კლიმატური ნორმები</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
              </div>
              <h3>ინტერაქტიული რუკები</h3>
              <p>კადასტრალური ინტეგრაცია, პოლიგონების ხატვა, ფართობის ავტომატური გამოთვლა</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>გუნდის მართვა</h3>
              <p>თანამშრომლების მართვა, real-time ჩატი, დავალებების სისტემა და პროგრესის თვალყურის დევნება</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>მონაცემთა ანალიტიკა</h3>
              <p>მინდვრების სტატისტიკა, კულტურების ისტორია, CSV ექსპორტი და ვიზუალური დაშბორდი</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>
                </svg>
              </div>
              <h3>მობილური აპლიკაცია</h3>
              <p>წვდომა ყველა ფუნქციაზე ნებისმიერი მოწყობილობიდან — მინდორშიც და ოფისშიც</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-visual">
              <div className="about-card glass-card">
                <div className="about-card-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h4>საიმედო პლატფორმა</h4>
                <p>შექმნილი ქართული აგროსექტორისთვის</p>
              </div>
              <div className="about-card glass-card offset">
                <div className="about-card-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="1.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h4>Sentinel-2 მონაცემები</h4>
                <p>ევროპული კოსმოსური სააგენტოს სატელიტები</p>
              </div>
            </div>
            <div className="about-content">
              <span className="section-tag">ჩვენ შესახებ</span>
              <h2>ვინ ვართ ჩვენ</h2>
              <p className="about-lead">
                MLAgro არის ქართული აგროტექნოლოგიური პლატფორმა, რომელიც ეხმარება
                ფერმერებს და აგრო-კომპანიებს თანამედროვე ტექნოლოგიების გამოყენებაში.
              </p>
              <div className="about-points">
                <div className="about-point">
                  <div className="point-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <strong>ქართული კადასტრის ინტეგრაცია</strong>
                    <p>NAPR საკადასტრო სისტემასთან პირდაპირი კავშირი</p>
                  </div>
                </div>
                <div className="about-point">
                  <div className="point-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <strong>ლოკალური მეტეო მონაცემები</strong>
                    <p>FieldClimate სადგურების ქსელი საქართველოს მასშტაბით</p>
                  </div>
                </div>
                <div className="about-point">
                  <div className="point-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <strong>ხელმისაწვდომი ფასები</strong>
                    <p>5 ₾ / ჰექტარზე / თვეში — გადაიხადეთ მხოლოდ იმაში რასაც იყენებთ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="partners">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">პარტნიორები</span>
            <h2>თანამშრომელი ორგანიზაციები</h2>
            <p>ჩვენ ვთანამშრომლობთ წამყვან ორგანიზაციებთან ქართული სოფლის მეურნეობის განვითარებისთვის</p>
          </div>
          <div className="partners-grid">
            <div className="partner-card glass-card">
              <div className="partner-logo">ESA</div>
              <span>European Space Agency</span>
            </div>
            <div className="partner-card glass-card">
              <div className="partner-logo">NAPR</div>
              <span>საჯარო რეესტრი</span>
            </div>
            <div className="partner-card glass-card">
              <div className="partner-logo">FC</div>
              <span>FieldClimate</span>
            </div>
            <div className="partner-card glass-card">
              <div className="partner-logo">BOG</div>
              <span>საქართველოს ბანკი</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="section-tag">კონტაქტი</span>
              <h2>დაგვიკავშირდით</h2>
              <p>გაქვთ შეკითხვები? გამოგვიგზავნეთ შეტყობინება და ჩვენ დაგიკავშირდებით უმოკლეს ვადაში.</p>
              <div className="contact-details">
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>mlmindbusiness@gmail.com</span>
                </div>
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>+995 599239551</span>
                </div>
                <div className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>თბილისი, საქართველო</span>
                </div>
              </div>
            </div>
            <form className="contact-form glass-card" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="name">სახელი</label>
                <input type="text" id="name" placeholder="თქვენი სახელი" />
              </div>
              <div className="form-group">
                <label htmlFor="email">ელ.ფოსტა</label>
                <input type="email" id="email" placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label htmlFor="message">შეტყობინება</label>
                <textarea id="message" rows={4} placeholder="დაწერეთ შეტყობინება..."></textarea>
              </div>
              <button type="submit" className="btn-primary">გაგზავნა</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <Leaf size={24} color="rgba(255,255,255,0.9)" />
                <span className="logo-text">MLAgro</span>
              </div>
              <p>ჭკვიანი სოფლის მეურნეობის მართვის პლატფორმა საქართველოსთვის</p>
            </div>
            <div className="footer-links">
              <h4>პლატფორმა</h4>
              <a href="#features">შესაძლებლობები</a>
              <a href="#about">ჩვენ შესახებ</a>
              <a href="#contact">კონტაქტი</a>
            </div>
            <div className="footer-links">
              <h4>ანგარიში</h4>
              <a onClick={() => navigate('/login')}>შესვლა</a>
              <a onClick={() => navigate('/register')}>რეგისტრაცია</a>
              <a onClick={() => navigate('/terms')}>წესები და პირობები</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 MLAgro. ყველა უფლება დაცულია.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
