import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

interface PizzaProps {
  name: string;
  description: string;
  price: number;
  image: string;
  isVegetarian?: boolean;
}

interface PizzaCardProps extends PizzaProps {
  onAddToCart: () => void;
}

const PizzaCard: React.FC<PizzaCardProps> = ({ name, description, price, image, isVegetarian, onAddToCart }) => {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Img 
        variant="top" 
        src={image} 
        style={{ 
          height: '180px',
          objectFit: 'cover',
          '@media (max-width: 576px)': {
            height: '150px'
          }
        }} 
      />
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h6 fw-bold mb-0">{name}</Card.Title>
          {isVegetarian && (
            <span className="text-success">🌱</span>
          )}
        </div>
        <Card.Text className="text-muted small mb-3">{description}</Card.Text>
        <Button
          variant="success"
          className="mt-auto w-100 py-2"
          style={{ backgroundColor: '#0B6E4F', border: 'none' }}
          onClick={onAddToCart}
        >
          FAMILIAR: ${price.toLocaleString()}
        </Button>
      </Card.Body>
    </Card>
  );
};

interface PizzaSectionProps {
  onAddToCart: () => void;
}

const PizzaSection: React.FC<PizzaSectionProps> = ({ onAddToCart }) => {
  const pizzas: PizzaProps[] = [
    {
      name: 'CHURRASQUITO',
      description: 'Pizza con Churrasco, Queso Mozzarella, Tomate y Salsa Palta.',
      price: 16900,
      image: '/pizzas/churrasquito.jpg'
    },
    {
      name: 'CHURRASCO LUCO',
      description: 'Pizza con sabrosa carne de churrasco, queso Mozzarella y...',
      price: 12990,
      image: '/pizzas/churrasco-luco.jpg'
    },
    {
      name: 'GARLIC FUGAZZA',
      description: 'Salsa garlic parmesan de base, extra cebolla fresca, queso...',
      price: 13600,
      image: '/pizzas/garlic-fugazza.jpg',
      isVegetarian: true
    }
  ];

  return (
    <Container fluid className="px-3 py-4">
      <h2 className="h3 fw-bold mb-4">PIZZAS</h2>
      
      {/* Banners especiales */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6}>
          <Card 
            className="h-100 border-0" 
            style={{ backgroundColor: '#FFD54F' }}
          >
            <Card.Body className="d-flex justify-content-between align-items-center p-3">
              <div>
                <h3 className="h5 fw-bold mb-0">Arma tu</h3>
                <h2 className="h2 fw-bold mb-0" style={{ color: '#0B6E4F' }}>PIZZA</h2>
              </div>
              <img 
                src="/pizzas/custom-pizza.png" 
                alt="Arma tu pizza" 
                className="custom-banner-image"
                style={{ 
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover'
                }} 
              />
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} md={6}>
          <Card 
            className="h-100 border-0 position-relative overflow-hidden" 
            style={{ backgroundColor: '#8FBC94' }}
          >
            {/* Imagen de fondo con overlay */}
            <div 
              className="position-absolute w-100 h-100"
              style={{
                backgroundImage: 'url(/images/Pizza_mitades.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: '0.2',
                filter: 'blur(1px)'
              }}
            />
            
            <Card.Body className="d-flex justify-content-between align-items-center p-3 position-relative">
              <div className="banner-text">
                <h3 className="h5 fw-bold mb-0">Pizza por</h3>
                <h2 className="h2 fw-bold mb-0" style={{ color: '#D6FF00' }}>MITADES</h2>
              </div>
              <div className="banner-image-container">
                <img 
                  src="/pizzas/half-pizza.png" 
                  alt="Pizza por mitades" 
                  className="w-100 h-100 custom-banner-image"
                  style={{ 
                    objectFit: 'contain',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                  }} 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de pizzas */}
      <Row className="g-3">
        {pizzas.map((pizza) => (
          <Col key={pizza.name} xs={12} sm={6} lg={4}>
            <PizzaCard {...pizza} onAddToCart={onAddToCart} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default PizzaSection; 