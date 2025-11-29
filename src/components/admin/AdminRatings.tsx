import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import { Star, MessageSquare, User, ShoppingBag, Truck } from 'lucide-react';
import { ratingService } from '../../services/ratingService';
import { StarRating } from '../StarRating';
import { Rating } from '../../types';

export default function AdminRatings() {
  const [serviceRatings, setServiceRatings] = useState<Rating[]>([]);
  const [deliveryRatings, setDeliveryRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'service' | 'delivery'>('service');

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [service, delivery] = await Promise.all([
        ratingService.getAllServiceRatings(),
        ratingService.getAllDeliveryRatings()
      ]);
      
      setServiceRatings(service);
      setDeliveryRatings(delivery);
    } catch (err: any) {
      console.error('Error loading ratings:', err);
      setError('Error al cargar calificaciones: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingBadgeVariant = (rating: number) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 4) return 'info';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  // Calcular promedios
  const calculateAverage = (ratings: Rating[]) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / ratings.length).toFixed(2));
  };

  const serviceAverage = calculateAverage(serviceRatings);
  const deliveryAverage = calculateAverage(deliveryRatings);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando calificaciones...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2 mb-1">
            <Star size={28} />
            Calificaciones de Clientes
          </h2>
          <p className="text-muted mb-0">Revisa las calificaciones de atención y delivery</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas de Calificaciones */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm border-primary h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="text-muted mb-1 small">Promedio de Atención</h6>
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="mb-0 text-primary fw-bold">
                      {serviceAverage > 0 ? serviceAverage.toFixed(1) : '0.0'}/5
                    </h3>
                    {serviceAverage > 0 && (
                      <StarRating rating={serviceAverage} size={20} />
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <MessageSquare size={32} className="text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Total de calificaciones:</span>
                  <Badge bg="primary">{serviceRatings.length}</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm border-success h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h6 className="text-muted mb-1 small">Promedio de Delivery</h6>
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="mb-0 text-success fw-bold">
                      {deliveryAverage > 0 ? deliveryAverage.toFixed(1) : '0.0'}/5
                    </h3>
                    {deliveryAverage > 0 && (
                      <StarRating rating={deliveryAverage} size={20} />
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <Truck size={32} className="text-success" />
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Total de calificaciones:</span>
                  <Badge bg="success">{deliveryRatings.length}</Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as 'service' | 'delivery')}
        className="mb-4"
      >
        <Tab eventKey="service" title={
          <span>
            <MessageSquare size={18} className="me-2" />
            Atención ({serviceRatings.length})
          </span>
        }>
          <Card className="shadow-sm mt-3">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Calificaciones de Atención al Cliente</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {serviceRatings.length === 0 ? (
                <div className="text-center py-5">
                  <MessageSquare size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay calificaciones de atención aún</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Calificación</th>
                        <th>Comentario</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceRatings.map((rating: any) => (
                        <tr key={rating.id}>
                          <td>
                            <Badge bg="secondary">
                              #{rating.orders?.order_number || rating.order_id.slice(-8)}
                            </Badge>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">
                                {rating.orders?.customer_name || rating.users?.full_name || 'Cliente'}
                              </div>
                              <small className="text-muted">
                                {rating.orders?.customer_email || rating.users?.email || ''}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <StarRating rating={rating.rating} size={16} />
                              <Badge bg={getRatingBadgeVariant(rating.rating)}>
                                {rating.rating}/5
                              </Badge>
                            </div>
                          </td>
                          <td>
                            {rating.comment ? (
                              <div className="d-flex align-items-start gap-2">
                                <MessageSquare size={16} className="text-muted mt-1" />
                                <span className="text-muted small">{rating.comment}</span>
                              </div>
                            ) : (
                              <span className="text-muted small">Sin comentario</span>
                            )}
                          </td>
                          <td>
                            <small>{formatDate(rating.created_at)}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="delivery" title={
          <span>
            <Truck size={18} className="me-2" />
            Delivery ({deliveryRatings.length})
          </span>
        }>
          <Card className="shadow-sm mt-3">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Calificaciones de Delivery</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {deliveryRatings.length === 0 ? (
                <div className="text-center py-5">
                  <Truck size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay calificaciones de delivery aún</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Repartidor</th>
                        <th>Calificación</th>
                        <th>Comentario</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryRatings.map((rating: any) => (
                        <tr key={rating.id}>
                          <td>
                            <Badge bg="secondary">
                              #{rating.orders?.order_number || rating.order_id.slice(-8)}
                            </Badge>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold">
                                {rating.orders?.customer_name || rating.users?.full_name || 'Cliente'}
                              </div>
                              <small className="text-muted">
                                {rating.orders?.customer_email || rating.users?.email || ''}
                              </small>
                            </div>
                          </td>
                          <td>
                            {rating.delivery_user ? (
                              <div>
                                <div className="fw-bold">
                                  {rating.delivery_user.full_name || 'Repartidor'}
                                </div>
                                <small className="text-muted">
                                  {rating.delivery_user.email || ''}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted small">No asignado</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <StarRating rating={rating.rating} size={16} />
                              <Badge bg={getRatingBadgeVariant(rating.rating)}>
                                {rating.rating}/5
                              </Badge>
                            </div>
                          </td>
                          <td>
                            {rating.comment ? (
                              <div className="d-flex align-items-start gap-2">
                                <MessageSquare size={16} className="text-muted mt-1" />
                                <span className="text-muted small">{rating.comment}</span>
                              </div>
                            ) : (
                              <span className="text-muted small">Sin comentario</span>
                            )}
                          </td>
                          <td>
                            <small>{formatDate(rating.created_at)}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

