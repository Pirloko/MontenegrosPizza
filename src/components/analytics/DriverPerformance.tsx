import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { Truck, Award, Clock, Star } from 'lucide-react';
import { metricsService } from '../../services/metricsService';
import { StarRating } from '../StarRating';

export function DriverPerformance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const driversData = await metricsService.getDriversPerformance();
      setData(driversData);
    } catch (err: any) {
      console.error('Error loading drivers performance:', err);
      setError('Error al cargar rendimiento de repartidores');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge bg="warning" className="me-2">🥇 #1</Badge>;
    if (index === 1) return <Badge bg="secondary" className="me-2">🥈 #2</Badge>;
    if (index === 2) return <Badge bg="warning" text="dark" className="me-2">🥉 #3</Badge>;
    return <Badge bg="light" text="dark" className="me-2">#{index + 1}</Badge>;
  };

  const getEfficiencyColor = (avgTime: number) => {
    if (avgTime <= 20) return 'success';
    if (avgTime <= 30) return 'warning';
    return 'danger';
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-primary text-white d-flex align-items-center gap-2">
        <Truck size={20} />
        <strong>Rendimiento de Repartidores</strong>
      </Card.Header>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Truck size={48} className="mb-3 opacity-50" />
            <p>No hay datos de repartidores aún</p>
          </div>
        ) : (
          <Table hover responsive>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Repartidor</th>
                <th>Entregas</th>
                <th>Calificación</th>
                <th>Tiempo Promedio</th>
                <th>Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              {data.map((driver, index) => (
                <tr key={driver.driver_id}>
                  <td>{getRankBadge(index)}</td>
                  <td>
                    <strong>{driver.driver_name}</strong>
                  </td>
                  <td>
                    <Badge bg="info">{driver.total_deliveries}</Badge> entregas
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <StarRating rating={driver.avg_rating || 0} size={16} />
                      <small className="text-muted">
                        ({driver.avg_rating?.toFixed(1) || '0.0'})
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Clock size={16} className={`text-${getEfficiencyColor(driver.avg_delivery_time)}`} />
                      <span>{driver.avg_delivery_time} min</span>
                    </div>
                  </td>
                  <td style={{ width: '150px' }}>
                    <ProgressBar 
                      now={Math.min((40 / (driver.avg_delivery_time || 1)) * 100, 100)}
                      variant={getEfficiencyColor(driver.avg_delivery_time)}
                      label={driver.avg_delivery_time <= 20 ? 'Excelente' : driver.avg_delivery_time <= 30 ? 'Bueno' : 'Mejorar'}
                      style={{ height: '25px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

