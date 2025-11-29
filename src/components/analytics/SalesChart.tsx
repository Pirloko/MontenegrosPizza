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
    <Card className="shadow-sm">
      <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <TrendingUp size={20} />
          <strong>Ventas por Período</strong>
        </div>
        <ButtonGroup size="sm">
          <Button
            variant={period === 'day' ? 'light' : 'outline-light'}
            onClick={() => setPeriod('day')}
          >
            Hoy
          </Button>
          <Button
            variant={period === 'week' ? 'light' : 'outline-light'}
            onClick={() => setPeriod('week')}
          >
            Semana
          </Button>
          <Button
            variant={period === 'month' ? 'light' : 'outline-light'}
            onClick={() => setPeriod('month')}
          >
            Mes
          </Button>
        </ButtonGroup>
      </Card.Header>

      <Card.Body>
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
                <div className="text-center p-3 bg-light rounded">
                  <small className="text-muted">Total Ventas</small>
                  <h4 className="text-success mb-0">${totalSales.toLocaleString('es-CL')}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <small className="text-muted">Promedio</small>
                  <h4 className="text-primary mb-0">${Math.round(averageSale).toLocaleString('es-CL')}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <small className="text-muted">Pedidos</small>
                  <h4 className="text-info mb-0">{data.length}</h4>
                </div>
              </div>
            </div>

            {/* Gráfico */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `$${value.toLocaleString('es-CL')}`}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="total" fill="#dc3545" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

