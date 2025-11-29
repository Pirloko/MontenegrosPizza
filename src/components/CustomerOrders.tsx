import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { History, Package, Clock, CheckCircle, XCircle, RefreshCw, Truck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { ratingService } from '../services/ratingService';
import { Database } from '../types/database';
import OrderDetailsModal from './OrderDetailsModal';
import CustomerDeliveryTracking from './CustomerDeliveryTracking';
import { RatingModal } from './RatingModal';
import { Pagination, usePagination } from './Pagination';

type Order = Database['public']['Tables']['orders']['Row'];

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(new Set());

  // Filtrar pedidos del historial (entregados y cancelados)
  const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
  
  // Hook de paginación debe estar siempre al nivel superior
  const { currentItems, currentPage, totalPages, goToPage, resetPage } = usePagination(historyOrders, 5);

  useEffect(() => {
    loadOrders();
    loadRatedOrders();
  }, []);

  // Resetear paginación cuando cambien los pedidos del historial
  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOrders.length]);

  const loadRatedOrders = async () => {
    if (!user?.id) return;
    
    try {
      const ratings = await ratingService.getUserRatings(user.id);
      const ratedOrderIds = new Set(ratings.map(r => r.order_id));
      setRatedOrders(ratedOrderIds);
    } catch (err) {
      console.error('Error loading rated orders:', err);
    }
  };

  const loadOrders = async () => {
    if (!user?.email) {
      console.warn('⚠️ No hay email de usuario disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Cargando pedidos para cliente:', user.email);
      const userOrders = await orderService.getOrdersByCustomerEmail(user.email);
      console.log(`✅ Pedidos del cliente cargados: ${userOrders.length}`);
      setOrders(userOrders);
    } catch (err: any) {
      console.error('❌ Error loading orders:', err);
      setError('Error al cargar el historial de pedidos: ' + (err.message || 'Error desconocido'));
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

  const handleOpenRatingModal = (order: Order) => {
    setOrderToRate(order);
    setShowRatingModal(true);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setOrderToRate(null);
  };

  const handleRatingSubmitted = () => {
    if (orderToRate) {
      setRatedOrders(new Set([...ratedOrders, orderToRate.id]));
    }
    loadRatedOrders(); // Recargar lista de pedidos calificados
  };

  const getStatusBadge = (status: string, deliveryType?: string) => {
    const statusConfig = {
      'received': { variant: 'primary', icon: Clock, text: 'Recibido' },
      'preparing': { variant: 'warning', icon: Package, text: 'Preparando' },
      'ready': { 
        variant: 'info', 
        icon: CheckCircle, 
        text: deliveryType === 'pickup' ? 'Listo para retirar' : 'Listo para entrega'
      },
      'on_the_way': { variant: 'secondary', icon: Truck, text: 'En Camino' },
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

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando pedidos...</p>
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
              Mis Pedidos
            </h4>
            <Button variant="outline-primary" size="sm" onClick={loadOrders}>
              <RefreshCw size={16} className="me-1" />
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

          {orders.length === 0 ? (
            <div className="text-center py-5">
              <Package size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No tienes pedidos aún</h5>
              <p className="text-muted">Cuando hagas tu primer pedido, aparecerá aquí.</p>
              <Button variant="primary" href="/">
                Hacer Pedido
              </Button>
            </div>
          ) : (
            <>
              {/* Pedidos Activos */}
              {(() => {
                const activeOrders = orders.filter(o => ['received', 'preparing', 'ready', 'on_the_way'].includes(o.status));
                if (activeOrders.length > 0) {
                  return (
                    <>
                      <div className="bg-light px-4 py-3 border-bottom">
                        <h5 className="mb-0 text-primary">🔔 Pedidos Activos ({activeOrders.length})</h5>
                      </div>
                      <div className="list-group list-group-flush">
                        {activeOrders.map((order) => (
                          <div key={order.id} className="list-group-item border-0 border-bottom p-4 bg-light">
                            {/* Mapa de tracking si está en camino */}
                            {order.status === 'on_the_way' && order.delivery_type === 'delivery' && (
                              <div className="mb-3">
                                <CustomerDeliveryTracking order={order} />
                              </div>
                            )}
                            
                            <Row className="align-items-center">
                              <Col md={8}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h5 className="mb-1">Pedido #{order.id.slice(-8)}</h5>
                                    <p className="text-muted mb-0">{formatDate(order.created_at)}</p>
                                  </div>
                                  <div>
                                    {getStatusBadge(order.status, order.delivery_type)}
                                    {order.status === 'ready' && order.delivery_type === 'pickup' && (order as any).pickup_code && (
                                      <div className="mt-2">
                                        <div className="alert alert-success mb-0 p-3">
                                          <strong className="d-block mb-2">🎫 Tu código de retiro:</strong>
                                          <Badge bg="dark" style={{ fontSize: '2rem', padding: '1rem 2rem' }}>
                                            {(order as any).pickup_code}
                                          </Badge>
                                          <p className="mb-0 mt-2 small">Muestra este código al empleado cuando retires tu pedido</p>
                                        </div>
                                      </div>
                                    )}
                                    {order.status === 'preparing' && (() => {
                                      const estimatedTime = (order as any).estimated_ready_time;
                                      if (estimatedTime != null && estimatedTime !== undefined) {
                                        const now = new Date();
                                        const startedAt = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at!);
                                        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
                                        const remaining = Math.max(0, estimatedTime - elapsed);
                                        
                                        return (
                                          <div className="mt-2">
                                            <Badge bg={remaining > 0 ? 'info' : 'warning'} className="mt-1" style={{ fontSize: '1rem' }}>
                                              ⏱️ {remaining > 0 ? `${remaining} min restantes` : 'Casi listo'}
                                            </Badge>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </Col>
                              <Col md={4} className="text-end">
                                <h4 className="text-success mb-3">${order.total.toLocaleString()}</h4>
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
                    </>
                  );
                }
                return null;
              })()}
              
              {/* Historial de Pedidos con Paginación */}
              {historyOrders.length > 0 && (
                <>
                  <div className="bg-light px-4 py-3 border-bottom">
                    <h6 className="mb-0 text-muted">📋 Historial ({historyOrders.length})</h6>
                  </div>
                  <div className="list-group list-group-flush">
                    {currentItems.map((order) => (
                      <div key={order.id} className="list-group-item border-0 border-bottom p-4">
                        <Row className="align-items-center">
                          <Col md={8}>
                            <div className="mb-2">
                              <h6 className="mb-1">Pedido #{order.id.slice(-8)}</h6>
                              <p className="text-muted mb-0 small">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="mb-2">
                              {getStatusBadge(order.status, order.delivery_type)}
                            </div>
                            <div className="small">
                              <span className="text-muted">Total:</span> <strong>${order.total.toLocaleString()}</strong>
                            </div>
                          </Col>
                          <Col md={4} className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => handleShowDetails(order)}
                              >
                                Ver Detalles
                              </Button>
                              {order.status === 'delivered' && !ratedOrders.has(order.id) && (
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleOpenRatingModal(order)}
                                >
                                  <Star size={14} className="me-1" />
                                  Calificar
                                </Button>
                              )}
                              {ratedOrders.has(order.id) && (
                                <Badge bg="success" className="align-self-center">
                                  ✓ Calificado
                                </Badge>
                              )}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                  
                  {/* Paginación del historial */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Detalles del Pedido */}
      <OrderDetailsModal
        show={showDetailsModal}
        onHide={handleCloseDetails}
        order={selectedOrder}
      />

      {/* Modal de Calificación */}
      {orderToRate && user && (
        <RatingModal
          show={showRatingModal}
          onHide={handleCloseRatingModal}
          orderId={orderToRate.id}
          userId={user.id}
          deliveryUserId={orderToRate.delivery_user_id || null}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Container>
  );
}
