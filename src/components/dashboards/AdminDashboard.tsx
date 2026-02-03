import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Button, Offcanvas } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  TrendingUp, 
  Tags,
  Settings,
  LogOut,
  ShoppingBag,
  Truck,
  Star,
  BarChart3,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductManagement from '../admin/ProductManagement';
import CategoryManagement from '../admin/CategoryManagement';
import IngredientManagement from '../admin/IngredientManagement';
import OrdersManagement from '../admin/OrdersManagement';
import PromotionsManagement from '../admin/PromotionsManagement';
import KPIDashboard from '../admin/KPIDashboard';
import DeliveryConfiguration from '../admin/DeliveryConfiguration';
import AdminRatings from '../admin/AdminRatings';
import UsersManagement from '../admin/UsersManagement';
import EmployeeStatsDashboard from '../admin/EmployeeStatsDashboard';
import DeliveryStatsDashboard from '../admin/DeliveryStatsDashboard';

type TabKey = 'overview' | 'products' | 'categories' | 'ingredients' | 'promotions' | 'orders' | 'users' | 'settings' | 'delivery' | 'ratings' | 'employeeStats' | 'deliveryStats';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const closeSidebar = () => setSidebarOpen(false);

  const navLinks: { key: TabKey; icon: React.ElementType; label: string }[] = [
    { key: 'overview', icon: TrendingUp, label: 'KPIs y Reportes' },
    { key: 'orders', icon: ShoppingBag, label: 'Pedidos' },
    { key: 'products', icon: Package, label: 'Productos' },
    { key: 'categories', icon: LayoutDashboard, label: 'Categorías' },
    { key: 'ingredients', icon: Tags, label: 'Ingredientes Extra' },
    { key: 'promotions', icon: Tags, label: 'Promociones' },
    { key: 'delivery', icon: Truck, label: 'Config. Delivery' },
    { key: 'ratings', icon: Star, label: 'Calificaciones' },
    { key: 'users', icon: Users, label: 'Usuarios' },
    { key: 'employeeStats', icon: BarChart3, label: 'Estad. Empleados' },
    { key: 'deliveryStats', icon: Truck, label: 'Estad. Repartidores' },
    { key: 'settings', icon: Settings, label: 'Configuración' },
  ];

  const renderNavLinks = (onItemClick?: () => void) => (
    <>
      {navLinks.map(({ key, icon: Icon, label }) => (
        <Nav.Link
          key={key}
          active={activeTab === key}
          onClick={() => {
            setActiveTab(key);
            onItemClick?.();
          }}
          className="d-flex align-items-center gap-2"
        >
          <Icon size={20} />
          <span>{label}</span>
        </Nav.Link>
      ))}
    </>
  );

  async function handleLogout() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  return (
    <div className="min-vh-100 admin-dark-mode">
      {/* Top Navigation Bar - sticky en móvil para que el menú hamburguesa siempre esté visible */}
      <nav 
        className="navbar navbar-dark navbar-expand-lg shadow-sm admin-nav-sticky" 
        style={{ padding: '0.75rem 0' }}
      >
        <Container fluid className="d-flex align-items-center">
          {/* Botón menú hamburguesa - solo en mobile/tablet */}
          <Button
            variant="outline-light"
            size="sm"
            className="d-lg-none me-2 rounded-3 p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
          >
            <Menu size={24} />
          </Button>
          <span className="navbar-brand fw-bold d-flex align-items-center admin-nav-brand" style={{ fontSize: 'clamp(1rem, 4vw, 1.2rem)' }}>
            <LayoutDashboard size={26} className="me-2" style={{ color: '#00C853' }} />
            <span style={{ background: 'linear-gradient(135deg, #00C853 0%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Panel Admin
            </span>
          </span>
          <div className="d-flex align-items-center gap-2 gap-sm-3 ms-auto">
            <span className="text-white d-flex align-items-center gap-2">
              <div style={{ 
                width: '36px', 
                height: '36px', 
                minWidth: '36px',
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0B6E4F 0%, #dc3545 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="d-none d-sm-block">
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{user?.full_name}</strong>
                <span className="badge" style={{ 
                  background: 'rgba(11, 110, 79, 0.2)', 
                  color: '#0B6E4F',
                  border: '1px solid #0B6E4F',
                  fontSize: '0.75rem'
                }}>Admin</span>
              </div>
            </span>
            <Button 
              variant="outline-light" 
              size="sm" 
              className="rounded-3"
              onClick={handleLogout}
              style={{
                borderColor: '#333',
                color: '#fff',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#dc3545';
                e.currentTarget.style.color = '#dc3545';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <LogOut size={18} className="me-1" />
              Salir
            </Button>
          </div>
        </Container>
      </nav>

      {/* Offcanvas menú lateral - solo visible en mobile/tablet */}
      <Offcanvas
        show={sidebarOpen}
        onHide={closeSidebar}
        placement="start"
        className="admin-dark-mode"
        style={{ width: '280px', maxWidth: '85vw' }}
      >
        <Offcanvas.Header closeButton className="border-bottom" style={{ borderColor: 'var(--admin-card-border)' }}>
          <Offcanvas.Title className="d-flex align-items-center fw-bold">
            <LayoutDashboard size={24} className="me-2" style={{ color: '#00C853' }} />
            Menú Admin
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column p-2 admin-sidebar admin-sidebar-v2" style={{ border: 'none', background: 'transparent' }}>
            {renderNavLinks(closeSidebar)}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      <Container fluid className="mt-4" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Row>
          {/* Sidebar - solo visible en desktop (lg+) */}
          <Col lg={2} className="mb-4 d-none d-lg-block">
            <Card className="admin-sidebar admin-sidebar-v2" style={{ border: 'none' }}>
              <Card.Body className="p-2">
                <Nav className="flex-column">
                  {renderNavLinks()}
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={10}>
            <Card style={{ border: 'none', borderRadius: '1rem', minHeight: 'calc(100vh - 120px)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <Card.Body className="p-4">
                {activeTab === 'overview' && <KPIDashboard />}

                {activeTab === 'products' && <ProductManagement />}

                {activeTab === 'categories' && <CategoryManagement />}

                {activeTab === 'ingredients' && <IngredientManagement />}

                {activeTab === 'promotions' && <PromotionsManagement />}

                {activeTab === 'delivery' && <DeliveryConfiguration />}

                {activeTab === 'ratings' && <AdminRatings />}

                {activeTab === 'orders' && <OrdersManagement />}

                {activeTab === 'users' && <UsersManagement />}

                {activeTab === 'employeeStats' && <EmployeeStatsDashboard />}

                {activeTab === 'deliveryStats' && <DeliveryStatsDashboard />}

                {activeTab === 'settings' && (
                  <div>
                    <h3 className="mb-4" style={{ color: '#fff' }}>Configuración</h3>
                    <Card>
                      <Card.Body>
                        <h5 style={{ color: '#fff' }}>Información del Administrador</h5>
                        <p style={{ color: '#b0b0b0' }}><strong>Nombre:</strong> <span style={{ color: '#fff' }}>{user?.full_name}</span></p>
                        <p style={{ color: '#b0b0b0' }}><strong>Email:</strong> <span style={{ color: '#fff' }}>{user?.email}</span></p>
                        <p style={{ color: '#b0b0b0' }}><strong>Teléfono:</strong> <span style={{ color: '#fff' }}>{user?.phone || 'No especificado'}</span></p>
                        <p style={{ color: '#b0b0b0' }}><strong>Rol:</strong> <span className="badge" style={{ 
                          background: 'rgba(220, 53, 69, 0.2)', 
                          color: '#dc3545',
                          border: '1px solid #dc3545'
                        }}>{user?.role}</span></p>
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

