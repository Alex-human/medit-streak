import { registerPlugin } from "@capacitor/core";

export type MeditCloudStoreValue = {
  value: string | null;
  cloudAvailable: boolean;
};

export interface MeditCloudStorePlugin {
  get(options: { key: string }): Promise<MeditCloudStoreValue>;
  set(options: { key: string; value: string }): Promise<{ cloudAvailable: boolean }>;
  remove(options: { key: string }): Promise<void>;
}

export const MeditCloudStore = registerPlugin<MeditCloudStorePlugin>("MeditCloudStore");
