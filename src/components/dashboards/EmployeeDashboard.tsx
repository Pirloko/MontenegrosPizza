import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingBag, 
  Package, 
  Clock,
  CheckCircle,
  Truck,
  LogOut,
  Plus,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmployeeOrdersDashboard from './EmployeeOrdersDashboard';
import EmployeeOrderForm from '../admin/EmployeeOrderForm';
import EmployeeOrderHistory from '../EmployeeOrderHistory';

type TabKey = 'orders' | 'inventory' | 'new-order' | 'history';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleOrderCreated = () => {
    // Cambiar a la pestaña de pedidos para ver el nuevo pedido
    setActiveTab('orders');
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
    <div className="min-vh-100" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Top Navigation Bar - mismo diseño que bloques 1-5 */}
      <nav className="navbar navbar-expand-lg shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #00A843 100%)' }}>
        <Container fluid>
          <span className="navbar-brand fw-bold d-flex align-items-center" style={{ color: '#fff' }}>
            <ShoppingBag size={24} className="me-2" style={{ color: '#00C853' }} />
            Panel Empleado
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-2">
              <strong>{user?.full_name}</strong>
              <Badge className="border-0" style={{ background: 'rgba(0,200,83,0.3)', color: '#1a1a1a', padding: '6px 12px', borderRadius: '8px' }}>Empleado</Badge>
            </span>
            <Button variant="outline-light" size="sm" className="rounded-3" onClick={handleLogout}>
              <LogOut size={18} className="me-1" />
              Salir
            </Button>
          </div>
        </Container>
      </nav>

      <Container fluid className="mt-4 px-3 px-md-4">
        <Row>
          {/* Sidebar - compacto y elegante */}
          <Col lg={2} className="mb-4">
            <Card className="panel-card border-0">
              <Card.Body className="p-2">
                <Nav className="flex-column">
                  {[
                    { key: 'orders' as TabKey, icon: ShoppingBag, label: 'Pedidos' },
                    { key: 'new-order' as TabKey, icon: Plus, label: 'Nuevo Pedido' },
                    { key: 'history' as TabKey, icon: History, label: 'Historial' },
                    { key: 'inventory' as TabKey, icon: Package, label: 'Inventario' },
                  ].map(({ key, icon: Icon, label }) => (
                    <Nav.Link
                      key={key}
                      active={activeTab === key}
                      onClick={() => setActiveTab(key)}
                      className={`d-flex align-items-center gap-2 py-2 rounded-3 mb-1 ${activeTab === key ? 'panel-nav-active' : ''}`}
                      style={{
                        fontWeight: activeTab === key ? 600 : 500,
                        color: activeTab === key ? '#00C853' : '#424242',
                        backgroundColor: activeTab === key ? 'rgba(0,200,83,0.1)' : 'transparent',
                      }}
                    >
                      <Icon size={18} />
                      {label}
                    </Nav.Link>
                  ))}
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={10}>
            {activeTab === 'orders' && <EmployeeOrdersDashboard />}

            {activeTab === 'new-order' && (
              <EmployeeOrderForm onOrderCreated={handleOrderCreated} />
            )}

            {activeTab === 'history' && <EmployeeOrderHistory />}

            {activeTab === 'inventory' && (
              <Card className="panel-card">
                <Card.Body className="p-4">
                  <h3 className="mb-4 fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>Vista de Inventario</h3>
                  <div className="panel-empty-state">
                    <div className="display-icon">
                      <Package size={48} />
                    </div>
                    <p className="mb-0">
                      Aquí podrás ver el inventario de productos disponibles.
                      Esta funcionalidad se implementará en las siguientes fases.
                    </p>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

