import { ISettingsRepository } from "../interfaces/settings.repository.interface";
import { HomepageSection, StoreSetting } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseSettingsRepository extends SupabaseRepository implements ISettingsRepository {
  /**
   * Store settings and homepage sections are read while rendering cached
   * storefront routes.
   */
  private catalog() {
    return this.serviceClient("public-catalog-cached");
  }

  /**
   * Settings and homepage-builder writes are gated by requireAdmin().
   */
  private admin() {
    return this.serviceClient("admin-authorised");
  }

  async getByKey(key: string): Promise<StoreSetting | null> {
    const { data, error } = await this.catalog()
      .from('store_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data as StoreSetting;
  }

  async getAll(): Promise<StoreSetting[]> {
    const { data, error } = await this.catalog()
      .from('store_settings')
      .select('*');

    if (error || !data) return [];
    return data as StoreSetting[];
  }

  async updateSetting(key: string, value: any, description?: string): Promise<void> {
    const updateData: any = { value, updated_at: new Date().toISOString() };
    if (description) updateData.description = description;

    // Use upsert to create if doesn't exist
    const { error } = await this.admin()
      .from('store_settings')
      .upsert({ key, ...updateData });

    if (error) throw new Error("Failed to update setting");
  }

  async getHomepageSections(enabledOnly = false): Promise<HomepageSection[]> {
    let query = this.catalog()
      .from("homepage_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (enabledOnly) {
      query = query.eq("is_enabled", true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as HomepageSection[];
  }

  async updateHomepageSection(
    id: string,
    data: Partial<HomepageSection>
  ): Promise<HomepageSection | null> {
    // Never let a caller rewrite identity or audit columns.
    const { id: _ignoredId, created_at: _ignoredCreated, ...updatable } = data as Record<string, any>;

    const { data: updated, error } = await this.admin()
      .from("homepage_sections")
      .update({ ...updatable, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) return null;
    return updated as HomepageSection;
  }

  async reorderHomepageSections(orderedIds: string[]): Promise<void> {
    const timestamp = new Date().toISOString();
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await this.admin()
        .from("homepage_sections")
        .update({ display_order: index, updated_at: timestamp })
        .eq("id", id);
      if (error) throw new Error("Failed to reorder homepage sections");
    }
  }
}
