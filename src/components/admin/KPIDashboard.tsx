import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Form, Button } from 'react-bootstrap';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown,
  Award,
  Users,
  Truck,
  Home,
  Package,
  Tag
} from 'lucide-react';
import { metricsService, DashboardMetrics } from '../../services/metricsService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { SalesChart } from '../analytics/SalesChart';
import { TopProductsChart } from '../analytics/TopProductsChart';
import { PeakHoursChart } from '../analytics/PeakHoursChart';
import { DriverPerformance } from '../analytics/DriverPerformance';
import { DeliveryZonesMap } from '../analytics/DeliveryZonesMap';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function KPIDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await metricsService.getDashboardMetrics(
        `${dateRange.start}T00:00:00Z`,
        `${dateRange.end}T23:59:59Z`
      );
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando métricas...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No hay datos disponibles</p>
      </div>
    );
  }

  // Preparar datos para gráficos
  const deliveryPieData = [
    { name: 'Delivery', value: metrics.deliveryVsPickup.delivery },
    { name: 'Retiro', value: metrics.deliveryVsPickup.pickup }
  ];

  return (
    <Container fluid>
      {/* Filtros de Fecha */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Form className="d-flex gap-3 align-items-end">
                <Form.Group style={{ minWidth: '200px' }}>
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group style={{ minWidth: '200px' }}>
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </Form.Group>
                <Button variant="primary" onClick={loadMetrics}>
                  Actualizar
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* KPIs Principales */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <p className="text-muted mb-1">Ingresos Totales</p>
                  <h3 className="mb-0">{formatCurrency(metrics.totalRevenue)}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <DollarSign className="text-primary" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <small className="text-success">
                  <TrendingUp size={14} className="me-1" />
                  Hoy: {formatCurrency(metrics.todayRevenue)}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <p className="text-muted mb-1">Total Pedidos</p>
                  <h3 className="mb-0">{metrics.totalOrders}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <ShoppingBag className="text-success" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <small className="text-success">
                  <TrendingUp size={14} className="me-1" />
                  Hoy: {metrics.todayOrders}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <p className="text-muted mb-1">Costos Totales</p>
                  <h3 className="mb-0">{formatCurrency(metrics.totalCosts)}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <Package className="text-warning" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  {((metrics.totalCosts / metrics.totalRevenue) * 100).toFixed(1)}% del ingreso
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <p className="text-muted mb-1">Ganancia Neta</p>
                  <h3 className="mb-0 text-success">{formatCurrency(metrics.totalProfit)}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <TrendingUp className="text-success" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <small className="text-success">
                  Margen: {((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)}%
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico de Ventas por Período */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Ventas por Día</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={formatDate}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#0B6E4F" name="Ingresos" strokeWidth={2} />
                  <Line type="monotone" dataKey="orders" stroke="#dc3545" name="Pedidos" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Delivery vs Retiro */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Delivery vs Retiro</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deliveryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deliveryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span><Truck size={16} className="me-2 text-primary" />Delivery:</span>
                  <strong>{formatCurrency(metrics.deliveryVsPickup.deliveryRevenue)}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span><Home size={16} className="me-2 text-success" />Retiro:</span>
                  <strong>{formatCurrency(metrics.deliveryVsPickup.pickupRevenue)}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Productos Más Vendidos */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0 d-flex align-items-center">
                <Award className="me-2" />
                Productos Más Vendidos
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topProducts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="productName" type="category" width={150} />
                  <Tooltip formatter={(value: any) => value} />
                  <Bar dataKey="quantity" fill="#0B6E4F" name="Cantidad Vendida" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Clientes Frecuentes */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0 d-flex align-items-center">
                <Users className="me-2" />
                Clientes Frecuentes
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Pedidos</th>
                      <th>Total Gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.frequentCustomers.slice(0, 5).map((customer, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <strong>{customer.customerName}</strong>
                            <br />
                            <small className="text-muted">{customer.customerEmail}</small>
                          </div>
                        </td>
                        <td>{customer.orderCount}</td>
                        <td><strong>{formatCurrency(customer.totalSpent)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Promociones Más Usadas */}
      {metrics.topPromotions.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0 d-flex align-items-center">
                  <Tag className="me-2" />
                  Promociones Más Usadas
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Promoción</th>
                        <th>Usos</th>
                        <th>Descuento Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topPromotions.map((promo, index) => (
                        <tr key={index}>
                          <td><strong>{promo.name}</strong></td>
                          <td>{promo.uses}</td>
                          <td className="text-danger"><strong>{formatCurrency(promo.totalDiscount)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* NUEVOS GRÁFICOS - FASE 3 */}
      
      {/* Ventas por Período */}
      <Row className="mb-4">
        <Col>
          <SalesChart />
        </Col>
      </Row>

      {/* Top Productos y Horarios Peak */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4 mb-lg-0">
          <TopProductsChart />
        </Col>
        <Col lg={6}>
          <PeakHoursChart />
        </Col>
      </Row>

      {/* Rendimiento de Repartidores */}
      <Row className="mb-4">
        <Col>
          <DriverPerformance />
        </Col>
      </Row>

      {/* Mapa de Zonas de Entrega */}
      <Row className="mb-4">
        <Col>
          <DeliveryZonesMap />
        </Col>
      </Row>
    </Container>
  );
}
