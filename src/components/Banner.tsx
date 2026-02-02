import React from 'react';
import { Container } from 'react-bootstrap';

const Banner: React.FC = () => {
  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="banner-hero position-relative overflow-hidden"
      style={{
        height: '70vh',
        minHeight: '420px',
        maxHeight: '640px',
      }}
    >
      {/* Background con parallax sutil */}
      <div
        className="position-absolute w-100 h-100 banner-hero-bg"
        style={{
          backgroundImage: 'url(/images/banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          transform: 'scale(1.05)',
        }}
      />
      {/* Degradado cálido (negro + toque crema/dorado) */}
      <div
        className="position-absolute w-100 h-100 top-0 start-0"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.85) 0%, rgba(26,26,26,0.6) 50%, rgba(255,248,225,0.08) 100%)',
        }}
      />
      {/* Contenido */}
      <Container
        className="h-100 d-flex align-items-center justify-content-center position-relative"
        style={{ zIndex: 1 }}
      >
        <div className="text-center text-white">
          <h1
            className="fw-bold mb-3 animate-hero-in montenegros-logo-text"
            style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              textShadow: '2px 4px 12px rgba(0,0,0,0.5)',
              lineHeight: '1.1',
              letterSpacing: '0.02em',
              animationDelay: '0.1s',
            }}
          >
            Montenegro's Pizza
          </h1>
          <p
            className="mb-4 animate-hero-in"
            style={{
              fontSize: 'clamp(1.15rem, 2.5vw, 1.6rem)',
              textShadow: '1px 2px 6px rgba(0,0,0,0.5)',
              color: 'rgba(255,248,225,0.95)',
              animationDelay: '0.2s',
              animationFillMode: 'forwards',
            }}
          >
            La auténtica pizza artesanal, hecha con amor
          </p>
          <div className="animate-hero-in" style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}>
            <button
              onClick={scrollToMenu}
              className="btn-hero-cta px-5 py-3 rounded-pill fw-semibold border-0"
              style={{
                backgroundColor: '#00C853',
                color: '#1a1a1a',
                fontSize: '1.15rem',
                boxShadow: '0 4px 14px rgba(0,200,83,0.4)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,200,83,0.5)';
                e.currentTarget.style.backgroundColor = '#00E676';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,200,83,0.4)';
                e.currentTarget.style.backgroundColor = '#00C853';
              }}
            >
              Hacer Pedido
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Banner;
