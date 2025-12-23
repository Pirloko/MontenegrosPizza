import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import ProductModalSupabase from './ProductModalSupabase';
import { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductListProps {
  products: Product[];
  categories: Category[];
  categoryName: string;
  onAddToCart: (product: Product, customizations: any) => void;
}

export default function ProductList({ products, categories, categoryName, onAddToCart }: ProductListProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Encontrar la categoría por nombre
  const currentCategory = categories.find(cat => cat.name === categoryName);
  
  // Filtrar productos por category_id
  const filteredProducts = currentCategory 
    ? products.filter(product => product.category_id === currentCategory.id)
    : [];

  return (
    <div id="menu" className="bg-white py-5">
      <Container className="px-4">
        {/* Título de la categoría */}
        <h2 
          className="fw-bold mb-5 text-dark"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '0.5px'
          }}
        >
          {categoryName}
        </h2>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No hay productos disponibles en esta categoría</p>
            {!currentCategory && (
              <p className="text-muted small">Categoría "{categoryName}" no encontrada</p>
            )}
          </div>
        ) : (
          <div 
            className="product-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in"
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Imagen del producto */}
                <div className="position-relative" style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                  <img
                    src={product.image_url || '/images/logo.jpeg'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    onError={(e) => {
                      // Fallback si la imagen falla
                      (e.target as HTMLImageElement).src = '/images/logo.jpeg';
                    }}
                  />
                  {/* Tag Vegetariano */}
                  {product.is_vegetarian && (
                    <div
                      className="position-absolute top-2 right-2 px-2 py-1 rounded"
                      style={{
                        backgroundColor: '#0B6E4F',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        zIndex: 1
                      }}
                    >
                      🌱 Vegetariano
                    </div>
                  )}
                </div>

                {/* Contenido del card */}
                <div className="p-4 d-flex flex-column flex-grow-1">
                  {/* Nombre del producto */}
                  <h3 
                    className="fw-bold mb-2 text-dark"
                    style={{
                      fontSize: '1.25rem',
                      lineHeight: '1.3'
                    }}
                  >
                    {product.name}
                  </h3>
                  
                  {/* Descripción */}
                  <p 
                    className="text-muted mb-3 line-clamp-2 flex-grow-1"
                    style={{
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      minHeight: '2.7rem'
                    }}
                  >
                    {product.description}
                  </p>

                  {/* Precio y botón */}
                  <div className="mt-auto">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-100 py-2 px-3 rounded d-flex align-items-center justify-content-between text-white fw-semibold border-0"
                      style={{
                        backgroundColor: '#0B6E4F',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#095a41';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0B6E4F';
                      }}
                    >
                      <span className="d-flex align-items-center">
                        <ShoppingCart size={18} className="me-2" />
                        Añadir
                      </span>
                      <span>${product.price.toLocaleString('es-CL')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {selectedProduct && (
        <ProductModalSupabase
          show={!!selectedProduct}
          onHide={() => setSelectedProduct(null)}
          product={selectedProduct}
          onAddToCart={onAddToCart}
          categories={categories}
        />
      )}
    </div>
  );
}