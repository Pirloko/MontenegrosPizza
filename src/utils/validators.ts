import { ValidationResult, ValidationError } from '../types';

/**
 * Validación de teléfono chileno
 * Formatos aceptados:
 * - +56 9 XXXX XXXX
 * - +569XXXXXXXX
 * - 9 XXXX XXXX
 * - 9XXXXXXXX
 */
export function validateChileanPhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!phone || phone.trim() === '') {
    errors.push({
      field: 'phone',
      message: 'El teléfono es obligatorio'
    });
    return { isValid: false, errors };
  }

  // Remover espacios y guiones
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Patrones válidos para Chile
  const patterns = [
    /^\+569\d{8}$/,     // +569XXXXXXXX
    /^9\d{8}$/,         // 9XXXXXXXX
    /^\+56\s*9\s*\d{4}\s*\d{4}$/, // +56 9 XXXX XXXX
    /^9\s*\d{4}\s*\d{4}$/  // 9 XXXX XXXX
  ];

  const isValid = patterns.some(pattern => pattern.test(phone.trim()));

  if (!isValid) {
    errors.push({
      field: 'phone',
      message: 'Formato de teléfono inválido. Use: +56 9 XXXX XXXX o 9 XXXX XXXX'
    });
  }

  return { isValid, errors };
}

/**
 * Validación de email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!email || email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'El email es obligatorio'
    });
    return { isValid: false, errors };
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email.trim())) {
    errors.push({
      field: 'email',
      message: 'Email inválido. Use el formato: ejemplo@correo.com'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validación de dirección
 */
export function validateAddress(address: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!address || address.trim() === '') {
    errors.push({
      field: 'address',
      message: 'La dirección es obligatoria'
    });
    return { isValid: false, errors };
  }

  const trimmedAddress = address.trim();
  
  if (trimmedAddress.length < 10) {
    errors.push({
      field: 'address',
      message: 'La dirección debe tener al menos 10 caracteres'
    });
  }

  if (trimmedAddress.length > 200) {
    errors.push({
      field: 'address',
      message: 'La dirección no puede exceder 200 caracteres'
    });
  }

  // Verificar que contenga al menos un número (generalmente las direcciones tienen numeración)
  if (!/\d/.test(trimmedAddress)) {
    errors.push({
      field: 'address',
      message: 'La dirección debe incluir el número de calle'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validación de nombre completo
 */
export function validateFullName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim() === '') {
    errors.push({
      field: 'full_name',
      message: 'El nombre es obligatorio'
    });
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    errors.push({
      field: 'full_name',
      message: 'El nombre debe tener al menos 3 caracteres'
    });
  }

  if (trimmedName.length > 100) {
    errors.push({
      field: 'full_name',
      message: 'El nombre no puede exceder 100 caracteres'
    });
  }

  // Verificar que contenga solo letras y espacios
  if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/.test(trimmedName)) {
    errors.push({
      field: 'full_name',
      message: 'El nombre solo puede contener letras y espacios'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validación de contraseña
 */
export function validatePassword(password: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({
      field: 'password',
      message: 'La contraseña es obligatoria'
    });
    return { isValid: false, errors };
  }

  if (password.length < 6) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  if (password.length > 50) {
    errors.push({
      field: 'password',
      message: 'La contraseña no puede exceder 50 caracteres'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Formato visual de teléfono chileno
 * Convierte 9XXXXXXXX a +56 9 XXXX XXXX
 */
export function formatChileanPhone(phone: string): string {
  // Remover todo excepto números
  const numbers = phone.replace(/\D/g, '');
  
  // Si empieza con 56, asumimos que es +56
  if (numbers.startsWith('56')) {
    const withoutPrefix = numbers.substring(2);
    if (withoutPrefix.length === 9) {
      return `+56 ${withoutPrefix[0]} ${withoutPrefix.substring(1, 5)} ${withoutPrefix.substring(5)}`;
    }
  }
  
  // Si es 9XXXXXXXX
  if (numbers.length === 9 && numbers.startsWith('9')) {
    return `+56 ${numbers[0]} ${numbers.substring(1, 5)} ${numbers.substring(5)}`;
  }
  
  return phone; // Devolver original si no coincide
}

/**
 * Validar calificación (1-5 estrellas)
 */
export function validateRating(rating: number): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (rating < 1 || rating > 5) {
    errors.push({
      field: 'rating',
      message: 'La calificación debe estar entre 1 y 5 estrellas'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validar comentario de calificación
 */
export function validateComment(comment: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (comment && comment.length > 500) {
    errors.push({
      field: 'comment',
      message: 'El comentario no puede exceder 500 caracteres'
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validar disponibilidad de producto
 */
export function validateProductAvailability(product: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (product.available === false) {
    errors.push({
      field: 'product',
      message: `El producto "${product.name}" no está disponible actualmente`
    });
  }

  if (product.stock_quantity !== undefined && product.stock_quantity <= 0 && product.stock_quantity !== 999) {
    errors.push({
      field: 'product',
      message: `El producto "${product.name}" está agotado`
    });
  }

  return { isValid: errors.length === 0, errors };
}

