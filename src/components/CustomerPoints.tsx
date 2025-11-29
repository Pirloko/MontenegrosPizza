import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Alert, Spinner, Row, Col, ProgressBar } from 'react-bootstrap';
import { Award, Gift, Star, TrendingUp, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { Database } from '../types/database';

type LoyaltyHistory = Database['public']['Tables']['loyalty_points_history']['Row'];

export default function CustomerPoints() {
  const { user } = useAuth();
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLoyaltyHistory();
  }, []);

  const loadLoyaltyHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (user?.email) {
        // Por ahora simulamos datos ya que no tenemos el método específico
        // En una implementación real, necesitarías crear este método en orderService
        setLoyaltyHistory([]);
      }
    } catch (err: any) {
      console.error('Error loading loyalty history:', err);
      setError('Error al cargar el historial de puntos');
    } finally {
      setLoading(false);
    }
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

  const getNextReward = (currentPoints: number) => {
    const rewards = [
      { points: 100, reward: 'Descuento del 5%' },
      { points: 250, reward: 'Descuento del 10%' },
      { points: 500, reward: 'Pizza gratis' },
      { points: 1000, reward: 'Combo completo gratis' }
    ];

    const nextReward = rewards.find(reward => reward.points > currentPoints);
    return nextReward || { points: 1000, reward: '¡Ya tienes todos los premios!' };
  };

  const calculateProgress = (currentPoints: number, targetPoints: number) => {
    return Math.min((currentPoints / targetPoints) * 100, 100);
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando puntos...</p>
        </div>
      </Container>
    );
  }

  const currentPoints = user?.loyalty_points || 0;
  const nextReward = getNextReward(currentPoints);
  const progress = calculateProgress(currentPoints, nextReward.points);

  return (
    <Container className="py-4">
      <Row className="g-4">
        {/* Resumen de Puntos */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="p-4 text-center">
              <div className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '100px', height: '100px' }}>
                <Award size={40} />
              </div>
              <h2 className="mb-1">{currentPoints}</h2>
              <p className="text-muted mb-4">Puntos de Lealtad</p>

              {/* Progreso hacia el siguiente premio */}
              <div className="mb-4">
                <h6 className="mb-2">Siguiente Premio</h6>
                <div className="mb-2">
                  <small className="text-muted">{nextReward.reward}</small>
                  <p className="mb-1 fw-bold">{nextReward.points} puntos</p>
                </div>
                <ProgressBar 
                  now={progress} 
                  variant="warning" 
                  className="mb-2"
                  style={{ height: '8px' }}
                />
                <small className="text-muted">
                  {nextReward.points - currentPoints} puntos más para el siguiente premio
                </small>
              </div>

              {/* Información de beneficios */}
              <div className="border-top pt-3">
                <h6 className="mb-3">Beneficios</h6>
                <div className="text-start">
                  <div className="d-flex align-items-center mb-2">
                    <Gift size={16} className="text-success me-2" />
                    <small>Descuentos exclusivos</small>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <Star size={16} className="text-warning me-2" />
                    <small>Productos gratis</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <TrendingUp size={16} className="text-primary me-2" />
                    <small>Ofertas especiales</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Historial de Puntos */}
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0 d-flex align-items-center">
                  <History size={20} className="me-2" />
                  Historial de Puntos
                </h5>
                <Button variant="outline-primary" size="sm" onClick={loadLoyaltyHistory}>
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

              {loyaltyHistory.length === 0 ? (
                <div className="text-center py-5">
                  <Award size={48} className="text-muted mb-3" />
                  <h6 className="text-muted">No hay historial de puntos</h6>
                  <p className="text-muted small">
                    Cuando hagas pedidos, ganarás puntos que aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {loyaltyHistory.map((entry) => (
                    <div key={entry.id} className="list-group-item border-0 border-bottom p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{entry.description}</h6>
                          <small className="text-muted">{formatDate(entry.created_at)}</small>
                        </div>
                        <div className="text-end">
                          <Badge 
                            bg={entry.points > 0 ? 'success' : 'danger'}
                            className="fs-6"
                          >
                            {entry.points > 0 ? '+' : ''}{entry.points}
                          </Badge>
                          <p className="mb-0 small text-muted">
                            Total: {entry.balance_after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Información sobre el programa de lealtad */}
      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body className="p-4">
              <h5 className="mb-3">¿Cómo funciona el programa de lealtad?</h5>
              <Row>
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="fw-bold">1</span>
                    </div>
                    <h6>Haz Pedidos</h6>
                    <p className="small text-muted">Gana 5 puntos por cada $1,000 gastados</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="fw-bold">2</span>
                    </div>
                    <h6>Acumula Puntos</h6>
                    <p className="small text-muted">Los puntos se acumulan automáticamente</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" 
                         style={{ width: '50px', height: '50px' }}>
                      <span className="fw-bold">3</span>
                    </div>
                    <h6>Canjea Premios</h6>
                    <p className="small text-muted">Usa tus puntos para obtener descuentos</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
