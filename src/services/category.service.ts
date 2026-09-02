import { RepositoryFactory } from "@/repositories/repository.factory";
import { Category } from "@/types/database";

export class CategoryService {
  static async getCategories(activeOnly = true): Promise<Category[]> {
    const repo = RepositoryFactory.getCategoryRepository();
    const categories = await repo.findAll();
    let list = [...categories];
    if (activeOnly) {
      list = list.filter((c) => c.is_active);
    }
    return list.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const repo = RepositoryFactory.getCategoryRepository();
    return await repo.findBySlug(slug);
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    const repo = RepositoryFactory.getCategoryRepository();
    return await repo.findById(id);
  }

  static async createCategory(data: Partial<Category>): Promise<Category> {
    const repo = RepositoryFactory.getCategoryRepository();
    
    const slug =
      data.slug ||
      (data.name || "category")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const newCategory = {
      name: data.name || "New Category",
      slug,
      description: data.description || "",
      image_url: data.image_url || null,
      parent_id: data.parent_id || null,
      display_order: Number(data.display_order) || 1, // simplified since repo doesn't know count sync
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    };

    return await repo.create(newCategory);
  }

  static async updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
    const repo = RepositoryFactory.getCategoryRepository();
    return await repo.update(id, data);
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const repo = RepositoryFactory.getCategoryRepository();
    return await repo.delete(id);
  }
}
