import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

interface NavigationProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeCategory, onCategoryChange }) => {
  const categories = ['PIZZAS', 'EMPANADAS', 'SANDWICH', 'BEBESTIBLES'];

  return (
    <div style={{ backgroundColor: '#000000' }} className="py-2">
      <Container fluid className="px-2">
        <Row className="g-2">
          {categories.map((category) => (
            <Col xs={3} key={category} className="text-center px-1">
              <button 
                className={`nav-button w-100 py-2 text-white fw-semibold ${activeCategory === category ? 'active' : ''}`}
                style={{ 
                  backgroundColor: activeCategory === category ? '#0B6E4F' : '#000000',
                  border: 'none',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => onCategoryChange(category)}
                onMouseEnter={(e) => {
                  if (activeCategory !== category) {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== category) {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }
                }}
              >
                {category}
              </button>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default Navigation; 