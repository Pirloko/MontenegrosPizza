import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Database } from '../types/database';
import { ingredientService } from '../services/ingredientService';

type Product = Database['public']['Tables']['products']['Row'];
type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  product: Product;
  onAddToCart: (product: Product, customizations: ProductCustomization) => void;
}

interface ProductCustomization {
  quantity: number;
  removedIngredients: string[];
  addedIngredients: ExtraIngredient[];
  specialInstructions: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ show, onHide, product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedIngredients, setAddedIngredients] = useState<ExtraIngredient[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<ExtraIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  useEffect(() => {
    if (show) {
      loadIngredients();
    }
  }, [show]);

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

  const calculateExtraCost = () => {
    return addedIngredients.reduce((total, ing) => total + (Number(ing.price) || 0), 0);
  };

  const calculateTotal = () => {
    const basePrice = Number(product.price) || 0;
    const extraCost = calculateExtraCost();
    return (basePrice + extraCost) * quantity;
  };

  const handleAddToCart = () => {
    const customizations: ProductCustomization = {
      quantity,
      removedIngredients,
      addedIngredients,
      specialInstructions
    };
    
    onAddToCart(product, customizations);
    onHide();
    
    // Reset form
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedIngredients([]);
    setSpecialInstructions('');
  };

  const handleClose = () => {
    onHide();
    // Reset form
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedIngredients([]);
    setSpecialInstructions('');
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      contentClassName="border-0"
      style={{ borderRadius: '16px', overflow: 'hidden' }}
    >
      {/* Header con gradiente usando paleta del logo (negro a verde) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0B6E4F 100%)',
          padding: '24px',
          color: 'white',
          position: 'relative'
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          {product.name}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          {product.description}
        </p>
      </div>

      <Modal.Body style={{ padding: '24px' }}>
        {/* Precio base */}
        <div className="mb-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #e9ecef' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ fontSize: '14px', color: '#6c757d' }}>Precio base:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
              ${(Number(product.price) || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cantidad */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-3" style={{ fontSize: '16px', color: '#000' }}>
            Cantidad
          </label>
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e9ecef';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <Minus size={18} color="#495057" />
            </button>
            <div
              style={{
                minWidth: '60px',
                height: '40px',
                borderRadius: '8px',
                background: '#fff',
                border: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#000'
              }}
            >
              {quantity}
            </div>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e9ecef';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <Plus size={18} color="#495057" />
            </button>
          </div>
        </div>

        {/* Ingredientes Extra */}
        <div className="mb-4">
          <label className="form-label fw-bold mb-3" style={{ fontSize: '16px', color: '#000' }}>
            Ingredientes Extra
          </label>
          {loadingIngredients ? (
            <div className="text-center py-3">
              <Spinner size="sm" />
              <span className="ms-2">Cargando ingredientes...</span>
            </div>
          ) : (
            <>
              {/* Ingredientes Básicos */}
              {availableIngredients.filter(ing => ing.category === 'basic' && ing.is_available).length > 0 && (
                <div className="mb-4">
                  <h6 className="text-primary mb-3 fw-bold">
                    <span className="badge bg-primary me-2">Básicos</span>
                    Ingredientes Básicos
                  </h6>
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {availableIngredients
                      .filter(ing => ing.category === 'basic' && ing.is_available)
                      .map((ingredient) => {
                        const isSelected = addedIngredients.some(ing => ing.id === ingredient.id);
                        return (
                          <div
                            key={ingredient.id}
                            onClick={() => toggleIngredient(ingredient)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: `2px solid ${isSelected ? '#0B6E4F' : '#dee2e6'}`,
                              background: isSelected ? '#f0f9f6' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#adb5bd';
                                e.currentTarget.style.background = '#f8f9fa';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#dee2e6';
                                e.currentTarget.style.background = '#fff';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: '#0B6E4F'
                                }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
                                {ingredient.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0B6E4F' }}>
                              +${(Number(ingredient.price) || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Ingredientes Premium */}
              {availableIngredients.filter(ing => ing.category === 'premium' && ing.is_available).length > 0 && (
                <div>
                  <h6 className="text-warning mb-3 fw-bold">
                    <span className="badge bg-warning text-dark me-2">Premium</span>
                    Ingredientes Premium
                  </h6>
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {availableIngredients
                      .filter(ing => ing.category === 'premium' && ing.is_available)
                      .map((ingredient) => {
                        const isSelected = addedIngredients.some(ing => ing.id === ingredient.id);
                        return (
                          <div
                            key={ingredient.id}
                            onClick={() => toggleIngredient(ingredient)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: `2px solid ${isSelected ? '#ffc107' : '#dee2e6'}`,
                              background: isSelected ? '#fffbf0' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#ffc107';
                                e.currentTarget.style.background = '#fffbf0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#dee2e6';
                                e.currentTarget.style.background = '#fff';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer',
                                  accentColor: '#ffc107'
                                }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
                                {ingredient.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffc107' }}>
                              +${(Number(ingredient.price) || 0).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {availableIngredients.filter(ing => ing.is_available).length === 0 && (
                <div className="text-center py-3 text-muted">
                  No hay ingredientes disponibles
                </div>
              )}
            </>
          )}
        </div>

        {/* Instrucciones Especiales */}
        <div className="mb-4">
          <Form.Label className="fw-bold mb-3" style={{ fontSize: '16px', color: '#000' }}>
            Instrucciones Especiales
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Ej: Sin cebolla, bien cocida..."
            style={{
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              padding: '12px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Total */}
        <div 
          style={{
            paddingTop: '20px',
            borderTop: '1px solid #e9ecef',
            marginTop: '20px'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Total:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0B6E4F' }}>
              ${calculateTotal().toLocaleString()}
            </span>
          </div>

          {/* Botones */}
          <div className="d-flex gap-3">
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddToCart}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: '#0B6E4F',
                border: 'none',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#095a41';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0B6E4F';
              }}
            >
              <ShoppingCart size={18} />
              Agregar al Carrito
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ProductModal;
