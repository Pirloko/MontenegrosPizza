import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { Clock, CheckCircle, Truck, Package, RefreshCw, Eye, X, User, Phone, Mail, MapPin, Calendar, DollarSign, Star, MessageSquare } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { deliveryService } from '../../services/deliveryService';
import { ratingService } from '../../services/ratingService';
import { StarRating } from '../StarRating';
import { Database } from '../../types/database';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type User = Database['public']['Tables']['users']['Row'];

const ORDER_STATUSES = {
  received: { label: 'Recibido', color: 'warning', icon: Clock },
  preparing: { label: 'Preparando', color: 'info', icon: Package },
  ready: { label: 'Listo', color: 'primary', icon: CheckCircle },
  on_the_way: { label: 'En Camino', color: 'secondary', icon: Truck },
  delivered: { label: 'Entregado', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'danger', icon: X }
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [orderToPrepare, setOrderToPrepare] = useState<{ id: string; orderNumber: string; deliveryType?: string } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      setError('Error al cargar pedidos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPreparing = async (orderId: string, orderNumber: string) => {
    setOrderToPrepare({ id: orderId, orderNumber });
    setEstimatedTime(30); // Valor por defecto: 30 minutos
    setSelectedDriver('');
    
    // Obtener información del pedido para saber si es delivery
    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        setOrderToPrepare({ id: orderId, orderNumber, deliveryType: order.delivery_type });
        
        // Si es delivery, cargar lista de repartidores
        if (order.delivery_type === 'delivery') {
          const drivers = await deliveryService.getAvailableDrivers();
          setAvailableDrivers(drivers);
        }
      }
    } catch (err: any) {
      console.error('Error loading order info:', err);
    }
    
    setShowTimeModal(true);
  };

  const handleConfirmPreparing = async () => {
    if (!orderToPrepare) return;
    
    try {
      const deliveryUserId = orderToPrepare.deliveryType === 'delivery' && selectedDriver ? selectedDriver : undefined;
      await orderService.updateOrderStatus(orderToPrepare.id, 'preparing', estimatedTime, deliveryUserId);
      await loadOrders();
      setShowTimeModal(false);
      setOrderToPrepare(null);
      setSelectedDriver('');
    } catch (err: any) {
      setError('Error al actualizar estado: ' + err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Recargar la lista
    } catch (err: any) {
      setError('Error al actualizar estado: ' + err.message);
    }
  };

  const getFilteredOrders = () => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES];
    if (!statusConfig) return <Badge bg="secondary">{status}</Badge>;
    
    const IconComponent = statusConfig.icon;
    return (
      <Badge bg={statusConfig.color} className="d-flex align-items-center gap-1">
        <IconComponent size={12} />
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL');
  };

  const getOrderItems = async (orderId: string) => {
    try {
      const order = await orderService.getOrderById(orderId);
      return order?.order_items || [];
    } catch (error) {
      console.error('Error loading order items:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h3>Gestión de Pedidos</h3>
            <Button variant="outline-primary" onClick={loadOrders}>
              <RefreshCw size={18} className="me-1" />
              Actualizar
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filtros de Estado */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setSelectedStatus('all')}
                >
                  Todos ({orders.length})
                </Button>
                {Object.entries(ORDER_STATUSES).map(([status, config]) => {
                  const count = orders.filter(o => o.status === status).length;
                  return (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {config.label} ({count})
                    </Button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de Pedidos */}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Tipo</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOrders().map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.order_number}</strong>
                        </td>
                        <td>{order.customer_name}</td>
                        <td>{order.customer_phone}</td>
                        <td>
                          <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'}>
                            {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                          </Badge>
                        </td>
                        <td>
                          <strong>${order.total.toLocaleString()}</strong>
                        </td>
                        <td>
                          {getStatusBadge(order.status)}
                          {order.status === 'preparing' && (order as any).estimated_ready_time && (
                            <div className="mt-1">
                              <small className="text-muted">
                                ⏱️ Tiempo estimado: {(order as any).estimated_ready_time} min
                              </small>
                            </div>
                          )}
                          {order.status === 'ready' && order.delivery_type === 'pickup' && (order as any).pickup_code && (
                            <div className="mt-1">
                              <Badge bg="dark">
                                🎫 Código: {(order as any).pickup_code}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{formatDate(order.created_at!)}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye size={14} />
                            </Button>
                            
                            {/* Botones de cambio de estado */}
                            {order.status === 'received' && (
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleStartPreparing(order.id, order.order_number)}
                              >
                                Preparar
                              </Button>
                            )}
                            
                            {order.status === 'preparing' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                              >
                                Listo
                              </Button>
                            )}
                            
                            {order.status === 'ready' && order.delivery_type === 'delivery' && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'on_the_way')}
                              >
                                Enviar
                              </Button>
                            )}
                            
                            {(order.status === 'ready' || order.status === 'on_the_way') && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                Entregado
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {getFilteredOrders().length === 0 && (
                <div className="text-center py-5">
                  <Package size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay pedidos con el estado seleccionado</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Tiempo Estimado */}
      <Modal show={showTimeModal} onHide={() => setShowTimeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Estimar Tiempo de Preparación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Pedido: <strong>#{orderToPrepare?.orderNumber}</strong></p>
          <Form.Group className="mb-3">
            <Form.Label>Tiempo estimado (en minutos)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="180"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 30)}
              placeholder="30"
            />
            <Form.Text className="text-muted">
              Ingresa cuántos minutos aproximadamente tardará en estar listo este pedido.
            </Form.Text>
          </Form.Group>
          
          {/* Selector de repartidor solo si es delivery */}
          {orderToPrepare?.deliveryType === 'delivery' && (
            <Form.Group className="mb-3">
              <Form.Label>Asignar Repartidor (opcional)</Form.Label>
              <Form.Select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">-- Seleccionar repartidor --</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name} {driver.phone ? `(${driver.phone})` : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Puedes asignar un repartidor ahora o dejarlo sin asignar. El repartidor podrá tomar el pedido cuando esté listo.
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimeModal(false)}>
            Cancelar
          </Button>
          <Button variant="info" onClick={handleConfirmPreparing}>
            Confirmar y Empezar a Preparar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Detalle del Pedido */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </Container>
  );
}

// Componente para mostrar detalles del pedido
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    loadOrderItems();
    loadRatings();
  }, [order.id]);

  const loadOrderItems = async () => {
    try {
      setLoading(true);
      const items = await getOrderItems(order.id);
      setOrderItems(items);
    } catch (error) {
      console.error('Error loading order items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async () => {
    try {
      setLoadingRatings(true);
      const orderRatings = await ratingService.getRatingsByOrder(order.id);
      setRatings(orderRatings);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const getOrderItems = async (orderId: string) => {
    try {
      const orderData = await orderService.getOrderById(orderId);
      return orderData?.order_items || [];
    } catch (error) {
      console.error('Error loading order items:', error);
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.received;
    const IconComponent = statusInfo.icon;
    return (
      <Badge bg={statusInfo.color} className="d-flex align-items-center gap-1" style={{ fontSize: '14px', padding: '6px 12px' }}>
        <IconComponent size={14} />
        {statusInfo.label}
      </Badge>
    );
  };

  const parseIngredients = (ingredientsJson: string | null) => {
    if (!ingredientsJson) return [];
    try {
      return JSON.parse(ingredientsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Package size={20} />
              Detalle del Pedido #{order.order_number}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="danger" />
                <p className="mt-3">Cargando detalles...</p>
              </div>
            ) : (
              <>
                <Row>
                  {/* Información del Cliente */}
                  <Col md={6}>
                    <Card className="mb-3 shadow-sm h-100">
                      <Card.Header className="bg-info text-white">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <User size={16} />
                          Información del Cliente
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-block mb-1">Nombre:</small>
                          <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_name}</p>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                            <Phone size={14} />
                            Teléfono:
                          </small>
                          <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_phone}</p>
                        </div>
                        {order.customer_email && (
                          <div className="mb-3">
                            <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                              <Mail size={14} />
                              Email:
                            </small>
                            <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_email}</p>
                          </div>
                        )}
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-block mb-1">Tipo de Entrega:</small>
                          <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'} style={{ fontSize: '14px', padding: '6px 12px' }}>
                            {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Retiro en tienda'}
                          </Badge>
                        </div>
                        {order.delivery_address && (
                          <div className="mb-3">
                            <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                              <MapPin size={14} />
                              Dirección:
                            </small>
                            <p className="mb-0" style={{ fontSize: '15px' }}>{order.delivery_address}</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Información del Pedido */}
                  <Col md={6}>
                    <Card className="mb-3 shadow-sm h-100">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <Package size={16} />
                          Información del Pedido
                        </h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                            <Calendar size={14} />
                            Fecha:
                          </small>
                          <p className="mb-0" style={{ fontSize: '15px' }}>{new Date(order.created_at!).toLocaleString('es-CL')}</p>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-block mb-1">Estado:</small>
                          <div>{getStatusBadge(order.status)}</div>
                          {order.status === 'ready' && order.delivery_type === 'pickup' && (order as any).pickup_code && (
                            <div className="mt-2">
                              <div className="alert alert-info mb-0 p-2">
                                <small className="fw-bold d-block mb-1">🎫 Código de retiro:</small>
                                <Badge bg="dark" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
                                  {(order as any).pickup_code}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                            <DollarSign size={14} />
                            Subtotal:
                          </small>
                          <p className="mb-0" style={{ fontSize: '15px' }}>${order.subtotal.toLocaleString('es-CL')}</p>
                        </div>
                        {order.discount && order.discount > 0 && (
                          <div className="mb-3">
                            <small className="text-muted fw-bold d-block mb-1">Descuento:</small>
                            <p className="mb-0 text-success fw-bold" style={{ fontSize: '15px' }}>-${order.discount.toLocaleString('es-CL')}</p>
                          </div>
                        )}
                        <div className="mb-3">
                          <small className="text-muted fw-bold d-block mb-1">Total:</small>
                          <p className="mb-0 fw-bold text-success" style={{ fontSize: '18px' }}>${order.total.toLocaleString('es-CL')}</p>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Notas */}
                {order.notes && (
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0 fw-bold">📋 Notas del Pedido</h6>
                    </Card.Header>
                    <Card.Body>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{order.notes}</p>
                    </Card.Body>
                  </Card>
                )}

                {/* Calificaciones */}
                {ratings.length > 0 && (
                  <Card className="mb-3 shadow-sm">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                        <Star size={16} />
                        Calificaciones del Cliente
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      {loadingRatings ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" variant="warning" />
                        </div>
                      ) : (
                        <Row>
                          {ratings.map((rating) => (
                            <Col md={rating.rating_type === 'service' ? 12 : 6} key={rating.id} className="mb-3">
                              <div className="p-3 border rounded" style={{ background: rating.rating_type === 'service' ? '#fff3cd' : '#e7f3ff', height: '100%' }}>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  {rating.rating_type === 'service' ? (
                                    <MessageSquare size={18} className="text-warning" />
                                  ) : (
                                    <Truck size={18} className="text-info" />
                                  )}
                                  <strong className={rating.rating_type === 'service' ? 'text-warning' : 'text-info'}>
                                    {rating.rating_type === 'service' ? 'Calificación de Atención' : 'Calificación de Delivery'}
                                  </strong>
                                </div>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  <StarRating rating={rating.rating} size={20} />
                                  <Badge bg={rating.rating >= 4.5 ? 'success' : rating.rating >= 4 ? 'info' : rating.rating >= 3 ? 'warning' : 'danger'}>
                                    {rating.rating}/5
                                  </Badge>
                                </div>
                                {rating.comment && (
                                  <div className="mt-2">
                                    <small className="text-muted fw-bold d-block mb-1">Comentario:</small>
                                    <p className="mb-0 small" style={{ fontSize: '14px' }}>"{rating.comment}"</p>
                                  </div>
                                )}
                                <small className="text-muted d-block mt-2">
                                  {new Date(rating.created_at).toLocaleDateString('es-CL', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* Productos */}
                <Card className="shadow-sm">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0 fw-bold">Productos del Pedido</h6>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" variant="success" />
                        <p className="mt-2 text-muted small">Cargando productos...</p>
                      </div>
                    ) : orderItems.length === 0 ? (
                      <div className="text-center py-3">
                        <Package size={48} className="text-muted mb-2" />
                        <p className="text-muted mb-0">No se encontraron productos</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="fw-bold">Producto</th>
                              <th className="fw-bold text-center">Cantidad</th>
                              <th className="fw-bold text-end">Precio Unit.</th>
                              <th className="fw-bold text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderItems.map((item, index) => {
                              const addedIngredients = parseIngredients(item.added_ingredients);
                              const removedIngredients = parseIngredients(item.removed_ingredients);
                              
                              return (
                                <tr key={index} style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                  <td>
                                    <div>
                                      <strong style={{ fontSize: '15px' }}>{item.product_name}</strong>
                                      {addedIngredients.length > 0 && (
                                        <div className="mt-1">
                                          <small className="text-success fw-bold d-block mb-1">✓ Ingredientes Extra:</small>
                                          <div className="d-flex flex-wrap gap-1">
                                            {addedIngredients.map((ing: any, idx: number) => (
                                              <Badge key={idx} bg="success" className="px-2 py-1" style={{ fontSize: '11px' }}>
                                                +{ing.name || ing}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {removedIngredients.length > 0 && (
                                        <div className="mt-1">
                                          <small className="text-danger fw-bold d-block mb-1">✗ Sin:</small>
                                          <div className="d-flex flex-wrap gap-1">
                                            {removedIngredients.map((ing: string, idx: number) => (
                                              <Badge key={idx} bg="danger" className="px-2 py-1" style={{ fontSize: '11px' }}>
                                                -{ing}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {item.special_instructions && (
                                        <div className="mt-2 p-2 rounded" style={{ background: '#fffbf0', border: '1px solid #ffc107' }}>
                                          <small className="text-warning fw-bold d-block mb-1">📝 Instrucciones:</small>
                                          <small className="text-muted">{item.special_instructions}</small>
                                        </div>
                                      )}
                                      {item.extra_ingredients_cost > 0 && (
                                        <div className="mt-1">
                                          <Badge bg="info" className="px-2 py-1" style={{ fontSize: '11px' }}>
                                            Costo extra: +${item.extra_ingredients_cost.toLocaleString('es-CL')}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <Badge bg="secondary" style={{ fontSize: '14px', padding: '6px 12px' }}>
                                      {item.quantity}
                                    </Badge>
                                  </td>
                                  <td className="text-end" style={{ fontSize: '15px' }}>
                                    ${item.product_price.toLocaleString('es-CL')}
                                  </td>
                                  <td className="text-end">
                                    <strong className="text-success" style={{ fontSize: '15px' }}>
                                      ${item.subtotal.toLocaleString('es-CL')}
                                    </strong>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}
          </div>
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <Button variant="secondary" onClick={onClose} style={{ padding: '8px 20px' }}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
