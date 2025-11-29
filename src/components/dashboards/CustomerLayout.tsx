import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../Header';
import Banner from '../Banner';
import Navigation from '../Navigation';
import Footer from '../Footer';

interface CustomerLayoutProps {
  cartCount: number;
  onCartClick: () => void;
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CustomerLayout({ 
  cartCount, 
  onCartClick,
  currentCategory,
  onCategoryChange 
}: CustomerLayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <Header cartCount={cartCount} onCartClick={onCartClick} />
      {isHomePage && <Banner />}
      {isHomePage && <Navigation onCategoryChange={onCategoryChange} activeCategory={currentCategory} />}
      <Outlet />
      <Footer />
    </div>
  );
}

