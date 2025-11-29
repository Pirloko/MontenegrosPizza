import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Plus, Edit, Trash2, Calendar, Percent, Tag, Gift, Clock } from 'lucide-react';
import { promotionService } from '../../services/promotionService';
import { productService } from '../../services/productService';
import { Database } from '../../types/database';

type Promotion = Database['public']['Tables']['promotions']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

const PROMOTION_TYPES = {
  percentage: { label: 'Descuento por %', icon: Percent, color: 'primary' },
  fixed_amount: { label: 'Descuento Fijo', icon: Tag, color: 'success' },
  product_combo: { label: 'Combo de Productos', icon: Tag, color: 'info' },
  coupon: { label: 'Cupón', icon: Tag, color: 'warning' }
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

export default function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed_amount' | 'product_combo' | 'coupon',
    value: 0,
    minPurchase: 0,
    maxUses: 0,
    startDate: '',
    endDate: '',
    validDays: [] as number[],
    couponCode: '',
    selectedProducts: [] as Array<{ productId: string; quantity: number }>
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promotionsData, productsData] = await Promise.all([
        promotionService.getAll(),
        productService.getAll()
      ]);
      setPromotions(promotionsData);
      setProducts(productsData);
    } catch (err: any) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minPurchase: 0,
      maxUses: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      validDays: [],
      couponCode: '',
      selectedProducts: []
    });
    setShowModal(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type as any,
      value: promotion.value,
      minPurchase: promotion.min_purchase || 0,
      maxUses: promotion.max_uses || 0,
      startDate: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      endDate: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      validDays: promotion.valid_days ? JSON.parse(promotion.valid_days) : [],
      couponCode: promotion.coupon_code || '',
      selectedProducts: []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromotion) {
        await promotionService.update(editingPromotion.id, {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          value: formData.value,
          min_purchase: formData.minPurchase || null,
          max_uses: formData.maxUses || null,
          start_date: formData.startDate,
          end_date: formData.endDate,
          valid_days: formData.validDays.length > 0 ? JSON.stringify(formData.validDays) : null,
          coupon_code: formData.couponCode || null
        });
      } else {
        await promotionService.create({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          value: formData.value,
          minPurchase: formData.minPurchase || undefined,
          maxUses: formData.maxUses || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
          validDays: formData.validDays.length > 0 ? formData.validDays : undefined,
          couponCode: formData.couponCode || undefined,
          products: formData.selectedProducts.length > 0 ? formData.selectedProducts : undefined
        });
      }
      await loadData();
      setShowModal(false);
    } catch (err: any) {
      setError('Error al guardar promoción: ' + err.message);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      try {
        await promotionService.delete(id);
        await loadData();
      } catch (err: any) {
        setError('Error al eliminar promoción: ' + err.message);
      }
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      validDays: prev.validDays.includes(day)
        ? prev.validDays.filter(d => d !== day)
        : [...prev.validDays, day]
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, { productId: '', quantity: 1 }]
    }));
  };

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const getPromotionTypeInfo = (type: string) => {
    return PROMOTION_TYPES[type as keyof typeof PROMOTION_TYPES] || PROMOTION_TYPES.percentage;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const isActive = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date!);
    const endDate = new Date(promotion.end_date!);
    return promotion.is_active && now >= startDate && now <= endDate;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando promociones...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="mb-1">Gestión de Promociones</h3>
              <p className="text-muted mb-0">Administra las promociones y descuentos disponibles</p>
            </div>
            <Button variant="danger" onClick={handleCreatePromotion}>
              <Plus className="me-2" />
              Nueva Promoción
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Código</th>
                      <th>Vigencia</th>
                      <th>Usos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((promotion) => {
                      const typeInfo = getPromotionTypeInfo(promotion.type);
                      const IconComponent = typeInfo.icon;
                      const active = isActive(promotion);
                      
                      return (
                        <tr key={promotion.id}>
                          <td>
                            <div>
                              <strong>{promotion.name}</strong>
                              {promotion.description && (
                                <div><small className="text-muted">{promotion.description}</small></div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg={typeInfo.color} className="d-flex align-items-center gap-1">
                              <IconComponent size={12} />
                              {typeInfo.label}
                            </Badge>
                          </td>
                          <td>
                            {promotion.type === 'percentage' ? `${promotion.value}%` : `$${promotion.value.toLocaleString()}`}
                          </td>
                          <td>
                            {promotion.coupon_code ? (
                              <code>{promotion.coupon_code}</code>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div>
                              <small>Desde: {formatDate(promotion.start_date!)}</small><br />
                              <small>Hasta: {formatDate(promotion.end_date!)}</small>
                            </div>
                          </td>
                          <td>
                            {promotion.max_uses ? (
                              `${promotion.current_uses || 0}/${promotion.max_uses}`
                            ) : (
                              `${promotion.current_uses || 0}`
                            )}
                          </td>
                          <td>
                            <Badge bg={active ? 'success' : 'secondary'}>
                              {active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditPromotion(promotion)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeletePromotion(promotion.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {promotions.length === 0 && (
                <div className="text-center py-5">
                  <Gift size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay promociones creadas</p>
                  <Button variant="primary" onClick={handleCreatePromotion}>
                    Crear Primera Promoción
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Creación/Edición */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fw-bold">
            {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: '24px' }}>
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Ej: Descuento de Verano"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción de la promoción"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tipo de Promoción *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    style={{ fontSize: '15px', padding: '10px' }}
                  >
                    <option value="percentage">Descuento por Porcentaje</option>
                    <option value="fixed_amount">Descuento Fijo</option>
                    <option value="product_combo">Combo de Productos</option>
                    <option value="coupon">Cupón</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Valor *
                    {formData.type === 'percentage' && ' (%)'}
                    {(formData.type === 'fixed_amount' || formData.type === 'special_price') && ' ($)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step={formData.type === 'percentage' ? '1' : '100'}
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    required
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Compra Mínima ($)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="100"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData(prev => ({ ...prev, minPurchase: parseFloat(e.target.value) || 0 }))}
                    placeholder="0 = Sin mínimo"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                  <Form.Text className="text-muted small">
                    Monto mínimo de compra para aplicar la promoción
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Máximo de Usos</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = Sin límite"
                    style={{ fontSize: '15px', padding: '10px' }}
                  />
                  <Form.Text className="text-muted small">
                    Número máximo de veces que se puede usar esta promoción
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Código de Cupón</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                    placeholder="VERANO2024"
                    style={{ fontSize: '15px', padding: '10px', textTransform: 'uppercase' }}
                  />
                  <Form.Text className="text-muted small">
                    Deja vacío para promociones automáticas
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Fecha de Inicio *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                        style={{ fontSize: '15px', padding: '10px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Fecha de Fin *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                        style={{ fontSize: '15px', padding: '10px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Días Válidos */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Días Válidos</Form.Label>
              <div className="p-3 border rounded" style={{ background: '#f8f9fa' }}>
                <div className="d-flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Form.Check
                      key={day.value}
                      type="checkbox"
                      id={`day-${day.value}`}
                      label={
                        <span className={formData.validDays.includes(day.value) ? 'fw-semibold' : ''}>
                          {day.label}
                        </span>
                      }
                      checked={formData.validDays.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                      className="mb-2"
                    />
                  ))}
                </div>
                <Form.Text className="text-muted small d-block mt-2">
                  Si no seleccionas ningún día, será válida todos los días
                </Form.Text>
              </div>
            </Form.Group>

            {/* Productos para Combos */}
            {formData.type === 'product_combo' && (
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Label className="fw-bold">Productos del Combo</Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={addProduct}>
                    <Plus size={16} className="me-1" />
                    Agregar Producto
                  </Button>
                </div>
                {formData.selectedProducts.length === 0 ? (
                  <div className="p-3 border rounded text-center text-muted" style={{ background: '#f8f9fa' }}>
                    No hay productos agregados al combo. Haz clic en "Agregar Producto" para comenzar.
                  </div>
                ) : (
                  <div className="border rounded p-3" style={{ background: '#f8f9fa' }}>
                    {formData.selectedProducts.map((product, index) => (
                      <div key={index} className="d-flex gap-2 mb-2 align-items-center">
                        <Form.Select
                          value={product.productId}
                          onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                          style={{ fontSize: '15px', padding: '8px', flex: 1 }}
                        >
                          <option value="">Seleccionar producto</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </Form.Select>
                        <Form.Label className="mb-0 small">Cantidad:</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ width: '80px', fontSize: '15px', padding: '8px' }}
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeProduct(index)}
                          title="Eliminar producto"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer style={{ padding: '16px 24px', borderTop: '1px solid #dee2e6' }}>
            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ padding: '8px 20px' }}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" style={{ padding: '8px 20px', fontWeight: '600' }}>
              {editingPromotion ? 'Actualizar' : 'Crear'} Promoción
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
