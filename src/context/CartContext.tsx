import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product, OrderDetails } from '../types/index';
import { validateProductAvailability } from '../utils/validators';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: Product,
    quantity: number,
    addedIngredients: string[],
    removedIngredients: string[],
    specialInstructions: string
  ) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  orderDetails: OrderDetails | null;
  setOrderDetails: (details: OrderDetails | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const addToCart = (
    product: Product,
    quantity: number,
    addedIngredients: string[],
    removedIngredients: string[],
    specialInstructions: string
  ) => {
    // Validar disponibilidad del producto
    const validation = validateProductAvailability(product);
    if (!validation.isValid) {
      alert(validation.errors[0].message);
      return;
    }

    setCartItems([
      ...cartItems,
      {
        product,
        quantity,
        customizations: {
          addedIngredients,
          removedIngredients,
          specialInstructions,
        },
      },
    ]);
  };

  const removeFromCart = (index: number) => {
    const newCartItems = [...cartItems];
    newCartItems.splice(index, 1);
    setCartItems(newCartItems);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newCartItems = [...cartItems];
    newCartItems[index].quantity = quantity;
    setCartItems(newCartItems);
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderDetails(null);
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        orderDetails,
        setOrderDetails,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};