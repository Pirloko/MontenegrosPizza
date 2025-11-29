import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { DollarSign, Package, Clock, TrendingUp, Award, Trophy } from 'lucide-react';
import { StarRating } from '../StarRating';
import { metricsService } from '../../services/metricsService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DriverStatsCardProps {
  driverId: string;
}

export function DriverStatsCard({ driverId }: DriverStatsCardProps) {
  const [stats, setStats] = useState<any>(null);
  const [ranking, setRanking] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [driverId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener rendimiento de todos los repartidores
      const allDrivers = await metricsService.getDriversPerformance();
      
      // Encontrar estadísticas del repartidor actual
      const myStats = allDrivers.find(d => d.driver_id === driverId);
      const myRanking = allDrivers.findIndex(d => d.driver_id === driverId) + 1;

      setStats(myStats || {
        total_deliveries: 0,
        avg_delivery_time: 0,
        avg_rating: 0,
        total_earnings: 0
      });
      setRanking(myRanking || allDrivers.length + 1);
    } catch (err: any) {
      console.error('Error loading driver stats:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Cargando estadísticas...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  const getRankBadge = () => {
    if (ranking === 1) return { icon: '🥇', text: '#1 - ¡CAMPEÓN!', variant: 'warning' };
    if (ranking === 2) return { icon: '🥈', text: '#2 - ¡Muy bien!', variant: 'secondary' };
    if (ranking === 3) return { icon: '🥉', text: '#3 - ¡Excelente!', variant: 'warning' };
    return { icon: '🏆', text: `#${ranking}`, variant: 'info' };
  };

  const rankBadge = getRankBadge();

  const getPerformanceBadge = () => {
    if (stats.avg_rating >= 4.5) return { text: 'Excelente', variant: 'success' };
    if (stats.avg_rating >= 4.0) return { text: 'Muy Bueno', variant: 'info' };
    if (stats.avg_rating >= 3.5) return { text: 'Bueno', variant: 'warning' };
    return { text: 'Mejorar', variant: 'danger' };
  };

  const performanceBadge = getPerformanceBadge();

  return (
    <Card className="shadow-sm border-primary">
      <Card.Header className="bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Trophy size={20} />
            <strong>Tus Estadísticas</strong>
          </div>
          <Badge bg={rankBadge.variant as any} style={{ fontSize: '1.1rem', padding: '0.5rem 1rem' }}>
            {rankBadge.icon} {rankBadge.text}
          </Badge>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className="g-3">
          {/* Total Entregas */}
          <Col md={6} lg={3}>
            <div className="text-center p-3 bg-light rounded">
              <Package size={32} className="text-primary mb-2" />
              <h3 className="mb-0">{stats.total_deliveries}</h3>
              <small className="text-muted">Entregas Totales</small>
            </div>
          </Col>

          {/* Ganancias */}
          <Col md={6} lg={3}>
            <div className="text-center p-3 bg-light rounded">
              <DollarSign size={32} className="text-success mb-2" />
              <h3 className="mb-0">${stats.total_earnings.toLocaleString('es-CL')}</h3>
              <small className="text-muted">Ganancias Totales</small>
            </div>
          </Col>

          {/* Tiempo Promedio */}
          <Col md={6} lg={3}>
            <div className="text-center p-3 bg-light rounded">
              <Clock size={32} className="text-warning mb-2" />
              <h3 className="mb-0">{stats.avg_delivery_time || 0}</h3>
              <small className="text-muted">Min Promedio</small>
            </div>
          </Col>

          {/* Calificación */}
          <Col md={6} lg={3}>
            <div className="text-center p-3 bg-light rounded">
              <Award size={32} className="text-danger mb-2" />
              <div className="d-flex justify-content-center mb-1">
                <StarRating rating={stats.avg_rating || 0} size={20} showValue />
              </div>
              <Badge bg={performanceBadge.variant as any}>
                {performanceBadge.text}
              </Badge>
            </div>
          </Col>
        </Row>

        {/* Barra de Progreso de Eficiencia */}
        <div className="mt-4">
          <div className="d-flex justify-content-between mb-2">
            <small className="fw-bold">Eficiencia General</small>
            <small className="text-muted">
              {stats.avg_delivery_time <= 20 ? 'Excelente' : stats.avg_delivery_time <= 30 ? 'Bueno' : 'Mejorable'}
            </small>
          </div>
          <ProgressBar>
            <ProgressBar 
              variant="success" 
              now={Math.min((stats.avg_rating / 5) * 33, 33)} 
              label="Calificación"
            />
            <ProgressBar 
              variant="primary" 
              now={Math.min((stats.total_deliveries / 100) * 33, 33)} 
              label="Entregas"
            />
            <ProgressBar 
              variant="warning" 
              now={Math.min((40 / (stats.avg_delivery_time || 1)) * 34, 34)} 
              label="Velocidad"
            />
          </ProgressBar>
        </div>

        {/* Mensajes Motivacionales */}
        {ranking === 1 && (
          <Alert variant="warning" className="mt-3 mb-0">
            <strong>🏆 ¡Eres el #1!</strong> ¡Sigue así, campeón! 🎉
          </Alert>
        )}
        {ranking === 2 && (
          <Alert variant="info" className="mt-3 mb-0">
            <strong>🥈 ¡Subcampeón!</strong> ¡Estás muy cerca del #1! 💪
          </Alert>
        )}
        {ranking === 3 && (
          <Alert variant="success" className="mt-3 mb-0">
            <strong>🥉 ¡Top 3!</strong> ¡Excelente trabajo! 👏
          </Alert>
        )}
        {stats.avg_rating >= 4.8 && (
          <Alert variant="success" className="mt-3 mb-0">
            <strong>⭐ Calificación Perfecta!</strong> Tus clientes te adoran 💯
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

