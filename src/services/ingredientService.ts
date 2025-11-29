import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type ExtraIngredient = Database['public']['Tables']['extra_ingredients']['Row'];
type ExtraIngredientInsert = Database['public']['Tables']['extra_ingredients']['Insert'];
type ExtraIngredientUpdate = Database['public']['Tables']['extra_ingredients']['Update'];

export const ingredientService = {
  // Get all ingredients
  async getAll(): Promise<ExtraIngredient[]> {
    const { data, error } = await supabase
      .from('extra_ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get available ingredients only
  async getAvailable(): Promise<ExtraIngredient[]> {
    const { data, error } = await supabase
      .from('extra_ingredients')
      .select('*')
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get ingredient by ID
  async getById(id: string): Promise<ExtraIngredient | null> {
    const { data, error } = await supabase
      .from('extra_ingredients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create ingredient
  async create(ingredient: ExtraIngredientInsert): Promise<ExtraIngredient> {
    const { data, error } = await supabase
      .from('extra_ingredients')
      .insert(ingredient)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update ingredient
  async update(id: string, ingredient: ExtraIngredientUpdate): Promise<ExtraIngredient> {
    const { data, error } = await supabase
      .from('extra_ingredients')
      .update(ingredient)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete ingredient
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('extra_ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle available status
  async toggleAvailable(id: string, isAvailable: boolean): Promise<ExtraIngredient> {
    return this.update(id, { is_available: isAvailable });
  }
};

