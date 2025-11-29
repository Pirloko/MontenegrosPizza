import { supabase } from '../lib/supabase';

// Definir tipos locales para evitar dependencias de tabla inexistente
type FavoriteAddress = {
  id: string;
  user_email: string;
  name: string;
  address: string;
  instructions?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type FavoriteAddressInsert = Omit<FavoriteAddress, 'id' | 'created_at' | 'updated_at'>;
type FavoriteAddressUpdate = Partial<Omit<FavoriteAddress, 'id' | 'user_email' | 'created_at' | 'updated_at'>>;

export const addressService = {
  // Obtener todas las direcciones favoritas de un usuario
  async getFavoriteAddresses(userEmail: string): Promise<FavoriteAddress[]> {
    try {
      // Por ahora usar localStorage hasta que se cree la tabla en Supabase
      const key = `favorite_addresses_${userEmail}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error fetching favorite addresses:', error);
      return [];
    }
  },

  // Crear una nueva dirección favorita
  async createFavoriteAddress(addressData: FavoriteAddressInsert): Promise<FavoriteAddress> {
    try {
      const newAddress: FavoriteAddress = {
        id: crypto.randomUUID(),
        ...addressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Si se marca como predeterminada, quitar la marca de las otras direcciones
      if (addressData.is_default) {
        const addresses = await this.getFavoriteAddresses(addressData.user_email);
        const updatedAddresses = addresses.map(addr => ({ ...addr, is_default: false }));
        localStorage.setItem(`favorite_addresses_${addressData.user_email}`, JSON.stringify(updatedAddresses));
      }

      // Agregar la nueva dirección
      const addresses = await this.getFavoriteAddresses(addressData.user_email);
      addresses.push(newAddress);
      localStorage.setItem(`favorite_addresses_${addressData.user_email}`, JSON.stringify(addresses));

      return newAddress;
    } catch (error) {
      console.error('Error creating favorite address:', error);
      throw error;
    }
  },

  // Actualizar una dirección favorita
  async updateFavoriteAddress(id: string, addressData: FavoriteAddressUpdate): Promise<FavoriteAddress> {
    try {
      // Necesitamos el email del usuario para encontrar la dirección
      // Por simplicidad, vamos a buscar en todas las claves de localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('favorite_addresses_'));
      
      for (const key of keys) {
        const addresses: FavoriteAddress[] = JSON.parse(localStorage.getItem(key) || '[]');
        const addressIndex = addresses.findIndex(addr => addr.id === id);
        
        if (addressIndex !== -1) {
          // Si se marca como predeterminada, quitar la marca de las otras direcciones
          if (addressData.is_default) {
            addresses.forEach(addr => {
              if (addr.id !== id) addr.is_default = false;
            });
          }

          // Actualizar la dirección
          addresses[addressIndex] = {
            ...addresses[addressIndex],
            ...addressData,
            updated_at: new Date().toISOString()
          };

          localStorage.setItem(key, JSON.stringify(addresses));
          return addresses[addressIndex];
        }
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Error updating favorite address:', error);
      throw error;
    }
  },

  // Eliminar una dirección favorita
  async deleteFavoriteAddress(id: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('favorite_addresses_'));
      
      for (const key of keys) {
        const addresses: FavoriteAddress[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredAddresses = addresses.filter(addr => addr.id !== id);
        
        if (filteredAddresses.length !== addresses.length) {
          localStorage.setItem(key, JSON.stringify(filteredAddresses));
          return;
        }
      }

      throw new Error('Address not found');
    } catch (error) {
      console.error('Error deleting favorite address:', error);
      throw error;
    }
  },

  // Marcar una dirección como predeterminada
  async setDefaultAddress(id: string, userEmail: string): Promise<FavoriteAddress> {
    try {
      const addresses = await this.getFavoriteAddresses(userEmail);
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        is_default: addr.id === id
      }));

      localStorage.setItem(`favorite_addresses_${userEmail}`, JSON.stringify(updatedAddresses));
      
      const defaultAddress = updatedAddresses.find(addr => addr.id === id);
      if (!defaultAddress) throw new Error('Address not found');
      
      return defaultAddress;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },

  // Obtener la dirección predeterminada de un usuario
  async getDefaultAddress(userEmail: string): Promise<FavoriteAddress | null> {
    try {
      const addresses = await this.getFavoriteAddresses(userEmail);
      return addresses.find(addr => addr.is_default) || null;
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }
};
