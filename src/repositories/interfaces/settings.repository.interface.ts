import { StoreSetting } from "../../types/database";

export interface ISettingsRepository {
  getByKey(key: string): Promise<StoreSetting | null>;
  getAll(): Promise<StoreSetting[]>;
  updateSetting(key: string, value: any, description?: string): Promise<void>;
}
