import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Spinner, Row, Col, Badge, Modal } from 'react-bootstrap';
import { MapPin, Plus, Edit, Trash2, Star, Home, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/addressService';

// Definir tipos locales para evitar dependencias de tabla inexistente
type FavoriteAddress = {
  id: string;
  user_email: string;
  name: string;
  address: string;
  instructions?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export default function FavoriteAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<FavoriteAddress | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    instructions: '',
    is_default: false
  });

  useEffect(() => {
    if (user?.email) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (user?.email) {
        const userAddresses = await addressService.getFavoriteAddresses(user.email);
        setAddresses(userAddresses);
      }
    } catch (err: any) {
      console.error('Error loading addresses:', err);
      setError('Error al cargar las direcciones');
      // No lanzar el error para evitar que rompa la aplicación
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (address?: FavoriteAddress) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name,
        address: address.address,
        instructions: address.instructions || '',
        is_default: address.is_default
      });
    } else {
      setEditingAddress(null);
      setFormData({
        name: '',
        address: '',
        instructions: '',
        is_default: addresses.length === 0 // Primera dirección es predeterminada
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    setFormData({
      name: '',
      address: '',
      instructions: '',
      is_default: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) return;

    try {
      if (editingAddress) {
        // Actualizar dirección existente
        await addressService.updateFavoriteAddress(editingAddress.id, {
          name: formData.name,
          address: formData.address,
          instructions: formData.instructions,
          is_default: formData.is_default
        });
      } else {
        // Crear nueva dirección
        await addressService.createFavoriteAddress({
          user_email: user.email,
          name: formData.name,
          address: formData.address,
          instructions: formData.instructions,
          is_default: formData.is_default
        });
      }
      
      await loadAddresses();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError('Error al guardar la dirección');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta dirección?')) return;

    try {
      await addressService.deleteFavoriteAddress(id);
      await loadAddresses();
    } catch (err: any) {
      console.error('Error deleting address:', err);
      setError('Error al eliminar la dirección');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user?.email) return;

    try {
      await addressService.setDefaultAddress(id, user.email);
      await loadAddresses();
    } catch (err: any) {
      console.error('Error setting default address:', err);
      setError('Error al establecer dirección predeterminada');
    }
  };

  const getAddressIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('casa') || lowerName.includes('hogar')) {
      return <Home size={20} />;
    } else if (lowerName.includes('trabajo') || lowerName.includes('oficina')) {
      return <Building size={20} />;
    }
    return <MapPin size={20} />;
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando direcciones...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 d-flex align-items-center">
              <MapPin size={20} className="me-2" />
              Mis Direcciones Favoritas
            </h5>
            <Button variant="primary" size="sm" onClick={() => handleShowModal()}>
              <Plus size={16} className="me-1" />
              Agregar Dirección
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error && (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-5">
              <MapPin size={64} className="text-muted mb-3" />
              <h6 className="text-muted">No tienes direcciones guardadas</h6>
              <p className="text-muted small">
                Agrega direcciones favoritas para facilitar tus pedidos con delivery.
              </p>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <Plus size={16} className="me-1" />
                Agregar Primera Dirección
              </Button>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {addresses.map((address) => (
                <div key={address.id} className="list-group-item border-0 border-bottom p-4">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <div className="d-flex align-items-start mb-2">
                        <div className="text-primary me-3 mt-1">
                          {getAddressIcon(address.name)}
                        </div>
                        <div>
                          <div className="d-flex align-items-center mb-1">
                            <h6 className="mb-0 me-2">{address.name}</h6>
                            {address.is_default && (
                              <Badge bg="warning" className="d-flex align-items-center gap-1">
                                <Star size={12} />
                                Predeterminada
                              </Badge>
                            )}
                          </div>
                          <p className="mb-1">{address.address}</p>
                          {address.instructions && (
                            <small className="text-muted">
                              <strong>Instrucciones:</strong> {address.instructions}
                            </small>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-3 mt-md-0">
                      <div className="d-flex gap-2 justify-content-md-end">
                        {!address.is_default && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                          >
                            <Star size={14} className="me-1" />
                            Predeterminada
                          </Button>
                        )}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(address)}
                        >
                          <Edit size={14} className="me-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 size={14} className="me-1" />
                          Eliminar
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para agregar/editar dirección */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAddress ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Dirección *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Casa, Trabajo, Universidad..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dirección Completa *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Calle, número, comuna, ciudad..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Instrucciones Adicionales</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ej: Timbre en el portón azul, casa con jardín..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Marcar como dirección predeterminada"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingAddress ? 'Actualizar' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
