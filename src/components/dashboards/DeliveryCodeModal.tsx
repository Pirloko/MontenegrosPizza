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
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <Key size={20} />
          Verificar Código de Entrega
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Pedido: <strong>#{order.order_number}</strong></p>
        <p className="text-muted small mb-3">
          Por favor pide al cliente el código de 3 dígitos que se generó cuando el pedido estaba listo.
        </p>
        
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Form.Group>
          <Form.Label>Código de Entrega</Form.Label>
          <Form.Control
            type="number"
            min="100"
            max="999"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleVerify();
              }
            }}
          />
          <Form.Text className="text-muted">
            Ingresa el código de 3 dígitos que te proporcionó el cliente.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={verifying}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleVerify} disabled={verifying || !code}>
          {verifying ? 'Verificando...' : 'Verificar y Entregar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

