import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deliveryService } from '../../services/deliveryService';

// Fix para iconos de Leaflet en producción
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ActiveDeliveryMapProps {
  orderId: string;
  deliveryAddress: string;
  deliveryUserId: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}

// Componente para actualizar el mapa cuando cambia la ubicación
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

export default function ActiveDeliveryMap({ orderId, deliveryAddress, deliveryUserId, deliveryLatitude, deliveryLongitude }: ActiveDeliveryMapProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const watchIdRef = useRef<number | null>(null);

  // Obtener coordenadas del destino (usar las guardadas o geocodificar)
  useEffect(() => {
    // Si ya tenemos coordenadas guardadas, usarlas
    if (deliveryLatitude && deliveryLongitude) {
      setDestinationCoords([deliveryLatitude, deliveryLongitude]);
      return;
    }
    
    // Si no, geocodificar la dirección
    const geocodeAddress = async () => {
      try {
        // Usar Nominatim (OpenStreetMap geocoding, gratis)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(deliveryAddress)}&limit=1`
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
  }, [deliveryAddress, deliveryLatitude, deliveryLongitude]);

  // Iniciar tracking de ubicación del repartidor
  useEffect(() => {
    if (!deliveryUserId) return;

    // Obtener permisos de geolocalización
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setCurrentLocation(newLocation);
          
          // Actualizar ubicación en Supabase cada 5 segundos
          deliveryService.updateDeliveryLocation(orderId, deliveryUserId, latitude, longitude)
            .catch(err => console.error('Error updating location:', err));
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Error al obtener ubicación: ' + err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } else {
      setError('Geolocalización no está disponible en tu navegador');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [orderId, deliveryUserId]);

  // Si no tenemos coordenadas, mostrar loading
  if (!destinationCoords) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando mapa...</span>
          </div>
          <p className="mt-2 text-muted">Obteniendo coordenadas...</p>
        </div>
      </div>
    );
  }

  // Calcular centro del mapa (entre ubicación actual y destino, o solo destino)
  const mapCenter: [number, number] = currentLocation 
    ? [(currentLocation[0] + destinationCoords[0]) / 2, (currentLocation[1] + destinationCoords[1]) / 2]
    : destinationCoords;

  return (
    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
      {error && (
        <div className="alert alert-warning mb-0" style={{ fontSize: '0.875rem', padding: '0.5rem' }}>
          {error}
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={currentLocation ? 13 : 15}
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
            <strong>Destino</strong><br />
            {deliveryAddress}
          </Popup>
        </Marker>
        
        {/* Marcador de ubicación actual del repartidor */}
        {currentLocation && (
          <>
            <Marker 
              position={currentLocation}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <strong>Tu Ubicación</strong><br />
                Actualizándose en tiempo real
              </Popup>
            </Marker>
            <MapUpdater center={currentLocation} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

