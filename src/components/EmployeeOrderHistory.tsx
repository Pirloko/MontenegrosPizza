import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner, Row, Col, Badge, Form, Tabs, Tab } from 'react-bootstrap';
import { History, Clock, CheckCircle, XCircle, Package, Truck, Filter, Search, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { Database } from '../types/database';
import OrderDetailsModal from './OrderDetailsModal';

type Order = Database['public']['Tables']['orders']['Row'];

export default function EmployeeOrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const allOrders = await orderService.getAllOrders();
      setOrders(allOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError('Error al cargar el historial de pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'received': { variant: 'primary', icon: Clock, text: 'Recibido' },
      'preparing': { variant: 'warning', icon: Package, text: 'Preparando' },
      'ready': { variant: 'info', icon: CheckCircle, text: 'Listo' },
      'delivered': { variant: 'success', icon: CheckCircle, text: 'Entregado' },
      'cancelled': { variant: 'danger', icon: XCircle, text: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.received;
    const IconComponent = config.icon;

    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderType = (order: Order) => {
    // Si el pedido tiene un empleado asignado, fue registrado por empleado
    // Si no, fue recibido online
    return order.employee_id ? 'Registrado por Empleado' : 'Recibido Online';
  };

  const getOrderTypeBadge = (order: Order) => {
    const isEmployeeOrder = order.employee_id;
    return (
      <Badge bg={isEmployeeOrder ? 'success' : 'info'}>
        {isEmployeeOrder ? 'Registrado' : 'Online'}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    // Filtro por estado
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      const isEmployeeOrder = order.employee_id;
      if (filterType === 'employee' && !isEmployeeOrder) return false;
      if (filterType === 'online' && isEmployeeOrder) return false;
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por fecha
    if (dateFilter) {
      const orderDate = new Date(order.created_at).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      return orderDate === filterDate;
    }

    return true;
  });

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      received: orders.filter(o => o.status === 'received').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando historial...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0 d-flex align-items-center">
              <History size={24} className="me-2" />
              Historial de Pedidos
            </h4>
            <Button variant="outline-primary" size="sm" onClick={loadOrders}>
              Actualizar
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          )}

          {/* Filtros */}
          <div className="p-3 bg-light border-bottom">
            <Row className="g-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Estado</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Todos ({statusCounts.all})</option>
                    <option value="received">Recibidos ({statusCounts.received})</option>
                    <option value="preparing">Preparando ({statusCounts.preparing})</option>
                    <option value="ready">Listos ({statusCounts.ready})</option>
                    <option value="delivered">Entregados ({statusCounts.delivered})</option>
                    <option value="cancelled">Cancelados ({statusCounts.cancelled})</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Tipo</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="employee">Registrados por Empleado</option>
                    <option value="online">Recibidos Online</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Buscar</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Cliente, teléfono, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Fecha</Form.Label>
                  <Form.Control
                    size="sm"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Lista de pedidos */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <History size={64} className="text-muted mb-3" />
              <h6 className="text-muted">No hay pedidos que coincidan con los filtros</h6>
              <p className="text-muted small">Ajusta los filtros para ver más resultados.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredOrders.map((order) => (
                <div key={order.id} className="list-group-item border-0 border-bottom p-4">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">Pedido #{order.id.slice(-8)}</h6>
                          <p className="text-muted mb-0">{formatDateShort(order.created_at)}</p>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-sm-6">
                          <small className="text-muted">Cliente:</small>
                          <p className="mb-1">{order.customer_name}</p>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted">Teléfono:</small>
                          <p className="mb-1">{order.customer_phone}</p>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-sm-6">
                          <small className="text-muted">Tipo de entrega:</small>
                          <p className="mb-1">
                            {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro en tienda'}
                          </p>
                        </div>
                        <div className="col-sm-6">
                          <small className="text-muted">Total:</small>
                          <p className="mb-1 fw-bold text-success">${order.total.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-2 d-flex align-items-center gap-2">
                        <small className="text-muted">Tipo:</small>
                        {getOrderTypeBadge(order)}
                        {order.points_used > 0 && (
                          <Badge bg="warning">
                            {order.points_used} pts usados
                          </Badge>
                        )}
                      </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-3 mt-md-0">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleShowDetails(order)}
                      >
                        Ver Detalles
                      </Button>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Detalles del Pedido */}
      <OrderDetailsModal
        show={showDetailsModal}
        onHide={handleCloseDetails}
        order={selectedOrder}
      />
    </Container>
  );
}
