import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { X, Package, Clock, CheckCircle, XCircle, MapPin, Phone, Mail, CreditCard, Award } from 'lucide-react';
import { orderService } from '../services/orderService';
import { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];

interface OrderDetailsModalProps {
  show: boolean;
  onHide: () => void;
  order: Order | null;
}

export default function OrderDetailsModal({ show, onHide, order }: OrderDetailsModalProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && order) {
      loadOrderItems();
    }
  }, [show, order]);

  const loadOrderItems = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      setError('');
      
      const items = await orderService.getOrderItems(order.id);
      setOrderItems(items);
    } catch (err: any) {
      console.error('Error loading order items:', err);
      setError('Error al cargar los detalles del pedido');
    } finally {
      setLoading(false);
    }
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

  const parseIngredients = (ingredientsJson: string | null) => {
    if (!ingredientsJson) return [];
    try {
      return JSON.parse(ingredientsJson);
    } catch {
      return [];
    }
  };

  const calculatePointsEarned = (total: number) => {
    // 5 puntos por cada $1000 gastados
    return Math.floor(total / 1000) * 5;
  };

  if (!order) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold">
          <Package size={20} />
          Detalles del Pedido #{order.order_number || order.id.slice(-8)}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: '24px' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3">Cargando detalles...</p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                {error}
              </Alert>
            )}

            {/* Información del Pedido */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0 fw-bold">Información del Pedido</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Fecha y Hora:</small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{formatDate(order.created_at)}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Estado:</small>
                      <div className="mt-1">{getStatusBadge(order.status, order.delivery_type)}</div>
                      {order.status === 'ready' && order.delivery_type === 'pickup' && (order as any).pickup_code && (
                        <div className="mt-3">
                          <div className="alert alert-info mb-0">
                            <strong>🎫 Código de retiro:</strong>
                            <div className="mt-2">
                              <Badge bg="dark" style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem' }}>
                                {(order as any).pickup_code}
                              </Badge>
                            </div>
                            <small className="d-block mt-2">Muestra este código al empleado cuando retires tu pedido</small>
                          </div>
                        </div>
                      )}
                      {(order.status === 'ready' || order.status === 'on_the_way') && order.delivery_type === 'delivery' && (order as any).delivery_code && (
                        <div className="mt-3">
                          <div className="alert alert-warning mb-0" style={{ border: '2px solid #ffc107' }}>
                            <strong className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '1.5rem' }}>🚚</span>
                              Código de Entrega:
                            </strong>
                            <div className="mt-2">
                              <Badge bg="dark" style={{ fontSize: '1.8rem', padding: '1rem 2rem', letterSpacing: '2px' }}>
                                {(order as any).delivery_code}
                              </Badge>
                            </div>
                            <small className="d-block mt-3 fw-bold">
                              ⚠️ Muestra este código al repartidor cuando recibas tu pedido para validar la entrega
                            </small>
                            <small className="d-block mt-2 text-muted">
                              El repartidor ingresará este código para confirmar que la entrega fue exitosa
                            </small>
                          </div>
                        </div>
                      )}
                      {order.status === 'preparing' && (() => {
                        const estimatedTime = (order as any).estimated_ready_time;
                        
                        if (estimatedTime) {
                          const now = new Date();
                          // Usar updated_at cuando cambió a preparing, o created_at como fallback
                          const startedAt = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at!);
                          const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
                          const remaining = estimatedTime - elapsed;
                          
                          return (
                            <div className="mt-2">
                              <Badge bg={remaining > 0 ? 'info' : 'warning'}>
                                ⏱️ {remaining > 0 
                                  ? `~${remaining} min restantes`
                                  : `Tiempo estimado: ${estimatedTime} min`
                                }
                              </Badge>
                            </div>
                          );
                        }
                        
                        // Si está preparando pero no hay tiempo estimado
                        return (
                          <div className="mt-2">
                            <Badge bg="secondary">
                              ⏱️ En preparación
                            </Badge>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Tipo de Entrega:</small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>
                        <Badge bg={order.delivery_type === 'delivery' ? 'info' : 'secondary'}>
                          {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Retiro en tienda'}
                        </Badge>
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Subtotal:</small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>${order.subtotal.toLocaleString('es-CL')}</p>
                    </div>
                    {order.discount > 0 && (
                      <div className="mb-3">
                        <small className="text-muted fw-bold d-block mb-1">Descuento:</small>
                        <p className="mb-0 text-success fw-bold" style={{ fontSize: '15px' }}>-${order.discount.toLocaleString('es-CL')}</p>
                      </div>
                    )}
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Total:</small>
                      <p className="mb-0 fw-bold text-success" style={{ fontSize: '18px' }}>${order.total.toLocaleString('es-CL')}</p>
                    </div>
                    {calculatePointsEarned(order.total) > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-flex align-items-center gap-1">
                          <Award size={14} />
                          Puntos Ganados:
                        </small>
                        <p className="mb-0 fw-bold text-warning">
                          +{calculatePointsEarned(order.total)} puntos
                        </p>
                        <small className="text-muted">
                          (5 puntos por cada $1,000 gastados)
                        </small>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información del Cliente */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h6 className="mb-0 fw-bold">Información del Cliente</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                        <Mail size={14} />
                        Email:
                      </small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_email || 'No especificado'}</p>
                    </div>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                        <Phone size={14} />
                        Teléfono:
                      </small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_phone}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">Nombre:</small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{order.customer_name}</p>
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
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Items del Pedido */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0 fw-bold">Productos del Pedido</h6>
              </Card.Header>
              <Card.Body>
                {orderItems.length === 0 ? (
                  <div className="text-center py-4">
                    <Package size={48} className="text-muted mb-2" />
                    <p className="text-muted mb-0">No se encontraron productos</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {orderItems.map((item, index) => {
                      const addedIngredients = parseIngredients(item.added_ingredients);
                      const removedIngredients = parseIngredients(item.removed_ingredients);
                      
                      return (
                        <div key={index} className="list-group-item border-0 border-bottom px-0 py-3" style={{ background: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1 fw-bold">{item.product_name}</h6>
                              <Badge bg="secondary" className="mb-2">Cantidad: {item.quantity}</Badge>
                            </div>
                            <div className="text-end">
                              <p className="mb-0 fw-bold text-success" style={{ fontSize: '16px' }}>${item.subtotal.toLocaleString('es-CL')}</p>
                              <small className="text-muted">
                                ${item.product_price.toLocaleString('es-CL')} c/u
                              </small>
                            </div>
                          </div>

                          {/* Ingredientes Agregados */}
                          {addedIngredients.length > 0 && (
                            <div className="mb-2 mt-2">
                              <small className="text-success fw-bold d-block mb-1">✓ Ingredientes Extra:</small>
                              <div className="d-flex flex-wrap gap-1">
                                {addedIngredients.map((ingredient: any, idx: number) => (
                                  <Badge key={idx} bg="success" className="px-2 py-1">
                                    +{ingredient.name || ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ingredientes Removidos */}
                          {removedIngredients.length > 0 && (
                            <div className="mb-2 mt-2">
                              <small className="text-danger fw-bold d-block mb-1">✗ Sin:</small>
                              <div className="d-flex flex-wrap gap-1">
                                {removedIngredients.map((ingredient: string, idx: number) => (
                                  <Badge key={idx} bg="danger" className="px-2 py-1">
                                    -{ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Instrucciones Especiales */}
                          {item.special_instructions && (
                            <div className="mb-2 mt-2 p-2 rounded" style={{ background: '#fffbf0', border: '1px solid #ffc107' }}>
                              <small className="text-warning fw-bold d-block mb-1">📝 Instrucciones Especiales:</small>
                              <p className="mb-0 small">{item.special_instructions}</p>
                            </div>
                          )}

                          {/* Costo de Ingredientes Extra */}
                          {item.extra_ingredients_cost > 0 && (
                            <div className="mt-2">
                              <Badge bg="info" className="px-2 py-1">
                                Costo ingredientes extra: +${item.extra_ingredients_cost.toLocaleString('es-CL')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Información Adicional */}
            {(order.notes || order.points_used > 0) && (
              <Card className="shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0 fw-bold">Información Adicional</h6>
                </Card.Header>
                <Card.Body>
                  {order.notes && (
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-block mb-1">📋 Notas del Pedido:</small>
                      <p className="mb-0" style={{ fontSize: '15px' }}>{order.notes}</p>
                    </div>
                  )}
                  {order.points_used > 0 && (
                    <div className="mb-3">
                      <small className="text-muted fw-bold d-flex align-items-center gap-1 mb-1">
                        <Award size={14} />
                        Puntos de Lealtad Usados:
                      </small>
                      <p className="mb-0 fw-bold text-warning" style={{ fontSize: '15px' }}>{order.points_used} puntos</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
        <Button variant="secondary" onClick={onHide} style={{ padding: '8px 20px' }}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
