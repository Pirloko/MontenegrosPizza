import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Database } from '../types/database';
import { ingredientService } from '../services/ingredientService';
import { categoryService } from '../services/categoryService';

type Product = Database['public']['Tables']['products']['Row'];
type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  product: Product;
  onAddToCart: (product: Product, customizations: ProductCustomization) => void;
  categories?: Category[];
}

interface ProductCustomization {
  quantity: number;
  removedIngredients: string[];
  addedIngredients: ExtraIngredient[];
  specialInstructions: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ show, onHide, product, onAddToCart, categories = [] }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedIngredients, setAddedIngredients] = useState<ExtraIngredient[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<ExtraIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [productCategory, setProductCategory] = useState<Category | null>(null);

  const isBeverage = () => {
    if (!productCategory) return false;
    return productCategory.name?.toUpperCase().includes('BEBESTIBLES') || false;
  };

  useEffect(() => {
    if (show) {
      const loadCategory = async () => {
        if (product.category_id) {
          if (categories.length > 0) {
            const category = categories.find(cat => cat.id === product.category_id);
            if (category) {
              setProductCategory(category);
              return;
            }
          }
          try {
            const category = await categoryService.getById(product.category_id);
            setProductCategory(category);
          } catch (error) {
            console.error('Error loading category:', error);
          }
        }
      };
      loadCategory();
    } else {
      setProductCategory(null);
      setAvailableIngredients([]);
    }
  }, [show, product.category_id, categories]);

  useEffect(() => {
    if (show && productCategory) {
      const categoryName = productCategory.name?.toUpperCase() || '';
      if (!categoryName.includes('BEBESTIBLES')) loadIngredients();
    }
  }, [show, productCategory]);

  const loadIngredients = async () => {
    try {
      setLoadingIngredients(true);
      const ingredients = await ingredientService.getAll();
      setAvailableIngredients(ingredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const toggleIngredient = (ingredient: ExtraIngredient) => {
    if (addedIngredients.some(ing => ing.id === ingredient.id)) {
      setAddedIngredients(addedIngredients.filter(ing => ing.id !== ingredient.id));
    } else {
      setAddedIngredients([...addedIngredients, ingredient]);
    }
  };

  const calculateExtraCost = () =>
    addedIngredients.reduce((total, ing) => total + (Number(ing.price) || 0), 0);

  const calculateTotal = () => {
    const basePrice = Number(product.price) || 0;
    return (basePrice + calculateExtraCost()) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, {
      quantity,
      removedIngredients,
      addedIngredients,
      specialInstructions,
    });
    onHide();
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedIngredients([]);
    setSpecialInstructions('');
    setProductCategory(null);
    setAvailableIngredients([]);
  };

  const handleClose = () => {
    onHide();
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedIngredients([]);
    setSpecialInstructions('');
    setProductCategory(null);
    setAvailableIngredients([]);
  };

  const basePrice = Number(product.price) || 0;
  const isBev = isBeverage();

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      contentClassName="border-0 modal-product-custom overflow-hidden"
      style={{ borderRadius: '1.25rem' }}
    >
      {/* Header prominente con imagen grande */}
      <div
        className="modal-header-custom position-relative"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          padding: 0,
          color: 'white',
          minHeight: '220px',
        }}
      >
        {/* Imagen del producto en tamaño grande */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 opacity-30"
          style={{
            backgroundImage: `url(${product.image_url || '/images/logo.jpeg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(26,26,26,0.7) 60%, rgba(26,26,26,0.95) 100%)',
          }}
        />
        <div className="position-relative d-flex align-items-end p-4 pb-3" style={{ minHeight: '220px', zIndex: 1 }}>
          <div className="flex-grow-1 pe-5">
            <h2
              className="mb-1 fw-bold"
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                fontFamily: 'Georgia, Cambria, serif',
              }}
            >
              {product.name}
            </h2>
            <p className="mb-0 small opacity-90" style={{ fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="btn-close-modal position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center rounded-circle border-0"
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Precio base */}
        <div className="mb-4 pb-3" style={{ borderBottom: '1px solid #eee' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Precio base</span>
            <span className="fw-bold fs-5 text-brand-black">
              ${basePrice.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        {/* Cantidad */}
        <div className="mb-4">
          <label className="form-label fw-semibold mb-2" style={{ color: '#1a1a1a', fontSize: '1rem' }}>
            Cantidad
          </label>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="btn-qty rounded-3 border d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderColor: '#e0e0e0 !important',
                background: '#FFF8E1',
                color: '#424242',
                transition: 'all 0.2s ease',
              }}
            >
              <Minus size={18} />
            </button>
            <div
              className="rounded-3 d-flex align-items-center justify-content-center fw-bold"
              style={{
                minWidth: '56px',
                height: '44px',
                background: '#F5F5F5',
                border: '1px solid #e0e0e0',
                fontSize: '1.1rem',
                color: '#1a1a1a',
              }}
            >
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="btn-qty rounded-3 border d-flex align-items-center justify-content-center"
              style={{
                width: '44px',
                height: '44px',
                borderColor: '#e0e0e0 !important',
                background: '#FFF8E1',
                color: '#424242',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="section-divider" />

        {/* Ingredientes Extra */}
        {!isBev && (
          <>
            <div className="mb-4">
              <label className="form-label fw-semibold mb-3" style={{ color: '#1a1a1a', fontSize: '1rem' }}>
                Ingredientes Extra
              </label>
              {loadingIngredients ? (
                <div className="text-center py-3">
                  <Spinner size="sm" />
                  <span className="ms-2 text-muted">Cargando...</span>
                </div>
              ) : (
                <>
                  {availableIngredients.filter(ing => ing.category === 'basic' && ing.is_available).length > 0 && (
                    <div className="mb-4">
                      <h6 className="mb-2 fw-semibold" style={{ color: '#424242', fontSize: '0.9rem' }}>
                        Básicos
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {availableIngredients
                          .filter(ing => ing.category === 'basic' && ing.is_available)
                          .map((ingredient) => {
                            const isSelected = addedIngredients.some(ing => ing.id === ingredient.id);
                            return (
                              <label
                                key={ingredient.id}
                                className="ingredient-chip mb-0 rounded-3 border d-flex align-items-center gap-2 px-3 py-2"
                                style={{
                                  cursor: 'pointer',
                                  borderWidth: '2px',
                                  borderColor: isSelected ? '#00C853' : '#e0e0e0',
                                  background: isSelected ? 'rgba(0,200,83,0.08)' : '#fff',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleIngredient(ingredient)}
                                  className="d-none"
                                />
                                <span
                                  className="rounded-circle d-inline-block"
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid ' + (isSelected ? '#00C853' : '#bdbdbd'),
                                    background: isSelected ? '#00C853' : 'transparent',
                                    transition: 'all 0.2s ease',
                                  }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1a1a1a' }}>
                                  {ingredient.name}
                                </span>
                                <span className="fw-semibold small" style={{ color: '#00C853' }}>
                                  +${(Number(ingredient.price) || 0).toLocaleString('es-CL')}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {availableIngredients.filter(ing => ing.category === 'premium' && ing.is_available).length > 0 && (
                    <div>
                      <h6 className="mb-2 fw-semibold" style={{ color: '#424242', fontSize: '0.9rem' }}>
                        Premium
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {availableIngredients
                          .filter(ing => ing.category === 'premium' && ing.is_available)
                          .map((ingredient) => {
                            const isSelected = addedIngredients.some(ing => ing.id === ingredient.id);
                            return (
                              <label
                                key={ingredient.id}
                                className="ingredient-chip mb-0 rounded-3 border d-flex align-items-center gap-2 px-3 py-2"
                                style={{
                                  cursor: 'pointer',
                                  borderWidth: '2px',
                                  borderColor: isSelected ? '#FFD54F' : '#e0e0e0',
                                  background: isSelected ? 'rgba(255,213,79,0.12)' : '#fff',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleIngredient(ingredient)}
                                  className="d-none"
                                />
                                <span
                                  className="rounded-circle d-inline-block"
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    border: '2px solid ' + (isSelected ? '#FFD54F' : '#bdbdbd'),
                                    background: isSelected ? '#FFD54F' : 'transparent',
                                    transition: 'all 0.2s ease',
                                  }}
                                />
                                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1a1a1a' }}>
                                  {ingredient.name}
                                </span>
                                <span className="fw-semibold small" style={{ color: '#E65100' }}>
                                  +${(Number(ingredient.price) || 0).toLocaleString('es-CL')}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {availableIngredients.filter(ing => ing.is_available).length === 0 && (
                    <p className="text-muted small mb-0">No hay ingredientes disponibles</p>
                  )}
                </>
              )}
            </div>
            <div className="section-divider" />
          </>
        )}

        {/* Instrucciones especiales */}
        {!isBev && (
          <div className="mb-4">
            <Form.Label className="fw-semibold mb-2" style={{ color: '#1a1a1a', fontSize: '1rem' }}>
              Instrucciones especiales
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Ej: Sin cebolla, bien cocida..."
              className="rounded-3 border"
              style={{
                borderColor: '#e0e0e0',
                padding: '12px',
                fontSize: '0.95rem',
                resize: 'vertical',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            />
          </div>
        )}

        {/* Total y botones */}
        <div
          className="pt-3 mt-3"
          style={{ borderTop: '1px solid #eee' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>Total</span>
            <span className="fw-bold fs-4" style={{ color: '#00C853' }}>
              ${calculateTotal().toLocaleString('es-CL')}
            </span>
          </div>
          <div className="d-flex gap-3">
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              className="rounded-3 flex-grow-1 py-2 fw-semibold border"
              style={{ borderColor: '#e0e0e0', color: '#424242', transition: 'all 0.2s ease' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              className="btn-add-cart-pulse rounded-3 flex-grow-1 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #00C853 0%, #00A843 100%)',
                color: '#1a1a1a',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,200,83,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ShoppingCart size={18} />
              Agregar al carrito
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductModal;
