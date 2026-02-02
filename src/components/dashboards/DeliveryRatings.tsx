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
          <Spinner animation="border" style={{ color: 'var(--brand-green)' }} />
          <p className="mt-3 text-brand-gray-muted">Cargando calificaciones...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2 mb-1 fw-bold" style={{ color: 'var(--brand-black)', fontFamily: 'var(--font-display)' }}>
            <Star size={28} style={{ color: 'var(--brand-green)' }} />
            Mis Calificaciones de Delivery
          </h2>
          <p className="text-brand-gray-muted mb-0">Revisa las calificaciones de tus entregas</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4 rounded-3 border-0" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {ratings.length > 0 && (
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="panel-card border-0">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-brand-gray-muted mb-1 small">Calificación Promedio</p>
                    <h3 className="mb-0 fw-bold" style={{ color: 'var(--brand-green)' }}>{stats.average.toFixed(1)}/5</h3>
                  </div>
                  <Star size={32} style={{ color: 'var(--brand-green)' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="panel-card border-0">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-brand-gray-muted mb-1 small">Total de Calificaciones</p>
                    <h3 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>{stats.total}</h3>
                  </div>
                  <MessageSquare size={32} style={{ color: '#424242' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="panel-card border-0">
              <Card.Body>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-brand-gray-muted mb-1 small">Calificaciones 5 Estrellas</p>
                    <h3 className="mb-0 fw-bold" style={{ color: '#FFD54F' }}>{stats.distribution[5]}</h3>
                  </div>
                  <Star size={32} style={{ color: '#FFD54F' }} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="panel-card">
        <Card.Header className="border-bottom py-3" style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', borderRadius: '1rem 1rem 0 0' }}>
          <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>
            <Star className="me-2" style={{ color: 'var(--brand-green)' }} />
            Historial de Calificaciones
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {ratings.length === 0 ? (
            <div className="panel-empty-state">
              <div className="display-icon"><Star size={48} /></div>
              <p className="mb-1">No tienes calificaciones aún</p>
              <p className="text-muted small mb-0">Aparecerán cuando los clientes califiquen tus entregas</p>
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

