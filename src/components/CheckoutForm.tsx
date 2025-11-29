import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';

interface CheckoutFormProps {
  onBack: () => void;
  onComplete: (deliveryInfo: DeliveryInfo) => void;
}

export interface DeliveryInfo {
  deliveryType: 'delivery' | 'pickup';
  name: string;
  address?: string;
  phone: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onBack, onComplete }) => {
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (deliveryType === 'delivery' && !address.trim()) {
      newErrors.address = 'La dirección es requerida para entrega a domicilio';
    }

    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\+?56\s?9\s?\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Ingresa un número de teléfono válido (+56 9 XXXX XXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onComplete({
        deliveryType,
        name,
        address: deliveryType === 'delivery' ? address : undefined,
        phone
      });
    }
  };

  return (
    <div className="p-4">
      {/* Botón Volver */}
      <button
        onClick={onBack}
        className="d-flex align-items-center text-secondary border-0 bg-transparent mb-4 p-0"
      >
        <ArrowLeft size={20} className="me-1" />
        Volver al carrito
      </button>

      <Form onSubmit={handleSubmit}>
        {/* Tipo de entrega */}
        <div className="mb-4">
          <h6 className="fw-bold mb-3">¿Cómo quieres recibir tu pedido?</h6>
          <div className="d-flex gap-3">
            <Form.Check
              type="radio"
              id="delivery"
              name="deliveryType"
              className="border rounded p-3 flex-grow-1 cursor-pointer"
              style={{ cursor: 'pointer' }}
              checked={deliveryType === 'delivery'}
              onChange={() => setDeliveryType('delivery')}
              label={
                <div>
                  <div className="fw-bold">Entrega a domicilio</div>
                  <small className="text-muted">Te entregamos el pedido donde indiques</small>
                </div>
              }
            />
            <Form.Check
              type="radio"
              id="pickup"
              name="deliveryType"
              className="border rounded p-3 flex-grow-1 cursor-pointer"
              style={{ cursor: 'pointer' }}
              checked={deliveryType === 'pickup'}
              onChange={() => setDeliveryType('pickup')}
              label={
                <div>
                  <div className="fw-bold">Retira tu pedido</div>
                  <small className="text-muted">Retira en nuestra tienda</small>
                </div>
              }
            />
          </div>
        </div>

        {/* Nombre completo */}
        <Form.Group className="mb-4">
          <Form.Label className="fw-bold">Nombre completo</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingresa tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isInvalid={!!errors.name}
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Dirección de entrega (solo si es delivery) */}
        {deliveryType === 'delivery' && (
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Dirección de entrega</Form.Label>
            <Form.Control
              type="text"
              placeholder="Dirección completa para entrega"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              isInvalid={!!errors.address}
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>
        )}

        {/* Teléfono */}
        <Form.Group className="mb-4">
          <Form.Label className="fw-bold">Teléfono</Form.Label>
          <Form.Control
            type="tel"
            placeholder="+56 9 1234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            isInvalid={!!errors.phone}
          />
          <Form.Control.Feedback type="invalid">
            {errors.phone}
          </Form.Control.Feedback>
          <Form.Text className="text-muted">
            Te contactaremos a este número para confirmar tu pedido
          </Form.Text>
        </Form.Group>

        {/* Botón continuar */}
        <Button
          type="submit"
          variant="success"
          className="w-100 py-3"
          style={{ backgroundColor: '#0B6E4F', border: 'none' }}
        >
          Confirmar pedido
        </Button>
      </Form>
    </div>
  );
};

export default CheckoutForm;