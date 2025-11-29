import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

interface DeliveryLayoutProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function DeliveryLayout({ cartCount, onCartClick }: DeliveryLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <Header cartCount={cartCount} onCartClick={onCartClick} />
      <Outlet />
      <Footer />
    </div>
  );
}

