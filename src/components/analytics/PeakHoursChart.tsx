import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';
import { metricsService } from '../../services/metricsService';

export function PeakHoursChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const hoursData = await metricsService.getPeakHours();
      
      // Formatear datos
      const formattedData = hoursData.map(item => ({
        hour: `${item.hour}:00`,
        hourNumber: item.hour,
        orders: item.total_orders,
        revenue: item.total_revenue
      }));

      setData(formattedData);
    } catch (err: any) {
      console.error('Error loading peak hours:', err);
      setError('Error al cargar horarios peak');
    } finally {
      setLoading(false);
    }
  };

  // Encontrar hora peak
  const peakHour = data.length > 0 
    ? data.reduce((max, item) => item.orders > max.orders ? item : max, data[0])
    : null;

  // Colorear barras según volumen
  const getBarColor = (orders: number) => {
    const maxOrders = Math.max(...data.map(d => d.orders));
    const percentage = (orders / maxOrders) * 100;
    
    if (percentage >= 80) return '#dc3545'; // Rojo - Alta demanda
    if (percentage >= 50) return '#ffc107'; // Amarillo - Media demanda
    return '#28a745'; // Verde - Baja demanda
  };

  return (
    <Card style={{ border: 'none', borderRadius: '12px' }}>
      <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
        <div className="d-flex align-items-center gap-2">
          <Clock size={20} style={{ color: '#0B6E4F' }} />
          <strong style={{ color: '#fff', fontWeight: 600 }}>Horarios Peak de Pedidos</strong>
        </div>
      </Card.Header>

      <Card.Body style={{ padding: '24px' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="info" />
            <p className="mt-3 text-muted">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Clock size={48} className="mb-3 opacity-50" />
            <p>No hay datos de horarios aún</p>
          </div>
        ) : (
          <>
            {/* Info de Hora Peak */}
            {peakHour && (
              <Alert 
                variant="info" 
                className="mb-4"
                style={{ 
                  backgroundColor: 'rgba(11, 110, 79, 0.2)', 
                  borderColor: '#0B6E4F',
                  color: '#fff'
                }}
              >
                <TrendingUp size={18} className="me-2" style={{ color: '#0B6E4F' }} />
                <strong>Hora Peak:</strong> {peakHour.hour} - {peakHour.orders} pedidos
                <span className="ms-3">
                  (${peakHour.revenue.toLocaleString('es-CL')} en ventas)
                </span>
              </Alert>
            )}

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="hour" 
                  label={{ value: 'Hora del Día', position: 'insideBottom', offset: -5 }}
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  label={{ value: 'Número de Pedidos', angle: -90, position: 'insideLeft' }}
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'orders') return [`${value} pedidos`, 'Pedidos'];
                    if (name === 'revenue') return [`$${value.toLocaleString('es-CL')}`, 'Ingresos'];
                    return value;
                  }}
                  contentStyle={{
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="orders" name="Pedidos" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.orders)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Leyenda */}
            <div className="d-flex justify-content-center gap-4 mt-3">
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: '20px', height: '20px', background: '#dc3545', borderRadius: '4px' }}></div>
                <small style={{ color: '#b0b0b0' }}>Alta demanda (80%+)</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: '20px', height: '20px', background: '#ffc107', borderRadius: '4px' }}></div>
                <small style={{ color: '#b0b0b0' }}>Media demanda (50-80%)</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: '20px', height: '20px', background: '#0B6E4F', borderRadius: '4px' }}></div>
                <small style={{ color: '#b0b0b0' }}>Baja demanda (&lt;50%)</small>
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

