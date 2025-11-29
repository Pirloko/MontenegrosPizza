import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, ToastContainer } from 'react-bootstrap';
import { CheckCircle } from 'lucide-react';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Components
import AdminDashboard from './components/dashboards/AdminDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import DeliveryDashboard from './components/dashboards/DeliveryDashboard';

// Customer Components
import Home from './pages/Home';
import CartDrawer from './components/CartDrawer';
import CustomerLayout from './components/dashboards/CustomerLayout';
import DeliveryLayout from './components/dashboards/DeliveryLayout';
import CustomerProfile from './components/CustomerProfile';
import CustomerOrders from './components/CustomerOrders';
import CustomerPoints from './components/CustomerPoints';
import FavoriteAddresses from './components/FavoriteAddresses';
import DeliveryEarnings from './components/dashboards/DeliveryEarnings';
import { Product } from './types';
import { CartItem } from './types/index';
import { Database } from './types/database';

type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];

interface ProductCustomization {
  quantity: number;
  removedIngredients: string[];
  addedIngredients: ExtraIngredient[];
  specialInstructions: string;
}

function AppContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('PIZZAS');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Usar autenticación real
  const { user, loading } = useAuth();

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
  };

  const handleAddToCart = (product: Product, customizations: ProductCustomization) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => 
        item.product.id === product.id &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      );
      
      if (existingItemIndex >= 0) {
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + customizations.quantity
        };
        setToastMessage(`Se agregó otro "${product.name}" al carrito`);
        return newItems;
      } else {
        setToastMessage(`"${product.name}" agregado al carrito`);
        return [...prevItems, { 
          product, 
          quantity: customizations.quantity,
          customizations: {
            removedIngredients: customizations.removedIngredients,
            addedIngredients: customizations.addedIngredients,
            specialInstructions: customizations.specialInstructions
          }
        }];
      }
    });
    setShowToast(true);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Redirect based on user role
  function HomeRedirect() {
    if (loading) return <div>Cargando...</div>;
    
    if (!user) {
      return <Home category={currentCategory} onAddToCart={handleAddToCart} />;
    }

    // Redirect authenticated users to their dashboards
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'employee':
        return <Navigate to="/employee" replace />;
      case 'delivery':
        return <Navigate to="/delivery" replace />;
      case 'customer':
        return <Home category={currentCategory} onAddToCart={handleAddToCart} />;
      default:
        return <Home category={currentCategory} onAddToCart={handleAddToCart} />;
    }
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route
          path="/"
          element={
            <CustomerLayout
              cartCount={cartCount}
              onCartClick={() => setIsCartOpen(true)}
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
            />
          }
        >
          <Route index element={<HomeRedirect />} />
          
          {/* Customer Protected Routes - Dentro del Layout para tener Header */}
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="points"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerPoints />
              </ProtectedRoute>
            }
          />
          <Route
            path="addresses"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <FavoriteAddresses />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Delivery Routes */}
        <Route
          path="/delivery"
          element={
            <DeliveryLayout
              cartCount={0}
              onCartClick={() => {}}
            />
          }
        >
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="earnings"
            element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <DeliveryEarnings />
              </ProtectedRoute>
            }
          />
        </Route>


        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />
      
      {/* Toast Notification */}
      <ToastContainer 
        position="bottom-end" 
        className="p-3" 
        style={{ zIndex: 1060 }}
      >
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          className="bg-white"
        >
          <Toast.Body className="d-flex align-items-center">
            <CheckCircle size={20} className="text-success me-2" />
            <span>{toastMessage}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;