import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { CartItem } from '../types/index';
import CheckoutModal from './CheckoutModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cartItems, setCartItems }) => {
  const [showCheckout, setShowCheckout] = useState(false);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(index);
      return;
    }
    setCartItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: newQuantity };
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: CartItem) => {
    const base = Number(item.product.price) || 0;
    const extra = item.customizations.addedIngredients.reduce((s, ing) => s + (Number(ing.price) || 0), 0);
    return (base + extra) * item.quantity;
  };

  const total = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setShowCheckout(false);
    onClose();
  };

  const productImage = (item: CartItem) =>
    (item.product as any).image_url || (item.product as any).image || '/images/logo.jpeg';

  return (
    <>
      {/* Overlay con transición */}
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 cart-drawer-overlay ${isOpen ? 'visible' : ''}`}
        style={{
          backgroundColor: 'rgba(26, 26, 26, 0.5)',
          zIndex: 1040,
        }}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Drawer con deslizamiento suave */}
      <div
        className={`position-fixed top-0 end-0 h-100 bg-white d-flex flex-column cart-drawer-panel ${isOpen ? 'visible' : ''}`}
        style={{
          width: 'min(400px, 100vw)',
          zIndex: 1050,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
        aria-modal="true"
        aria-label="Carrito"
      >
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom"
          style={{ borderColor: '#eee', backgroundColor: '#F5F5F5' }}
        >
          <h5 className="mb-0 d-flex align-items-center fw-bold" style={{ color: '#1a1a1a', fontSize: '1.2rem' }}>
            <ShoppingBag size={22} className="me-2" style={{ color: '#00C853' }} />
            Carrito {cartItems.length > 0 && `(${cartItems.length})`}
          </h5>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-link p-2 rounded-3 text-dark text-decoration-none d-flex align-items-center justify-content-center"
            style={{ minWidth: '40px', minHeight: '40px', transition: 'background 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Lista de items */}
        <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#fff' }}>
          {cartItems.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: '72px', height: '72px', backgroundColor: '#F5F5F5' }}
              >
                <ShoppingBag size={36} style={{ color: '#9e9e9e' }} />
              </div>
              <p className="text-muted mb-4">Tu carrito está vacío</p>
              <button
                type="button"
                className="btn rounded-3 px-4 py-2 fw-semibold border"
                style={{ borderColor: '#00C853', color: '#00C853', transition: 'all 0.2s' }}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,200,83,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-3 border p-3 d-flex gap-3"
                  style={{
                    borderColor: '#eee',
                    backgroundColor: '#fff',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  {/* Mini imagen */}
                  <div
                    className="rounded-3 flex-shrink-0 overflow-hidden bg-light"
                    style={{ width: '72px', height: '72px' }}
                  >
                    <img
                      src={productImage(item)}
                      alt={item.product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.jpeg'; }}
                    />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <h6 className="mb-1 fw-bold text-break" style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
                      {item.product.name}
                    </h6>
                    <small className="text-muted d-block mb-1">
                      ${Number(item.product.price).toLocaleString('es-CL')} c/u
                    </small>
                    {item.customizations.addedIngredients.length > 0 && (
                      <small className="text-success d-block">
                        + {item.customizations.addedIngredients.map(ing => ing.name).join(', ')}
                      </small>
                    )}
                    {item.customizations.specialInstructions && (
                      <small className="text-muted d-block mt-1">📝 {item.customizations.specialInstructions}</small>
                    )}
                    {/* Cantidad y total por item */}
                    <div className="d-flex align-items-center justify-content-between mt-2 flex-wrap gap-2">
                      <div className="d-flex align-items-center rounded-3 border" style={{ borderColor: '#e0e0e0' }}>
                        <button
                          type="button"
                          className="cart-item-qty-btn btn btn-link p-2 text-dark text-decoration-none d-flex align-items-center justify-content-center"
                          style={{ minWidth: '36px', minHeight: '36px', borderRadius: '0.5rem' }}
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-2 fw-semibold" style={{ minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-item-qty-btn btn btn-link p-2 text-dark text-decoration-none d-flex align-items-center justify-content-center"
                          style={{ minWidth: '36px', minHeight: '36px', borderRadius: '0.5rem' }}
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <strong style={{ color: '#00C853', fontSize: '1rem' }}>
                          ${calculateItemTotal(item).toLocaleString('es-CL')}
                        </strong>
                        <button
                          type="button"
                          className="cart-item-qty-btn btn btn-link p-2 text-danger text-decoration-none d-flex align-items-center justify-content-center"
                          style={{ minWidth: '32px', minHeight: '32px' }}
                          onClick={() => removeFromCart(index)}
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen y CTA */}
        {cartItems.length > 0 && (
          <div
            className="border-top p-4"
            style={{
              borderColor: '#eee',
              backgroundColor: '#F5F5F5',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#1a1a1a' }}>Total</span>
              <span className="fw-bold" style={{ fontSize: '1.35rem', color: '#00C853' }}>
                ${total.toLocaleString('es-CL')}
              </span>
            </div>
            <button
              type="button"
              className="btn w-100 py-2 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 border-0"
              style={{
                background: 'linear-gradient(135deg, #00C853 0%, #00A843 100%)',
                color: '#1a1a1a',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0,200,83,0.35)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onClick={() => setShowCheckout(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,200,83,0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,200,83,0.35)';
              }}
            >
              <CreditCard size={20} />
              Finalizar pedido
            </button>
          </div>
        )}
      </div>

      <CheckoutModal
        show={showCheckout}
        onHide={() => setShowCheckout(false)}
        cartItems={cartItems}
        onOrderSuccess={handleCheckoutSuccess}
      />
    </>
  );
};

export default CartDrawer;
