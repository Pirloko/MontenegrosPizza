import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type ProductIngredient = Database['public']['Tables']['product_ingredients']['Row'];
type ProductIngredientInsert = Database['public']['Tables']['product_ingredients']['Insert'];
type ProductIngredientUpdate = Database['public']['Tables']['product_ingredients']['Update'];

export const productIngredientService = {
  /**
   * Obtener todos los ingredientes de un producto
   */
  async getByProduct(productId: string): Promise<ProductIngredient[]> {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error obteniendo ingredientes del producto:', error);
      throw new Error(error.message || 'Error al obtener ingredientes del producto');
    }
  },

  /**
   * Obtener todos los ingredientes de un producto con información completa
   */
  async getByProductWithDetails(productId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select(`
          *,
          extra_ingredients (*)
        `)
        .eq('product_id', productId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error obteniendo ingredientes del producto:', error);
      throw new Error(error.message || 'Error al obtener ingredientes del producto');
    }
  },

  /**
   * Crear relación producto-ingrediente
   */
  async create(productIngredient: ProductIngredientInsert): Promise<ProductIngredient> {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .insert(productIngredient)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creando relación producto-ingrediente:', error);
      throw new Error(error.message || 'Error al crear relación producto-ingrediente');
    }
  },

  /**
   * Crear múltiples relaciones producto-ingrediente
   */
  async createMany(productId: string, ingredientIds: string[]): Promise<void> {
    try {
      const relations = ingredientIds.map(ingredientId => ({
        product_id: productId,
        ingredient_id: ingredientId,
        quantity: 1.0
      }));

      const { error } = await supabase
        .from('product_ingredients')
        .insert(relations);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creando relaciones producto-ingrediente:', error);
      throw new Error(error.message || 'Error al crear relaciones producto-ingrediente');
    }
  },

  /**
   * Actualizar relación producto-ingrediente
   */
  async update(id: string, updates: ProductIngredientUpdate): Promise<ProductIngredient> {
    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error actualizando relación producto-ingrediente:', error);
      throw new Error(error.message || 'Error al actualizar relación producto-ingrediente');
    }
  },

  /**
   * Eliminar relación producto-ingrediente
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error eliminando relación producto-ingrediente:', error);
      throw new Error(error.message || 'Error al eliminar relación producto-ingrediente');
    }
  },

  /**
   * Eliminar todas las relaciones de un producto
   */
  async deleteByProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error eliminando relaciones del producto:', error);
      throw new Error(error.message || 'Error al eliminar relaciones del producto');
    }
  },

  /**
   * Sincronizar ingredientes de un producto (elimina todos y crea nuevos)
   */
  async syncProductIngredients(productId: string, ingredientIds: string[]): Promise<void> {
    try {
      // Eliminar relaciones existentes
      await this.deleteByProduct(productId);
      
      // Crear nuevas relaciones si hay ingredientes
      if (ingredientIds.length > 0) {
        await this.createMany(productId, ingredientIds);
      }
    } catch (error: any) {
      console.error('Error sincronizando ingredientes del producto:', error);
      throw new Error(error.message || 'Error al sincronizar ingredientes del producto');
    }
  }
};

