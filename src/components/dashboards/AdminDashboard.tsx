import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Button } from 'react-bootstrap';
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
  BarChart3
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      {/* Top Navigation Bar */}
      <nav className="navbar navbar-dark navbar-expand-lg shadow-sm" style={{ padding: '1rem 0' }}>
        <Container fluid>
          <span className="navbar-brand fw-bold d-flex align-items-center" style={{ fontSize: '1.25rem' }}>
            <LayoutDashboard size={28} className="me-2" style={{ color: '#0B6E4F' }} />
            <span style={{ background: 'linear-gradient(135deg, #0B6E4F 0%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Panel de Administración
            </span>
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white d-flex align-items-center gap-2">
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0B6E4F 0%, #dc3545 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
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

      <Container fluid className="mt-4" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Row>
          {/* Sidebar */}
          <Col lg={2} className="mb-4">
            <Card className="admin-sidebar" style={{ border: 'none', borderRadius: '12px' }}>
              <Card.Body className="p-3">
                <Nav className="flex-column">
                  <Nav.Link 
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className="d-flex align-items-center gap-2"
                  >
                    <TrendingUp size={20} />
                    <span>KPIs y Reportes</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'orders'}
                    onClick={() => setActiveTab('orders')}
                    className="d-flex align-items-center gap-2"
                  >
                    <ShoppingBag size={20} />
                    <span>Pedidos</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'products'}
                    onClick={() => setActiveTab('products')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Package size={20} />
                    <span>Productos</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'categories'}
                    onClick={() => setActiveTab('categories')}
                    className="d-flex align-items-center gap-2"
                  >
                    <LayoutDashboard size={20} />
                    <span>Categorías</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'ingredients'}
                    onClick={() => setActiveTab('ingredients')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Tags size={20} />
                    <span>Ingredientes Extra</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'promotions'}
                    onClick={() => setActiveTab('promotions')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Tags size={20} />
                    <span>Promociones</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'delivery'}
                    onClick={() => setActiveTab('delivery')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Truck size={20} />
                    <span>Config. Delivery</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'ratings'}
                    onClick={() => setActiveTab('ratings')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Star size={20} />
                    <span>Calificaciones</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'users'}
                    onClick={() => setActiveTab('users')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Users size={20} />
                    <span>Usuarios</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'employeeStats'}
                    onClick={() => setActiveTab('employeeStats')}
                    className="d-flex align-items-center gap-2"
                  >
                    <BarChart3 size={20} />
                    <span>Estad. Empleados</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'deliveryStats'}
                    onClick={() => setActiveTab('deliveryStats')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Truck size={20} />
                    <span>Estad. Repartidores</span>
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    className="d-flex align-items-center gap-2"
                  >
                    <Settings size={20} />
                    <span>Configuración</span>
                  </Nav.Link>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={10}>
            <Card style={{ border: 'none', borderRadius: '12px', minHeight: 'calc(100vh - 120px)' }}>
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

