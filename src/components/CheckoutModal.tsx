import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Card, Badge } from 'react-bootstrap';
import { ShoppingCart, MapPin, Clock, CreditCard, Gift, Tag, Map, Truck, X, LogIn, UserPlus } from 'lucide-react';
import { CartItem } from '../types/index';
import { orderService } from '../services/orderService';
import { promotionService } from '../services/promotionService';
import { deliveryConfigService } from '../services/deliveryConfigService';
import AddressSelector from './AddressSelector';
import AddressMapPicker from './AddressMapPicker';
import { Database } from '../types/database';
import { validateChileanPhone, validateEmail, validateAddress, validateProductAvailability } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type DeliveryConfig = Database['public']['Tables']['delivery_config']['Row'];

interface CheckoutModalProps {
  show: boolean;
  onHide: () => void;
  cartItems: CartItem[];
  onOrderSuccess: () => void;
}

export default function CheckoutModal({ show, onHide, cartItems, onOrderSuccess }: CheckoutModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    deliveryAddress: '',
    notes: '',
    pointsUsed: 0,
    couponCode: ''
  });
  
  // Cargar datos del usuario si está logueado
  useEffect(() => {
    if (user && show) {
      setFormData(prev => ({
        ...prev,
        customerName: user.full_name || prev.customerName,
        customerPhone: user.phone || prev.customerPhone,
        customerEmail: user.email || prev.customerEmail
      }));
    }
  }, [user, show]);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [promotionError, setPromotionError] = useState('');

  // Calcular totales con validaciones
  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = Number(item.product.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const itemTotal = itemPrice * quantity;
    
    const extraCost = item.customizations.addedIngredients.reduce((sum, ing) => {
      const price = Number(ing.price) || 0;
      return sum + price;
    }, 0) * quantity;
    
    return total + itemTotal + extraCost;
  }, 0);

  const pointsDiscount = (Number(formData.pointsUsed) || 0) * 100; // 100 pesos por punto
  const promotionDiscount = appliedPromotion ? (Number(appliedPromotion.discount) || 0) : 0;
  const totalDiscount = pointsDiscount + promotionDiscount;
  const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
  const total = subtotalAfterDiscount + deliveryFee;

  // Calcular puntos ganados (solo sobre productos, no sobre delivery)
  const pointsEarned = Math.floor(subtotalAfterDiscount / 1000) * 5;

  // Cargar configuración de delivery al montar el componente
  useEffect(() => {
    loadDeliveryConfig();
  }, []);

  // Recalcular delivery fee cuando cambian las coordenadas o el tipo de entrega
  useEffect(() => {
    if (formData.deliveryType === 'delivery' && deliveryCoords && deliveryConfig) {
      try {
        const result = deliveryConfigService.calculateDeliveryFee(
          deliveryConfig,
          deliveryCoords.lat,
          deliveryCoords.lng,
          subtotalAfterDiscount
        );
        setDeliveryFee(result.fee);
        setDeliveryDistance(result.distance);
        setIsFreeDelivery(result.isFree);
      } catch (err: any) {
        setError(err.message);
        setDeliveryFee(0);
      }
    } else {
      setDeliveryFee(0);
      setDeliveryDistance(0);
      setIsFreeDelivery(false);
    }
  }, [deliveryCoords, formData.deliveryType, deliveryConfig, subtotalAfterDiscount]);

  const loadDeliveryConfig = async () => {
    try {
      const config = await deliveryConfigService.getConfig();
      setDeliveryConfig(config);
    } catch (err: any) {
      console.error('Error cargando configuración de delivery:', err);
      // No mostrar error al usuario, usar valores por defecto
    }
  };

  const handleApplyPromotion = async () => {
    if (!formData.couponCode.trim()) {
      setPromotionError('Ingresa un código de cupón');
      return;
    }

    try {
      setPromotionError('');
      const result = await promotionService.applyPromotion(formData.couponCode, subtotal, formData.customerEmail);
      setAppliedPromotion(result);
    } catch (err: any) {
      setPromotionError(err.message);
      setAppliedPromotion(null);
    }
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setFormData(prev => ({ ...prev, couponCode: '' }));
    setPromotionError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones de formulario
    if (!formData.customerName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    // Validar teléfono
    const phoneValidation = validateChileanPhone(formData.customerPhone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.errors[0].message);
      return;
    }

    // Validar email si se proporciona
    if (formData.customerEmail) {
      const emailValidation = validateEmail(formData.customerEmail);
      if (!emailValidation.isValid) {
        setError(emailValidation.errors[0].message);
        return;
      }
    }

    // Validar dirección para delivery
    if (formData.deliveryType === 'delivery') {
      if (!deliveryCoords) {
        setError('Por favor, selecciona tu ubicación en el mapa para calcular el costo de delivery');
        return;
      }
      
      if (!formData.deliveryAddress.trim()) {
        setError('Por favor ingresa tu dirección de entrega');
        return;
      }

      const addressValidation = validateAddress(formData.deliveryAddress);
      if (!addressValidation.isValid) {
        setError(addressValidation.errors[0].message);
        return;
      }
    }

    // Validar disponibilidad de todos los productos en el carrito
    for (const item of cartItems) {
      const validation = validateProductAvailability(item.product);
      if (!validation.isValid) {
        setError(validation.errors[0].message);
        return;
      }
    }
    
    setLoading(true);
    setError('');

    try {
      // Preparar items para el pedido con validaciones
      const orderItems = cartItems.map(item => {
        const itemPrice = Number(item.product.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const baseSubtotal = itemPrice * quantity;
        
        const extraCost = item.customizations.addedIngredients.reduce((sum, ing) => {
          const price = Number(ing.price) || 0;
          return sum + price;
        }, 0) * quantity;
        
        const itemSubtotal = baseSubtotal + extraCost;
        
        return {
          productId: item.product.id,
          productName: item.product.name,
          productPrice: itemPrice,
          quantity: quantity,
          subtotal: itemSubtotal,
          removedIngredients: item.customizations.removedIngredients,
          addedIngredients: item.customizations.addedIngredients,
          specialInstructions: item.customizations.specialInstructions,
          extraIngredientsCost: extraCost
        };
      });

      // Validar que los totales sean válidos
      if (isNaN(subtotal) || isNaN(total) || subtotal <= 0 || total <= 0) {
        throw new Error('Error en el cálculo de totales. Por favor, revisa los productos en tu carrito.');
      }

      // Usar email del usuario logueado si está disponible
      const customerEmail = user?.email || formData.customerEmail || undefined;

      // Crear el pedido
      await orderService.createOrder({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: customerEmail,
        deliveryType: formData.deliveryType,
        deliveryAddress: formData.deliveryType === 'delivery' ? formData.deliveryAddress : undefined,
        deliveryLatitude: formData.deliveryType === 'delivery' && deliveryCoords ? deliveryCoords.lat : undefined,
        deliveryLongitude: formData.deliveryType === 'delivery' && deliveryCoords ? deliveryCoords.lng : undefined,
        deliveryFee: deliveryFee,
        items: orderItems,
        subtotal: subtotal,
        discount: totalDiscount,
        total: total,
        notes: formData.notes,
        pointsUsed: formData.pointsUsed,
        promotionId: appliedPromotion ? appliedPromotion.promotion.id : undefined
      });

      // Incrementar uso de promoción si se aplicó
      if (appliedPromotion) {
        await promotionService.incrementUsage(appliedPromotion.promotion.id);
      }

      setSuccess(true);
      setTimeout(() => {
        onOrderSuccess();
        onHide();
        setSuccess(false);
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          deliveryType: 'delivery',
          deliveryAddress: '',
          notes: '',
          pointsUsed: 0,
          couponCode: ''
        });
        setAppliedPromotion(null);
        setPromotionError('');
      }, 2000);

    } catch (err: any) {
      setError('Error al crear el pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Body className="text-center py-5">
          <div className="text-success mb-4">
            <ShoppingCart size={64} />
          </div>
          <h3 className="text-success mb-3">¡Pedido Creado Exitosamente!</h3>
          <p className="text-muted">
            Tu pedido ha sido recibido y está siendo procesado.
            <br />
            Te contactaremos pronto para confirmar los detalles.
          </p>
          {pointsEarned > 0 && (
            <Alert variant="info" className="mt-3">
              <Gift className="me-2" />
              ¡Ganaste {pointsEarned} puntos de lealtad!
            </Alert>
          )}
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="lg" 
      centered
      contentClassName="border-0"
      style={{ borderRadius: '16px', overflow: 'hidden' }}
    >
      {/* Header con gradiente usando paleta del logo */}
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #0B6E4F 100%)',
          padding: '24px',
          color: 'white',
          position: 'relative'
        }}
      >
        <button
          onClick={onHide}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingCart size={28} />
          Finalizar Pedido
        </h2>
      </div>

      <Modal.Body style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" style={{ borderRadius: '8px', marginBottom: '20px' }}>
            {error}
          </Alert>
        )}
        
        {/* Mensaje si no está logueado */}
        {!user && (
          <Alert variant="warning" style={{ borderRadius: '8px', marginBottom: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <LogIn size={20} />
              <strong>Inicia sesión para ganar puntos de lealtad</strong>
            </div>
            <p className="mb-3">
              Para recibir puntos de lealtad y hacer seguimiento de tus pedidos, necesitas iniciar sesión o crear una cuenta.
            </p>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onHide();
                  navigate('/login');
                }}
                className="d-flex align-items-center gap-2"
              >
                <LogIn size={16} />
                Iniciar Sesión
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  onHide();
                  navigate('/register');
                }}
                className="d-flex align-items-center gap-2"
              >
                <UserPlus size={16} />
                Crear Cuenta
              </Button>
            </div>
            <p className="text-muted small mt-3 mb-0">
              Puedes continuar sin cuenta, pero no recibirás puntos de lealtad.
            </p>
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Información del Cliente */}
            <Col md={6}>
              <Card 
                className="mb-4" 
                style={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Card.Header style={{ 
                  background: '#f8f9fa', 
                  borderBottom: '1px solid #e9ecef',
                  borderRadius: '12px 12px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0" style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                    Información del Cliente
                  </h5>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                      Nombre Completo *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      required
                      placeholder="Tu nombre completo"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                        padding: '12px',
                        fontSize: '14px'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                      Teléfono *
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      required
                      placeholder="+56 9 1234 5678"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                        padding: '12px',
                        fontSize: '14px'
                      }}
                    />
                  </Form.Group>

                  {user ? (
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.customerEmail}
                        disabled
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #dee2e6',
                          padding: '12px',
                          fontSize: '14px',
                          backgroundColor: '#f8f9fa',
                          cursor: 'not-allowed'
                        }}
                      />
                      <Form.Text className="text-success" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        ✅ Email de tu cuenta - Recibirás puntos de lealtad automáticamente
                      </Form.Text>
                    </Form.Group>
                  ) : (
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                        Email (Opcional)
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                        placeholder="tu@email.com"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #dee2e6',
                          padding: '12px',
                          fontSize: '14px'
                        }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Para recibir puntos de lealtad, inicia sesión o crea una cuenta
                      </Form.Text>
                    </Form.Group>
                  )}
                </Card.Body>
              </Card>

              {/* Sección de Promociones */}
              <Card 
                className="mb-4" 
                style={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Card.Header style={{ 
                  background: '#f8f9fa', 
                  borderBottom: '1px solid #e9ecef',
                  borderRadius: '12px 12px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0 d-flex align-items-center" style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                    <Tag size={20} className="me-2" />
                    Promociones y Cupones
                  </h5>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                      Código de Cupón
                    </Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        value={formData.couponCode}
                        onChange={(e) => handleInputChange('couponCode', e.target.value.toUpperCase())}
                        placeholder="VERANO2024"
                        disabled={!!appliedPromotion}
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #dee2e6',
                          padding: '12px',
                          fontSize: '14px'
                        }}
                      />
                      {!appliedPromotion ? (
                        <Button 
                          onClick={handleApplyPromotion}
                          disabled={!formData.couponCode.trim()}
                          style={{
                            borderRadius: '8px',
                            background: '#0B6E4F',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            padding: '12px 20px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.background = '#095a41';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#0B6E4F';
                          }}
                        >
                          Aplicar
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleRemovePromotion}
                          style={{
                            borderRadius: '8px',
                            background: '#dc3545',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            padding: '12px 20px'
                          }}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                    {promotionError && (
                      <Form.Text className="text-danger">{promotionError}</Form.Text>
                    )}
                    {appliedPromotion && (
                      <Alert variant="success" className="mt-2 mb-0">
                        <Tag className="me-2" />
                        <strong>{appliedPromotion.promotion.name}</strong> aplicado
                        <br />
                        <small>Descuento: ${appliedPromotion.discount.toLocaleString()}</small>
                      </Alert>
                    )}
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            {/* Opciones de Entrega */}
            <Col md={6}>
              <Card 
                className="mb-4" 
                style={{ 
                  borderRadius: '12px', 
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <Card.Header style={{ 
                  background: '#f8f9fa', 
                  borderBottom: '1px solid #e9ecef',
                  borderRadius: '12px 12px 0 0',
                  padding: '16px 20px'
                }}>
                  <h5 className="mb-0" style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                    Opciones de Entrega
                  </h5>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '12px', display: 'block' }}>
                      Tipo de Entrega *
                    </Form.Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div
                        onClick={() => handleInputChange('deliveryType', 'delivery')}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: `2px solid ${formData.deliveryType === 'delivery' ? '#0B6E4F' : '#dee2e6'}`,
                          background: formData.deliveryType === 'delivery' ? '#f0f9f6' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.deliveryType !== 'delivery') {
                            e.currentTarget.style.borderColor = '#adb5bd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.deliveryType !== 'delivery') {
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value="delivery"
                          checked={formData.deliveryType === 'delivery'}
                          onChange={() => {}}
                          style={{ accentColor: '#0B6E4F', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: '500', color: '#000' }}>Delivery</span>
                      </div>
                      <div
                        onClick={() => handleInputChange('deliveryType', 'pickup')}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: `2px solid ${formData.deliveryType === 'pickup' ? '#0B6E4F' : '#dee2e6'}`,
                          background: formData.deliveryType === 'pickup' ? '#f0f9f6' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.deliveryType !== 'pickup') {
                            e.currentTarget.style.borderColor = '#adb5bd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.deliveryType !== 'pickup') {
                            e.currentTarget.style.borderColor = '#dee2e6';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="deliveryType"
                          value="pickup"
                          checked={formData.deliveryType === 'pickup'}
                          onChange={() => {}}
                          style={{ accentColor: '#0B6E4F', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: '500', color: '#000' }}>Retiro en Tienda</span>
                      </div>
                    </div>
                  </Form.Group>

                  {formData.deliveryType === 'delivery' && (
                    <>
                      {!deliveryCoords && (
                        <Alert 
                          variant="warning" 
                          className="mb-3"
                          style={{ 
                            borderRadius: '8px',
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            color: '#856404'
                          }}
                        >
                          <strong>📍 Importante:</strong> Debes marcar tu ubicación en el mapa para calcular el costo de delivery
                        </Alert>
                      )}
                      
                      <Button 
                        className="mb-3 w-100"
                        onClick={() => setShowMapPicker(!showMapPicker)}
                        style={{
                          borderRadius: '8px',
                          background: deliveryCoords ? '#0B6E4F' : '#000',
                          border: 'none',
                          color: 'white',
                          fontWeight: '600',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = deliveryCoords ? '#095a41' : '#1a1a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = deliveryCoords ? '#0B6E4F' : '#000';
                        }}
                      >
                        <Map size={18} />
                        {deliveryCoords 
                          ? (showMapPicker ? 'Ocultar Mapa' : 'Cambiar Ubicación')
                          : 'Seleccionar Ubicación en Mapa'}
                      </Button>
                      
                      {showMapPicker ? (
                        <AddressMapPicker
                          onLocationSelect={(lat, lng, address) => {
                            setDeliveryCoords({ lat, lng });
                            handleInputChange('deliveryAddress', address);
                            setShowMapPicker(false);
                          }}
                          initialLat={deliveryCoords?.lat}
                          initialLng={deliveryCoords?.lng}
                        />
                      ) : (
                        <>
                          <AddressSelector
                            selectedAddress={formData.deliveryAddress}
                            onAddressChange={(address) => {
                              handleInputChange('deliveryAddress', address);
                              // No limpiar coordenadas aquí para permitir edición manual
                            }}
                            onInstructionsChange={(instructions) => handleInputChange('notes', instructions)}
                          />
                          {deliveryCoords && (
                            <Alert variant="success" className="mt-2 mb-0 d-flex justify-content-between align-items-center">
                              <div>
                                <MapPin size={16} className="me-2" />
                                Ubicación confirmada
                              </div>
                              {deliveryFee > 0 && (
                                <Badge bg="dark">
                                  {deliveryDistance.toFixed(1)} km → ${deliveryFee.toLocaleString()}
                                </Badge>
                              )}
                            </Alert>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: '600', fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                      Notas Adicionales
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Instrucciones especiales..."
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                        padding: '12px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Resumen del Pedido */}
          <Card 
            className="mb-4" 
            style={{ 
              borderRadius: '12px', 
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <Card.Header style={{ 
              background: '#f8f9fa', 
              borderBottom: '1px solid #e9ecef',
              borderRadius: '12px 12px 0 0',
              padding: '16px 20px'
            }}>
              <h5 className="mb-0" style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                Resumen del Pedido
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              <div className="mb-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{item.product.name}</strong>
                      <small className="text-muted d-block">
                        Cantidad: {item.quantity}
                        {item.customizations.addedIngredients.length > 0 && (
                          <span> • +{item.customizations.addedIngredients.length} extras</span>
                        )}
                      </small>
                    </div>
                    <div className="text-end">
                      <div>${(item.product.price * item.quantity).toLocaleString()}</div>
                      {item.customizations.addedIngredients.length > 0 && (
                        <small className="text-muted">
                          +${(item.customizations.addedIngredients.reduce((sum, ing) => sum + ing.price, 0) * item.quantity).toLocaleString()}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>

              {pointsDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento por puntos:</span>
                  <span>-${pointsDiscount.toLocaleString()}</span>
                </div>
              )}

              {promotionDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento por cupón:</span>
                  <span>-${promotionDiscount.toLocaleString()}</span>
                </div>
              )}

              {formData.deliveryType === 'delivery' && deliveryCoords && (
                <div className="d-flex justify-content-between mb-2">
                  <span>
                    <Truck size={16} className="me-1" />
                    Costo de Delivery ({deliveryDistance.toFixed(1)} km):
                  </span>
                  {isFreeDelivery ? (
                    <Badge bg="success">¡GRATIS!</Badge>
                  ) : (
                    <span>${deliveryFee.toLocaleString()}</span>
                  )}
                </div>
              )}

              <hr />

              <div 
                className="d-flex justify-content-between mb-3"
                style={{
                  paddingTop: '16px',
                  borderTop: '2px solid #e9ecef',
                  marginTop: '16px'
                }}
              >
                <strong style={{ fontSize: '20px', color: '#000' }}>Total a Pagar:</strong>
                <strong style={{ fontSize: '24px', color: '#0B6E4F' }}>${total.toLocaleString()}</strong>
              </div>

              {pointsEarned > 0 && (
                <Alert 
                  variant="info" 
                  className="mb-0"
                  style={{
                    borderRadius: '8px',
                    background: '#e7f3ff',
                    border: '1px solid #0B6E4F',
                    color: '#0B6E4F',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Gift size={18} />
                  <span style={{ fontWeight: '500' }}>
                    Ganarás {pointsEarned} puntos de lealtad con esta compra
                  </span>
                </Alert>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-end gap-3" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
            <Button 
              variant="outline-secondary" 
              onClick={onHide}
              style={{
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                color: '#000',
                fontWeight: '600',
                padding: '12px 24px',
                background: '#fff',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              style={{ 
                borderRadius: '8px',
                backgroundColor: '#0B6E4F', 
                border: 'none',
                color: 'white',
                fontWeight: '600',
                padding: '12px 24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#095a41';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0B6E4F';
              }}
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
