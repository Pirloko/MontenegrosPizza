import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Settings, MapPin, DollarSign, Truck, Save, RefreshCw, Gift } from 'lucide-react';
import { deliveryConfigService } from '../../services/deliveryConfigService';
import { useAuth } from '../../context/AuthContext';
import { Database } from '../../types/database';

type DeliveryConfig = Database['public']['Tables']['delivery_config']['Row'];

export default function DeliveryConfiguration() {
  const { user } = useAuth();
  const [config, setConfig] = useState<DeliveryConfig | null>(null);
  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    store_latitude: -34.1704,
    store_longitude: -70.7408,
    base_fee: 800,
    price_per_km: 300,
    min_delivery_fee: 1500,
    max_delivery_fee: 5000,
    free_delivery_enabled: false,
    free_delivery_min_amount: 20000,
    max_delivery_distance_km: 15
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await deliveryConfigService.getConfig();
      if (data) {
        setConfig(data);
        setFormData({
          store_name: data.store_name,
          store_address: data.store_address,
          store_latitude: data.store_latitude,
          store_longitude: data.store_longitude,
          base_fee: data.base_fee,
          price_per_km: data.price_per_km,
          min_delivery_fee: data.min_delivery_fee,
          max_delivery_fee: data.max_delivery_fee,
          free_delivery_enabled: data.free_delivery_enabled,
          free_delivery_min_amount: data.free_delivery_min_amount,
          max_delivery_distance_km: data.max_delivery_distance_km
        });
      }
    } catch (err: any) {
      setError('Error al cargar configuración: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await deliveryConfigService.updateConfig(formData, user.id);
      
      setSuccess('✅ Configuración guardada exitosamente');
      await loadConfig();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Ejemplo de cálculo en tiempo real
  const exampleDistance = 5; // 5 km de ejemplo
  const exampleFee = formData.base_fee + (exampleDistance * formData.price_per_km);
  const exampleFeeAdjusted = Math.max(formData.min_delivery_fee, Math.min(exampleFee, formData.max_delivery_fee));

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando configuración...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="d-flex align-items-center gap-2">
            <Settings size={28} />
            Configuración de Delivery
          </h2>
          <p className="text-muted">Administra las tarifas y zonas de entrega</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSave}>
        <Row className="g-4">
          {/* Ubicación del Local */}
          <Col lg={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <MapPin className="me-2" />
                  Ubicación del Local
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Local</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.store_address}
                    onChange={(e) => handleInputChange('store_address', e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Diego de Almagro 1059, Rancagua, O'Higgins
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Latitud</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.000001"
                        value={formData.store_latitude}
                        onChange={(e) => handleInputChange('store_latitude', parseFloat(e.target.value))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Longitud</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.000001"
                        value={formData.store_longitude}
                        onChange={(e) => handleInputChange('store_longitude', parseFloat(e.target.value))}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info" className="mb-0">
                  <small>
                    💡 Puedes buscar las coordenadas exactas en <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a> (clic derecho en el mapa → ver coordenadas)
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          </Col>

          {/* Tarifas de Delivery */}
          <Col lg={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <DollarSign className="me-2" />
                  Tarifas de Delivery
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Costo Base</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    value={formData.base_fee}
                    onChange={(e) => handleInputChange('base_fee', parseInt(e.target.value))}
                    required
                  />
                  <Form.Text className="text-muted">
                    Costo fijo inicial antes de calcular distancia
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Precio por Kilómetro</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="50"
                    value={formData.price_per_km}
                    onChange={(e) => handleInputChange('price_per_km', parseInt(e.target.value))}
                    required
                  />
                  <Form.Text className="text-muted">
                    Costo adicional por cada kilómetro de distancia
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mínimo</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="100"
                        value={formData.min_delivery_fee}
                        onChange={(e) => handleInputChange('min_delivery_fee', parseInt(e.target.value))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Máximo</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="100"
                        value={formData.max_delivery_fee}
                        onChange={(e) => handleInputChange('max_delivery_fee', parseInt(e.target.value))}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Distancia Máxima de Entrega (km)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={formData.max_delivery_distance_km}
                    onChange={(e) => handleInputChange('max_delivery_distance_km', parseInt(e.target.value))}
                    required
                  />
                  <Form.Text className="text-muted">
                    No se aceptarán pedidos más allá de esta distancia
                  </Form.Text>
                </Form.Group>

                {/* Ejemplo de cálculo */}
                <Alert variant="secondary" className="mb-0">
                  <strong>📊 Ejemplo de cálculo ({exampleDistance} km):</strong>
                  <div className="mt-2">
                    ${formData.base_fee} (base) + ${exampleDistance} km × ${formData.price_per_km} = ${exampleFee}
                    <br />
                    <strong>Costo final: ${exampleFeeAdjusted.toLocaleString()}</strong>
                  </div>
                </Alert>
              </Card.Body>
            </Card>
          </Col>

          {/* Delivery Gratis */}
          <Col lg={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-warning">
                <h5 className="mb-0 d-flex align-items-center">
                  <Gift className="me-2" />
                  Delivery Gratis (Promoción)
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="switch"
                        id="free-delivery-switch"
                        label={
                          <span className="fw-bold">
                            {formData.free_delivery_enabled ? (
                              <Badge bg="success">✅ Activado</Badge>
                            ) : (
                              <Badge bg="secondary">❌ Desactivado</Badge>
                            )}
                            <span className="ms-2">Habilitar Delivery Gratis</span>
                          </span>
                        }
                        checked={formData.free_delivery_enabled}
                        onChange={(e) => handleInputChange('free_delivery_enabled', e.target.checked)}
                      />
                      <Form.Text className="text-muted">
                        Cuando está activado, los pedidos sobre el monto mínimo tendrán delivery gratis
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Compra Mínima para Delivery Gratis</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.free_delivery_min_amount}
                        onChange={(e) => handleInputChange('free_delivery_min_amount', parseInt(e.target.value))}
                        disabled={!formData.free_delivery_enabled}
                        required
                      />
                      <Form.Text className="text-muted">
                        Monto mínimo de compra para delivery gratis
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {formData.free_delivery_enabled && (
                  <Alert variant="success" className="mb-0">
                    <strong>🎉 Delivery Gratis Activado</strong>
                    <p className="mb-0 mt-2">
                      Los pedidos de ${formData.free_delivery_min_amount.toLocaleString()} o más tendrán delivery gratis
                    </p>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="mt-4 d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={loadConfig} disabled={saving}>
            <RefreshCw size={18} className="me-2" />
            Recargar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} className="me-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* Información de ayuda */}
      <Row className="mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <h6 className="fw-bold mb-3">ℹ️ Información del Sistema de Delivery</h6>
              <ul className="mb-0">
                <li>El costo se calcula automáticamente cuando el cliente marca su ubicación en el mapa</li>
                <li>Fórmula: <code>Costo Base + (Distancia en km × Precio por km)</code></li>
                <li>El resultado se ajusta entre el mínimo y máximo configurado</li>
                <li>Si el delivery gratis está activado y el pedido supera el monto mínimo, el costo será $0</li>
                <li>Los pedidos fuera de la distancia máxima serán rechazados automáticamente</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

