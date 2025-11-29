import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { Package, Truck, MapPin, Clock, User, Phone, Navigation, History, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { orderService } from '../../services/orderService';
import { Database } from '../../types/database';
import ActiveDeliveryMap from './ActiveDeliveryMap';
import DeliveryCodeModal from './DeliveryCodeModal';
import DeliveryRatings from './DeliveryRatings';
import { DriverStatsCard } from '../analytics/DriverStatsCard';

type Order = Database['public']['Tables']['orders']['Row'];

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderForCode, setSelectedOrderForCode] = useState<Order | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
      // Actualizar cada 30 segundos
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) {
      console.warn('⚠️ No hay ID de usuario disponible para repartidor');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando datos para repartidor:', user.id);
      
      const [available, active, history] = await Promise.all([
        deliveryService.getAvailableOrders(),
        deliveryService.getMyActiveDeliveries(user.id),
        deliveryService.getMyDeliveryHistory(user.id)
      ]);
      
      console.log(`✅ Datos cargados: ${available.length} disponibles, ${active.length} activos, ${history.length} completadas`);
      setAvailableOrders(available);
      setActiveDeliveries(active);
      setDeliveryHistory(history);
    } catch (err: any) {
      console.error('❌ Error loading delivery data:', err);
      setError('Error al cargar pedidos: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleTakeOrder = async (orderId: string) => {
    if (!user?.id) return;
    
    try {
      await deliveryService.takeOrderForDelivery(orderId, user.id);
      await loadData();
    } catch (err: any) {
      setError('Error al tomar pedido: ' + err.message);
    }
  };

  const handleArrived = (order: Order) => {
    setSelectedOrderForCode(order);
    setShowCodeModal(true);
  };

  const handleCodeVerified = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, 'delivered');
      // Detener tracking de ubicación
      if (user?.id) {
        await deliveryService.stopLocationTracking(orderId, user.id);
      }
      await loadData();
      setShowCodeModal(false);
      setSelectedOrderForCode(null);
    } catch (err: any) {
      setError('Error al marcar como entregado: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
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
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="d-flex align-items-center gap-2 mb-1">
                <Truck size={28} />
                Dashboard de Repartidor
              </h2>
              <p className="text-muted mb-0">Gestiona tus entregas en curso y toma nuevos pedidos</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant={showRatings ? "outline-warning" : "outline-warning"} 
                onClick={() => {
                  setShowRatings(!showRatings);
                  setShowHistory(false);
                }}
              >
                <Star size={18} className="me-2" />
                {showRatings ? 'Ocultar Calificaciones' : 'Mis Calificaciones'}
              </Button>
              <Button 
                variant={showHistory ? "outline-secondary" : "outline-primary"} 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowRatings(false);
                }}
              >
                <History size={18} className="me-2" />
                {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas del Repartidor */}
      {user && (
        <Row className="mb-4">
          <Col>
            <DriverStatsCard driverId={user.id} />
          </Col>
        </Row>
      )}

      <Row className="g-4">
        {/* Pedidos Disponibles */}
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0 d-flex align-items-center">
                <Package className="me-2" />
                Pedidos Disponibles ({availableOrders.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {availableOrders.length === 0 ? (
                <div className="text-center py-4">
                  <Package size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay pedidos disponibles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableOrders.map((order) => (
                    <Card key={order.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Pedido #{order.order_number}</h6>
                            <p className="mb-1 text-muted small">
                              <Clock size={14} className="me-1" />
                              {formatDate(order.created_at!)}
                            </p>
                            <p className="mb-1">
                              <User size={14} className="me-1" />
                              <strong>{order.customer_name}</strong>
                            </p>
                            <p className="mb-1 text-muted small">
                              <Phone size={14} className="me-1" />
                              {order.customer_phone}
                            </p>
                            {order.delivery_address && (
                              <p className="mb-1 text-muted small">
                                <MapPin size={14} className="me-1" />
                                {order.delivery_address}
                              </p>
                            )}
                          </div>
                          <div className="text-end">
                            <h5 className="mb-1 text-success">${order.total.toLocaleString()}</h5>
                          </div>
                        </div>
                        <Button
                          variant="success"
                          size="sm"
                          className="w-100"
                          onClick={() => handleTakeOrder(order.id)}
                        >
                          <Truck className="me-1" />
                          Tomar Pedido
                        </Button>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Mis Entregas en Curso */}
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0 d-flex align-items-center">
                <Truck className="me-2" />
                Mis Entregas en Curso ({activeDeliveries.length})
              </h5>
            </Card.Header>
            <Card.Body>
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-4">
                  <Truck size={48} className="text-muted mb-3" />
                  <p className="text-muted">No tienes entregas en curso</p>
                  <p className="text-muted small">Toma un pedido disponible para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeliveries.map((order) => (
                    <Card key={order.id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="mb-1">Pedido #{order.order_number}</h6>
                            <p className="mb-1">
                              <User size={14} className="me-1" />
                              <strong>{order.customer_name}</strong>
                            </p>
                            <p className="mb-1 text-muted small">
                              <Phone size={14} className="me-1" />
                              {order.customer_phone}
                            </p>
                            {order.delivery_address && (
                              <p className="mb-1">
                                <MapPin size={14} className="me-1" />
                                {order.delivery_address}
                              </p>
                            )}
                            <div className="mt-2">
                              <small className="text-muted">
                                💡 Pide al cliente el código de entrega para validar
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <h5 className="mb-1 text-success">${order.total.toLocaleString()}</h5>
                          </div>
                        </div>
                        
                        {/* Mapa para este pedido */}
                        {order.delivery_address && (
                          <div className="mb-3">
                            <ActiveDeliveryMap
                              orderId={order.id}
                              deliveryAddress={order.delivery_address}
                              deliveryUserId={user?.id || ''}
                              deliveryLatitude={order.delivery_latitude}
                              deliveryLongitude={order.delivery_longitude}
                            />
                          </div>
                        )}
                        
                        <div className="d-flex gap-2">
                          {order.delivery_address && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="flex-fill"
                              onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address!)}`;
                                window.open(url, '_blank');
                              }}
                            >
                              <Navigation className="me-1" />
                              Abrir en Navegación
                            </Button>
                          )}
                          <Button
                            variant="success"
                            size="sm"
                            className="flex-fill"
                            onClick={() => handleArrived(order)}
                          >
                            He Llegado
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Calificaciones */}
      {showRatings && (
        <Row className="mt-4">
          <Col>
            <DeliveryRatings />
          </Col>
        </Row>
      )}

      {/* Historial de Entregas Completadas */}
      {showHistory && (
        <Row className="mt-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <CheckCircle className="me-2" />
                  Historial de Entregas ({deliveryHistory.length})
                </h5>
              </Card.Header>
              <Card.Body>
                {deliveryHistory.length === 0 ? (
                  <div className="text-center py-4">
                    <History size={48} className="text-muted mb-3" />
                    <p className="text-muted">No tienes entregas completadas aún</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Dirección</th>
                          <th>Total</th>
                          <th>Fecha Entrega</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryHistory.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <strong>#{order.order_number}</strong>
                            </td>
                            <td>
                              <div>
                                <div>{order.customer_name}</div>
                                <small className="text-muted">{order.customer_phone}</small>
                              </div>
                            </td>
                            <td>
                              <small>{order.delivery_address || 'N/A'}</small>
                            </td>
                            <td>
                              <strong className="text-success">${order.total.toLocaleString()}</strong>
                            </td>
                            <td>
                              <small>{formatDate(order.updated_at!)}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal de Código de Entrega */}
      <DeliveryCodeModal
        show={showCodeModal}
        onHide={() => {
          setShowCodeModal(false);
          setSelectedOrderForCode(null);
        }}
        order={selectedOrderForCode}
        onCodeVerified={handleCodeVerified}
      />
    </Container>
  );
}

