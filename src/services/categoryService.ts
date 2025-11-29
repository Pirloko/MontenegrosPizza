import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('CategoryService.getAll error:', err);
      throw err;
    }
  },

  // Get active categories only
  async getActive(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('CategoryService.getActive error:', err);
      throw err;
    }
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('CategoryService.getById error:', err);
      throw err;
    }
  },

  // Create category
  async create(category: CategoryInsert): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('CategoryService.create error:', err);
      throw err;
    }
  },

  // Update category
  async update(id: string, category: CategoryUpdate): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('CategoryService.update error:', err);
      throw err;
    }
  },

  // Delete category
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('CategoryService.delete error:', err);
      throw err;
    }
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean): Promise<Category> {
    try {
      return this.update(id, { is_active: isActive });
    } catch (err) {
      console.error('CategoryService.toggleActive error:', err);
      throw err;
    }
  }
};

