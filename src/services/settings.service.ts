import { RepositoryFactory } from "@/repositories/repository.factory";
import { HomepageSection } from "@/types/database";
import {
  DEFAULT_STORE_FEATURES,
  type StoreFeatures,
} from "@/features/settings/StoreFeaturesContext";

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
   * Read one settings category ("shipping", "features", …) as a plain object.
   * Returns an empty object when the category has never been written.
   */
  static async getSettingCategory(category: string): Promise<Record<string, any>> {
    const repo = RepositoryFactory.getSettingsRepository();
    const setting = await repo.getByKey(category);
    return (setting?.value as Record<string, any>) || {};
  }

  /**
   * Replace a settings category wholesale.
   *
   * `updateStoreSettings` merges, which is right for a form that submits only
   * the fields it owns. Restoring a previous version needs the opposite: keys
   * the old version did not have must disappear, or an undo would leave behind
   * whatever the newer version added.
   */
  static async replaceStoreSettings(
    category: string,
    value: Record<string, any>
  ): Promise<Record<string, any>> {
    const repo = RepositoryFactory.getSettingsRepository();
    await repo.updateSetting(category, value);
    return value;
  }

  /**
   * Which optional storefront features are switched on.
   *
   * Falls back to the permissive defaults on any read failure: a database
   * hiccup must not silently disable checkout for every customer.
   */
  static async getStoreFeatures(): Promise<StoreFeatures> {
    try {
      const features = await this.getSettingCategory("features");
      return {
        guestCheckout: features.guest_checkout_enabled !== false,
        wishlist: features.wishlist_enabled !== false,
        // Reviews are opt-in rather than opt-out: the storefront has no review
        // surface yet, so the flag stays off unless explicitly switched on.
        reviews: features.reviews_enabled === true,
      };
    } catch (error) {
      console.error("[SettingsService] Could not read feature flags:", error);
      return DEFAULT_STORE_FEATURES;
    }
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
