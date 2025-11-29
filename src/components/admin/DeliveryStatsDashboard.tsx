import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { TrendingUp, DollarSign, Truck, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { employeeStatsService, DeliveryStats } from '../../services/employeeStatsService';
import { formatCurrency } from '../../utils/formatters';
import { userService } from '../../services/userService';
import { Database } from '../../types/database';

type DeliveryUser = Database['public']['Tables']['users']['Row'];

export default function DeliveryStatsDashboard() {
  const [stats, setStats] = useState<DeliveryStats[]>([]);
  const [allStats, setAllStats] = useState<DeliveryStats[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');

  useEffect(() => {
    loadDeliveryUsers();
  }, []);

  useEffect(() => {
    loadStats();
  }, [startDate, endDate]);

  useEffect(() => {
    filterStats();
  }, [selectedDeliveryId, allStats]);

  const loadDeliveryUsers = async () => {
    try {
      const data = await userService.getDeliveryUsers();
      setDeliveryUsers(data);
    } catch (err: any) {
      console.error('Error loading delivery users:', err);
    }
  };

  const filterStats = () => {
    if (!selectedDeliveryId) {
      setStats(allStats);
    } else {
      setStats(allStats.filter(s => s.delivery_id === selectedDeliveryId));
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await employeeStatsService.getDeliveryStats(
        startDate || undefined,
        endDate || undefined
      );
      setAllStats(data);
    } catch (err: any) {
      console.error('Error loading delivery stats:', err);
      setError('Error al cargar estadísticas: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <strong>Error:</strong> {error}
      </Alert>
    );
  }

  const totalRevenue = stats.reduce((sum, s) => sum + s.total_revenue, 0);
  const totalDeliveries = stats.reduce((sum, s) => sum + s.total_deliveries, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completed_deliveries, 0);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">
            <Truck className="me-2" />
            Estadísticas de Repartidores
          </h2>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Repartidor</Form.Label>
            <Form.Select
              value={selectedDeliveryId}
              onChange={(e) => setSelectedDeliveryId(e.target.value)}
            >
              <option value="">Todos los repartidores</option>
              {deliveryUsers.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.full_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Fecha Inicio</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Fecha Fin</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Form.Group className="w-100">
            <Form.Control
              type="button"
              value="Limpiar Filtros"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedDeliveryId('');
              }}
              className="btn btn-secondary w-100"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Resumen general */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                  <DollarSign size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Ventas</p>
                  <h4 className="mb-0">{formatCurrency(totalRevenue)}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                  <Truck size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Entregas</p>
                  <h4 className="mb-0">{totalDeliveries}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                  <CheckCircle size={24} className="text-info" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Completadas</p>
                  <h4 className="mb-0">{totalCompleted}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded p-3 me-3">
                  <TrendingUp size={24} className="text-warning" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Promedio por Entrega</p>
                  <h4 className="mb-0">
                    {totalDeliveries > 0 ? formatCurrency(totalRevenue / totalDeliveries) : formatCurrency(0)}
                  </h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de estadísticas por repartidor */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0">Estadísticas por Repartidor</h5>
        </Card.Header>
        <Card.Body>
          {stats.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No hay estadísticas disponibles para el período seleccionado.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Repartidor</th>
                    <th className="text-end">Total Entregas</th>
                    <th className="text-end">Total Ventas</th>
                    <th className="text-end">Promedio por Entrega</th>
                    <th className="text-center">Completadas</th>
                    <th className="text-center">Canceladas</th>
                    <th className="text-center">Tiempo Promedio</th>
                    <th>Última Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.delivery_id}>
                      <td>
                        <div>
                          <strong>{stat.delivery_name}</strong>
                          <br />
                          <small className="text-muted">{stat.delivery_email}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <Badge bg="primary">{stat.total_deliveries}</Badge>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">{formatCurrency(stat.total_revenue)}</strong>
                      </td>
                      <td className="text-end">
                        {formatCurrency(stat.average_delivery_value)}
                      </td>
                      <td className="text-center">
                        <Badge bg="success">{stat.completed_deliveries}</Badge>
                      </td>
                      <td className="text-center">
                        {stat.cancelled_deliveries > 0 && (
                          <Badge bg="danger">{stat.cancelled_deliveries}</Badge>
                        )}
                        {stat.cancelled_deliveries === 0 && (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        {stat.average_delivery_time_minutes !== null ? (
                          <Badge bg="info">
                            <Clock size={14} className="me-1" />
                            {formatTime(stat.average_delivery_time_minutes)}
                          </Badge>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        {stat.last_delivery_date ? (
                          <small>
                            {new Date(stat.last_delivery_date).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </small>
                        ) : (
                          <small className="text-muted">N/A</small>
                        )}
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

