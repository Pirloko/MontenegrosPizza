import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Pizza } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  openCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ openCart }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems } = useCart();
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Pizza size={32} className="text-red-600" />
          <h1 className={`ml-2 font-bold text-xl md:text-2xl ${isScrolled ? 'text-red-600' : 'text-white'}`}>
            Montenegros Pizza
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => scrollToSection('home')} 
            className={`font-medium ${isScrolled ? 'text-gray-800 hover:text-red-600' : 'text-white hover:text-red-200'}`}
          >
            Inicio
          </button>
          <button 
            onClick={() => scrollToSection('menu')} 
            className={`font-medium ${isScrolled ? 'text-gray-800 hover:text-red-600' : 'text-white hover:text-red-200'}`}
          >
            Menú
          </button>
          <button 
            onClick={openCart} 
            className="relative bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        
        {/* Mobile Navigation Icon */}
        <div className="flex items-center space-x-4 md:hidden">
          <button 
            onClick={openCart} 
            className="relative bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button 
            onClick={toggleMenu}
            className={`p-2 rounded-md ${isScrolled ? 'text-gray-800' : 'text-white'}`}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-800 hover:text-red-600 py-2 font-medium"
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection('menu')}
              className="text-gray-800 hover:text-red-600 py-2 font-medium"
            >
              Menú
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;