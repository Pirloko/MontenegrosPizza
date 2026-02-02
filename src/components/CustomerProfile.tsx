import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { User, Award, History, Package, Clock, CheckCircle, XCircle, Truck, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { ratingService } from '../services/ratingService';
import { Database } from '../types/database';
import OrderDetailsModal from './OrderDetailsModal';
import CustomerDeliveryTracking from './CustomerDeliveryTracking';
import { RatingModal } from './RatingModal';

type Order = Database['public']['Tables']['orders']['Row'];

export default function CustomerProfile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [orderToRate, setOrderToRate] = useState<Order | null>(null);
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
    loadRatedOrders();
  }, []);

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
      
      console.log('🔄 Cargando pedidos para perfil cliente:', user.email);
      const userOrders = await orderService.getOrdersByCustomerEmail(user.email);
      console.log(`✅ Pedidos del perfil cargados: ${userOrders.length}`);
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
    loadRatedOrders();
  };

  const getStatusBadge = (status: string, deliveryType?: string) => {
    const statusConfig: Record<string, { badgeClass: string; icon: typeof Clock; text: string }> = {
      received: { badgeClass: 'order-badge-received', icon: Clock, text: 'Recibido' },
      preparing: { badgeClass: 'order-badge-preparing', icon: Package, text: 'Preparando' },
      ready: { badgeClass: 'order-badge-ready', icon: CheckCircle, text: deliveryType === 'pickup' ? 'Listo para retirar' : 'Listo para entrega' },
      on_the_way: { badgeClass: 'order-badge-on_the_way', icon: Truck, text: 'En Camino' },
      delivered: { badgeClass: 'order-badge-delivered', icon: CheckCircle, text: 'Entregado' },
      cancelled: { badgeClass: 'order-badge-cancelled', icon: XCircle, text: 'Cancelado' }
    };
    const config = statusConfig[status] || statusConfig.received;
    const IconComponent = config.icon;
    return (
      <Badge className={`d-inline-flex align-items-center gap-1 ${config.badgeClass}`} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none' }}>
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
          <Spinner animation="border" style={{ color: '#00C853' }} />
          <p className="mt-3 text-brand-gray-muted">Cargando perfil...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="g-4">
        {/* Información del Usuario */}
        <Col lg={4}>
          <Card className="panel-card h-100">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #00C853 0%, #00A843 100%)', color: '#1a1a1a' }}
                >
                  <User size={32} />
                </div>
                <h4 className="mb-1 fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>{user?.full_name || 'Usuario'}</h4>
                <p className="text-brand-gray-muted mb-0 small">{user?.email}</p>
              </div>

              {/* Puntos de Lealtad */}
              <Card className="border-0 mb-3 rounded-3 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,213,79,0.2) 0%, rgba(255,248,225,0.5) 100%)', border: '1px solid rgba(255,213,79,0.3)' }}>
                <Card.Body className="text-center py-3">
                  <Award size={24} className="mb-2" style={{ color: '#E65100' }} />
                  <h3 className="mb-1 fw-bold" style={{ color: '#1a1a1a' }}>{user?.loyalty_points || 0}</h3>
                  <p className="mb-0 small text-brand-gray-muted">Puntos de Lealtad</p>
                </Card.Body>
              </Card>

              {/* Información Adicional */}
              <div className="border-top pt-3" style={{ borderColor: '#eee !important' }}>
                <h6 className="fw-bold mb-3" style={{ color: '#1a1a1a' }}>Información de Cuenta</h6>
                <div className="mb-2">
                  <small className="text-brand-gray-muted">Miembro desde:</small>
                  <p className="mb-0" style={{ color: '#1a1a1a' }}>{user?.created_at ? formatDate(user.created_at) : 'No disponible'}</p>
                </div>
                <div className="mb-2">
                  <small className="text-brand-gray-muted">Total de pedidos:</small>
                  <p className="mb-0 fw-semibold" style={{ color: '#1a1a1a' }}>{orders.length}</p>
                </div>
                <div>
                  <small className="text-brand-gray-muted">Estado:</small>
                  <p className="mb-0">
                    <Badge className="order-badge-delivered" style={{ padding: '6px 12px', borderRadius: '8px' }}>Activo</Badge>
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Historial de Pedidos */}
        <Col lg={8}>
          <Card className="panel-card">
            <Card.Header className="bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0 d-flex align-items-center fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>
                  <History size={20} className="me-2" style={{ color: '#00C853' }} />
                  Historial de Pedidos
                </h5>
                <Button variant="outline-secondary" size="sm" className="rounded-3" onClick={loadOrders}>
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
                <div className="panel-empty-state">
                  <div className="display-icon">
                    <Package size={40} />
                  </div>
                  <h6 className="fw-semibold mb-2">No tienes pedidos aún</h6>
                  <p className="small mb-0">Cuando hagas tu primer pedido, aparecerá aquí.</p>
                </div>
              ) : (
                <>
                  {/* Pedidos Activos */}
                  {(() => {
                    const activeOrders = orders.filter(o => ['received', 'preparing', 'ready', 'on_the_way'].includes(o.status));
                    if (activeOrders.length > 0) {
                      return (
                        <>
                          <div className="px-4 py-3 border-bottom" style={{ backgroundColor: 'rgba(0,200,83,0.06)', borderColor: '#eee' }}>
                            <strong style={{ color: '#00C853' }}>🔔 Pedidos Activos ({activeOrders.length})</strong>
                          </div>
                          <div className="list-group list-group-flush">
                            {activeOrders.map((order) => (
                              <div key={order.id} className="list-group-item border-0 border-bottom bg-light">
                                {/* Mapa de tracking si está en camino */}
                                {order.status === 'on_the_way' && order.delivery_type === 'delivery' && (
                                  <div className="mb-3">
                                    <CustomerDeliveryTracking order={order} />
                                  </div>
                                )}
                                
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-1">Pedido #{order.id.slice(-8)}</h6>
                                    <small className="text-muted">{formatDate(order.created_at)}</small>
                                  </div>
                                  <div className="text-end">
                                    {getStatusBadge(order.status, order.delivery_type)}
                                    {order.status === 'ready' && order.delivery_type === 'pickup' && (order as any).pickup_code && (
                                      <div className="mt-2">
                                        <div className="alert alert-success mb-0 p-2" style={{ fontSize: '0.875rem' }}>
                                          <strong>🎫 Tu código de retiro:</strong>
                                          <div className="mt-1">
                                            <Badge bg="dark" style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem' }}>
                                              {(order as any).pickup_code}
                                            </Badge>
                                          </div>
                                          <small className="d-block mt-2">Muestra este código al empleado cuando retires tu pedido</small>
                                        </div>
                                      </div>
                                    )}
                                    {order.status === 'preparing' && (() => {
                                      const estimatedTime = (order as any).estimated_ready_time;
                                      if (estimatedTime) {
                                        const now = new Date();
                                        const startedAt = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at!);
                                        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
                                        const remaining = estimatedTime - elapsed;
                                        
                                        return (
                                          <div className="mt-2">
                                            <Badge bg={remaining > 0 ? 'info' : 'warning'} className="mt-1">
                                              <Clock size={12} className="me-1" />
                                              {remaining > 0 ? `${remaining} min restantes` : 'Casi listo'}
                                            </Badge>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="fw-bold" style={{ color: '#00C853' }}>${order.total.toLocaleString('es-CL')}</span>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-3"
                                    onClick={() => handleShowDetails(order)}
                                  >
                                    Ver Detalles
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Historial de Pedidos */}
                  {(() => {
                    const historyOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
                    if (historyOrders.length > 0) {
                      return (
                        <>
                          <div className="px-4 py-3 border-bottom" style={{ backgroundColor: '#F5F5F5', borderColor: '#eee' }}>
                            <strong className="text-brand-gray-muted">📋 Historial ({historyOrders.length})</strong>
                          </div>
                          <div className="list-group list-group-flush">
                            {historyOrders.map((order) => (
                              <div key={order.id} className="list-group-item border-0 border-bottom">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="mb-1">Pedido #{order.id.slice(-8)}</h6>
                                    <small className="text-muted">{formatDate(order.created_at)}</small>
                                  </div>
                                  <div className="text-end">
                                    {getStatusBadge(order.status, order.delivery_type)}
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="fw-bold">${order.total.toLocaleString()}</span>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => handleShowDetails(order)}
                                    >
                                      Ver Detalles
                                    </Button>
                                    {order.status === 'delivered' && !ratedOrders.has(order.id) && (
                                    <Button
                                      size="sm"
                                      className="rounded-3 panel-btn-primary"
                                      onClick={() => handleOpenRatingModal(order)}
                                    >
                                      <Star size={14} className="me-1" />
                                      Calificar
                                    </Button>
                                    )}
                                    {ratedOrders.has(order.id) && (
                                      <Badge className="order-badge-delivered align-self-center" style={{ padding: '6px 10px' }}>
                                        ✓ Calificado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
