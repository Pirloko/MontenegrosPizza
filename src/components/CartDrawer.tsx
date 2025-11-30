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

    setCartItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity
      };
      return newItems;
    });
  };

  const removeFromCart = (index: number) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: CartItem) => {
    const basePrice = item.product.price * item.quantity;
    const extraCost = item.customizations.addedIngredients.reduce((sum, ing) => sum + ing.price, 0) * item.quantity;
    return basePrice + extraCost;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setShowCheckout(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" 
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column"
        style={{ 
          width: '400px', 
          zIndex: 1050,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0 d-flex align-items-center">
            <ShoppingBag className="me-2" />
            Carrito ({cartItems.length})
          </h5>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-grow-1 overflow-auto p-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-5">
              <ShoppingBag size={48} className="text-muted mb-3" />
              <p className="text-muted">Tu carrito está vacío</p>
              <button 
                className="btn btn-outline-primary"
                onClick={onClose}
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.product.name}</h6>
                      <small className="text-muted">
                        ${item.product.price.toLocaleString()} c/u
                      </small>
                    </div>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeFromCart(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Customizations */}
                  {item.customizations.addedIngredients.length > 0 && (
                    <div className="mb-2">
                      <small className="text-success">
                        + {item.customizations.addedIngredients.map(ing => ing.name).join(', ')}
                      </small>
                    </div>
                  )}

                  {item.customizations.removedIngredients.length > 0 && (
                    <div className="mb-2">
                      <small className="text-danger">
                        - {item.customizations.removedIngredients.join(', ')}
                      </small>
                    </div>
                  )}

                  {item.customizations.specialInstructions && (
                    <div className="mb-2">
                      <small className="text-danger fw-bold">
                        📝 Nota: {item.customizations.specialInstructions}
                      </small>
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="mx-3">{item.quantity}</span>
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-end">
                      <strong>${calculateItemTotal(item).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-top p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Total:</h5>
              <h5 className="mb-0 text-success">${calculateTotal().toLocaleString()}</h5>
            </div>
            
            <button 
              className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center"
              onClick={() => setShowCheckout(true)}
              style={{ backgroundColor: '#0B6E4F', borderColor: '#0B6E4F' }}
            >
              <CreditCard className="me-2" />
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
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