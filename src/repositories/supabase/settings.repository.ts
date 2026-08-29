import { ISettingsRepository } from "../interfaces/settings.repository.interface";
import { StoreSetting } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseSettingsRepository implements ISettingsRepository {
  private getClient() {
    return createAdminClient();
  }

  async getByKey(key: string): Promise<StoreSetting | null> {
    const { data, error } = await this.getClient()
      .from('store_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data as StoreSetting;
  }

  async getAll(): Promise<StoreSetting[]> {
    const { data, error } = await this.getClient()
      .from('store_settings')
      .select('*');

    if (error || !data) return [];
    return data as StoreSetting[];
  }

  async updateSetting(key: string, value: any, description?: string): Promise<void> {
    const updateData: any = { value, updated_at: new Date().toISOString() };
    if (description) updateData.description = description;

    // Use upsert to create if doesn't exist
    const { error } = await this.getClient()
      .from('store_settings')
      .upsert({ key, ...updateData });

    if (error) throw new Error("Failed to update setting");
  }
}
