import { HomepageSection, StoreSetting } from "../../types/database";

export interface ISettingsRepository {
  getByKey(key: string): Promise<StoreSetting | null>;
  getAll(): Promise<StoreSetting[]>;
  updateSetting(key: string, value: any, description?: string): Promise<void>;

  /** Homepage builder sections, ordered by display_order. */
  getHomepageSections(enabledOnly?: boolean): Promise<HomepageSection[]>;
  updateHomepageSection(
    id: string,
    data: Partial<HomepageSection>
  ): Promise<HomepageSection | null>;
  reorderHomepageSections(orderedIds: string[]): Promise<void>;
}
