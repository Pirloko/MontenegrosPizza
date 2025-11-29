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
    <div className="min-vh-100 bg-light">
      {/* Top Navigation Bar */}
      <nav className="navbar navbar-dark bg-warning navbar-expand-lg shadow-sm">
        <Container fluid>
          <span className="navbar-brand fw-bold text-dark">
            <ShoppingBag size={24} className="me-2" />
            Panel de Empleado
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-dark">
              <strong>{user?.full_name}</strong>
              <span className="badge bg-dark ms-2">Empleado</span>
            </span>
            <Button variant="outline-dark" size="sm" onClick={handleLogout}>
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
                    active={activeTab === 'orders'}
                    onClick={() => setActiveTab('orders')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <ShoppingBag size={18} />
                    Pedidos
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'new-order'}
                    onClick={() => setActiveTab('new-order')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Plus size={18} />
                    Nuevo Pedido
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <History size={18} />
                    Historial
                  </Nav.Link>
                  <Nav.Link 
                    active={activeTab === 'inventory'}
                    onClick={() => setActiveTab('inventory')}
                    className="d-flex align-items-center gap-2 py-2"
                  >
                    <Package size={18} />
                    Inventario
                  </Nav.Link>
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
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <h3 className="mb-4">Vista de Inventario</h3>
                  <div className="p-4 bg-light rounded text-center">
                    <Package size={48} className="text-muted mb-3" />
                    <p className="text-muted mb-0">
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

