import { RepositoryFactory } from "@/repositories/repository.factory";
import { HomepageSection } from "@/types/database";

export class SettingsService {
  /**
   * Get all store configuration settings
   */
  static async getStoreSettings(): Promise<Record<string, any>> {
    const repo = RepositoryFactory.getSettingsRepository();
    const settings = await repo.getAll();
    const config: Record<string, any> = {};
    for (const s of settings) {
      config[s.key] = s.value;
    }
    return config;
  }

  /**
   * Update specific configuration category (e.g. 'general', 'branding', 'tax', 'shipping', 'features')
   */
  static async updateStoreSettings(category: string, data: Record<string, any>): Promise<Record<string, any>> {
    const repo = RepositoryFactory.getSettingsRepository();
    const current = await repo.getByKey(category);
    const newValue = { ...(current?.value || {}), ...data };
    
    await repo.updateSetting(category, newValue);
    
    return await this.getStoreSettings();
  }

  /**
   * Get dynamic homepage sections from persistent storage.
   */
  static async getHomepageSections(enabledOnly = false): Promise<HomepageSection[]> {
    const repo = RepositoryFactory.getSettingsRepository();
    return await repo.getHomepageSections(enabledOnly);
  }

  /**
   * Update a single homepage section.
   */
  static async updateHomepageSection(
    id: string,
    data: Partial<HomepageSection>
  ): Promise<HomepageSection | null> {
    const repo = RepositoryFactory.getSettingsRepository();
    return await repo.updateHomepageSection(id, data);
  }

  /**
   * Persist a new section ordering.
   */
  static async reorderHomepageSections(orderedIds: string[]): Promise<void> {
    const repo = RepositoryFactory.getSettingsRepository();
    await repo.reorderHomepageSections(orderedIds);
  }
}
