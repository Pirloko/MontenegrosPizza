import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowLeft, Home } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Prevenir doble submit
    if (loading) return;

    try {
      setError('');
      setLoading(true);
      console.log('🚀 Login iniciado');
      
      const userData = await signIn(email, password);
      
      console.log('✅ Login completado, redirigiendo según rol:', userData?.role);
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        // Redirigir según el rol del usuario
        switch (userData?.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'employee':
            navigate('/employee');
            break;
          case 'delivery':
            navigate('/delivery');
            break;
          case 'customer':
          default:
            navigate('/');
            break;
        }
        setLoading(false);
      }, 100);
    } catch (err: any) {
      console.error('❌ Error en handleSubmit:', err);
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <Container className="py-5">
      {/* Botón Volver al inicio - visible arriba del formulario */}
      <div className="d-flex justify-content-center mb-3">
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-2 btn btn-outline-secondary rounded-3 px-3 py-2 text-decoration-none"
          style={{ color: 'var(--brand-black)', borderColor: '#dee2e6' }}
        >
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <Card className="panel-card border-0 shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <img
                  src="/images/logo.jpeg"
                  alt="Montenegro's Pizza"
                  style={{ height: '80px', objectFit: 'contain' }}
                  className="mb-3"
                />
                <h2 className="fw-bold mb-1" style={{ color: 'var(--brand-black)', fontFamily: 'var(--font-display)' }}>
                  Iniciar Sesión
                </h2>
                <p className="text-brand-gray-muted mb-0">Accede a tu cuenta</p>
              </div>

              {error && (
                <Alert variant="danger" className="rounded-3 border-0">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold d-flex align-items-center gap-2">
                    <Mail size={18} style={{ color: 'var(--brand-green)' }} />
                    Correo Electrónico
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="rounded-3"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold d-flex align-items-center gap-2">
                    <Lock size={18} style={{ color: 'var(--brand-green)' }} />
                    Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="rounded-3"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 py-2 fw-bold rounded-3 panel-btn-primary border-0"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  ¿No tienes cuenta?{' '}
                  <Link
                    to="/register"
                    className="fw-bold text-decoration-none"
                    style={{ color: 'var(--brand-green)' }}
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>

              <div className="text-center mt-3 pt-3 border-top">
                <Link
                  to="/"
                  className="d-inline-flex align-items-center gap-2 small text-muted text-decoration-none"
                >
                  <Home size={16} />
                  Ir a la página principal
                </Link>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}

