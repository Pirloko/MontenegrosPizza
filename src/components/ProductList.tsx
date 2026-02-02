import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { ShoppingCart } from 'lucide-react';
import ProductModalSupabase from './ProductModalSupabase';
import { useInView } from '../hooks/useInView';
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
  const { ref: sectionRef, inView: sectionInView } = useInView();

  const currentCategory = categories.find(cat => cat.name === categoryName);
  const filteredProducts = currentCategory
    ? products.filter(product => product.category_id === currentCategory.id)
    : [];

  return (
    <div id="menu" className="bg-brand-gray-light py-5 py-md-6" ref={sectionRef}>
      <Container className="px-4">
        <h2
          className={`fw-bold mb-5 text-brand-black animate-in-view ${sectionInView ? 'is-visible' : ''}`}
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-display)',
          }}
        >
          {categoryName}
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-brand-gray-muted">No hay productos disponibles en esta categoría</p>
            {!currentCategory && (
              <p className="text-brand-gray-muted small">Categoría "{categoryName}" no encontrada</p>
            )}
          </div>
        ) : (
          <div
            className="product-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                className="product-card-modern bg-white overflow-hidden border-0 shadow-sm position-relative"
                style={{
                  borderRadius: '1rem',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  animation: 'cardFadeInUp 0.5s ease-out both',
                  animationDelay: `${Math.min(index * 0.08, 0.6)}s`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                }}
              >
                {/* Imagen con hover: zoom + overlay */}
                <div
                  className="product-card-image-wrapper position-relative overflow-hidden"
                  style={{ width: '100%', height: '200px', cursor: 'pointer' }}
                  onClick={() => setSelectedProduct(product)}
                >
                  <img
                    src={product.image_url || '/images/logo.jpeg'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="product-card-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      transition: 'transform 0.35s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/logo.jpeg';
                    }}
                  />
                  {/* Overlay oscuro en hover */}
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100 opacity-0 product-card-overlay"
                    style={{
                      background: 'linear-gradient(to top, rgba(26,26,26,0.5) 0%, transparent 50%)',
                      transition: 'opacity 0.25s ease',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* Badge vegetariano */}
                  {product.is_vegetarian && (
                    <div
                      className="position-absolute top-2 end-2 px-2 py-1 rounded-pill text-white small fw-semibold"
                      style={{
                        backgroundColor: '#00C853',
                        fontSize: '0.75rem',
                        zIndex: 2,
                      }}
                    >
                      🌱 Vegetariano
                    </div>
                  )}
                  {/* Badge precio: degradado verde */}
                  <div
                    className="position-absolute bottom-2 start-2 px-3 py-2 rounded-3 text-dark fw-bold shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #00C853 0%, #00A843 100%)',
                      color: '#1a1a1a',
                      fontSize: '1rem',
                      zIndex: 2,
                      boxShadow: '0 2px 8px rgba(0,200,83,0.35)',
                    }}
                  >
                    ${Number(product.price).toLocaleString('es-CL')}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 d-flex flex-column flex-grow-1">
                  <h3
                    className="fw-bold mb-2 text-brand-black"
                    style={{ fontSize: '1.25rem', lineHeight: '1.3' }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-brand-gray-muted mb-3 line-clamp-2 flex-grow-1"
                    style={{ fontSize: '0.9rem', lineHeight: '1.5', minHeight: '2.7rem' }}
                  >
                    {product.description}
                  </p>
                  <div className="mt-auto">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-100 py-2 px-3 rounded-3 d-flex align-items-center justify-content-center gap-2 text-dark fw-semibold border-0"
                      style={{
                        background: 'linear-gradient(135deg, #00C853 0%, #00A843 100%)',
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,200,83,0.25)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,200,83,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,200,83,0.25)';
                      }}
                    >
                      <ShoppingCart size={18} />
                      Añadir
                    </button>
                  </div>
                </div>
              </article>
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
