import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Truck, DollarSign } from 'lucide-react';
import Header from '../Header';
import Footer from '../Footer';

interface DeliveryLayoutProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function DeliveryLayout({ cartCount, onCartClick }: DeliveryLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-light)' }}>
      <Header cartCount={cartCount} onCartClick={onCartClick} />
      {/* Barra Panel Repartidor - mismo diseño que Panel Empleado */}
      <nav className="navbar py-2 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #00A843 100%)' }}>
        <Container fluid className="d-flex justify-content-center justify-content-md-start">
          <div className="d-flex align-items-center gap-2 gap-md-4">
            <span className="navbar-brand fw-bold d-flex align-items-center mb-0" style={{ color: '#fff' }}>
              <Truck size={22} className="me-2" style={{ color: '#00C853' }} />
              Panel Repartidor
            </span>
            <NavLink
              to="/delivery"
              end
              className={({ isActive }) =>
                `nav-link d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 ${isActive ? 'bg-white text-dark fw-semibold' : 'text-white'}`
              }
            >
              <Truck size={18} />
              Mis Entregas
            </NavLink>
            <NavLink
              to="/delivery/earnings"
              className={({ isActive }) =>
                `nav-link d-inline-flex align-items-center gap-1 rounded-3 px-3 py-1 ${isActive ? 'bg-white text-dark fw-semibold' : 'text-white'}`
              }
            >
              <DollarSign size={18} />
              Ganancias
            </NavLink>
          </div>
        </Container>
      </nav>
      <Outlet />
      <Footer />
    </div>
  );
}

