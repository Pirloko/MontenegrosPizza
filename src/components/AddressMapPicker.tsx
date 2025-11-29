import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { MapPin, Navigation } from 'lucide-react';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AddressMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

// Componente para actualizar el mapa cuando cambia la posición
function MapUpdater({ center, zoom, shouldUpdate }: { center: [number, number] | null; zoom: number; shouldUpdate: boolean }) {
  const map = useMap();
  const lastCenter = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (center && shouldUpdate && center !== lastCenter.current) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5
      });
      lastCenter.current = center;
    }
  }, [center, zoom, map, shouldUpdate]);

  return null;
}

// Componente para manejar clicks en el mapa
function LocationMarker({ position, setPosition }: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void 
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function AddressMapPicker({ 
  onLocationSelect, 
  initialLat, 
  initialLng 
}: AddressMapPickerProps) {
  // Santiago, Chile como centro por defecto
  const defaultCenter: [number, number] = [-33.4489, -70.6693];
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [shouldUpdateMap, setShouldUpdateMap] = useState(false);

  // Geocodificación inversa: coordenadas → dirección
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      } else {
        const fallbackAddress = `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(fallbackAddress);
        return fallbackAddress;
      }
    } catch (err) {
      console.error('Error en geocodificación inversa:', err);
      const fallbackAddress = `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallbackAddress);
      return fallbackAddress;
    } finally {
      setLoading(false);
    }
  };

  // Obtener ubicación actual del usuario
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPosition: [number, number] = [lat, lng];
        setPosition(newPosition);
        setShouldUpdateMap(true); // Activar actualización del mapa
        await reverseGeocode(lat, lng);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        setError('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Actualizar dirección cuando cambia la posición
  useEffect(() => {
    if (position) {
      reverseGeocode(position[0], position[1]);
    }
  }, [position]);

  // Resetear flag de actualización después de que el mapa se haya movido
  useEffect(() => {
    if (shouldUpdateMap) {
      // Pequeño delay para asegurar que el mapa se haya actualizado
      const timer = setTimeout(() => {
        setShouldUpdateMap(false);
      }, 600); // Un poco más que la duración de la animación
      return () => clearTimeout(timer);
    }
  }, [shouldUpdateMap]);

  // Confirmar selección
  const handleConfirm = () => {
    if (position && address) {
      onLocationSelect(position[0], position[1], address);
    }
  };

  const mapCenter = position || defaultCenter;

  return (
    <div>
      <div className="mb-3 d-flex gap-2">
        <Button 
          variant="primary" 
          size="sm"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Obteniendo ubicación...
            </>
          ) : (
            <>
              <Navigation size={16} className="me-2" />
              Usar Mi Ubicación Actual
            </>
          )}
        </Button>
        
        {position && (
          <Button 
            variant="success" 
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            <MapPin size={16} className="me-2" />
            Confirmar Ubicación
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6', marginBottom: '1rem' }}>
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <MapUpdater 
            center={position} 
            zoom={16} 
            shouldUpdate={shouldUpdateMap}
          />
        </MapContainer>
      </div>

      {loading && (
        <div className="text-center mb-2">
          <Spinner animation="border" size="sm" />
          <span className="ms-2 text-muted">Obteniendo dirección...</span>
        </div>
      )}

      {address && (
        <div className="alert alert-info mb-0">
          <strong>📍 Dirección seleccionada:</strong>
          <br />
          {address}
          {position && (
            <div className="text-muted small mt-1">
              Coordenadas: {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          )}
        </div>
      )}

      {!position && !error && (
        <Alert variant="info" className="mb-0">
          <strong>💡 Instrucciones:</strong>
          <ul className="mb-0 mt-2">
            <li>Haz clic en "Usar Mi Ubicación Actual" para detectar automáticamente tu ubicación</li>
            <li>O haz clic en cualquier punto del mapa para seleccionar tu ubicación de entrega</li>
          </ul>
        </Alert>
      )}
    </div>
  );
}

