import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { DollarSign, Fuel, Gauge, TrendingUp, Calculator, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

interface VehicleConfig {
  fuel_price_per_liter: number;
  km_per_liter: number;
}

export default function DeliveryEarnings() {
  const { user } = useAuth();
  const [deliveryHistory, setDeliveryHistory] = useState<Order[]>([]);
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>({
    fuel_price_per_liter: 0,
    km_per_liter: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Cargar historial de entregas
      const history = await deliveryService.getMyDeliveryHistory(user.id);
      setDeliveryHistory(history);
      
      // Cargar configuración del vehículo
      try {
        const { data, error: configError } = await supabase
          .from('users')
          .select('fuel_price_per_liter, km_per_liter')
          .eq('id', user.id)
          .single();
        
        if (!configError && data) {
          setVehicleConfig({
            fuel_price_per_liter: (data as any).fuel_price_per_liter || 0,
            km_per_liter: (data as any).km_per_liter || 0
          });
        } else if (configError?.message?.includes('fuel_price_per_liter') || configError?.message?.includes('km_per_liter') || configError?.message?.includes('schema cache')) {
          // Si las columnas no existen, usar valores por defecto
          setVehicleConfig({
            fuel_price_per_liter: 0,
            km_per_liter: 0
          });
          setError('⚠️ Las columnas de configuración del vehículo no existen. Ejecuta el script SQL: add_vehicle_config_to_users.sql en Supabase para habilitar esta funcionalidad.');
        }
      } catch (configErr: any) {
        // Si falla la carga de configuración, continuar con valores por defecto
        console.warn('Error loading vehicle config:', configErr);
        setVehicleConfig({
          fuel_price_per_liter: 0,
          km_per_liter: 0
        });
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.message?.includes('fuel_price_per_liter') || err.message?.includes('km_per_liter') || err.message?.includes('schema cache')) {
        setError('⚠️ Las columnas de configuración del vehículo no existen. Ejecuta el script SQL: add_vehicle_config_to_users.sql en Supabase.');
      } else {
        setError('Error al cargar datos: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!user?.id) return;
    
    if (vehicleConfig.fuel_price_per_liter <= 0 || vehicleConfig.km_per_liter <= 0) {
      setError('Por favor ingresa valores válidos para la configuración del vehículo');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          fuel_price_per_liter: vehicleConfig.fuel_price_per_liter,
          km_per_liter: vehicleConfig.km_per_liter,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving config:', err);
      
      // Verificar si el error es por columnas faltantes
      if (err.message?.includes('fuel_price_per_liter') || err.message?.includes('km_per_liter') || err.message?.includes('schema cache')) {
        setError('Las columnas de configuración del vehículo no existen en la base de datos. Por favor, ejecuta el script SQL: add_vehicle_config_to_users.sql en Supabase.');
      } else {
        setError('Error al guardar configuración: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Calcular estadísticas
  const calculateStats = () => {
    const totalEarnings = deliveryHistory.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);
    const totalDeliveries = deliveryHistory.length;
    
    // Calcular distancia total (estimada basada en entregas)
    // Nota: En una implementación real, deberías tener la distancia real de cada entrega
    // Por ahora, estimamos 5km promedio por entrega
    const avgDistancePerDelivery = 5; // km
    const totalKm = totalDeliveries * avgDistancePerDelivery;
    
    // Calcular costos de combustible
    const totalLiters = vehicleConfig.km_per_liter > 0 ? totalKm / vehicleConfig.km_per_liter : 0;
    const totalFuelCost = totalLiters * vehicleConfig.fuel_price_per_liter;
    
    // Ganancia neta
    const netEarnings = totalEarnings - totalFuelCost;
    
    return {
      totalEarnings,
      totalDeliveries,
      totalKm,
      totalLiters,
      totalFuelCost,
      netEarnings,
      avgEarningsPerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0
    };
  };

  const stats = calculateStats();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" style={{ color: '#00C853' }} />
          <p className="mt-3 text-brand-gray-muted">Cargando datos...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2 mb-1 fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>
            <DollarSign size={28} style={{ color: '#00C853' }} />
            Ganancias
          </h2>
          <p className="text-brand-gray-muted mb-0">Gestiona tus ganancias y costos de entrega</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Row className="g-4 mb-4">
        {/* Configuración del Vehículo */}
        <Col lg={4}>
          <Card className="panel-card">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 d-flex align-items-center fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>
                <Gauge size={20} className="me-2" style={{ color: '#00C853' }} />
                Configuración del Vehículo
              </h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <Fuel size={16} className="me-1" />
                    Precio de Bencina (por litro)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 1200"
                    value={vehicleConfig.fuel_price_per_liter || ''}
                    onChange={(e) => setVehicleConfig({
                      ...vehicleConfig,
                      fuel_price_per_liter: parseFloat(e.target.value) || 0
                    })}
                  />
                  <Form.Text className="text-muted">
                    Ingresa el precio actual de la bencina en pesos chilenos
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <Gauge size={16} className="me-1" />
                    Kilómetros por Litro
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 15.5"
                    value={vehicleConfig.km_per_liter || ''}
                    onChange={(e) => setVehicleConfig({
                      ...vehicleConfig,
                      km_per_liter: parseFloat(e.target.value) || 0
                    })}
                  />
                  <Form.Text className="text-muted">
                    Rendimiento de combustible de tu vehículo (km/L)
                  </Form.Text>
                </Form.Group>

                <Button
                  className="w-100 rounded-3 panel-btn-primary"
                  onClick={handleSaveConfig}
                  disabled={saving}
                >
                  <Save size={18} className="me-2" />
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Estadísticas de Ganancias */}
        <Col lg={8}>
          <Row className="g-3">
            <Col md={6}>
              <Card className="panel-card border-0">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-brand-gray-muted mb-1 small">Ganancias Totales</p>
                      <h3 className="mb-0 fw-bold" style={{ color: '#00C853' }}>${stats.totalEarnings.toLocaleString('es-CL')}</h3>
                    </div>
                    <DollarSign size={32} style={{ color: '#00C853' }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="panel-card border-0">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-brand-gray-muted mb-1 small">Ganancia Neta</p>
                      <h3 className="mb-0 fw-bold" style={{ color: '#00C853' }}>${stats.netEarnings.toLocaleString('es-CL')}</h3>
                    </div>
                    <TrendingUp size={32} style={{ color: '#00C853' }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="panel-card border-0">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-brand-gray-muted mb-1 small">Costo de Combustible</p>
                      <h3 className="mb-0 fw-bold" style={{ color: '#E53935' }}>${stats.totalFuelCost.toLocaleString('es-CL')}</h3>
                    </div>
                    <Fuel size={32} style={{ color: '#E53935' }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="panel-card border-0">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-brand-gray-muted mb-1 small">Promedio por Entrega</p>
                      <h3 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>${stats.avgEarningsPerDelivery.toLocaleString('es-CL')}</h3>
                    </div>
                    <Calculator size={32} style={{ color: '#424242' }} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Detalles de Cálculo */}
          {vehicleConfig.fuel_price_per_liter > 0 && vehicleConfig.km_per_liter > 0 && (
            <Card className="panel-card mt-3">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>Detalles del Cálculo</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Total de Entregas:</strong> {stats.totalDeliveries}
                    </p>
                    <p className="mb-2">
                      <strong>Kilómetros Totales:</strong> {stats.totalKm.toFixed(1)} km
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Litros Consumidos:</strong> {stats.totalLiters.toFixed(2)} L
                    </p>
                    <p className="mb-2">
                      <strong>Costo por Litro:</strong> ${vehicleConfig.fuel_price_per_liter.toLocaleString()}
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Historial de Entregas */}
      <Row>
        <Col>
          <Card className="panel-card">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: '#1a1a1a', fontFamily: 'var(--font-display)' }}>Historial de Entregas</h5>
            </Card.Header>
            <Card.Body>
              {deliveryHistory.length === 0 ? (
                <div className="panel-empty-state">
                  <p className="mb-0">No tienes entregas completadas aún</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Dirección</th>
                        <th>Fecha</th>
                        <th className="text-end">Ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryHistory.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>#{order.order_number}</strong>
                          </td>
                          <td>{order.customer_name}</td>
                          <td>
                            <small>{order.delivery_address || 'N/A'}</small>
                          </td>
                          <td>
                            <small>{formatDate(order.updated_at!)}</small>
                          </td>
                          <td className="text-end">
                            <Badge bg="success">
                              ${(order.delivery_fee || 0).toLocaleString()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end">
                          <strong>Total:</strong>
                        </td>
                        <td className="text-end">
                          <strong className="text-success">
                            ${stats.totalEarnings.toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

