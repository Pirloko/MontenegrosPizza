import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, Phone, MapPin } from 'lucide-react';
import { validateEmail, validateChileanPhone, validateFullName, validatePassword } from '../../utils/validators';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    favorite_address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.full_name || !formData.email || !formData.phone || !formData.password) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar nombre completo
    const nameValidation = validateFullName(formData.full_name);
    if (!nameValidation.isValid) {
      setError(nameValidation.errors[0].message);
      return;
    }

    // Validar email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0].message);
      return;
    }

    // Validar teléfono
    const phoneValidation = validateChileanPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.errors[0].message);
      return;
    }

    // Validar contraseña
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0].message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(formData.email, formData.password, {
        full_name: formData.full_name,
        phone: formData.phone,
        favorite_address: formData.favorite_address || null,
      });
      navigate('/'); // Redirect to home after registration
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <img 
                  src="/images/logo.jpeg" 
                  alt="Montenegro's Pizza" 
                  style={{ height: '80px', objectFit: 'contain' }}
                  className="mb-3"
                />
                <h2 className="fw-bold">Crear Cuenta</h2>
                <p className="text-muted">Regístrate y comienza a disfrutar</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <User size={18} className="me-2" />
                    Nombre Completo *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    placeholder="Juan Pérez"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <Mail size={18} className="me-2" />
                    Correo Electrónico *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <Phone size={18} className="me-2" />
                    Teléfono *
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <MapPin size={18} className="me-2" />
                    Dirección Favorita
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="favorite_address"
                    placeholder="Calle Principal #123, Comuna"
                    value={formData.favorite_address}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Opcional - Puedes actualizar esto después
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <Lock size={18} className="me-2" />
                    Contraseña *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    <Lock size={18} className="me-2" />
                    Confirmar Contraseña *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Button
                  variant="danger"
                  type="submit"
                  className="w-100 py-2 fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="text-danger fw-bold text-decoration-none">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
}

