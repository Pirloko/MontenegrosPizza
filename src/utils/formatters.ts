/**
 * Formats a price in Chilean pesos
 * @param price The price to format
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  return `$${price.toLocaleString()}`;
};

/**
 * Formats a currency value in Chilean pesos
 * @param value The currency value to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return formatPrice(value);
};