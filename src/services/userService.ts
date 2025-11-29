import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export const userService = {
  /**
   * Obtener todos los usuarios (solo empleados y repartidores)
   */
  async getEmployeesAndDelivery(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['employee', 'delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error obteniendo usuarios:', error);
      throw new Error(error.message || 'Error al obtener usuarios');
    }
  },

  /**
   * Obtener solo empleados
   */
  async getEmployees(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error obteniendo empleados:', error);
      throw new Error(error.message || 'Error al obtener empleados');
    }
  },

  /**
   * Obtener solo repartidores
   */
  async getDeliveryUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'delivery')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error obteniendo repartidores:', error);
      throw new Error(error.message || 'Error al obtener repartidores');
    }
  },

  /**
   * Obtener usuario por ID
   */
  async getById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error obteniendo usuario:', error);
      throw new Error(error.message || 'Error al obtener usuario');
    }
  },

  /**
   * Crear perfil de usuario en public.users
   * Nota: El usuario debe existir primero en auth.users
   */
  async createUserProfile(userData: {
    id: string; // ID del usuario en auth.users
    email: string;
    full_name: string;
    phone?: string | null;
    role: 'employee' | 'delivery';
  }): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone || null,
          role: userData.role,
          loyalty_points: 0,
          is_active: true
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      throw new Error(error.message || 'Error al crear usuario');
    }
  },

  /**
   * Actualizar usuario
   */
  async update(id: string, updates: UserUpdate): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      throw new Error(error.message || 'Error al actualizar usuario');
    }
  },

  /**
   * Pausar/Activar usuario
   */
  async toggleActive(id: string, isActive: boolean): Promise<User> {
    return this.update(id, { is_active: isActive } as any);
  },

  /**
   * Eliminar usuario (solo del perfil, no de auth)
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      throw new Error(error.message || 'Error al eliminar usuario');
    }
  }
};

