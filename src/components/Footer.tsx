import { MapPin, Phone, Clock, Mail, Instagram, Facebook } from 'lucide-react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer
      className="text-white py-5 py-md-6"
      style={{
        backgroundColor: '#1a1a1a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Container className="px-4">
        <Row className="g-4 g-md-5">
          {/* Ubicación */}
          <Col xs={12} md={4}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(0,200,83,0.15)',
                  color: '#00C853',
                }}
              >
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-2 text-white" style={{ fontSize: '1rem', letterSpacing: '0.02em' }}>
                  Ubicación
                </h3>
                <p className="mb-1 small text-white-50">Av. Diego de Almagro #1059</p>
                <p className="mb-0 small text-white-50">Rancagua, Chile</p>
              </div>
            </div>
          </Col>

          {/* Horario */}
          <Col xs={12} md={4}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#FFF8E1',
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-2 text-white" style={{ fontSize: '1rem', letterSpacing: '0.02em' }}>
                  Horario
                </h3>
                <p className="mb-1 small text-white-50">Lunes a Jueves: 12:00 - 23:00</p>
                <p className="mb-1 small text-white-50">Viernes y Sábado: 12:00 - 00:00</p>
                <p className="mb-0 small text-white-50">Domingo: 12:00 - 22:00</p>
              </div>
            </div>
          </Col>

          {/* Contáctanos */}
          <Col xs={12} md={4}>
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#FFF8E1',
                }}
              >
                <Mail size={22} />
              </div>
              <div>
                <h3 className="h6 fw-bold mb-2 text-white" style={{ fontSize: '1rem', letterSpacing: '0.02em' }}>
                  Contáctanos
                </h3>
                <div className="d-flex flex-column gap-2 mb-3">
                  <a
                    href="tel:+56923736818"
                    className="d-flex align-items-center gap-2 small text-white-50 text-decoration-none footer-link"
                    style={{ transition: 'color 0.2s ease' }}
                  >
                    <Phone size={16} />
                    +56 9 2373 6818
                  </a>
                  <a
                    href="mailto:contacto@montenegros.cl"
                    className="d-flex align-items-center gap-2 small text-white-50 text-decoration-none footer-link"
                    style={{ transition: 'color 0.2s ease' }}
                  >
                    <Mail size={16} />
                    contacto@montenegros.cl
                  </a>
                </div>
                {/* Redes con hover */}
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://www.instagram.com/montenegrospizza/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social rounded-3 d-flex align-items-center justify-content-center text-white text-decoration-none"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      transition: 'all 0.25s ease',
                    }}
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100057590403740&locale=es_LA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social rounded-3 d-flex align-items-center justify-content-center text-white text-decoration-none"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      transition: 'all 0.25s ease',
                    }}
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Copyright y créditos */}
        <div
          className="mt-5 pt-4 text-center"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="mb-1 small text-white-50" style={{ fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Montenegro's Pizza. Todos los derechos reservados.
          </p>
          <p className="mb-0 small text-white-50" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            Desarrollado por{' '}
            <a
              href="https://ancodevs.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white-50 text-decoration-none footer-credit"
              style={{ transition: 'color 0.2s ease' }}
            >
              ancodevs.cl
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
