import { CartItem } from '../types/index';
import { DeliveryInfo } from '../components/CheckoutForm';
import { formatPrice } from './formatters';

/**
 * Generates a formatted WhatsApp message for an order
 */
export const generateWhatsAppMessage = (items: CartItem[], deliveryInfo: DeliveryInfo, total: number): string => {
  const orderDetails = items.map(item => {
    const customizations = [];
    if (item.customizations.removedIngredients.length > 0) {
      customizations.push(`Sin: ${item.customizations.removedIngredients.join(', ')}`);
    }
    if (item.customizations.addedIngredients.length > 0) {
      customizations.push(`Con: ${item.customizations.addedIngredients.join(', ')}`);
    }
    if (item.customizations.specialInstructions) {
      customizations.push(`Nota: ${item.customizations.specialInstructions}`);
    }
    
    return `${item.quantity}x ${item.product.name} (${formatPrice(item.product.price + item.customizations.extraPrice)})${customizations.length ? '\n' + customizations.join('\n') : ''}`;
  }).join('\n\n');

  const message = `🍕 *Nuevo Pedido - Montenegro's Pizza*\n\n` +
    `*Detalles del Pedido:*\n${orderDetails}\n\n` +
    `*Total: ${formatPrice(total)}*\n\n` +
    `*Datos de Entrega:*\n` +
    `Nombre: ${deliveryInfo.name}\n` +
    `Teléfono: ${deliveryInfo.phone}\n` +
    `Tipo de entrega: ${deliveryInfo.deliveryType === 'delivery' ? 'Delivery' : 'Retiro en local'}` +
    (deliveryInfo.address ? `\nDirección: ${deliveryInfo.address}` : '');

  return message;
};

export const generateWhatsAppUrl = (message: string): string => {
  // Número de WhatsApp de Montenegro's Pizza
  const phoneNumber = '+56923736818';
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};