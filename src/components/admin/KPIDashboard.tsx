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
      {/* Filtros de fecha compactos */}
      <Row className="mb-4">
        <Col>
          <Card style={{ border: 'none', borderRadius: '1rem' }}>
            <Card.Body className="py-3">
              <Form className="d-flex flex-wrap gap-3 align-items-end admin-date-filters">
                <Form.Group style={{ minWidth: '160px' }} className="mb-0">
                  <Form.Label className="small mb-1" style={{ color: '#b0b0b0', fontWeight: 500 }}>
                    Inicio
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group style={{ minWidth: '160px' }} className="mb-0">
                  <Form.Label className="small mb-1" style={{ color: '#b0b0b0', fontWeight: 500 }}>
                    Fin
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </Form.Group>
                <Button variant="primary" onClick={loadMetrics} className="px-3">
                  Actualizar
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* KPIs con iconos más grandes y animación de entrada */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100 kpi-card admin-kpi-card border-0">
            <Card.Body style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <p className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ingresos Totales
                  </p>
                  <h3 className="mb-0" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
                    {formatCurrency(metrics.totalRevenue)}
                  </h3>
                </div>
                <div className="admin-kpi-icon kpi-icon-wrapper info" style={{ backgroundColor: 'rgba(23, 162, 184, 0.25)' }}>
                  <DollarSign size={28} style={{ color: '#17a2b8' }} />
                </div>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
                <small className="trend-up">
                  <TrendingUp size={16} className="me-1" />
                  <span style={{ fontWeight: 600 }}>Hoy: {formatCurrency(metrics.todayRevenue)}</span>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 kpi-card admin-kpi-card border-0">
            <Card.Body style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <p className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Pedidos
                  </p>
                  <h3 className="mb-0" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
                    {metrics.totalOrders.toLocaleString()}
                  </h3>
                </div>
                <div className="admin-kpi-icon kpi-icon-wrapper success" style={{ backgroundColor: 'rgba(0, 200, 83, 0.25)' }}>
                  <ShoppingBag size={28} style={{ color: '#00C853' }} />
                </div>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
                <small className="trend-up">
                  <TrendingUp size={16} className="me-1" />
                  <span style={{ fontWeight: 600 }}>Hoy: {metrics.todayOrders}</span>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 kpi-card admin-kpi-card border-0">
            <Card.Body style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <p className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Costos Totales
                  </p>
                  <h3 className="mb-0" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
                    {formatCurrency(metrics.totalCosts)}
                  </h3>
                </div>
                <div className="admin-kpi-icon kpi-icon-wrapper warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.25)' }}>
                  <Package size={28} style={{ color: '#FFD54F' }} />
                </div>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
                <small className="text-muted" style={{ fontWeight: 500 }}>
                  {((metrics.totalCosts / metrics.totalRevenue) * 100).toFixed(1)}% del ingreso
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 kpi-card admin-kpi-card border-0">
            <Card.Body style={{ padding: '24px' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ flex: 1 }}>
                  <p className="text-muted mb-2" style={{ fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ganancia Neta
                  </p>
                  <h3 className="mb-0" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#00C853' }}>
                    {formatCurrency(metrics.totalProfit)}
                  </h3>
                </div>
                <div className="admin-kpi-icon kpi-icon-wrapper success" style={{ backgroundColor: 'rgba(0, 200, 83, 0.25)' }}>
                  <TrendingUp size={28} style={{ color: '#00C853' }} />
                </div>
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
                <small className="trend-up" style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>
                    Margen: {((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráfico de Ventas por Período */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
              <h5 className="mb-0" style={{ color: '#fff', fontWeight: 600 }}>Ventas por Día</h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={formatDate}
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: '12px',
                      color: '#fff',
                      padding: '12px 16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00C853" 
                    name="Ingresos" 
                    strokeWidth={3}
                    dot={{ fill: '#00C853', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#E53935" 
                    name="Pedidos" 
                    strokeWidth={3}
                    dot={{ fill: '#E53935', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Delivery vs Retiro */}
        <Col lg={4}>
          <Card className="h-100" style={{ border: 'none', borderRadius: '12px' }}>
            <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
              <h5 className="mb-0" style={{ color: '#fff', fontWeight: 600 }}>Tipo de Pedido</h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#00C853' : '#E53935'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #333' }}>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span style={{ color: '#b0b0b0' }}>
                    <Truck size={16} className="me-2" style={{ color: '#00C853' }} />
                    Delivery:
                  </span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(metrics.deliveryVsPickup.deliveryRevenue)}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ color: '#b0b0b0' }}>
                    <Home size={16} className="me-2" style={{ color: '#E53935' }} />
                    Retiro:
                  </span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(metrics.deliveryVsPickup.pickupRevenue)}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Productos Más Vendidos */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
              <h5 className="mb-0 d-flex align-items-center" style={{ color: '#fff', fontWeight: 600 }}>
                <Award className="me-2" size={20} style={{ color: '#0B6E4F' }} />
                Top 10 Productos
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topProducts.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    type="number" 
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    dataKey="productName" 
                    type="category" 
                    width={150}
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => value}
                    contentStyle={{
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="#00C853" 
                    name="Cantidad Vendida"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Clientes Frecuentes */}
        <Col lg={6}>
          <Card style={{ border: 'none', borderRadius: '12px' }}>
            <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
              <h5 className="mb-0 d-flex align-items-center" style={{ color: '#fff', fontWeight: 600 }}>
                <Users className="me-2" size={20} style={{ color: '#0B6E4F' }} />
                Clientes Frecuentes
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <div className="table-responsive">
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Cliente</th>
                      <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Pedidos</th>
                      <th style={{ color: '#b0b0b0', fontWeight: 600, borderColor: '#333' }}>Total Gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.frequentCustomers.slice(0, 5).map((customer, index) => (
                      <tr key={index}>
                        <td style={{ borderColor: '#333' }}>
                          <div>
                            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>
                              {customer.customerName}
                            </strong>
                            <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                              {customer.customerEmail}
                            </small>
                          </div>
                        </td>
                        <td style={{ borderColor: '#333', color: '#fff', verticalAlign: 'middle' }}>
                          <span className="badge" style={{ 
                            background: 'rgba(11, 110, 79, 0.2)', 
                            color: '#0B6E4F',
                            border: '1px solid #0B6E4F',
                            padding: '6px 12px'
                          }}>
                            {customer.orderCount}
                          </span>
                        </td>
                        <td style={{ borderColor: '#333', verticalAlign: 'middle' }}>
                          <strong style={{ color: '#0B6E4F' }}>{formatCurrency(customer.totalSpent)}</strong>
                        </td>
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
