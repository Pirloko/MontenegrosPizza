import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Package } from 'lucide-react';
import { metricsService } from '../../services/metricsService';

const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#dc3545', '#ffc107', '#28a745', '#17a2b8', '#6c757d'];

export function TopProductsChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadData();
  }, [limit]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const topProducts = await metricsService.getTopProducts(limit);
      setData(topProducts);
    } catch (err: any) {
      console.error('Error loading top products:', err);
      setError('Error al cargar productos más vendidos');
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-warning d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <Trophy size={20} />
          <strong>Top {limit} Productos Más Vendidos</strong>
        </div>
      </Card.Header>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="warning" />
            <p className="mt-3 text-muted">Cargando datos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Package size={48} className="mb-3 opacity-50" />
            <p>No hay datos de ventas aún</p>
          </div>
        ) : (
          <>
            {/* Lista de Top Productos */}
            <div className="mb-4">
              {data.map((product, index) => (
                <div 
                  key={product.product_name}
                  className="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded"
                  style={{
                    borderLeft: index < 3 ? `4px solid ${COLORS[index]}` : 'none'
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '1.5rem', width: '40px', textAlign: 'center' }}>
                      {getMedalIcon(index)}
                    </span>
                    <div>
                      <strong>{product.product_name}</strong>
                      <br />
                      <small className="text-muted">
                        ${product.revenue.toLocaleString('es-CL')} en ventas
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge bg="danger" style={{ fontSize: '1.2rem' }}>
                      {product.total_sold}
                    </Badge>
                    <br />
                    <small className="text-muted">vendidos</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico de Barras */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="product_name" type="category" width={150} />
                <Tooltip 
                  formatter={(value: any) => `${value} unidades`}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="total_sold" name="Vendidos">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

