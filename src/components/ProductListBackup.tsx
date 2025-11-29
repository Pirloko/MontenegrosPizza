import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import ProductModal from './ProductModal';
import { products } from '../data/products';
import { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductListProps {
  products: Product[];
  categoryName: string;
  onAddToCart: (product: Product, customizations: any) => void;
}

interface ProductCustomization {
  quantity: number;
  removedIngredients: string[];
  addedIngredients: any[];
  specialInstructions: string;
}

export default function ProductListBackup({ products, categoryName, onAddToCart }: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Filtrar productos por categoría (usando el sistema anterior)
  const filteredProducts = products.filter(product => {
    const categoryMap: { [key: string]: string } = {
      'PIZZAS': 'PIZZAS',
      'EMPANADAS': 'EMPANADAS', 
      'SANDWICH': 'SANDWICH',
      'BEBESTIBLES': 'BEBESTIBLES'
    };
    return product.category === categoryMap[categoryName];
  });

  return (
    <Container fluid className="px-3 py-4">
      <h2 className="h3 fw-bold mb-4">{categoryName}</h2>
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No hay productos disponibles en esta categoría</p>
        </div>
      ) : (
        <Row className="g-3">
          {filteredProducts.map((product) => (
            <Col key={product.id} xs={12} sm={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Img 
                  variant="top" 
                  src={product.image || '/images/logo.jpeg'} 
                  style={{ 
                    height: '180px',
                    objectFit: 'cover'
                  }} 
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6 fw-bold mb-0">{product.name}</Card.Title>
                    {product.isVegetarian && (
                      <Badge bg="success" className="ms-2">🌱 Vegetariano</Badge>
                    )}
                  </div>
                  <Card.Text className="text-muted small mb-3">
                    {product.description}
                  </Card.Text>
                  <Button
                    variant="success"
                    className="mt-auto w-100 py-2 d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: '#0B6E4F', border: 'none' }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <span>Añadir al carrito</span>
                    <span>${product.price.toLocaleString()}</span>
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {selectedProduct && (
        <ProductModal
          show={!!selectedProduct}
          onHide={() => setSelectedProduct(null)}
          product={selectedProduct}
          onAddToCart={onAddToCart}
        />
      )}
    </Container>
  );
}
