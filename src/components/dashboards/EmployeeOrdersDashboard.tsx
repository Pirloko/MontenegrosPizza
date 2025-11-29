import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Modal, Form, Collapse } from 'react-bootstrap';
import { Clock, CheckCircle, Truck, Package, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { deliveryService } from '../../services/deliveryService';
import { Database } from '../../types/database';
import { supabase } from '../../lib/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

const ORDER_STATUSES = {
  received: { label: 'Recibido', color: 'warning', icon: Clock },
  preparing: { label: 'Preparando', color: 'info', icon: Package },
  ready: { label: 'Listo', color: 'primary', icon: CheckCircle },
  on_the_way: { label: 'En Camino', color: 'secondary', icon: Truck },
  delivered: { label: 'Entregado', color: 'success', icon: CheckCircle }
};

export default function EmployeeOrdersDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [orderToPrepare, setOrderToPrepare] = useState<{ id: string; orderNumber: string; deliveryType?: string } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [availableDrivers, setAvailableDrivers] = useState<Database['public']['Tables']['users']['Row'][]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando pedidos para empleado...');
      
      // Cargar pedidos activos con sus items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .in('status', ['received', 'preparing', 'ready', 'on_the_way'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const activeOrders = (data || []) as OrderWithItems[];
      console.log(`✅ Pedidos activos encontrados: ${activeOrders.length}`);
      setOrders(activeOrders);
    } catch (err: any) {
      console.error('❌ Error cargando pedidos:', err);
      setError('Error al cargar pedidos: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const parseIngredients = (ingredientsJson: any) => {
    if (!ingredientsJson) return [];
    if (typeof ingredientsJson === 'string') {
      try {
        return JSON.parse(ingredientsJson);
      } catch {
        return [];
      }
    }
    return Array.isArray(ingredientsJson) ? ingredientsJson : [];
  };

  const renderOrderItems = (order: OrderWithItems) => {
    const items = order.order_items || [];
    if (items.length === 0) {
      return <p className="text-muted small mb-0">No hay productos en este pedido</p>;
    }

    return (
      <div className="mt-3 border-top pt-3">
        <h6 className="mb-2 fw-bold">Productos del Pedido:</h6>
        {items.map((item, index) => {
          const removedIngredients = parseIngredients(item.removed_ingredients);
          const addedIngredients = parseIngredients(item.added_ingredients);
          
          return (
            <div key={item.id || index} className="mb-3 p-2 bg-light rounded">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div className="flex-grow-1">
                  <strong className="d-block">{item.product_name}</strong>
                  <small className="text-muted">
                    Cantidad: {item.quantity} x ${item.product_price.toLocaleString()} = ${item.subtotal.toLocaleString()}
                  </small>
                </div>
                {item.extra_ingredients_cost > 0 && (
                  <Badge bg="success" className="ms-2">
                    +${item.extra_ingredients_cost.toLocaleString()} extras
                  </Badge>
                )}
              </div>
              
              {removedIngredients.length > 0 && (
                <div className="mt-2">
                  <small className="text-danger">
                    <strong>Sin:</strong> {removedIngredients.join(', ')}
                  </small>
                </div>
              )}
              
              {addedIngredients.length > 0 && (
                <div className="mt-1">
                  <small className="text-success">
                    <strong>Extra:</strong> {Array.isArray(addedIngredients) 
                      ? addedIngredients.map((ing: any) => 
                          typeof ing === 'object' && ing.name ? ing.name : String(ing)
                        ).join(', ')
                      : String(addedIngredients)
                    }
                  </small>
                </div>
              )}
              
              {item.special_instructions && (
                <div className="mt-2">
                  <small className="text-info">
                    <strong>📝 Instrucciones:</strong> {item.special_instructions}
                  </small>
                </div>
              )}
            </div>
          );
        })}
        
        {order.notes && (
          <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
            <small>
              <strong>📌 Notas del pedido:</strong> {order.notes}
            </small>
          </div>
        )}
      </div>
    );
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
      await loadOrders();
    } catch (err: any) {
      setError('Error al actualizar estado: ' + err.message);
    }
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

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
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
            <h3>Pedidos Activos</h3>
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

      {/* Resumen de Estados */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body className="text-center">
              <Clock size={32} className="mb-2" />
              <h4>{getOrdersByStatus('received').length}</h4>
              <p className="mb-0">Recibidos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body className="text-center">
              <Package size={32} className="mb-2" />
              <h4>{getOrdersByStatus('preparing').length}</h4>
              <p className="mb-0">Preparando</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <CheckCircle size={32} className="mb-2" />
              <h4>{getOrdersByStatus('ready').length}</h4>
              <p className="mb-0">Listos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-secondary text-white">
            <Card.Body className="text-center">
              <Truck size={32} className="mb-2" />
              <h4>{getOrdersByStatus('on_the_way').length}</h4>
              <p className="mb-0">En Camino</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lista de Pedidos por Estado */}
      <Row>
        {/* Pedidos Recibidos */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Clock className="me-2" />
                Pedidos Recibidos ({getOrdersByStatus('received').length})
              </h5>
            </Card.Header>
            <Card.Body>
              {getOrdersByStatus('received').length === 0 ? (
                <p className="text-muted text-center mb-0">No hay pedidos recibidos</p>
              ) : (
                <div className="space-y-2">
                  {getOrdersByStatus('received').map((order) => (
                    <div key={order.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">#{order.order_number}</h6>
                          <p className="mb-1"><strong>{order.customer_name}</strong></p>
                          <p className="mb-1 text-muted">{order.customer_phone}</p>
                          <small className="text-muted">{formatDate(order.created_at!)}</small>
                        </div>
                        <div className="text-end">
                          <h6 className="mb-1">${order.total.toLocaleString()}</h6>
                          <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'}>
                            {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100 mb-2"
                        onClick={() => toggleOrderExpanded(order.id)}
                      >
                        {expandedOrders.has(order.id) ? (
                          <>
                            <ChevronUp size={16} className="me-1" />
                            Ocultar Productos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} className="me-1" />
                            Ver Productos
                          </>
                        )}
                      </Button>
                      
                      <Collapse in={expandedOrders.has(order.id)}>
                        <div>
                          {renderOrderItems(order)}
                        </div>
                      </Collapse>
                      
                      <Button
                        variant="info"
                        size="sm"
                        className="w-100 mt-2"
                        onClick={() => handleStartPreparing(order.id, order.order_number)}
                      >
                        <Package className="me-1" />
                        Empezar a Preparar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pedidos Preparando */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Package className="me-2" />
                Preparando ({getOrdersByStatus('preparing').length})
              </h5>
            </Card.Header>
            <Card.Body>
              {getOrdersByStatus('preparing').length === 0 ? (
                <p className="text-muted text-center mb-0">No hay pedidos en preparación</p>
              ) : (
                <div className="space-y-2">
                  {getOrdersByStatus('preparing').map((order) => {
                    // Calcular tiempo restante si hay tiempo estimado
                    const estimatedTime = (order as any).estimated_ready_time;
                    let timeInfo = null;
                    if (estimatedTime) {
                      const now = new Date();
                      const createdAt = new Date(order.created_at!);
                      const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60)); // minutos transcurridos
                      const remaining = estimatedTime - elapsed;
                      timeInfo = {
                        total: estimatedTime,
                        elapsed,
                        remaining: remaining > 0 ? remaining : 0
                      };
                    }
                    
                    return (
                      <div key={order.id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">#{order.order_number}</h6>
                            <p className="mb-1"><strong>{order.customer_name}</strong></p>
                            <p className="mb-1 text-muted">{order.customer_phone}</p>
                            <small className="text-muted">{formatDate(order.created_at!)}</small>
                            {timeInfo && (
                              <div className="mt-2">
                                <Badge bg={timeInfo.remaining > 0 ? 'info' : 'warning'}>
                                  {timeInfo.remaining > 0 
                                    ? `⏱️ ~${timeInfo.remaining} min restantes`
                                    : `⏱️ Tiempo estimado: ${timeInfo.total} min`
                                  }
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="text-end">
                            <h6 className="mb-1">${order.total.toLocaleString()}</h6>
                            <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'}>
                              {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="w-100 mb-2"
                          onClick={() => toggleOrderExpanded(order.id)}
                        >
                          {expandedOrders.has(order.id) ? (
                            <>
                              <ChevronUp size={16} className="me-1" />
                              Ocultar Productos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} className="me-1" />
                              Ver Productos
                            </>
                          )}
                        </Button>
                        
                        <Collapse in={expandedOrders.has(order.id)}>
                          <div>
                            {renderOrderItems(order)}
                          </div>
                        </Collapse>
                        
                        <Button
                          variant="success"
                          size="sm"
                          className="w-100 mt-2"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          <CheckCircle className="me-1" />
                          Marcar como Listo
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pedidos Listos */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <CheckCircle className="me-2" />
                Listos para Entrega ({getOrdersByStatus('ready').length})
              </h5>
            </Card.Header>
            <Card.Body>
              {getOrdersByStatus('ready').length === 0 ? (
                <p className="text-muted text-center mb-0">No hay pedidos listos</p>
              ) : (
                <div className="space-y-2">
                  {getOrdersByStatus('ready').map((order) => (
                    <div key={order.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">#{order.order_number}</h6>
                          <p className="mb-1"><strong>{order.customer_name}</strong></p>
                          <p className="mb-1 text-muted">{order.customer_phone}</p>
                          {order.delivery_address && (
                            <p className="mb-1 text-muted small">{order.delivery_address}</p>
                          )}
                          {order.delivery_type === 'pickup' && (order as any).pickup_code && (
                            <div className="mt-2">
                              <Badge bg="dark" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                🎫 Código: {(order as any).pickup_code}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="text-end">
                          <h6 className="mb-1">${order.total.toLocaleString()}</h6>
                          <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'}>
                            {order.delivery_type === 'delivery' ? 'Delivery' : 'Retiro'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100 mb-2"
                        onClick={() => toggleOrderExpanded(order.id)}
                      >
                        {expandedOrders.has(order.id) ? (
                          <>
                            <ChevronUp size={16} className="me-1" />
                            Ocultar Productos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} className="me-1" />
                            Ver Productos
                          </>
                        )}
                      </Button>
                      
                      <Collapse in={expandedOrders.has(order.id)}>
                        <div>
                          {renderOrderItems(order)}
                        </div>
                      </Collapse>
                      
                      {order.delivery_type === 'delivery' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-100 mt-2"
                          onClick={() => updateOrderStatus(order.id, 'on_the_way')}
                        >
                          <Truck className="me-1" />
                          Enviar Delivery
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          className="w-100 mt-2"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                        >
                          <CheckCircle className="me-1" />
                          Entregado (Retiro)
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Pedidos En Camino */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Truck className="me-2" />
                En Camino ({getOrdersByStatus('on_the_way').length})
              </h5>
            </Card.Header>
            <Card.Body>
              {getOrdersByStatus('on_the_way').length === 0 ? (
                <p className="text-muted text-center mb-0">No hay pedidos en camino</p>
              ) : (
                <div className="space-y-2">
                  {getOrdersByStatus('on_the_way').map((order) => (
                    <div key={order.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">#{order.order_number}</h6>
                          <p className="mb-1"><strong>{order.customer_name}</strong></p>
                          <p className="mb-1 text-muted">{order.customer_phone}</p>
                          <p className="mb-1 text-muted small">{order.delivery_address}</p>
                        </div>
                        <div className="text-end">
                          <h6 className="mb-1">${order.total.toLocaleString()}</h6>
                          <Badge bg="info">Delivery</Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100 mb-2"
                        onClick={() => toggleOrderExpanded(order.id)}
                      >
                        {expandedOrders.has(order.id) ? (
                          <>
                            <ChevronUp size={16} className="me-1" />
                            Ocultar Productos
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} className="me-1" />
                            Ver Productos
                          </>
                        )}
                      </Button>
                      
                      <Collapse in={expandedOrders.has(order.id)}>
                        <div>
                          {renderOrderItems(order)}
                        </div>
                      </Collapse>
                      
                      <Button
                        variant="success"
                        size="sm"
                        className="w-100 mt-2"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        <CheckCircle className="me-1" />
                        Marcar como Entregado
                      </Button>
                    </div>
                  ))}
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
    </Container>
  );
}
