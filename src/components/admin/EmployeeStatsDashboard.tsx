import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, User, Package } from 'lucide-react';
import { employeeStatsService, EmployeeStats } from '../../services/employeeStatsService';
import { formatCurrency } from '../../utils/formatters';
import { userService } from '../../services/userService';
import { Database } from '../../types/database';

type Employee = Database['public']['Tables']['users']['Row'];

export default function EmployeeStatsDashboard() {
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [allStats, setAllStats] = useState<EmployeeStats[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadStats();
  }, [startDate, endDate]);

  useEffect(() => {
    filterStats();
  }, [selectedEmployeeId, allStats]);

  const loadEmployees = async () => {
    try {
      const data = await userService.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      console.error('Error loading employees:', err);
    }
  };

  const filterStats = () => {
    if (!selectedEmployeeId) {
      setStats(allStats);
    } else {
      setStats(allStats.filter(s => s.employee_id === selectedEmployeeId));
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await employeeStatsService.getEmployeeStats(
        startDate || undefined,
        endDate || undefined
      );
      setAllStats(data);
    } catch (err: any) {
      console.error('Error loading employee stats:', err);
      setError('Error al cargar estadísticas: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, string> = {
      received: 'primary',
      preparing: 'warning',
      ready: 'info',
      delivered: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'secondary';
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
  const totalOrders = stats.reduce((sum, s) => sum + s.total_orders, 0);

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">
            <User className="me-2" />
            Estadísticas de Empleados
          </h2>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Empleado</Form.Label>
            <Form.Select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Todos los empleados</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
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
                setSelectedEmployeeId('');
              }}
              className="btn btn-secondary w-100"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Resumen general */}
      <Row className="mb-4">
        <Col md={4}>
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
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                  <ShoppingBag size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Pedidos</p>
                  <h4 className="mb-0">{totalOrders}</h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                  <TrendingUp size={24} className="text-info" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Promedio por Pedido</p>
                  <h4 className="mb-0">
                    {totalOrders > 0 ? formatCurrency(totalRevenue / totalOrders) : formatCurrency(0)}
                  </h4>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de estadísticas por empleado */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0">Estadísticas por Empleado</h5>
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
                    <th>Empleado</th>
                    <th className="text-end">Total Pedidos</th>
                    <th className="text-end">Total Ventas</th>
                    <th className="text-end">Promedio por Pedido</th>
                    <th>Estado de Pedidos</th>
                    <th>Tipo de Pedidos</th>
                    <th>Último Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.employee_id}>
                      <td>
                        <div>
                          <strong>{stat.employee_name}</strong>
                          <br />
                          <small className="text-muted">{stat.employee_email}</small>
                        </div>
                      </td>
                      <td className="text-end">
                        <Badge bg="primary">{stat.total_orders}</Badge>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">{formatCurrency(stat.total_revenue)}</strong>
                      </td>
                      <td className="text-end">
                        {formatCurrency(stat.average_order_value)}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {Object.entries(stat.orders_by_status).map(([status, count]) => (
                            count > 0 && (
                              <Badge
                                key={status}
                                bg={getStatusBadgeVariant(status)}
                                className="text-capitalize"
                              >
                                {status}: {count}
                              </Badge>
                            )
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Badge bg="info">Delivery: {stat.orders_by_type.delivery}</Badge>
                          <Badge bg="secondary">Pickup: {stat.orders_by_type.pickup}</Badge>
                        </div>
                      </td>
                      <td>
                        {stat.last_order_date ? (
                          <small>
                            {new Date(stat.last_order_date).toLocaleDateString('es-CL', {
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

