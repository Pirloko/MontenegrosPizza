import React from 'react';
import { Navbar, Container, Button, Badge, Dropdown } from 'react-bootstrap';
import { ShoppingCart, User, Award, History, Settings, LogOut, MapPin, Truck, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return (
    <Navbar 
      className="shadow-sm py-2"
      style={{ backgroundColor: '#000000' }}
    >
      <Container fluid className="px-3">
        <Navbar.Brand 
          className="d-flex align-items-center"
          onClick={handleGoHome}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="/images/Imagen1.png"
            alt="Montenegro's Pizza"
            className="d-inline-block align-top img-fluid header-logo"
            style={{
              maxHeight: '120px',
              height: 'auto',
              width: 'auto',
              cursor: 'pointer',
              objectFit: 'contain'
            }}
            onClick={handleGoHome}
          />
        </Navbar.Brand>
        
        <div className="d-flex align-items-center gap-2">
          {user && (
            <>
              {/* Loyalty Points Display - Solo para clientes */}
              {(user.role === 'customer' || !user.role) && (
                <div className="d-none d-md-flex align-items-center bg-warning text-dark px-3 py-1 rounded">
                  <Award size={18} className="me-1" />
                  <strong>{user.loyalty_points}</strong>
                  <span className="ms-1 small">pts</span>
                </div>
              )}

              {/* User Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" size="sm" className="d-flex align-items-center">
                  <User size={18} className="me-1" />
                  <span className="d-none d-sm-inline">{user.full_name?.split(' ')[0]}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item disabled>
                    <small className="text-muted">{user.email}</small>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  
                  {/* Opciones para Repartidor */}
                  {user.role === 'delivery' && (
                    <>
                      <Dropdown.Item onClick={() => navigate('/delivery')}>
                        <Truck size={16} className="me-2" />
                        Mis Entregas
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate('/delivery/earnings')}>
                        <DollarSign size={16} className="me-2" />
                        Mis Ganancias
                      </Dropdown.Item>
                    </>
                  )}
                  
                  {/* Opciones para Cliente */}
                  {(user.role === 'customer' || !user.role) && (
                    <>
                      <Dropdown.Item onClick={() => navigate('/profile')}>
                        <Settings size={16} className="me-2" />
                        Mi Perfil
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate('/orders')}>
                        <History size={16} className="me-2" />
                        Mis Pedidos
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate('/points')}>
                        <Award size={16} className="me-2" />
                        Mis Puntos
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => navigate('/addresses')}>
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
              onClick={() => navigate('/login')}
              className="d-flex align-items-center text-white px-3"
              style={{ 
                backgroundColor: 'transparent',
                border: 'none',
                textDecoration: 'none'
              }}
            >
              <User size={18} className="me-2" />
              <span>Ingresar</span>
            </Button>
          )}

          {/* Carrito - Solo para clientes */}
          {(!user || user.role === 'customer' || !user.role) && (
            <Button 
              variant="link"
              className="d-flex align-items-center text-white p-2 position-relative" 
              style={{ 
                backgroundColor: 'transparent',
                border: 'none',
                textDecoration: 'none'
              }}
              onClick={onCartClick}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <Badge 
                  className="position-absolute top-0 start-100 translate-middle rounded-pill"
                  style={{
                    backgroundColor: '#FF0000',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default Header; 