import { Category } from "../../types/database";

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(includeSubcategories?: boolean): Promise<Category[]>;
  getMainCategories(): Promise<Category[]>;
  create(data: Partial<Category>): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}
