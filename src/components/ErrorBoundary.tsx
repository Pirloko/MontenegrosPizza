import React, { Component, ReactNode } from 'react';
import { Container, Alert, Button, Card } from 'react-bootstrap';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Aquí podrías enviar el error a un servicio de logging (ej: Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <Container className="py-5">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <Card className="shadow-lg border-danger">
                <Card.Body className="p-5 text-center">
                  <AlertTriangle size={80} className="text-danger mb-4" />
                  
                  <h2 className="fw-bold mb-3">¡Ups! Algo salió mal</h2>
                  
                  <Alert variant="danger" className="text-start">
                    <strong>Error:</strong> {this.state.error?.message || 'Error desconocido'}
                  </Alert>

                  <p className="text-muted mb-4">
                    Lo sentimos, ocurrió un error inesperado. 
                    Por favor intenta recargar la página o volver al inicio.
                  </p>

                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="danger"
                      onClick={this.handleReset}
                      className="d-flex align-items-center gap-2"
                    >
                      <RefreshCw size={18} />
                      Intentar de Nuevo
                    </Button>
                    
                    <Button
                      variant="outline-danger"
                      onClick={this.handleGoHome}
                      className="d-flex align-items-center gap-2"
                    >
                      <Home size={18} />
                      Ir al Inicio
                    </Button>
                  </div>

                  {/* Detalles técnicos (solo en desarrollo) */}
                  {import.meta.env.DEV && this.state.errorInfo && (
                    <details className="mt-4 text-start">
                      <summary className="cursor-pointer text-muted">
                        <small>Detalles técnicos (dev)</small>
                      </summary>
                      <pre className="mt-2 p-3 bg-light text-danger rounded" style={{ fontSize: '10px', overflow: 'auto' }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Hook para usar en componentes funcionales
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

