import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { StarRating } from './StarRating';
import { ratingService } from '../services/ratingService';
import { validateRating, validateComment } from '../utils/validators';

interface RatingModalProps {
  show: boolean;
  onHide: () => void;
  orderId: string;
  userId: string;
  deliveryUserId?: string | null;
  onRatingSubmitted?: () => void;
}

export function RatingModal({
  show,
  onHide,
  orderId,
  userId,
  deliveryUserId,
  onRatingSubmitted
}: RatingModalProps) {
  const [serviceRating, setServiceRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [serviceComment, setServiceComment] = useState('');
  const [deliveryComment, setDeliveryComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que al menos una calificación esté seleccionada
    if (serviceRating === 0) {
      setError('Por favor califica el servicio');
      return;
    }

    // Validar calificación
    const ratingValidation = validateRating(serviceRating);
    if (!ratingValidation.isValid) {
      setError(ratingValidation.errors[0].message);
      return;
    }

    // Validar comentarios si existen
    if (serviceComment) {
      const commentValidation = validateComment(serviceComment);
      if (!commentValidation.isValid) {
        setError(commentValidation.errors[0].message);
        return;
      }
    }

    if (deliveryComment) {
      const commentValidation = validateComment(deliveryComment);
      if (!commentValidation.isValid) {
        setError(commentValidation.errors[0].message);
        return;
      }
    }

    try {
      setLoading(true);

      // Crear calificación del servicio
      await ratingService.createRating({
        orderId,
        userId,
        ratingType: 'service',
        rating: serviceRating,
        comment: serviceComment || undefined
      });

      // Si hay calificación de delivery, crearla también
      if (deliveryRating > 0 && deliveryUserId) {
        await ratingService.createRating({
          orderId,
          userId,
          ratingType: 'delivery',
          targetId: deliveryUserId,
          rating: deliveryRating,
          comment: deliveryComment || undefined
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onHide();
        if (onRatingSubmitted) {
          onRatingSubmitted();
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setServiceRating(0);
      setDeliveryRating(0);
      setServiceComment('');
      setDeliveryComment('');
      setError('');
      setSuccess(false);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          ⭐ Califica tu Experiencia
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && (
          <Alert variant="success">
            ¡Gracias por tu calificación! 🎉
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Calificación del Servicio */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              ¿Cómo fue tu experiencia con nosotros? *
            </Form.Label>
            <div className="d-flex justify-content-center py-3">
              <StarRating
                rating={serviceRating}
                size={40}
                interactive
                onChange={setServiceRating}
              />
            </div>
            <Form.Text className="text-muted d-block text-center">
              {serviceRating === 0 && 'Selecciona una calificación'}
              {serviceRating === 1 && 'Muy malo'}
              {serviceRating === 2 && 'Malo'}
              {serviceRating === 3 && 'Regular'}
              {serviceRating === 4 && 'Bueno'}
              {serviceRating === 5 && '¡Excelente!'}
            </Form.Text>
            
            {/* Comentario del Servicio */}
            <div className="mt-3">
              <Form.Label className="small text-muted">
                Comentario sobre tu experiencia (opcional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={serviceComment}
                onChange={(e) => setServiceComment(e.target.value)}
                placeholder="Cuéntanos sobre tu experiencia con Montenegro's..."
                maxLength={500}
                disabled={loading}
                style={{ fontSize: '14px' }}
              />
              <Form.Text className="text-muted small">
                {serviceComment.length}/500 caracteres
              </Form.Text>
            </div>
          </Form.Group>

          {/* Calificación del Delivery (opcional) */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              ¿Cómo fue el servicio de entrega? (opcional)
            </Form.Label>
            <div className="d-flex justify-content-center py-3">
              <StarRating
                rating={deliveryRating}
                size={32}
                interactive
                onChange={setDeliveryRating}
              />
            </div>
            <Form.Text className="text-muted d-block text-center">
              {deliveryRating === 0 && 'Sin calificación'}
              {deliveryRating === 1 && 'Muy lento'}
              {deliveryRating === 2 && 'Lento'}
              {deliveryRating === 3 && 'Normal'}
              {deliveryRating === 4 && 'Rápido'}
              {deliveryRating === 5 && '¡Súper rápido!'}
            </Form.Text>
            
            {/* Comentario del Delivery */}
            {deliveryRating > 0 && (
              <div className="mt-3">
                <Form.Label className="small text-muted">
                  Comentario sobre el repartidor (opcional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  placeholder="Cuéntanos sobre tu experiencia con el repartidor..."
                  maxLength={500}
                  disabled={loading}
                  style={{ fontSize: '14px' }}
                />
                <Form.Text className="text-muted small">
                  {deliveryComment.length}/500 caracteres
                </Form.Text>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="warning" 
          onClick={handleSubmit}
          disabled={loading || serviceRating === 0}
        >
          {loading ? 'Enviando...' : 'Enviar Calificación'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

