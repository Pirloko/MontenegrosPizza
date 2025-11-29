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
    <div className="min-vh-100 bg-light">
      {/* Top Navigation Bar */}
      <nav className="navbar navbar-dark bg-danger navbar-expand-lg shadow-sm">
        <Container fluid>
          <span className="navbar-brand fw-bold">
            <LayoutDashboard size={24} className="me-2" />
            Panel de Administración
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white">
              <strong>{user?.full_name}</strong>
              <span className="badge bg-light text-danger ms-2">Admin</span>
            </span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <LogOut size={18} className="me-1" />
              Salir
            </Button>
          </div>
        </Container>
      </nav>

      <Container fluid className="mt-4">
        <Row>
          {/* Sidebar */}
          <Col lg={2} className="mb-4">
            <Card className="shadow-sm">
              <Card.Body className="p-2">
                <Nav className="flex-column">
                  <Nav.Link 
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <TrendingUp size={18} />
                    KPIs y Reportes
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'orders'}
                    onClick={() => setActiveTab('orders')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <ShoppingBag size={18} />
                    Pedidos
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'products'}
                    onClick={() => setActiveTab('products')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Package size={18} />
                    Productos
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'categories'}
                    onClick={() => setActiveTab('categories')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <LayoutDashboard size={18} />
                    Categorías
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'ingredients'}
                    onClick={() => setActiveTab('ingredients')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Tags size={18} />
                    Ingredientes Extra
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'promotions'}
                    onClick={() => setActiveTab('promotions')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Tags size={18} />
                    Promociones
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'delivery'}
                    onClick={() => setActiveTab('delivery')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Truck size={18} />
                    Config. Delivery
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'ratings'}
                    onClick={() => setActiveTab('ratings')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Star size={18} />
                    Calificaciones
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'users'}
                    onClick={() => setActiveTab('users')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Users size={18} />
                    Usuarios
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'employeeStats'}
                    onClick={() => setActiveTab('employeeStats')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <BarChart3 size={18} />
                    Estad. Empleados
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'deliveryStats'}
                    onClick={() => setActiveTab('deliveryStats')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Truck size={18} />
                    Estad. Repartidores
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Settings size={18} />
                    Configuración
                  </Nav.Link>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={10}>
            <Card className="shadow-sm">
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
                    <h3 className="mb-4">Configuración</h3>
                    <Card>
                      <Card.Body>
                        <h5>Información del Administrador</h5>
                        <p><strong>Nombre:</strong> {user?.full_name}</p>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Teléfono:</strong> {user?.phone || 'No especificado'}</p>
                        <p><strong>Rol:</strong> <span className="badge bg-danger">{user?.role}</span></p>
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

