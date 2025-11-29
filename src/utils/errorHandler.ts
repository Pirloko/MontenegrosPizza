/**
 * Utilidades para manejo centralizado de errores
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
}

export class AppError extends Error {
  public readonly context?: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    userMessage?: string,
    context?: ErrorContext,
    isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.userMessage = userMessage || message;
    this.context = context;
    this.isRetryable = isRetryable;
  }
}

/**
 * Manejo de errores de red/timeout
 */
export function handleNetworkError(error: any, context?: ErrorContext): AppError {
  console.error('🌐 Error de red:', error, context);

  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return new AppError(
      `Network timeout in ${context?.component || 'unknown'}`,
      'La conexión está tardando demasiado. Verifica tu internet y vuelve a intentar.',
      context,
      true
    );
  }

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return new AppError(
      `Network error in ${context?.component || 'unknown'}`,
      'No se pudo conectar al servidor. Verifica tu conexión a internet.',
      context,
      true
    );
  }

  return new AppError(
    error.message || 'Unknown network error',
    'Ocurrió un error de conexión. Por favor intenta nuevamente.',
    context,
    true
  );
}

/**
 * Manejo de errores de Supabase
 */
export function handleSupabaseError(error: any, context?: ErrorContext): AppError {
  console.error('🔴 Error de Supabase:', error, context);

  // Errores comunes de Supabase
  if (error.message?.includes('JWT')) {
    return new AppError(
      'JWT token error',
      'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      context,
      false
    );
  }

  if (error.message?.includes('row-level security')) {
    return new AppError(
      'RLS policy violation',
      'No tienes permiso para realizar esta acción.',
      context,
      false
    );
  }

  if (error.message?.includes('unique constraint')) {
    return new AppError(
      'Unique constraint violation',
      'Este registro ya existe. Por favor verifica los datos.',
      context,
      false
    );
  }

  if (error.message?.includes('foreign key')) {
    return new AppError(
      'Foreign key constraint',
      'Error de integridad de datos. Contacta con soporte.',
      context,
      false
    );
  }

  return new AppError(
    error.message || 'Unknown Supabase error',
    'Ocurrió un error en la base de datos. Por favor intenta nuevamente.',
    context,
    true
  );
}

/**
 * Retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        // Backoff exponencial: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, i);
        console.log(`⏳ Reintento ${i + 1}/${maxRetries} en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrapper para funciones async con manejo de errores
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw handleNetworkError(error, context);
      } else {
        throw handleSupabaseError(error, context);
      }
    }
  }) as T;
}

/**
 * Log de errores (para futura integración con servicio externo)
 */
export function logError(error: Error, context?: ErrorContext) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('📋 Error Log:', errorLog);

  // En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
  if (import.meta.env.PROD) {
    // sendToErrorService(errorLog);
  }
}

/**
 * Obtener mensaje amigable de error
 */
export function getFriendlyErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Convertir errores técnicos a mensajes amigables
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    
    if (message.includes('timeout')) {
      return 'La operación tardó demasiado. Intenta nuevamente.';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'No tienes permiso para realizar esta acción.';
    }
    
    if (message.includes('not found')) {
      return 'El recurso solicitado no existe.';
    }

    return error.message;
  }

  return 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
}

