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
      className="banner-container position-relative"
      style={{
        height: '60vh',
        minHeight: '400px',
        maxHeight: '600px',
        overflow: 'hidden'
      }}
    >
      {/* Background Image with Blur */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          backgroundImage: 'url(/images/banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(3px)',
          transform: 'scale(1.1)'
        }}
      />
      
      {/* Dark Overlay */}
      <div 
        className="position-absolute w-100 h-100 top-0 start-0"
        style={{
          background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))'
        }}
      />
      
      {/* Content */}
      <Container className="h-100 d-flex align-items-center justify-content-center position-relative" style={{ zIndex: 1 }}>
        <div className="text-center text-white animate-fade-in">
          <h1 
            className="fw-bold mb-3"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              lineHeight: '1.2'
            }}
          >
            Las Mejores Pizzas
          </h1>
          <p 
            className="mb-4"
            style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
              textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
            }}
          >
            ¡Hechas con amor!
          </p>
          <button
            onClick={scrollToMenu}
            className="btn px-5 py-3 rounded-pill fw-semibold"
            style={{
              backgroundColor: '#FF0000',
              color: 'white',
              border: 'none',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#cc0000';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FF0000';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Ver Menú
          </button>
        </div>
      </Container>
    </div>
  );
};

export default Banner; 