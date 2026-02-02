import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Button, Dropdown, Offcanvas } from 'react-bootstrap';
import { ShoppingCart, User, Award, History, Settings, LogOut, MapPin, Truck, DollarSign, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [badgeAnimate, setBadgeAnimate] = useState(false);
  const prevCartCount = useRef(cartCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (cartCount !== prevCartCount.current && cartCount > 0) {
      setBadgeAnimate(true);
      prevCartCount.current = cartCount;
      const t = setTimeout(() => setBadgeAnimate(false), 400);
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  const handleGoHome = () => {
    setShowMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  const handleNav = (path: string) => {
    setShowMobileMenu(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setShowMobileMenu(false);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navContent = (
    <>
      {user && (
        <>
          {(user.role === 'customer' || !user.role) && (
            <div
              className="d-flex align-items-center text-dark px-3 py-2 rounded-3 mb-2 mb-md-0 me-md-2"
              style={{ backgroundColor: 'rgba(255,213,79,0.25)' }}
            >
              <Award size={18} className="me-1" />
              <strong>{user.loyalty_points}</strong>
              <span className="ms-1 small">pts</span>
            </div>
          )}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="outline-light"
              size="sm"
              className="d-flex align-items-center border rounded-3"
              style={{ color: 'white' }}
            >
              <User size={18} className="me-1" />
              <span className="d-none d-sm-inline">{user.full_name?.split(' ')[0]}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="rounded-3 border-0 shadow-lg" style={{ marginTop: '8px' }}>
              <Dropdown.Item disabled className="small text-muted">
                {user.email}
              </Dropdown.Item>
              <Dropdown.Divider />
              {user.role === 'delivery' && (
                <>
                  <Dropdown.Item onClick={() => handleNav('/delivery')}>
                    <Truck size={16} className="me-2" />
                    Mis Entregas
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNav('/delivery/earnings')}>
                    <DollarSign size={16} className="me-2" />
                    Mis Ganancias
                  </Dropdown.Item>
                </>
              )}
              {(user.role === 'customer' || !user.role) && (
                <>
                  <Dropdown.Item onClick={() => handleNav('/profile')}>
                    <Settings size={16} className="me-2" />
                    Mi Perfil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNav('/orders')}>
                    <History size={16} className="me-2" />
                    Mis Pedidos
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNav('/points')}>
                    <Award size={16} className="me-2" />
                    Mis Puntos
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleNav('/addresses')}>
                    <MapPin size={16} className="me-2" />
                    Mis Direcciones
                  </Dropdown.Item>
                </>
              )}
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout} className="text-danger">
                <LogOut size={16} className="me-2" />
                Cerrar Sesión
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </>
      )}
      {!user && (
        <Button
          variant="link"
          size="sm"
          onClick={() => handleNav('/login')}
          className="d-flex align-items-center text-white px-3 text-decoration-none rounded-3"
          style={{ backgroundColor: 'transparent', border: 'none' }}
        >
          <User size={18} className="me-2" />
          <span>Ingresar</span>
        </Button>
      )}
      {(!user || user.role === 'customer' || !user.role) && (
        <Button
          variant="link"
          className="d-flex align-items-center text-white p-2 position-relative rounded-3 ms-1"
          style={{ backgroundColor: 'transparent', border: 'none', textDecoration: 'none' }}
          onClick={onCartClick}
        >
          <ShoppingCart size={22} strokeWidth={2} />
          {cartCount > 0 && (
            <span
              className={`position-absolute top-0 start-100 translate-middle rounded-pill d-inline-flex align-items-center justify-content-center fw-bold ${badgeAnimate ? 'cart-badge-pop' : ''}`}
              style={{
                backgroundColor: '#E53935',
                color: 'white',
                fontSize: '0.7rem',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
              }}
            >
              {cartCount}
            </span>
          )}
        </Button>
      )}
    </>
  );

  return (
    <>
      <Navbar
        expand={false}
        fixed="top"
        className={`py-2 transition-all duration-300 ${scrolled ? 'header-scrolled shadow-sm' : ''}`}
        style={{
          backgroundColor: scrolled ? undefined : '#1a1a1a',
          zIndex: 1030,
        }}
      >
        <Container fluid className="px-3 px-md-4">
          {/* Menú hamburguesa solo móvil */}
          <Button
            variant="link"
            className="d-md-none d-flex align-items-center justify-content-center text-white p-2 me-2 rounded-3"
            style={{ border: 'none', minWidth: '44px', minHeight: '44px' }}
            onClick={() => setShowMobileMenu(true)}
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </Button>

          <Navbar.Brand
            className="d-flex align-items-center header-logo-hover"
            onClick={handleGoHome}
            style={{ cursor: 'pointer' }}
          >
            <img
              src="/images/Imagen1.png"
              alt="Montenegro's Pizza"
              className="d-inline-block align-top img-fluid"
              style={{
                maxHeight: '56px',
                height: 'auto',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Navbar.Brand>

          <div className="d-none d-md-flex align-items-center gap-2">{navContent}</div>

          {/* En móvil mostrar solo carrito/ingresar si no hay menú abierto */}
          <div className="d-md-none d-flex align-items-center ms-auto">{navContent}</div>
        </Container>
      </Navbar>

      {/* Offcanvas menú móvil: slide desde la derecha */}
      <Offcanvas
        show={showMobileMenu}
        onHide={() => setShowMobileMenu(false)}
        placement="end"
        className="offcanvas-header-nav border-0"
        style={{ width: '280px', maxWidth: '85vw' }}
      >
        <Offcanvas.Header closeButton className="border-bottom pb-3">
          <Offcanvas.Title className="fw-bold" style={{ color: '#1a1a1a' }}>
            Menú
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pt-3">
          <div className="d-flex flex-column gap-2">
            <Button
              variant="outline-dark"
              size="sm"
              className="rounded-3 text-start d-flex align-items-center"
              onClick={handleGoHome}
            >
              Inicio
            </Button>
            {user && (user.role === 'customer' || !user.role) && (
              <>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/profile')}
                >
                  <Settings size={18} className="me-2" />
                  Mi Perfil
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/orders')}
                >
                  <History size={18} className="me-2" />
                  Mis Pedidos
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/points')}
                >
                  <Award size={18} className="me-2" />
                  Mis Puntos
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/addresses')}
                >
                  <MapPin size={18} className="me-2" />
                  Mis Direcciones
                </Button>
              </>
            )}
            {user && user.role === 'delivery' && (
              <>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/delivery')}
                >
                  <Truck size={18} className="me-2" />
                  Mis Entregas
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  className="rounded-3 text-start d-flex align-items-center"
                  onClick={() => handleNav('/delivery/earnings')}
                >
                  <DollarSign size={18} className="me-2" />
                  Mis Ganancias
                </Button>
              </>
            )}
            {!user && (
              <Button
                variant="outline-dark"
                size="sm"
                className="rounded-3 text-start"
                onClick={() => handleNav('/login')}
              >
                Ingresar
              </Button>
            )}
            {user && (
              <Button
                variant="outline-danger"
                size="sm"
                className="rounded-3 text-start d-flex align-items-center mt-2"
                onClick={handleLogout}
              >
                <LogOut size={18} className="me-2" />
                Cerrar Sesión
              </Button>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Espaciador para navbar fija */}
      <div style={{ height: '72px' }} />
    </>
  );
};

export default Header;
