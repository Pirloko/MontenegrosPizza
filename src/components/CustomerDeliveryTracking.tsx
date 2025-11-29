import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation } from 'lucide-react';
import { deliveryService } from '../services/deliveryService';
import { Database } from '../types/database';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Order = Database['public']['Tables']['orders']['Row'];
type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row'];

interface CustomerDeliveryTrackingProps {
  order: Order;
  onClose?: () => void;
}

// Componente para actualizar el mapa cuando cambia la ubicación
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function CustomerDeliveryTracking({ order, onClose }: CustomerDeliveryTrackingProps) {
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const [eta, setEta] = useState<string>('');

  // Obtener coordenadas del destino (usar las guardadas o geocodificar)
  useEffect(() => {
    if (!order.delivery_address) return;

    // Si ya tenemos coordenadas guardadas, usarlas
    if (order.delivery_latitude && order.delivery_longitude) {
      setDestinationCoords([order.delivery_latitude, order.delivery_longitude]);
      return;
    }

    // Si no, geocodificar la dirección
    const geocodeAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.delivery_address!)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setDestinationCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError('No se pudo encontrar la dirección');
        }
      } catch (err) {
        console.error('Error geocoding address:', err);
        setError('Error al geocodificar dirección');
      }
    };

    geocodeAddress();
  }, [order.delivery_address, order.delivery_latitude, order.delivery_longitude]);

  // Calcular ETA estimado basado en distancia
  const calculateETA = React.useCallback((lat: number, lng: number) => {
    if (!destinationCoords) return;

    try {
      // Calcular distancia en km usando fórmula de Haversine
      const R = 6371; // Radio de la Tierra en km
      const dLat = (destinationCoords[0] - lat) * Math.PI / 180;
      const dLng = (destinationCoords[1] - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(destinationCoords[0] * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distancia en km
      
      // Estimación: ~2 minutos por km en ciudad (considerando tráfico)
      const estimatedMinutes = Math.max(1, Math.ceil(distance * 2));
      setEta(`~${estimatedMinutes} min`);
    } catch (err) {
      console.error('Error calculating ETA:', err);
      setEta('Calculando...');
    }
  }, [destinationCoords]);

  // Suscribirse a cambios de ubicación en tiempo real
  useEffect(() => {
    if (!order.id || order.status !== 'on_the_way') return;

    // Cargar ubicación inicial
    deliveryService.getDeliveryLocation(order.id)
      .then(location => {
        if (location && destinationCoords) {
          setDeliveryLocation(location);
          calculateETA(location.latitude, location.longitude);
        }
      })
      .catch(err => console.error('Error loading initial location:', err));

    // Suscribirse a cambios
    const unsubscribe = deliveryService.subscribeToDeliveryLocation(order.id, (location) => {
      setDeliveryLocation(location);
      if (location && destinationCoords) {
        calculateETA(location.latitude, location.longitude);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [order.id, order.status, destinationCoords, calculateETA]);

  // Si el pedido no está en camino, no mostrar nada
  if (order.status !== 'on_the_way') {
    return null;
  }

  // Calcular centro del mapa
  const hasLocation = deliveryLocation && destinationCoords;
  const mapCenter: [number, number] = hasLocation && deliveryLocation
    ? [(deliveryLocation.latitude + destinationCoords[0]) / 2, (deliveryLocation.longitude + destinationCoords[1]) / 2]
    : destinationCoords || [0, 0];

  return (
    <Card className="mb-3 shadow-sm" style={{ border: '2px solid #0d6efd' }}>
      <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
        <div>
          <strong>📍 Seguimiento en Tiempo Real</strong>
          {eta && <Badge bg="light" text="dark" className="ms-2">ETA: {eta}</Badge>}
        </div>
        {onClose && (
          <Button variant="light" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        {error && (
          <div className="alert alert-warning m-3 mb-0" style={{ fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        {!destinationCoords ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando mapa...</span>
              </div>
              <p className="mt-2 text-muted">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <div style={{ height: '300px', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={hasLocation && deliveryLocation ? 13 : 15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Marcador de destino */}
              <Marker position={destinationCoords}>
                <Popup>
                  <strong>Tu Dirección</strong><br />
                  {order.delivery_address}
                </Popup>
              </Marker>
              
              {/* Marcador del repartidor */}
              {deliveryLocation && (
                <>
                  <Marker 
                    position={[deliveryLocation.latitude, deliveryLocation.longitude]}
                    icon={L.icon({
                      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                  >
                    <Popup>
                      <strong>Repartidor</strong><br />
                      En camino hacia ti
                    </Popup>
                  </Marker>
                  <MapUpdater center={[deliveryLocation.latitude, deliveryLocation.longitude]} />
                </>
              )}
            </MapContainer>
            
            {/* Información adicional */}
            <div className="position-absolute bottom-0 start-0 end-0 bg-white p-2 border-top">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    {(order as any).delivery_code && (
                      <>
                        <strong>Código de entrega:</strong>{' '}
                        <Badge bg="dark" className="ms-1">{(order as any).delivery_code}</Badge>
                      </>
                    )}
                  </small>
                </div>
                {order.delivery_address && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address!)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <Navigation size={14} className="me-1" />
                    Ver en Google Maps
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

