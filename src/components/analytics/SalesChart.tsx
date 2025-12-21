import React, { useState, useEffect } from 'react';
import { Card, ButtonGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { metricsService } from '../../services/metricsService';

type Period = 'day' | 'week' | 'month';

export function SalesChart() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const salesData = await metricsService.getSalesByPeriod(period);
      
      // Formatear datos para el gráfico
      const formattedData = salesData.map(item => ({
        ...item,
        date: format(new Date(item.date), period === 'day' ? 'HH:mm' : 'dd/MM', { locale: es }),
        total: Number(item.total) || 0
      }));

      setData(formattedData);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError('Error al cargar datos de ventas');
    } finally {
      setLoading(false);
    }
  };

  const totalSales = data.reduce((sum, item) => sum + item.total, 0);
  const averageSale = data.length > 0 ? totalSales / data.length : 0;

  return (
    <Card style={{ border: 'none', borderRadius: '12px' }}>
      <Card.Header style={{ background: 'transparent', borderBottom: '1px solid #333', padding: '20px' }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <TrendingUp size={20} style={{ color: '#0B6E4F' }} />
            <strong style={{ color: '#fff', fontWeight: 600 }}>Ventas por Período</strong>
          </div>
          <ButtonGroup size="sm">
            <Button
              variant={period === 'day' ? 'primary' : 'outline-light'}
              onClick={() => setPeriod('day')}
              style={{
                borderRadius: period === 'day' ? '8px 0 0 8px' : '0',
                borderColor: '#333',
                color: period === 'day' ? '#fff' : '#b0b0b0'
              }}
            >
              Hoy
            </Button>
            <Button
              variant={period === 'week' ? 'primary' : 'outline-light'}
              onClick={() => setPeriod('week')}
              style={{
                borderRadius: '0',
                borderColor: '#333',
                color: period === 'week' ? '#fff' : '#b0b0b0'
              }}
            >
              Semana
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'outline-light'}
              onClick={() => setPeriod('month')}
              style={{
                borderRadius: period === 'month' ? '0 8px 8px 0' : '0',
                borderColor: '#333',
                color: period === 'month' ? '#fff' : '#b0b0b0'
              }}
            >
              Mes
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>

      <Card.Body style={{ padding: '24px' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 text-muted">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Calendar size={48} className="mb-3 opacity-50" />
            <p>No hay datos para este período</p>
          </div>
        ) : (
          <>
            {/* Estadísticas Rápidas */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="text-center p-3 rounded" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
                  <small className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Total Ventas</small>
                  <h4 className="mb-0" style={{ color: '#0B6E4F', fontWeight: 700 }}>
                    ${totalSales.toLocaleString('es-CL')}
                  </h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 rounded" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
                  <small className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Promedio</small>
                  <h4 className="mb-0" style={{ color: '#17a2b8', fontWeight: 700 }}>
                    ${Math.round(averageSale).toLocaleString('es-CL')}
                  </h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 rounded" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
                  <small className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Pedidos</small>
                  <h4 className="mb-0" style={{ color: '#fff', fontWeight: 700 }}>{data.length}</h4>
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: any) => `$${value.toLocaleString('es-CL')}`}
                  contentStyle={{
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#dc3545" 
                  name="Ventas"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

