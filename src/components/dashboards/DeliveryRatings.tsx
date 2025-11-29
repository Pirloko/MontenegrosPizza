import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { Star, MessageSquare, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ratingService } from '../../services/ratingService';
import { StarRating } from '../StarRating';
import { Rating } from '../../types';

export default function DeliveryRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadRatings();
    }
  }, [user]);

  const loadRatings = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const deliveryRatings = await ratingService.getDeliveryUserRatings(user.id);
      setRatings(deliveryRatings);
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

  // Calcular estadísticas
  const stats = {
    total: ratings.length,
    average: ratings.length > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2))
      : 0,
    distribution: {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    }
  };

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
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2 mb-1">
            <Star size={28} />
            Mis Calificaciones de Delivery
          </h2>
          <p className="text-muted mb-0">Revisa las calificaciones de tus entregas</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {ratings.length > 0 && (
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-primary">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small">Calificación Promedio</p>
                    <h3 className="mb-0 text-primary">
                      {stats.average.toFixed(1)}/5
                    </h3>
                  </div>
                  <Star size={32} className="text-primary" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-success">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small">Total de Calificaciones</p>
                    <h3 className="mb-0 text-success">
                      {stats.total}
                    </h3>
                  </div>
                  <MessageSquare size={32} className="text-success" />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-warning">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small">Calificaciones 5 Estrellas</p>
                    <h3 className="mb-0 text-warning">
                      {stats.distribution[5]}
                    </h3>
                  </div>
                  <Star size={32} className="text-warning" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Tabla de Calificaciones */}
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">Historial de Calificaciones</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {ratings.length === 0 ? (
            <div className="text-center py-5">
              <Star size={48} className="text-muted mb-3" />
              <p className="text-muted">No tienes calificaciones aún</p>
              <p className="text-muted small">Las calificaciones aparecerán aquí cuando los clientes califiquen tus entregas</p>
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
                  {ratings.map((rating: any) => (
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
    </Container>
  );
}

