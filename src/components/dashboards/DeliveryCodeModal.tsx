import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Key } from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { Database } from '../../types/database';

type Order = Database['public']['Tables']['orders']['Row'];

interface DeliveryCodeModalProps {
  show: boolean;
  onHide: () => void;
  order: Order | null;
  onCodeVerified: (orderId: string) => void;
}

export default function DeliveryCodeModal({ show, onHide, order, onCodeVerified }: DeliveryCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!order) return;
    
    const codeNumber = parseInt(code);
    if (isNaN(codeNumber) || codeNumber < 100 || codeNumber > 999) {
      setError('Por favor ingresa un código válido de 3 dígitos');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const isValid = await deliveryService.verifyDeliveryCode(order.id, codeNumber);
      
      if (isValid) {
        onCodeVerified(order.id);
        setCode('');
        setError('');
      } else {
        setError('Código incorrecto. Por favor verifica el código con el cliente.');
      }
    } catch (err: any) {
      setError('Error al verificar código: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onHide();
  };

  if (!order) return null;

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="rounded-3 border-0 shadow-lg">
      <Modal.Header closeButton className="border-bottom" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #00A843 100%)', color: '#fff' }}>
        <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontFamily: 'var(--font-display)' }}>
          <Key size={20} style={{ color: '#00C853' }} />
          Verificar Código de Entrega
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <p className="mb-2">Pedido: <strong>#{order.order_number}</strong></p>
        <p className="text-muted small mb-3">
          Pide al cliente el código de 3 dígitos generado cuando el pedido estaba listo.
        </p>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="rounded-3 border-0">
            {error}
          </Alert>
        )}
        <Form.Group>
          <Form.Label className="fw-bold">Código de Entrega</Form.Label>
          <Form.Control
            type="number"
            min="100"
            max="999"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123"
            autoFocus
            className="rounded-3"
            onKeyPress={(e) => { if (e.key === 'Enter') handleVerify(); }}
          />
          <Form.Text className="text-muted">Código de 3 dígitos que te dio el cliente.</Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-top bg-light">
        <Button variant="outline-secondary" className="rounded-3" onClick={handleClose} disabled={verifying}>Cancelar</Button>
        <Button className="rounded-3 panel-btn-primary border-0" onClick={handleVerify} disabled={verifying || !code}>
          {verifying ? 'Verificando...' : 'Verificar y Entregar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

