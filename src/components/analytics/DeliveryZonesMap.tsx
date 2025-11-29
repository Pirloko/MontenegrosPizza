import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip as LeafletTooltip } from 'react-leaflet';
import { MapPin, TrendingUp } from 'lucide-react';
import { metricsService } from '../../services/metricsService';
import 'leaflet/dist/leaflet.css';

export function DeliveryZonesMap() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const zonesData = await metricsService.getDeliveryZones();
      setZones(zonesData.slice(0, 10)); // Top 10 zonas
    } catch (err: any) {
      console.error('Error loading delivery zones:', err);
      setError('Error al cargar zonas de entrega');
    } finally {
      setLoading(false);
    }
  };

  // Centro del mapa (promedio de todas las zonas o default Rancagua)
  const mapCenter: [number, number] = zones.length > 0
    ? [
        zones.reduce((sum, z) => sum + z.avg_lat, 0) / zones.length,
        zones.reduce((sum, z) => sum + z.avg_lng, 0) / zones.length
      ]
    : [-34.1704, -70.7408]; // Rancagua default

  // Obtener color según frecuencia
  const getHeatColor = (count: number) => {
    const maxCount = Math.max(...zones.map(z => z.count));
    const percentage = (count / maxCount) * 100;

    if (percentage >= 75) return '#dc3545'; // Rojo - Muy frecuente
    if (percentage >= 50) return '#fd7e14'; // Naranja
    if (percentage >= 25) return '#ffc107'; // Amarillo
    return '#28a745'; // Verde - Poco frecuente
  };

  // Radio según frecuencia (en metros)
  const getRadius = (count: number) => {
    const maxCount = Math.max(...zones.map(z => z.count));
    const minRadius = 100;
    const maxRadius = 500;
    return minRadius + ((count / maxCount) * (maxRadius - minRadius));
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-success text-white d-flex align-items-center gap-2">
        <MapPin size={20} />
        <strong>Zonas de Entrega Más Frecuentes</strong>
      </Card.Header>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
            <p className="mt-3 text-muted">Cargando datos...</p>
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <MapPin size={48} className="mb-3 opacity-50" />
            <p>No hay datos de zonas de entrega aún</p>
          </div>
        ) : (
          <>
            {/* Mapa */}
            <div style={{ height: '400px', marginBottom: '20px' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {zones.map((zone, index) => (
                  <CircleMarker
                    key={index}
                    center={[zone.avg_lat, zone.avg_lng]}
                    radius={Math.sqrt(zone.count) * 5}
                    pathOptions={{
                      fillColor: getHeatColor(zone.count),
                      fillOpacity: 0.6,
                      color: getHeatColor(zone.count),
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <strong>Zona #{index + 1}</strong>
                        <br />
                        <small>📦 {zone.count} entregas</small>
                        <br />
                        <small>💰 ${zone.revenue.toLocaleString('es-CL')}</small>
                      </div>
                    </Popup>
                    <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                      {zone.count} entregas
                    </LeafletTooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Lista de Top Zonas */}
            <div className="row">
              <div className="col-md-6">
                <h6 className="mb-3">
                  <TrendingUp size={18} className="me-2" />
                  Top Zonas por Pedidos
                </h6>
                <ListGroup>
                  {zones.slice(0, 5).map((zone, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="me-2">#{index + 1}</span>
                        <small className="text-muted">Zona {zone.zone.substring(0, 15)}...</small>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg="danger">{zone.count} pedidos</Badge>
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            background: getHeatColor(zone.count),
                            borderRadius: '50%'
                          }}
                        ></div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>

              <div className="col-md-6">
                <h6 className="mb-3">
                  <TrendingUp size={18} className="me-2" />
                  Top Zonas por Ingresos
                </h6>
                <ListGroup>
                  {[...zones].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((zone, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="me-2">#{index + 1}</span>
                        <small className="text-muted">Zona {zone.zone.substring(0, 15)}...</small>
                      </div>
                      <Badge bg="success">${zone.revenue.toLocaleString('es-CL')}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </div>

            {/* Leyenda */}
            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">Leyenda del Mapa de Calor:</small>
              <div className="d-flex justify-content-around mt-2">
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: '20px', height: '20px', background: '#dc3545', borderRadius: '50%' }}></div>
                  <small>Muy frecuente (75%+)</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: '20px', height: '20px', background: '#fd7e14', borderRadius: '50%' }}></div>
                  <small>Frecuente (50-75%)</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: '20px', height: '20px', background: '#ffc107', borderRadius: '50%' }}></div>
                  <small>Moderado (25-50%)</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: '20px', height: '20px', background: '#28a745', borderRadius: '50%' }}></div>
                  <small>Bajo (&lt;25%)</small>
                </div>
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

