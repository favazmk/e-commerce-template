import { ICategoryRepository } from "../interfaces/category.repository.interface";
import { Category } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseCategoryRepository implements ICategoryRepository {
  private getClient() {
    return createAdminClient();
  }

  async findById(id: string): Promise<Category | null> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as Category;
  }

  async findAll(includeSubcategories = true): Promise<Category[]> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    
    // Quick tree mapping
    const categories = data as Category[];
    if (includeSubcategories) {
      const topLevel = categories.filter(c => !c.parent_id);
      topLevel.forEach(parent => {
        parent.subcategories = categories.filter(c => c.parent_id === parent.id);
      });
      return topLevel;
    }
    
    return categories;
  }

  async getMainCategories(): Promise<Category[]> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  }

  async create(data: Partial<Category>): Promise<Category> {
    const { data: created, error } = await this.getClient()
      .from('categories')
      .insert([data])
      .select()
      .single();
    if (error || !created) throw new Error("Failed to create category");
    return created as Category;
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const { data: updated, error } = await this.getClient()
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error || !updated) return null;
    return updated as Category;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from('categories')
      .delete()
      .eq('id', id);
    return !error;
  }
}
