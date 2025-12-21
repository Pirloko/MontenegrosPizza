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
    <Card style={{ border: 'none', borderRadius: '12px' }}>
      <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
        <div className="d-flex align-items-center gap-2">
          <Truck size={20} style={{ color: '#0B6E4F' }} />
          <strong style={{ color: '#fff', fontWeight: 600 }}>Rendimiento de Repartidores</strong>
        </div>
      </Card.Header>

      <Card.Body style={{ padding: '24px' }}>
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
          <div className="table-responsive">
            <Table hover responsive style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Rank</th>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Repartidor</th>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Entregas</th>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Calificación</th>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Tiempo Promedio</th>
                  <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Eficiencia</th>
                </tr>
              </thead>
              <tbody>
                {data.map((driver, index) => (
                  <tr key={driver.driver_id} style={{ borderColor: '#333' }}>
                    <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                      {index === 0 && <Badge style={{ 
                        background: 'rgba(255, 193, 7, 0.2)', 
                        color: '#ffc107',
                        border: '1px solid #ffc107',
                        padding: '6px 12px'
                      }}>🥇 #1</Badge>}
                      {index === 1 && <Badge style={{ 
                        background: 'rgba(108, 117, 125, 0.2)', 
                        color: '#6c757d',
                        border: '1px solid #6c757d',
                        padding: '6px 12px'
                      }}>🥈 #2</Badge>}
                      {index === 2 && <Badge style={{ 
                        background: 'rgba(255, 193, 7, 0.2)', 
                        color: '#ffc107',
                        border: '1px solid #ffc107',
                        padding: '6px 12px'
                      }}>🥉 #3</Badge>}
                      {index > 2 && <Badge style={{ 
                        background: 'rgba(108, 117, 125, 0.2)', 
                        color: '#b0b0b0',
                        border: '1px solid #333',
                        padding: '6px 12px'
                      }}>#{index + 1}</Badge>}
                    </td>
                    <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                      <strong style={{ color: '#fff' }}>{driver.driver_name}</strong>
                    </td>
                    <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                      <Badge style={{ 
                        background: 'rgba(23, 162, 184, 0.2)', 
                        color: '#17a2b8',
                        border: '1px solid #17a2b8',
                        padding: '6px 12px'
                      }}>
                        {driver.total_deliveries}
                      </Badge>
                      <span style={{ color: '#b0b0b0', marginLeft: '8px' }}>entregas</span>
                    </td>
                    <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center gap-2">
                        <StarRating rating={driver.avg_rating || 0} size={16} />
                        <small className="text-muted">
                          ({driver.avg_rating?.toFixed(1) || '0.0'})
                        </small>
                      </div>
                    </td>
                    <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center gap-2">
                        <Clock 
                          size={16} 
                          style={{ 
                            color: driver.avg_delivery_time <= 20 ? '#0B6E4F' : 
                                   driver.avg_delivery_time <= 30 ? '#ffc107' : '#dc3545'
                          }} 
                        />
                        <span style={{ color: '#fff' }}>{driver.avg_delivery_time} min</span>
                      </div>
                    </td>
                    <td style={{ width: '150px', borderColor: '#333', verticalAlign: 'middle' }}>
                      <ProgressBar 
                        now={Math.min((40 / (driver.avg_delivery_time || 1)) * 100, 100)}
                        variant={getEfficiencyColor(driver.avg_delivery_time)}
                        label={driver.avg_delivery_time <= 20 ? 'Excelente' : driver.avg_delivery_time <= 30 ? 'Bueno' : 'Mejorar'}
                        style={{ 
                          height: '25px',
                          backgroundColor: '#333',
                          borderRadius: '6px'
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

