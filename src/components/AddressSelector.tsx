import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col, Card, Badge } from 'react-bootstrap';
import { MapPin, Plus, Star, Home, Building } from 'lucide-react';
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

interface AddressSelectorProps {
  selectedAddress: string;
  onAddressChange: (address: string) => void;
  onInstructionsChange: (instructions: string) => void;
}

export default function AddressSelector({ 
  selectedAddress, 
  onAddressChange, 
  onInstructionsChange 
}: AddressSelectorProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddresses, setShowAddresses] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    if (user?.email && showAddresses) {
      loadAddresses();
    }
  }, [user, showAddresses]);

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

  const handleAddressSelect = (address: FavoriteAddress) => {
    onAddressChange(address.address);
    onInstructionsChange(address.instructions || '');
    setShowAddresses(false);
  };

  const handleCustomAddressChange = (value: string) => {
    setCustomAddress(value);
    onAddressChange(value);
  };

  const handleCustomInstructionsChange = (value: string) => {
    setCustomInstructions(value);
    onInstructionsChange(value);
  };

  const getAddressIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('casa') || lowerName.includes('hogar')) {
      return <Home size={16} />;
    } else if (lowerName.includes('trabajo') || lowerName.includes('oficina')) {
      return <Building size={16} />;
    }
    return <MapPin size={16} />;
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Dirección de Entrega *</Form.Label>
        
        {/* Botón para mostrar direcciones guardadas */}
        {user && (
          <div className="mb-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAddresses(!showAddresses)}
              className="d-flex align-items-center gap-1"
            >
              <MapPin size={14} />
              {showAddresses ? 'Ocultar Direcciones Guardadas' : 'Usar Dirección Guardada'}
            </Button>
          </div>
        )}

        {/* Lista de direcciones guardadas */}
        {showAddresses && (
          <Card className="mb-3">
            <Card.Body className="p-3">
              {loading ? (
                <div className="text-center py-3">
                  <Spinner size="sm" />
                  <span className="ms-2">Cargando direcciones...</span>
                </div>
              ) : error ? (
                <Alert variant="warning" className="mb-0">
                  <small>{error}</small>
                </Alert>
              ) : addresses.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-muted mb-2">No tienes direcciones guardadas</p>
                  <Button variant="outline-primary" size="sm" href="/addresses">
                    <Plus size={14} className="me-1" />
                    Agregar Direcciones
                  </Button>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="list-group-item border-0 border-bottom p-2 cursor-pointer"
                      onClick={() => handleAddressSelect(address)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="text-primary me-2">
                          {getAddressIcon(address.name)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <strong className="me-2">{address.name}</strong>
                            {address.is_default && (
                              <Badge bg="warning" size="sm">
                                <Star size={10} className="me-1" />
                                Predeterminada
                              </Badge>
                            )}
                          </div>
                          <small className="text-muted">{address.address}</small>
                          {address.instructions && (
                            <div>
                              <small className="text-muted">
                                <strong>Instrucciones:</strong> {address.instructions}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Campo de dirección personalizada */}
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Ingresa la dirección completa de entrega..."
          value={selectedAddress}
          onChange={(e) => handleCustomAddressChange(e.target.value)}
          required
        />
      </Form.Group>

      {/* Campo de instrucciones adicionales */}
      <Form.Group className="mb-3">
        <Form.Label>Instrucciones Adicionales</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Ej: Timbre en el portón azul, casa con jardín, llamar al llegar..."
          value={customInstructions}
          onChange={(e) => handleCustomInstructionsChange(e.target.value)}
        />
      </Form.Group>
    </div>
  );
}
